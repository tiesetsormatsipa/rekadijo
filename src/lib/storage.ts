import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Storage abstraction
 * ────────────────────
 * STORAGE_DRIVER=local (default): writes to /public/uploads and returns a
 * relative URL. Fine for development and small single-VPS deployments.
 *
 * For production at scale, swap the body of `saveFile` for an S3-compatible
 * client (AWS S3, DigitalOcean Spaces, Backblaze B2, etc.) using the
 * S3_* environment variables already scaffolded in .env.example. Every
 * call site in the app uses this module, so only this file needs to change.
 */

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export async function saveFile(file: File): Promise<{ url: string; mimeType: string }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large (max 25MB).");
  }

  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);
    return { url: `/uploads/${filename}`, mimeType: file.type };
  }

  // Production drivers (e.g. "s3") are intentionally not implemented here —
  // wire real credentials in .env, then implement the upload call in this
  // branch using your chosen SDK.
  throw new Error(
    `Storage driver "${driver}" is not wired yet. Add S3 (or equivalent) credentials and implement the upload in src/lib/storage.ts.`
  );
}
