import { NextResponse } from "next/server";
import { createCharacter, listCharacters } from "@/lib/db";
import { saveUploadedImage } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({ characters: listCharacters() });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = form.get("name");
  const bio = form.get("bio");
  const basePrompt = form.get("basePrompt");
  const image = form.get("image");

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof basePrompt !== "string" || !basePrompt.trim()) {
    return NextResponse.json(
      { error: "basePrompt is required" },
      { status: 400 }
    );
  }
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { error: "a reference image is required" },
      { status: 400 }
    );
  }

  const baseImagePath = await saveUploadedImage(image);
  const character = createCharacter({
    name: name.trim(),
    bio: typeof bio === "string" ? bio.trim() : "",
    basePrompt: basePrompt.trim(),
    baseImagePath,
  });

  return NextResponse.json({ character }, { status: 201 });
}
