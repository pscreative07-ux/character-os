import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MODIFIER_SEED } from "./modifierSeed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "studio.db");

const globalForDb = globalThis as unknown as { studioDb?: Database.Database };

function createConnection() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "uploads"), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      base_prompt TEXT NOT NULL,
      base_image_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modifiers (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      prompt_fragment TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS creations (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL REFERENCES characters(id),
      expression_id TEXT REFERENCES modifiers(id),
      hairstyle_id TEXT REFERENCES modifiers(id),
      outfit_id TEXT REFERENCES modifiers(id),
      effect_id TEXT REFERENCES modifiers(id),
      prompt TEXT NOT NULL,
      image_url TEXT NOT NULL,
      model TEXT NOT NULL,
      cost_usd REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const modifierCount = db
    .prepare("SELECT COUNT(*) as count FROM modifiers")
    .get() as { count: number };

  if (modifierCount.count === 0) {
    const insert = db.prepare(
      `INSERT INTO modifiers (id, category, label, prompt_fragment, sort_order) VALUES (@id, @category, @label, @promptFragment, @sortOrder)`
    );
    const insertMany = db.transaction((rows: typeof MODIFIER_SEED) => {
      rows.forEach((row, index) => {
        insert.run({
          id: randomUUID(),
          category: row.category,
          label: row.label,
          promptFragment: row.promptFragment,
          sortOrder: index,
        });
      });
    });
    insertMany(MODIFIER_SEED);
  }

  return db;
}

// Lazily initialized: connecting/migrating at module-import time would run
// during Next.js's build-time page-data collection (which imports route
// modules in several parallel workers without calling their handlers),
// causing concurrent first-time DB creation and SQLITE_BUSY. Deferring to
// first actual use avoids that.
function getDb(): Database.Database {
  if (!globalForDb.studioDb) {
    globalForDb.studioDb = createConnection();
  }
  return globalForDb.studioDb;
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type ModifierCategory = "expression" | "hairstyle" | "outfit" | "effect";

export interface ModifierRow {
  id: string;
  category: ModifierCategory;
  label: string;
  prompt_fragment: string;
  sort_order: number;
}

export interface CharacterRow {
  id: string;
  name: string;
  bio: string;
  base_prompt: string;
  base_image_path: string;
  created_at: string;
}

export interface CreationRow {
  id: string;
  character_id: string;
  expression_id: string | null;
  hairstyle_id: string | null;
  outfit_id: string | null;
  effect_id: string | null;
  prompt: string;
  image_url: string;
  model: string;
  cost_usd: number;
  created_at: string;
}

export function listCharacters(): CharacterRow[] {
  return db
    .prepare("SELECT * FROM characters ORDER BY created_at DESC")
    .all() as CharacterRow[];
}

export function getCharacter(id: string): CharacterRow | undefined {
  return db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as
    | CharacterRow
    | undefined;
}

export function createCharacter(input: {
  name: string;
  bio: string;
  basePrompt: string;
  baseImagePath: string;
}): CharacterRow {
  const row: CharacterRow = {
    id: randomUUID(),
    name: input.name,
    bio: input.bio,
    base_prompt: input.basePrompt,
    base_image_path: input.baseImagePath,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO characters (id, name, bio, base_prompt, base_image_path, created_at)
     VALUES (@id, @name, @bio, @base_prompt, @base_image_path, @created_at)`
  ).run(row);
  return row;
}

export function listModifiers(category?: ModifierCategory): ModifierRow[] {
  if (category) {
    return db
      .prepare(
        "SELECT * FROM modifiers WHERE category = ? ORDER BY sort_order ASC"
      )
      .all(category) as ModifierRow[];
  }
  return db
    .prepare("SELECT * FROM modifiers ORDER BY category ASC, sort_order ASC")
    .all() as ModifierRow[];
}

export function getModifier(id: string): ModifierRow | undefined {
  return db.prepare("SELECT * FROM modifiers WHERE id = ?").get(id) as
    | ModifierRow
    | undefined;
}

export function listCreations(characterId?: string): CreationRow[] {
  if (characterId) {
    return db
      .prepare(
        "SELECT * FROM creations WHERE character_id = ? ORDER BY created_at DESC"
      )
      .all(characterId) as CreationRow[];
  }
  return db
    .prepare("SELECT * FROM creations ORDER BY created_at DESC")
    .all() as CreationRow[];
}

export function createCreation(input: {
  characterId: string;
  expressionId: string | null;
  hairstyleId: string | null;
  outfitId: string | null;
  effectId: string | null;
  prompt: string;
  imageUrl: string;
  model: string;
  costUsd: number;
}): CreationRow {
  const row: CreationRow = {
    id: randomUUID(),
    character_id: input.characterId,
    expression_id: input.expressionId,
    hairstyle_id: input.hairstyleId,
    outfit_id: input.outfitId,
    effect_id: input.effectId,
    prompt: input.prompt,
    image_url: input.imageUrl,
    model: input.model,
    cost_usd: input.costUsd,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO creations
      (id, character_id, expression_id, hairstyle_id, outfit_id, effect_id, prompt, image_url, model, cost_usd, created_at)
     VALUES
      (@id, @character_id, @expression_id, @hairstyle_id, @outfit_id, @effect_id, @prompt, @image_url, @model, @cost_usd, @created_at)`
  ).run(row);
  return row;
}

export function getUsageStats(characterId?: string) {
  const where = characterId ? "WHERE character_id = ?" : "";
  const params = characterId ? [characterId] : [];
  const row = db
    .prepare(
      `SELECT COUNT(*) as totalCreations, COALESCE(SUM(cost_usd), 0) as totalCostUsd
       FROM creations ${where}`
    )
    .get(...params) as { totalCreations: number; totalCostUsd: number };
  return row;
}
