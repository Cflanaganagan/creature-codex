import type { PoolClient } from "pg";

// Reviewed corrections for the initial AI discoveries. Preserve every original
// record, run once per ID, and never overwrite later editorial changes.
const VERSION = "species-validation-v2";
const livingIds = ["koala", "blue-wildebeest", "cheetah", "tiger", "red-kangaroo", "oilfish", "salamander", "domestic-dog", "domestic-rabbit"];
const patches: Record<string, Record<string, unknown>> = Object.fromEntries(livingIds.map(id => [id, {lifeStatus:"extant",mya:"Present",era:"Modern"}]));
patches["salamander"] = {...patches.salamander,name:"Fire Salamander"};
patches["domestic-dog"] = {...patches["domestic-dog"],
  size:"Highly variable among domestic dogs, from small companions to large working dogs",
  habitat:"Human-associated environments worldwide, including homes, farms and settlements",
  description:"The domestic dog is a domesticated canid descended from wolves. Dogs live alongside people across the world and vary widely in size, coat, shape and behavior. Their social behavior and ability to learn have supported roles as companions and working animals for thousands of years.",
  funFacts:[
    "Domestic dogs descend from wolves and have a long history of living alongside humans.",
    "Dogs communicate with one another using body posture, facial expressions, scent and vocal sounds.",
    "Domestic dogs have a highly developed sense of smell that helps them explore their surroundings.",
    "Selective breeding has produced considerable variation in size, coat and body shape within domestic dogs.",
    "Dogs can learn tasks and cooperate with people in a wide variety of working roles.",
  ],regions:["Worldwide"],
};
patches["domestic-rabbit"] = {...patches["domestic-rabbit"],
  size:"Variable among domestic rabbits; body size and weight depend on the individual and variety",
  habitat:"Human-managed environments worldwide; descended from the European rabbit",
  description:"The domestic rabbit is the domesticated form of the European rabbit, Oryctolagus cuniculus. It is a herbivorous mammal with long ears, strong hind legs and teeth adapted for processing plant material. Domestic rabbits vary in size and appearance but belong to the same species as their wild European ancestors.",
  funFacts:[
    "Domestic rabbits descend from the European rabbit rather than from the many other rabbit species.",
    "Rabbits are herbivorous mammals with digestive systems adapted to processing fibrous plant material.",
    "Rabbit teeth grow continuously and are worn down as the animals chew their food.",
    "Rabbits produce nutrient-rich cecotropes that they eat to recover nutrients from digestion.",
    "Young rabbits are born with closed eyes and rely on their mother for nourishment.",
  ],regions:["Worldwide"],
};
export async function repairLegacyCreatures(client: PoolClient) {
  await client.query(`CREATE TABLE IF NOT EXISTS creature_revision_backups (
    version text NOT NULL, creature_id text NOT NULL, original_data jsonb NOT NULL,
    saved_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(version,creature_id)
  )`);
  const ids=[...livingIds,"felidae","sea-horse"];
  const rows=await client.query<{id:string;data:Record<string,unknown>}>("SELECT id,data FROM creature_collection WHERE id=ANY($1) AND data->>'source'='ai' AND NOT (data ? 'identityVersion')",[ids]);
  for (const {id,data} of rows.rows) {
    const backup=await client.query("INSERT INTO creature_revision_backups(version,creature_id,original_data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING creature_id",[VERSION,id,JSON.stringify(data)]);
    if (!backup.rowCount) continue;
    const patch=patches[id] || {reviewStatus:"withdrawn",reviewReason:"Broad taxonomic group: a specific species is required."};
    await client.query("UPDATE creature_collection SET data=$2 WHERE id=$1",[id,JSON.stringify({...data,...patch})]);
  }
  // A broad historical alias must never silently resolve to an arbitrary species.
  await client.query("DELETE FROM creature_aliases WHERE alias=ANY($1)",[["salamander","salamanders","sea horse","seahorse","hippocampus","felidae"]]);
  await client.query(`INSERT INTO creature_aliases(alias,creature_id)
    SELECT 'fire salamander',id FROM creature_collection WHERE id='salamander' AND data->>'name'='Fire Salamander'
    ON CONFLICT DO NOTHING`);
}
