"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCharacterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(file: File | null) {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!image) {
      setError("Selecione uma imagem de referência.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("name", name);
    form.set("bio", bio);
    form.set("basePrompt", basePrompt);
    form.set("image", image);

    const res = await fetch("/api/characters", { method: "POST", body: form });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Falha ao criar personagem.");
      return;
    }

    const { character } = await res.json();
    router.push(`/characters/${character.id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Novo personagem</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="image">
            Imagem de referência (ficha do personagem)
          </label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            className="text-sm"
            required
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pré-visualização"
              className="mt-2 h-48 w-48 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="bio">
            Bio (opcional)
          </label>
          <input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="basePrompt">
            Descrição da identidade (usada em toda geração)
          </label>
          <textarea
            id="basePrompt"
            value={basePrompt}
            onChange={(e) => setBasePrompt(e.target.value)}
            rows={4}
            placeholder="Ex: Mulher de 28 anos, olhos castanhos, cabelo longo castanho, óculos redondos finos, brincos de argola prateados."
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-transparent"
            required
          />
          <p className="text-xs text-neutral-500">
            Essa descrição é incluída em todo prompt de edição para manter a
            identidade do personagem consistente entre gerações.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "Criando..." : "Criar personagem"}
        </button>
      </form>
    </main>
  );
}
