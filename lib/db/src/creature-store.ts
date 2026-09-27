import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, usagePool, databaseConfigured } from "./pool";
import { type ResolvedIdentity } from "./creature-identity";
import { repairLegacyCreatures } from "./repair-legacy-creatures";
import { seedCreatures } from "./seed-creatures";

const text = z.string().trim().min(1).max(2000);
export const discoveredCreatureSchema = z.object({
  name: text.max(160), scientificName: text.max(160), genus: text.max(160),
  category: z.enum(["Mammals", "Reptiles", "Birds", "Aquatic", "Amphibians", "Invertebrates", "Mystery Creatures"]),
  lifeStatus: z.enum(["extant", "extinct"]), taxonRank: z.enum(["species", "subspecies", "domestic_form"]), identityVersion: z.literal(2),
  era: text, mya: text, diet: text, size: text, habitat: text, description: text,
  funFacts: z.array(text).length(5), family: z.array(z.object({ name: text, living: z.boolean() })).max(50),
  mysteryLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  regions: z.array(text).max(20).optional(),
}).refine(c => c.genus.toLowerCase() !== "unknown" && !/fictional|does not exist|not a real creature/i.test(c.description), "This must be a real, recognized creature.").refine(c => c.lifeStatus !== "extinct" || !/present|extant|living|modern|ongoing/i.test(c.mya), "An extinct creature needs an extinction range, not a living label.");
export type StoredCreature = z.infer<typeof discoveredCreatureSchema> & { id: string; source?: "seed" | "ai"; discoveredAt?: string };
export class CollectionError extends Error { constructor(public status: number, message: string, public code?: string, public suggestions: string[] = []) { super(message); } }
export const normalizeCreatureName = (name: string) => name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
let initialization: Promise<void> | undefined;

