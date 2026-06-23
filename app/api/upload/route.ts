import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";
import path from "path";

export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const upload_secret = process.env.UPLOAD_SECRET;
  if (upload_secret) {
    const auth = req.headers.get("x-upload-secret");
    if (auth !== upload_secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const db = getDb();
  const inserted: number[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid type: ${file.type}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const key = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadFile(key, buffer, file.type);

    const result = db
      .prepare(
        "INSERT INTO ads (filename, original_name) VALUES (?, ?)"
      )
      .run(key, file.name);

    inserted.push(result.lastInsertRowid as number);
  }

  return NextResponse.json({ inserted });
}
