import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function saveUploadedImage(file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type] ?? "png";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return filename;
}

export async function readImageAsDataUri(filename: string): Promise<string> {
  const buffer = await fs.readFile(
    path.join(process.cwd(), "data", "uploads", filename)
  );
  const ext = path.extname(filename).slice(1);
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
