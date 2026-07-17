import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { auth } from "@/auth";

// Dealer photo upload. Accepts multipart form-data with one or more "files",
// normalises each to a max 1600px-wide WebP with sharp, writes them under
// public/uploads/<uuid>/ and returns same-origin URLs. DEALER-only.
export const runtime = "nodejs";

const MAX_FILES = 10;
const MAX_BYTES = 12 * 1024 * 1024; // 12MB per file (before compression)
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "DEALER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorised to upload photos" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `You can upload at most ${MAX_FILES} photos at a time.` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is larger than 12MB.` },
        { status: 400 },
      );
    }
    if (file.type && !ACCEPTED.has(file.type)) {
      return NextResponse.json(
        { error: `"${file.name}" is not a supported image type.` },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: `"${file.name}" could not be processed as an image.` },
        { status: 400 },
      );
    }

    const name = `${randomUUID()}.webp`;
    await writeFile(path.join(destDir, name), output);
    urls.push(`/uploads/${folder}/${name}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
