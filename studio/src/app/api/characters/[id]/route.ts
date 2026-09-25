import { NextResponse } from "next/server";
import { getCharacter, getUsageStats, listCreations } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const character = getCharacter(id);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  return NextResponse.json({
    character,
    creations: listCreations(id),
    stats: getUsageStats(id),
  });
}
