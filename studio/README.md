# Character Studio

A reference implementation of an identity-preserving character image studio:
create a character from one reference image, then generate new images of
that same character — different expression, hairstyle, outfit, or visual
effect — while keeping their identity consistent. Every generation is
tracked in a local gallery with its cost.

This mirrors the mechanic behind [Character OS](../README.md)'s
generation-connector pattern: a canonical character reference (Fingerprint)
+ a categorized library of modifiers + a pluggable generative backend behind
a neutral interface.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite (`better-sqlite3`) for characters, the modifier library, and the
  creations gallery — a single file at `data/studio.db`, created on first run
- [fal.ai](https://fal.ai) for the identity-preserving image edit, behind a
  pluggable `ImageGenerationConnector` interface
  (`src/lib/connectors/`) — swap in another provider by implementing the same
  interface and wiring it up in `src/lib/connectors/index.ts`

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in FAL_KEY
npm run dev
```

Without `FAL_KEY` set, the app runs in **mock mode**: generation is free and
just echoes back the character's reference image, so you can develop and
demo the full flow (character creation, modifier picking, gallery, cost
tracking) before wiring up real credentials.

Get a `FAL_KEY` at <https://fal.ai/dashboard/keys>. The default model is
`fal-ai/qwen-image-edit`; override it with `FAL_IMAGE_EDIT_MODEL` if you
prefer a different identity-preserving edit model from fal's catalog (e.g. a
nano-banana or flux-kontext variant), and `FAL_IMAGE_EDIT_COST_USD` if its
per-generation price differs from the default estimate.

## How it works

1. **Create a character** (`/characters/new`): upload a reference image and
   write a short identity description (age, eyes, hair, distinguishing
   features). That description is included in every future edit prompt.
2. **Studio page** (`/characters/[id]`): pick one modifier per category
   (Expressão / Penteado / Roupa / Efeito) from the seeded library
   (`src/lib/modifierSeed.ts`) and hit **Gerar**. The app composes an edit
   prompt from the character's base identity + selected modifiers
   (`src/lib/promptBuilder.ts`) and sends the reference image + prompt to the
   image connector.
3. Every generation is saved to the gallery with its exact combination, so
   **Recriar** on a past creation re-runs the same combination.
4. The dashboard (`/`) and each character's studio page show running
   generation counts and spend.

## Extending

- **More modifiers**: add rows to `MODIFIER_SEED` in
  `src/lib/modifierSeed.ts` (they seed into SQLite on first run, once the
  `modifiers` table is empty).
- **A different generative backend**: implement `ImageGenerationConnector`
  (`src/lib/connectors/types.ts`) and select it in
  `src/lib/connectors/index.ts`.
- **Video generation**: not implemented yet. Following the same connector
  pattern, a `VideoGenerationConnector` could wrap a model like Seedance
  behind the same kind of pluggable interface.
