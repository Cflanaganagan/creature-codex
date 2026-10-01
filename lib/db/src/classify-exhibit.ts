import type { PoolClient } from "pg";
import { applyExhibitClassification, groupFromLineage, knownClassification, type Classification, type Classifiable } from "./exhibit-taxonomy";

type Taxon = {oid:string;nam:string;par?:string;flg?:string;acc?:string;acn?:string};
const base=process.env.PBDB_API_BASE_URL || "https://paleobiodb.org/data1.2";
const cache=new Map<string,Classification>();
/** Free scientific lineage lookup; independent of the profile writer's category choice. */
export async function classifyExhibit(creature:Pick<Classifiable,"genus"|"scientificName">):Promise<Classification> {
  const known=knownClassification(creature);if(known)return known;
  const name=creature.scientificName || creature.genus || "";
  if(cache.has(name))return cache.get(name)!;
  try {
    const response=await fetch(`${base}/taxa/list.json?name=${encodeURIComponent(name)}&rel=all_parents`,{signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error("Lineage unavailable");
    const data=await response.json() as {records?:Taxon[];warnings?:unknown;errors?:unknown};
    if(data.errors || data.warnings || !Array.isArray(data.records))throw Error("Incomplete lineage");
    const records=data.records;const roots=records.filter(r=>r.nam.toLowerCase()===name.toLowerCase());
    if(roots.length!==1)throw Error("Ambiguous lineage");
    const byId=new Map(records.map(r=>[r.oid,r]));let row:Taxon|undefined=roots[0];
    const lineage:string[]=[];const seen=new Set<string>();
    while(row&&!seen.has(row.oid)){seen.add(row.oid);lineage.unshift(row.nam);row=byId.get(row.par || "");}
    if(!lineage.includes("Animalia"))throw Error("Incomplete ancestry");
    const result:Classification={group:groupFromLineage(lineage),lineage,source:"Paleobiology Database",sourceUrl:`https://paleobiodb.org/classic/basicTaxonInfo?taxon_no=${roots[0].oid.replace("txn:","")}`,version:1};
    if(cache.size>=2000)cache.delete(cache.keys().next().value!);cache.set(name,result);return result;
  } catch {
    // Preserve the animal as an uncertain exhibit member, never guess from its habitat or suffix.
    return {group:"Mystery Creatures",lineage:[],source:"Classification pending review",version:1};
  }
}
/** Idempotent migration: retain every original card and change only exhibit metadata. */
export async function migrateExhibits(client:PoolClient) {
  const rows=await client.query<{id:string;data:Classifiable&Record<string,unknown>}>("SELECT id,data FROM creature_collection WHERE data->>'lifeStatus'='extinct' AND COALESCE(data->>'reviewStatus','')<>'withdrawn' AND COALESCE(data->>'exhibitVersion','')<>'1'");
  for(const {id,data} of rows.rows){
    const classification=await classifyExhibit(data);
    await client.query("INSERT INTO creature_revision_backups(version,creature_id,original_data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",["nine-exhibits-v1",id,JSON.stringify(data)]);
    await client.query("UPDATE creature_collection SET data=$2 WHERE id=$1",[id,JSON.stringify(applyExhibitClassification(data,classification))]);
  }
}
