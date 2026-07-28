import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_FILES = 10;
const MAX_BYTES = 12 * 1024 * 1024; // 12MB per file (before compression)
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export type ImageUploadResult =
  | { ok: true; urls: string[] }
  | { ok: false; error: string; status: number };

/**
 * Shared photo pipeline: multipart "files" → sharp WebP → public/uploads/<uuid>/.
 * Callers are responsible for auth/role checks before invoking this.
 */
export async function processImageUploads(form: FormData): Promise<ImageUploadResult> {
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false, error: "No files provided", status: 400 };
  }
  if (files.length > MAX_FILES) {
    return {
      ok: false,
      error: `You can upload at most ${MAX_FILES} photos at a time.`,
      status: 400,
    };
  }

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return {
        ok: false,
        error: `"${file.name}" is larger than 12MB.`,
        status: 400,
      };
    }
    if (file.type && !ACCEPTED.has(file.type)) {
      return {
        ok: false,
        error: `"${file.name}" is not a supported image type.`,
        status: 400,
      };
    }
  }

  const folder = randomUUID();
  const destDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(destDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const input = Buffer.from(await file.arrayBuffer());
    let output: Buffer;
    try {
      output = await sharp(input)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return {
        ok: false,
        error: `"${file.name}" could not be processed as an image.`,
        status: 400,
      };
    }

    const name = `${randomUUID()}.webp`;
    await writeFile(path.join(destDir, name), output);
    urls.push(`/uploads/${folder}/${name}`);
  }

  return { ok: true, urls };
}
