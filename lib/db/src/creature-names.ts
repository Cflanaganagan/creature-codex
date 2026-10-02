/** Display policy only: never infer a species from a single reference-list result. */
export type NamedCreature = {name:string;genus:string;scientificName?:string;monotypic?:boolean};
// Reviewed single-species genera. Canonical identities are not changed by this list.
// Reviewed 2026-10-02; sources include NHM Suchomimus, Xu et al. 1999
// (doi:10.1038/20670), and taxonomic accounts linked below.
export const singleSpeciesGenera:Record<string,{scientificName:string;source:string}> = {
 Suchomimus:{scientificName:"Suchomimus tenerensis",source:"https://www.nhm.ac.uk/discover/dino-directory/suchomimus.html"},
 Koolasuchus:{scientificName:"Koolasuchus cleelandi",source:"https://en.wikipedia.org/wiki/Koolasuchus"},
 Beipiaosaurus:{scientificName:"Beipiaosaurus inexpectus",source:"https://en.wikipedia.org/wiki/Beipiaosaurus"},
 Falcatus:{scientificName:"Falcatus falcatus",source:"https://en.wikipedia.org/wiki/Falcatus"},
 Scutosaurus:{scientificName:"Scutosaurus karpinskii",source:"https://en.wikipedia.org/wiki/Scutosaurus"},
};
// Unambiguous common-name bridges already used by the reference resolver.
const legacyCommonNames:Record<string,string> = {
 "tyrannosaurus rex":"Tyrannosaurus rex", "dodo":"Raphus cucullatus", "great auk":"Pinguinus impennis",
 "passenger pigeon":"Ectopistes migratorius", "thylacine":"Thylacinus cynocephalus",
 "stellers sea cow":"Hydrodamalis gigas", "steller's sea cow":"Hydrodamalis gigas",
 "woolly mammoth":"Mammuthus primigenius", "steppe mammoth":"Mammuthus trogontherii",
};
export function applyCreatureNames<T extends NamedCreature>(creature:T):T {
 const reviewed=singleSpeciesGenera[creature.genus];
 const scientificName=creature.scientificName?.trim() || legacyCommonNames[creature.name.toLowerCase()] || reviewed?.scientificName;
 if(!scientificName)return creature; // Old genus/family-level cards must not acquire an invented species.
 const single=creature.monotypic===true || reviewed?.scientificName===scientificName;
 const isScientificTitle=creature.name.toLowerCase()===scientificName.toLowerCase();
 const isGenusTitle=creature.name.toLowerCase()===creature.genus.toLowerCase();
 const name=isScientificTitle||isGenusTitle ? (single?creature.genus:scientificName) : creature.name;
 return {...creature,name,scientificName};
}
export const scientificLabel=(creature:NamedCreature)=>applyCreatureNames(creature).scientificName || creature.genus;
