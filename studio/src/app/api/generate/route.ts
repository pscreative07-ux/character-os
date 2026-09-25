import { NextResponse } from "next/server";
import { createCreation, getCharacter, getModifier } from "@/lib/db";
import { getImageConnector } from "@/lib/connectors";
import { buildEditPrompt } from "@/lib/promptBuilder";
import { readImageAsDataUri } from "@/lib/storage";

interface GenerateBody {
  characterId: string;
  expressionId?: string;
  hairstyleId?: string;
  outfitId?: string;
  effectId?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateBody;

  if (!body.characterId) {
    return NextResponse.json({ error: "characterId is required" }, { status: 400 });
  }

  const character = getCharacter(body.characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const expression = body.expressionId ? getModifier(body.expressionId) : undefined;
  const hairstyle = body.hairstyleId ? getModifier(body.hairstyleId) : undefined;
  const outfit = body.outfitId ? getModifier(body.outfitId) : undefined;
  const effect = body.effectId ? getModifier(body.effectId) : undefined;

  const prompt = buildEditPrompt(character.base_prompt, {
    expression,
    hairstyle,
    outfit,
    effect,
  });

  const referenceImageDataUri = await readImageAsDataUri(character.base_image_path);

  try {
    const connector = getImageConnector();
    const result = await connector.generate({ referenceImageDataUri, prompt });

    const creation = createCreation({
      characterId: character.id,
      expressionId: expression?.id ?? null,
      hairstyleId: hairstyle?.id ?? null,
      outfitId: outfit?.id ?? null,
      effectId: effect?.id ?? null,
      prompt,
      imageUrl: result.imageUrl,
      model: result.model,
      costUsd: result.costUsd,
    });

    return NextResponse.json({ creation }, { status: 201 });
  } catch (error) {
    console.error("Generation failed", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
