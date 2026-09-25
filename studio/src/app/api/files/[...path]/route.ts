import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  // Only ever serve a single flat filename from UPLOADS_DIR — reject any
  // attempt to traverse out of it.
  const filename = path.basename(segments.join("/"));
  const filePath = path.join(process.cwd(), "data", "uploads", filename);

  try {
    const data = await fs.readFile(filePath);
    const contentType = MIME_BY_EXT[path.extname(filename)] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
