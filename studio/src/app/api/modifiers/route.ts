import { NextResponse } from "next/server";
import { listModifiers, type ModifierCategory } from "@/lib/db";

const VALID_CATEGORIES: ModifierCategory[] = [
  "expression",
  "hairstyle",
  "outfit",
  "effect",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (category && !VALID_CATEGORIES.includes(category as ModifierCategory)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  return NextResponse.json({
    modifiers: listModifiers(category as ModifierCategory | undefined),
  });
}
