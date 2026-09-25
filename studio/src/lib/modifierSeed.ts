import type { ModifierCategory } from "./db";

export interface ModifierSeed {
  category: ModifierCategory;
  label: string;
  promptFragment: string;
}

// A starter library, mirroring the shape of a full asset catalog (expressions,
// hairstyles, outfits, effects) without trying to match any third-party
// provider's proprietary set 1:1. Add more rows here to grow each category.
export const MODIFIER_SEED: ModifierSeed[] = [
  // Expressions
  {
    category: "expression",
    label: "Neutra",
    promptFragment: "Give her a calm, neutral resting expression, relaxed mouth, soft gaze.",
  },
  {
    category: "expression",
    label: "Sorriso aberto",
    promptFragment: "Change her expression to a wide, genuine open-mouth smile with visible teeth.",
  },
  {
    category: "expression",
    label: "Língua de fora",
    promptFragment: "Change her expression to playful, sticking her tongue out with a wink.",
  },
  {
    category: "expression",
    label: "Surpresa",
    promptFragment: "Change her expression to surprised: raised eyebrows, wide eyes, slightly open mouth.",
  },
  {
    category: "expression",
    label: "Pensativa",
    promptFragment: "Change her expression to thoughtful, looking slightly off-camera, one eyebrow subtly raised.",
  },
  {
    category: "expression",
    label: "Beicinho",
    promptFragment: "Change her expression to a cute pout, lips pushed forward slightly.",
  },
  {
    category: "expression",
    label: "Riso contido",
    promptFragment: "Change her expression to a held-back laugh, eyes crinkled, closed-mouth grin.",
  },
  {
    category: "expression",
    label: "Séria",
    promptFragment: "Change her expression to serious and confident, direct eye contact, closed lips.",
  },
  // Hairstyles
  {
    category: "hairstyle",
    label: "Padrão",
    promptFragment: "Keep her hairstyle exactly as in the reference image.",
  },
  {
    category: "hairstyle",
    label: "Rabo de cavalo alto",
    promptFragment: "Replace her hairstyle exactly with a sleek high ponytail, no flyaways.",
  },
  {
    category: "hairstyle",
    label: "Bob assimétrico",
    promptFragment: "Replace her hairstyle exactly with a glossy asymmetrical bob, shorter in the back, longer at the front.",
  },
  {
    category: "hairstyle",
    label: "Ondas soltas",
    promptFragment: "Replace her hairstyle exactly with loose beachy waves worn down.",
  },
  {
    category: "hairstyle",
    label: "Coque baixo",
    promptFragment: "Replace her hairstyle exactly with a low, polished bun at the nape of the neck.",
  },
  {
    category: "hairstyle",
    label: "Tranças",
    promptFragment: "Replace her hairstyle exactly with two neat braids over the shoulders.",
  },
  {
    category: "hairstyle",
    label: "Curto moderno",
    promptFragment: "Replace her hairstyle exactly with a short modern pixie cut.",
  },
  // Outfits
  {
    category: "outfit",
    label: "Padrão",
    promptFragment: "Keep her outfit exactly as in the reference image.",
  },
  {
    category: "outfit",
    label: "Blazer preto",
    promptFragment: "Replace her outfit exactly with a tailored black blazer over a plain white top.",
  },
  {
    category: "outfit",
    label: "Look de treino",
    promptFragment: "Replace her outfit exactly with a matching athletic set: fitted top and leggings.",
  },
  {
    category: "outfit",
    label: "Vestido casual",
    promptFragment: "Replace her outfit exactly with a simple casual midi dress.",
  },
  {
    category: "outfit",
    label: "Jaqueta jeans",
    promptFragment: "Replace her outfit exactly with a denim jacket over a basic tee.",
  },
  {
    category: "outfit",
    label: "Look de festa",
    promptFragment: "Replace her outfit exactly with an elegant black cocktail outfit.",
  },
  // Effects
  {
    category: "effect",
    label: "Nenhum",
    promptFragment: "Render as a realistic photograph, no stylistic filter.",
  },
  {
    category: "effect",
    label: "Cinema",
    promptFragment: "Apply a cinematic color grade: filmic contrast, soft highlights, subtle grain.",
  },
  {
    category: "effect",
    label: "Cartoon",
    promptFragment: "Render in a clean 2D cartoon illustration style while keeping the same facial identity.",
  },
  {
    category: "effect",
    label: "Preto e branco",
    promptFragment: "Render in high-contrast black and white.",
  },
];
