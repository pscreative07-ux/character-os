import type { ModifierRow } from "./db";

export function buildEditPrompt(
  basePrompt: string,
  selected: {
    expression?: ModifierRow;
    hairstyle?: ModifierRow;
    outfit?: ModifierRow;
    effect?: ModifierRow;
  }
): string {
  const lines = [
    "Edit the reference image. Keep the scene, background, camera framing, and composition consistent with the reference.",
    `The subject must remain exactly the same character described here: ${basePrompt}`,
  ];

  if (selected.expression) lines.push(selected.expression.prompt_fragment);
  if (selected.hairstyle) lines.push(selected.hairstyle.prompt_fragment);
  if (selected.outfit) lines.push(selected.outfit.prompt_fragment);
  if (selected.effect) lines.push(selected.effect.prompt_fragment);

  lines.push("Photoreal skin and lighting unless a stylized effect says otherwise. No added text, watermarks, or logos.");

  return lines.join(" ");
}
