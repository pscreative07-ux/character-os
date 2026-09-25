import { NextResponse } from "next/server";
import { getUsageStats, listCreations } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId") ?? undefined;

  return NextResponse.json({
    creations: listCreations(characterId),
    stats: getUsageStats(characterId),
  });
}
