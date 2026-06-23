import { Hono } from "hono";
import { renderHTML } from "./frontend";

type Bindings = {
  BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
  R2_PUBLIC_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const PAGE_SIZE = 20;
const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

// Reversed timestamp so R2 lexicographic order = newest first
function makeKey(filename: string): string {
  const ext = filename.match(/\.[^.]+$/)?.[0] ?? ".jpg";
  const rev = (Number.MAX_SAFE_INTEGER - Date.now()).toString().padStart(16, "0");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${rev}-${rand}${ext}`;
}

// --- Frontend ---
app.get("/", (c) => {
  return c.html(renderHTML(c.env.R2_PUBLIC_URL));
});

// --- List ads ---
app.get("/api/ads", async (c) => {
  const cursor = c.req.query("cursor") ?? undefined;

  const listed = await c.env.BUCKET.list({
    limit: PAGE_SIZE,
    cursor,
  });

  const items = listed.objects.map((obj) => ({
    key: obj.key,
    name: (obj.customMetadata?.originalName as string | undefined) ?? obj.key,
    uploaded: obj.uploaded.toISOString(),
    size: obj.size,
  }));

  return c.json({
    items,
    nextCursor: listed.truncated ? listed.cursor : null,
  });
});

// --- Upload ---
app.post("/upload", async (c) => {
  const secret = c.env.UPLOAD_SECRET;
  if (secret) {
    const provided = c.req.header("x-upload-secret");
    if (provided !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  const formData = await c.req.formData();
  const files = formData.getAll("files") as unknown as File[];

  if (!files.length) {
    return c.json({ error: "No files" }, 400);
  }

  const uploaded: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return c.json({ error: `Invalid type: ${file.type}` }, 400);
    }
    if (file.size > MAX_SIZE) {
      return c.json({ error: `File too large: ${file.name}` }, 400);
    }

    const key = makeKey(file.name);
    const buffer = await file.arrayBuffer();

    await c.env.BUCKET.put(key, buffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });

    uploaded.push(key);
  }

  return c.json({ uploaded });
});

export default app;
