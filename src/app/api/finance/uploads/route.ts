import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { processImageUploads } from "@/lib/image-upload";

// Finance company photo upload for repo vehicles. FINANCE_CO only.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== "FINANCE_CO") {
    return NextResponse.json({ error: "Not authorised to upload photos" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const result = await processImageUploads(form);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ urls: result.urls }, { status: 201 });
}
