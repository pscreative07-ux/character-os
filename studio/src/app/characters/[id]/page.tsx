import { notFound } from "next/navigation";
import {
  getCharacter,
  getUsageStats,
  listCreations,
  listModifiers,
} from "@/lib/db";
import { StudioClient } from "./StudioClient";

export default async function CharacterStudioPage({
  params,
}: PageProps<"/characters/[id]">) {
  const { id } = await params;
  const character = getCharacter(id);
  if (!character) notFound();

  const modifiers = listModifiers();
  const creations = listCreations(id);
  const stats = getUsageStats(id);

  return (
    <StudioClient
      character={character}
      modifiers={modifiers}
      initialCreations={creations}
      initialStats={stats}
    />
  );
}
