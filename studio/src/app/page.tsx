import Link from "next/link";
import { listCharacters, getUsageStats } from "@/lib/db";

// Characters/stats change at request time via the API — never cache this
// page's data at build time.
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const characters = listCharacters();
  const stats = getUsageStats();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Character Studio</h1>
          <p className="text-sm text-neutral-500">
            Personagens, biblioteca de modificadores e geração de imagens
            preservando identidade.
          </p>
        </div>
        <Link
          href="/characters/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          + Novo personagem
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Personagens" value={characters.length} />
        <StatCard label="Gerações" value={stats.totalCreations} />
        <StatCard
          label="Gasto total"
          value={`$${stats.totalCostUsd.toFixed(2)}`}
        />
        <StatCard
          label="Custo médio"
          value={
            stats.totalCreations > 0
              ? `$${(stats.totalCostUsd / stats.totalCreations).toFixed(3)}`
              : "$0.000"
          }
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Personagens
        </h2>
        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500 dark:border-neutral-700">
            Nenhum personagem ainda.{" "}
            <Link href="/characters/new" className="underline">
              Crie o primeiro
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 transition hover:border-neutral-400 dark:border-neutral-800"
              >
                <div className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/${character.base_image_path}`}
                    alt={character.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium">{character.name}</p>
                  {character.bio && (
                    <p className="line-clamp-2 text-xs text-neutral-500">
                      {character.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
