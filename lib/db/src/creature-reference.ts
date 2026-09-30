import { readFileSync } from "node:fs";
import { knownClarification, knownIdentity, normalizeName, type ResolvedIdentity } from "./creature-identity";

type Row = [id: string, scientificName: string, extinct: boolean, commonName: string, referenceId: string, attribution: string];
type Snapshot = {retrievedAt: string; records: Row[]; synonyms: [string,string][]};
const snapshot = JSON.parse(readFileSync(new URL("./taxon-reference.json", import.meta.url), "utf8")) as Snapshot;
if (!Array.isArray(snapshot.records) || snapshot.records.length < 10000) throw new Error("Taxonomy reference is missing or incomplete");
const byId = new Map<string, Row>();
const names = new Map<string, Set<string>>();
const preferred = new Map<string, string>();
const scientificNames = new Set<string>();
const reviewedCommonNames = new Set<string>();
const commonKeys = new Set<string>();
function addName(name: string, id: string) {
  const key = normalizeName(name);
  if (!key) return;
  const ids = names.get(key) || new Set<string>(); ids.add(id); names.set(key, ids);
}
for (const row of snapshot.records) {
  byId.set(row[0], row);
  addName(row[1],row[0]); scientificNames.add(normalizeName(row[1]));
  if (row[3]) {addName(row[3],row[0]);commonKeys.add(normalizeName(row[3]));}
}
for (const [name,id] of snapshot.synonyms) if (byId.has(id)) { addName(name,id); scientificNames.add(normalizeName(name)); }
// Common-name bridges; targets must already be accepted in the source snapshot.
const commonNames: [string,string,string[]][] = [
  ["Mammuthus primigenius","Woolly Mammoth",["Wooly mammoth"]],
  ["Mammuthus columbi","Columbian Mammoth",[]],
  ["Mammuthus trogontherii","Steppe Mammoth",[]],
  ["Mammuthus exilis","Channel Islands Pygmy Mammoth",[]],
  ["Mammuthus creticus","Cretan Dwarf Mammoth",[]],
  ["Tyrannosaurus rex","Tyrannosaurus Rex",["T. rex","T rex"]],
  ["Raphus cucullatus","Dodo",[]],
  ["Pinguinus impennis","Great Auk",[]],
  ["Ectopistes migratorius","Passenger Pigeon",[]],
  ["Thylacinus cynocephalus","Thylacine",["Tasmanian tiger"]],
  ["Hydrodamalis gigas","Steller's Sea Cow",[]],
];
for (const [scientific,name,aliases] of commonNames) {
  const ids = names.get(normalizeName(scientific));
  if (ids?.size !== 1) continue;
  const id = [...ids][0]; preferred.set(id,name);
  for (const alias of [name,...aliases]) {addName(alias,id); reviewedCommonNames.add(normalizeName(alias)); commonKeys.add(normalizeName(alias));}
}
// A documented editorial correction: PBDB currently labels this extinct subspecies extant.
// UCL Grant Museum records the last quagga's death on 12 August 1883.
const quaggaId = [...(names.get("equus quagga quagga") || [])][0];
if (quaggaId) {
  const row = byId.get(quaggaId)!; byId.set(quaggaId,[row[0],row[1],true,"Quagga",row[4],row[5]]);
  preferred.set(quaggaId,"Quagga"); addName("Quagga",quaggaId); reviewedCommonNames.add("quagga"); commonKeys.add("quagga");
}
const quaggaSource = "https://www.ucl.ac.uk/engage/museums-collections/grant-museum-zoology/top-ten-specimens-grant-museum/quagga-skeleton";
const sortedNames = [...names.keys()].sort();
const sortedCommonNames = [...commonKeys].sort();
export const referenceMetadata = { source:"Paleobiology Database", url:"https://paleobiodb.org", license:"CC BY 4.0", retrievedAt:snapshot.retrievedAt, extinctCount:[...byId.values()].filter(r=>r[2]).length };
export type ReferenceSuggestion = {taxonId:string; name:string; scientificName:string};
function suggestion(id: string): ReferenceSuggestion {
  const r = byId.get(id)!;
  const common = r[3] && names.get(normalizeName(r[3]))?.size === 1 && !knownClarification(r[3]) ? r[3] : "";
  return {taxonId:id, name:preferred.get(id) || (common ? common[0].toUpperCase()+common.slice(1) : r[1]), scientificName:r[1]};
}
function prefixKeys(prefix: string, keys=sortedNames): string[] {
  let lo=0, hi=keys.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(keys[mid]<prefix)lo=mid+1;else hi=mid;}
  const out:string[]=[];
  for(let i=lo;i<keys.length&&out.length<512&&keys[i].startsWith(prefix);i++) out.push(keys[i]);
  return out;
}
export function suggestReference(query: string, limit=7): ReferenceSuggestion[] {
  const key=normalizeName(query); if(key.length<2||key.length>160)return [];
  const ids=new Set<string>();
  const broad=knownClarification(query);
  for(const label of broad?.suggestions || []) for(const id of names.get(normalizeName(label)) || []) if(byId.get(id)?.[2])ids.add(id);
  for(const k of [...prefixKeys(key,sortedCommonNames),...prefixKeys(key)]) {
    for(const id of names.get(k) || []) if(byId.get(id)?.[2])ids.add(id);
    if(ids.size>=limit)break;
  }
  return [...ids].slice(0,limit).map(suggestion);
}
function nearName(a:string,b:string):boolean {
  if(Math.abs(a.length-b.length)>2)return false;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const next=[i];
    for(let j=1;j<=b.length;j++) next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    if(Math.min(...next)>2)return false;
    prev=next;
  }
  return prev[b.length]<=2;
}
type Verdict = {status:"resolved"; identity:ResolvedIdentity} | {status:"living_species"|"clarification_required"|"unverified_name"; message:string; suggestions:string[]};
export function resolveReference(query:string): Verdict {
  const known=knownIdentity(query);
  if(known) return {status:"living_species",message:`${known.name} is alive today. Woolly exhibits extinct creatures only.`,suggestions:[]};
  const broad=knownClarification(query);
  if(broad)return {status:"clarification_required",message:broad.message,suggestions:broad.suggestions};
  // Reviewed living names absent from this fossil-focused snapshot. Never admit them on a fuzzy match.
  if(["red kangaroo","osphranter rufus","macropus rufus","poodle"].includes(normalizeName(query))) return {status:"living_species",message:"This animal is alive today. Woolly exhibits extinct creatures only.",suggestions:[]};
  const key=normalizeName(query), ids=names.get(key);
  if(ids?.size===1){
    const id=[...ids][0], r=byId.get(id)!;
    if(!r[2])return {status:"living_species",message:`${suggestion(id).name} is listed as living in our reference. It will not be added to the extinct collection.`,suggestions:[]};
    if(!scientificNames.has(key) && !reviewedCommonNames.has(key)) return {status:"clarification_required",message:"Our reference suggests this species. Please confirm its scientific name before discovering it; common names can refer to different animals.",suggestions:[r[1]]};
    const display=suggestion(id);
    return {status:"resolved",identity:{status:"resolved",name:display.name,scientificName:r[1],genus:r[1].split(" ")[0],rank:r[1].split(" ").length===3?"subspecies":"species",lifeStatus:"extinct",confidence:"high",reference:{source:id===quaggaId?"UCL Grant Museum / Paleobiology Database":"Paleobiology Database",taxonId:id,url:id===quaggaId?quaggaSource:`https://paleobiodb.org/classic/basicTaxonInfo?taxon_no=${id.replace("txn:","")}`,checkedAt:snapshot.retrievedAt}}};
  }
  if(ids?.size)return {status:"clarification_required",message:"That name matches more than one taxon. Choose a scientific species name.",suggestions:[...ids].slice(0,4).map(id=>byId.get(id)![1])};
  let suggestions=suggestReference(query,4).map(s=>s.scientificName);
  if(!suggestions.length&&key.length>=5){
    const nearIds=new Set<string>();
    for(const k of prefixKeys(key.slice(0,3)))if(nearName(k,key))for(const id of names.get(k)||[])if(byId.get(id)?.[2])nearIds.add(id);
    suggestions=[...nearIds].slice(0,4).map(id=>byId.get(id)![1]);
  }
  return {status:suggestions.length?"clarification_required":"unverified_name",message:suggestions.length?"Please select a specific species from the reference list. We won't guess which creature you mean.":"We couldn't verify this name in our reference list. Try another spelling or a scientific species name. Missing from the list does not mean it never existed.",suggestions};
}
