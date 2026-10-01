import { exhibitLineages } from "./exhibit-lineages";

export const EXHIBITS = ["Mammals", "Dinosaurs", "Fish", "Synapsids", "Reptiles", "Birds", "Amphibians & Early Tetrapods", "Invertebrates", "Mystery Creatures"] as const;
export type Exhibit = typeof EXHIBITS[number];
export type Classification = {group:Exhibit;lineage:string[];source:string;sourceUrl?:string;version:1};
export type Classifiable = {genus?:string;scientificName?:string;category:string;mysteryLevel?:number;mysteryExhibit?:boolean;classification?:Classification;exhibitVersion?:number};
export const EXHIBIT_VERSION = 1;
export function groupFromLineage(lineage: readonly string[]): Exhibit {
  const has=(...names:string[])=>names.some(name=>lineage.includes(name));
  // Narrow descendants must precede broad ancestors: mammals are synapsids;
  // birds are dinosaurs, and all tetrapods descend from bony fishes.
  if(has("Mammalia")) return "Mammals";
  if(has("Aves","Avialae")) return "Birds";
  if(has("Dinosauria")) return "Dinosaurs";
  if(has("Synapsida")) return "Synapsids";
  if(has("Sauropsida","Reptilia")) return "Reptiles";
  if(has("Tetrapoda","Elpistostegalia","Elpistostegidae","Amphibia","Temnospondyli")) return "Amphibians & Early Tetrapods";
  if(has("Vertebrata","Craniata","Chondrichthyes","Placodermi","Osteichthyes")) return "Fish";
  if(has("Animalia") && !has("Chordata")) return "Invertebrates";
  return "Mystery Creatures";
}
export function knownClassification(creature: Pick<Classifiable,"genus"|"scientificName">): Classification | undefined {
  const genus=(creature.scientificName?.split(" ")[0] || creature.genus || "").trim().toLowerCase();
  // Do not turn the disputed Tully monster placement into a settled fish/mollusc claim.
  if(genus==="tullimonstrum")return {group:"Mystery Creatures",lineage:["Animalia","Tullimonstrum"],source:"Editorial review: disputed placement",version:1};
  const data=exhibitLineages[genus];
  if(!data)return undefined;
  return {group:groupFromLineage(data.lineage),lineage:[...data.lineage],source:"Paleobiology Database",sourceUrl:`https://paleobiodb.org/classic/basicTaxonInfo?taxon_no=${data.taxonId.replace("txn:","")}`,version:1};
}
export function applyExhibitClassification<T extends Classifiable>(creature:T, classification?:Classification):T & {classification:Classification;exhibitVersion:1} {
  const classified=classification || (creature.exhibitVersion===1?creature.classification:undefined) || knownClassification(creature) || {group:"Mystery Creatures" as const,lineage:[],source:"Classification pending review",version:1 as const};
  return {...creature,category:classified.group,classification:classified,exhibitVersion:1,
    mysteryExhibit:creature.mysteryExhibit===true || creature.category==="Mystery Creatures" || (creature.mysteryLevel || 0)>=2 || classified.group==="Mystery Creatures"};
}
export const isInExhibit = (creature:Classifiable, exhibit:string) => exhibit==="Mystery Creatures"
  ? creature.category==="Mystery Creatures" || creature.mysteryExhibit===true || (creature.mysteryLevel || 0)>=2
  : creature.category===exhibit;
export function normalizeExhibitLink(value:string|null):string|null {
  const aliases:Record<string,string>={Aquatic:"Fish",Amphibians:"Amphibians & Early Tetrapods","Theropods":"Dinosaurs","Sauropods":"Dinosaurs","Ceratopsians":"Dinosaurs","Armoured Dinosaurs":"Dinosaurs","Marine Reptiles":"Reptiles",Pterosaurs:"Reptiles","Prehistoric Fish":"Fish","Prehistoric Mammals":"Mammals","Ice Age Megafauna":"Mammals","Giant Prehistoric Insects":"Invertebrates"};
  return value?(aliases[value] || value):null;
}
