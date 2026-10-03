/** Display policy only; admission and canonical taxon identity remain separate. */
export type NamedCreature = {name:string;genus:string;scientificName?:string;monotypic?:boolean;referenceSpeciesCount?:number;id?:string};
// Reviewed single-species genera. Canonical identities are not changed by this list.
// Reviewed 2026-10-02; sources include NHM Suchomimus, Xu et al. 1999
// (doi:10.1038/20670), and taxonomic accounts linked below.
export const singleSpeciesGenera:Record<string,{scientificName:string;source:string}> = {
 Ornithocheirus:{scientificName:"Ornithocheirus simus",source:"https://doi.org/10.1080/08912963.2019.1690482"},
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
 // This founding card describes Mary Anning's English specimen (NHM collection).
 // https://www.nhm.ac.uk/discover/mary-anning-fossils.html
 const legacySpecies=creature.id==="dimorphodon" && creature.genus==="Dimorphodon" ? "Dimorphodon macronyx" : undefined;
 const stored=creature.scientificName?.trim();
 const titleParts=creature.name.trim().split(/\s+/);
 const scientificTitle=titleParts[0]===creature.genus && titleParts.length>=2 && titleParts.length<=3 && titleParts.slice(1).every(part=>/^[a-z]+$/.test(part)) ? creature.name.trim() : undefined;
 const scientificName=(stored && stored.includes(" ") ? stored : undefined) || legacySpecies || scientificTitle || legacyCommonNames[creature.name.toLowerCase()] || reviewed?.scientificName;
 if(!scientificName)return creature; // Old genus/family-level cards must not acquire an invented species.
 const single=(creature.monotypic===true || creature.referenceSpeciesCount===1 || reviewed?.scientificName===scientificName) && scientificName.split(/\s+/).length===2;
 const isScientificTitle=creature.name.toLowerCase()===scientificName.toLowerCase();
 const isGenusTitle=creature.name.toLowerCase()===creature.genus.toLowerCase();
 const name=isScientificTitle||isGenusTitle ? (single?creature.genus:scientificName) : creature.name;
 return {...creature,name,scientificName};
}
export const scientificLabel=(creature:NamedCreature)=>applyCreatureNames(creature).scientificName || creature.genus;