export function initializeCollection(): Promise<void> {
  if (!databaseConfigured) return Promise.resolve();
  if (!initialization) initialization = initialize().catch(error => { initialization = undefined; throw error; });
  return initialization;
}
async function initialize() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(729302611)");
    await client.query(`CREATE TABLE IF NOT EXISTS creature_collection (
      id text PRIMARY KEY, taxon_key text NOT NULL UNIQUE, data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS creature_aliases (
      alias text PRIMARY KEY, creature_id text NOT NULL REFERENCES creature_collection(id)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS creature_discovery_usage (
      day date PRIMARY KEY, requests integer NOT NULL DEFAULT 0
    )`);
    for (const creature of seedCreatures) {
      const key = normalizeCreatureName(creature.name);
      await client.query("INSERT INTO creature_collection(id,taxon_key,data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [creature.id,key,JSON.stringify({...creature,source:"seed"})]);
      await client.query("INSERT INTO creature_aliases(alias,creature_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [key,creature.id]);
    }
    await repairLegacyCreatures(client);
    await client.query("COMMIT");
  } catch(error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
export async function readCollection() {
  if (!databaseConfigured) return { mode: "preview" as const, creatures: seedCreatures, total: seedCreatures.length };
  await initializeCollection();
  const result = await pool.query<{data:StoredCreature}>("SELECT data FROM creature_collection WHERE COALESCE(data->>'reviewStatus','') <> 'withdrawn' ORDER BY created_at, id");
  return { mode: "shared" as const, creatures: result.rows.map(row=>row.data), total:result.rowCount || 0 };
}

/** Lock per search across processes; unique taxon keys protect concurrent aliases. */
export async function discoverCreature(query: string, resolve: (query: string) => Promise<ResolvedIdentity>, generate: (identity: ResolvedIdentity) => Promise<unknown>, canGenerate = true): Promise<StoredCreature> {
  if (!databaseConfigured) throw new CollectionError(503, "The shared collection is not connected yet. Existing creatures are still available.");
  await initializeCollection();
  const key = normalizeCreatureName(query);
  if (!key || key.length > 160) throw new CollectionError(400, "Enter a creature name of up to 160 characters.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '65s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
    const found = await client.query<{data:StoredCreature}>("SELECT c.data FROM creature_aliases a JOIN creature_collection c ON c.id=a.creature_id WHERE a.alias=$1 AND COALESCE(c.data->>'reviewStatus','') <> 'withdrawn'",[key]);
    if (found.rows[0]) { await client.query("COMMIT"); return found.rows[0].data; }
    if (!canGenerate) throw new CollectionError(503, "AI discovery is not configured yet. The shared collection is still available.");
    // This budget counts generation attempts, even if validation/provider calls fail.
    const limit = Math.max(1, Number(process.env.DISCOVERY_DAILY_LIMIT) || 100);
    const budget = await usagePool.query(`INSERT INTO creature_discovery_usage(day,requests) VALUES(CURRENT_DATE,1)
      ON CONFLICT(day) DO UPDATE SET requests=creature_discovery_usage.requests+1
      WHERE creature_discovery_usage.requests<$1 RETURNING requests`,[limit]);
    if (!budget.rowCount) throw new CollectionError(429,"Today's discovery allowance has been reached. Please explore the existing collection and try again tomorrow.");
    const identity = await resolve(query);
    // Reuse a resolved species before generating prose. Never forward the raw query.
    const identityKey = normalizeCreatureName(identity.scientificName);
    const resolvedName = normalizeCreatureName(identity.name);
    const canonical = await client.query<{data:StoredCreature}>(`SELECT c.data FROM creature_collection c LEFT JOIN creature_aliases a ON a.creature_id=c.id
      WHERE (c.taxon_key=$1 OR a.alias=$1 OR a.alias=$2) AND COALESCE(c.data->>'reviewStatus','') <> 'withdrawn' LIMIT 1`,[identityKey,resolvedName]);
    if (canonical.rows[0]) {
      const saved=canonical.rows[0].data;
      await client.query("INSERT INTO creature_aliases(alias,creature_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[key,saved.id]);
      await client.query("COMMIT"); return saved;
    }
    const parsed = discoveredCreatureSchema.safeParse(await generate(identity));
    if (!parsed.success) throw new CollectionError(422,"We couldn't verify a complete entry for that creature. Try its common or scientific name.");
    const creature = parsed.data;
    const scientificKey = normalizeCreatureName(creature.scientificName || creature.name);
    const nameKey = normalizeCreatureName(creature.name);
    const existing = await client.query<{data:StoredCreature}>(`SELECT c.data FROM creature_collection c LEFT JOIN creature_aliases a ON a.creature_id=c.id
      WHERE c.taxon_key=$1 OR a.alias=$2 OR a.alias=$1 LIMIT 1`,[scientificKey,nameKey]);
    let saved = existing.rows[0]?.data;
    if (!saved) {
      const slug = creature.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || randomUUID();
      const newCreature:StoredCreature = {...creature,id:slug,source:"ai",discoveredAt:new Date().toISOString()};
      const inserted = await client.query<{data:StoredCreature}>(`INSERT INTO creature_collection(id,taxon_key,data) VALUES($1,$2,$3)
        ON CONFLICT DO NOTHING RETURNING data`,[slug,scientificKey,JSON.stringify(newCreature)]);
      saved=inserted.rows[0]?.data;
      if (!saved) {
        const winner=await client.query<{data:StoredCreature}>("SELECT data FROM creature_collection WHERE taxon_key=$1 OR id=$2 LIMIT 1",[scientificKey,slug]);
        saved=winner.rows[0]?.data;
      }
    }
    if (!saved) throw new Error("Could not save creature");
    for (const alias of new Set([key,nameKey,scientificKey])) {
      await client.query("INSERT INTO creature_aliases(alias,creature_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[alias,saved.id]);
    }
    await client.query("COMMIT");
    return saved;
  } catch(error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
