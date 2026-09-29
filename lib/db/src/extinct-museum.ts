import type { PoolClient } from "pg";
import { seedCreatures } from "./seed-creatures";

const VERSION = "extinct-museum-v1";
const seedStatus = new Map(seedCreatures.map(c => [c.id, c.lifeStatus]));

/** Archive rather than delete; record the complete pre-migration JSON once. */
export async function prepareExtinctMuseum(client: PoolClient) {
  const rows = await client.query<{id: string; data: Record<string, unknown>}>(
    `SELECT id,data FROM creature_collection WHERE NOT (data ? 'museumVersion')`
  );
  for (const {id, data} of rows.rows) {
    // Only reviewed founding records or explicit validated statuses are trusted.
    // A fossil age alone is not evidence of extinction for old AI discoveries.
    const status = data.source === "seed" ? seedStatus.get(id) : data.lifeStatus;
    const livingLabel = /present|extant|living|ongoing/i.test(String(data.mya || ""));
    const eligible = status === "extinct" && !livingLabel && data.reviewStatus !== "withdrawn";
    await client.query(`INSERT INTO creature_revision_backups(version,creature_id,original_data)
      VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, [VERSION,id,JSON.stringify(data)]);
    const patch = eligible
      ? {lifeStatus:"extinct",museumVersion:1}
      : {lifeStatus: livingLabel ? "extant" : status || "unverified", museumVersion:1, reviewStatus:"withdrawn",
         reviewReason: status === "extant" || livingLabel ? "Living species: outside the extinct museum collection." : "Identity or extinction status needs review before exhibition."};
    await client.query("UPDATE creature_collection SET data=$2 WHERE id=$1", [id,JSON.stringify({...data,...patch})]);
  }
}
