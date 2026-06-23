import { NextRequest, NextResponse } from "next/server";
import { getDb, Ad } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const db = getDb();

  const rows = cursor
    ? db
        .prepare(
          "SELECT * FROM ads WHERE id < ? ORDER BY id DESC LIMIT ?"
        )
        .all(Number(cursor), PAGE_SIZE) as Ad[]
    : db
        .prepare("SELECT * FROM ads ORDER BY id DESC LIMIT ?")
        .all(PAGE_SIZE) as Ad[];

  const items = rows.map((ad) => ({
    id: ad.id,
    url: getPublicUrl(ad.filename),
    originalName: ad.original_name,
    uploadedAt: ad.uploaded_at,
  }));

  const nextCursor =
    rows.length === PAGE_SIZE ? rows[rows.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
