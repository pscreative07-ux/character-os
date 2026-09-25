"use client";

import { useMemo, useState } from "react";
import type {
  CharacterRow,
  CreationRow,
  ModifierCategory,
  ModifierRow,
} from "@/lib/db";

const CATEGORY_LABELS: Record<ModifierCategory, string> = {
  expression: "Expressão",
  hairstyle: "Penteado",
  outfit: "Roupa",
  effect: "Efeito",
};

const CATEGORY_ORDER: ModifierCategory[] = [
  "expression",
  "hairstyle",
  "outfit",
  "effect",
];

interface Props {
  character: CharacterRow;
  modifiers: ModifierRow[];
  initialCreations: CreationRow[];
  initialStats: { totalCreations: number; totalCostUsd: number };
}

type Selection = Partial<Record<ModifierCategory, string>>;

export function StudioClient({
  character,
  modifiers,
  initialCreations,
  initialStats,
}: Props) {
  const [activeTab, setActiveTab] = useState<ModifierCategory>("expression");
  const [selection, setSelection] = useState<Selection>({});
  const [creations, setCreations] = useState(initialCreations);
  const [stats, setStats] = useState(initialStats);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<ModifierCategory, ModifierRow[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const modifier of modifiers) {
      map.get(modifier.category)?.push(modifier);
    }
    return map;
  }, [modifiers]);

  const latest = creations[0];

  async function generate(overrides?: Selection) {
    setGenerating(true);
    setError(null);
    const combo = overrides ?? selection;

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: character.id,
        expressionId: combo.expression,
        hairstyleId: combo.hairstyle,
        outfitId: combo.outfit,
        effectId: combo.effect,
      }),
    });

    setGenerating(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Falha ao gerar imagem.");
      return;
    }

    const { creation } = await res.json();
    setCreations((prev) => [creation, ...prev]);
    setStats((prev) => ({
      totalCreations: prev.totalCreations + 1,
      totalCostUsd: prev.totalCostUsd + creation.cost_usd,
    }));
  }

  function toggle(category: ModifierCategory, modifierId: string) {
    setSelection((prev) => ({
      ...prev,
      [category]: prev[category] === modifierId ? undefined : modifierId,
    }));
  }

  function recreate(creation: CreationRow) {
    const combo: Selection = {
      expression: creation.expression_id ?? undefined,
      hairstyle: creation.hairstyle_id ?? undefined,
      outfit: creation.outfit_id ?? undefined,
      effect: creation.effect_id ?? undefined,
    };
    setSelection(combo);
    void generate(combo);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{character.name}</h1>
          {character.bio && (
            <p className="text-sm text-neutral-500">{character.bio}</p>
          )}
        </div>
        <div className="flex gap-4 text-sm text-neutral-500">
          <span>{stats.totalCreations} gerações</span>
          <span>${stats.totalCostUsd.toFixed(2)} gasto</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
        {/* Modifier picker */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1 rounded-full bg-neutral-100 p-1 text-sm dark:bg-neutral-900">
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`rounded-full px-3 py-1.5 transition ${
                  activeTab === category
                    ? "bg-white font-medium shadow-sm dark:bg-neutral-700"
                    : "text-neutral-500"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {byCategory.get(activeTab)?.map((modifier) => {
              const active = selection[activeTab] === modifier.id;
              return (
                <button
                  key={modifier.id}
                  onClick={() => toggle(activeTab, modifier.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800"
                  }`}
                >
                  {modifier.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + generate */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <PreviewCard
              label="Referência"
              src={`/api/files/${character.base_image_path}`}
            />
            <PreviewCard
              label={latest ? `Última (${latest.model})` : "Resultado"}
              src={latest?.image_url}
              loading={generating}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={() => generate()}
            disabled={generating}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {generating ? "Gerando..." : "Gerar"}
          </button>
        </div>

        {/* Gallery */}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Minhas criações
          </h2>
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
            {creations.length === 0 && (
              <p className="text-sm text-neutral-500">
                Nenhuma geração ainda.
              </p>
            )}
            {creations.map((creation) => (
              <div
                key={creation.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creation.image_url}
                  alt="Criação"
                  className="h-14 w-14 rounded object-cover"
                />
                <div className="flex-1 text-xs text-neutral-500">
                  <p>${creation.cost_usd.toFixed(3)}</p>
                  <p>{new Date(creation.created_at).toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => recreate(creation)}
                  className="rounded-full border border-neutral-300 px-2 py-1 text-xs hover:border-neutral-500 dark:border-neutral-700"
                >
                  Recriar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function PreviewCard({
  label,
  src,
  loading,
}: {
  label: string;
  src?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-neutral-500">{label}</p>
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
        {loading ? (
          <span className="text-xs text-neutral-500">Gerando...</span>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500">—</span>
        )}
      </div>
    </div>
  );
}
