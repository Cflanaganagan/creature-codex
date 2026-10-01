import { z } from "zod";

const label = z.string().trim().min(1).max(160);
export const resolvedIdentitySchema = z.object({
  status: z.literal("resolved"),
  name: label,
  scientificName: label.regex(/^[A-Z][a-z]+ [a-z]+(?: [a-z]+)?$/, "A species or subspecies name is required"),
  genus: label.regex(/^[A-Z][a-z]+$/),
  rank: z.enum(["species", "subspecies", "domestic_form"]),
  lifeStatus: z.enum(["extant", "extinct"]),
  confidence: z.literal("high"),
  reference: z.object({source:label,taxonId:label,url:z.string().url(),checkedAt:z.string(),corroboratingUrl:z.string().url().optional(),evidence:z.array(z.object({url:z.string().url(),title:z.string().max(500),quote:z.string().max(1000)})).max(5).optional()}).optional(),
}).refine(c => c.scientificName.split(" ")[0] === c.genus, "Genus must match the resolved species");
export type ResolvedIdentity = z.infer<typeof resolvedIdentitySchema>;
export const clarificationSchema = z.object({
  status: z.literal("clarification_required"),
  message: z.string().trim().min(1).max(500),
  suggestions: z.array(label).max(4).default([]),
});
export type Clarification = z.infer<typeof clarificationSchema>;
export const normalizeName = (name: string) => name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const broadNames: Record<string, string[]> = {
  mammoth: ["Woolly Mammoth", "Columbian Mammoth", "Steppe Mammoth", "Mammuthus exilis"],
  mammuthus: ["Woolly Mammoth", "Columbian Mammoth", "Steppe Mammoth", "Mammuthus exilis"],
  "pygmy mammoth": ["Mammuthus exilis", "Mammuthus creticus"],
  smilodon: ["Smilodon fatalis", "Smilodon populator", "Smilodon gracilis"],
  "saber toothed cat": ["Smilodon fatalis", "Homotherium latidens"],
  "sabre toothed cat": ["Smilodon fatalis", "Homotherium latidens"],
  felidae: ["Smilodon fatalis", "Panthera spelaea"], canidae: ["Dire Wolf"],
  panthera: ["Panthera spelaea", "Panthera atrox"], canis: [],
  whale: ["Basilosaurus cetoides", "Dorudon atrox"], dolphin: [],
  frog: ["Beelzebufo ampinga"], shark: ["Otodus megalodon"], beetle: [],
  rabbit: [], kangaroo: ["Procoptodon goliah"],
  seahorse: [], "sea horse": [], hippocampus: [], salamander: [], salamandra: [],
  bird: ["Dodo", "Great Auk"], fish: [], mammal: [], reptile: [], amphibian: [], insect: [],
  dinosaur: ["Tyrannosaurus rex", "Triceratops horridus"],
};
export function knownClarification(query: string): Clarification | undefined {
  const key = normalizeName(query);
  const suggestions = broadNames[key] ?? broadNames[key.replace(/s$/, "")];
  if (suggestions) return { status: "clarification_required", message: `“${query}” refers to a group of creatures. Please enter a specific extinct species or its scientific name.`, suggestions };
  return undefined;
}
const domestic = (name: string, scientificName: string): ResolvedIdentity => ({status:"resolved",name,scientificName,genus:scientificName.split(" ")[0],rank:"domestic_form",lifeStatus:"extant",confidence:"high"});
export function normalizeDomestic(identity: ResolvedIdentity): ResolvedIdentity {
  if (["Canis familiaris", "Canis lupus familiaris"].includes(identity.scientificName)) return domestic("Domestic Dog", "Canis lupus familiaris");
  if (["Felis catus", "Felis silvestris catus"].includes(identity.scientificName)) return domestic("Domestic Cat", "Felis catus");
  if (["Equus caballus", "Equus ferus caballus"].includes(identity.scientificName)) return domestic("Domestic Horse", "Equus caballus");
  if (identity.rank === "domestic_form" && identity.scientificName.startsWith("Oryctolagus cuniculus")) return domestic("Domestic Rabbit", "Oryctolagus cuniculus");
  return identity;
}
export function knownIdentity(query: string): ResolvedIdentity | undefined {
  const key=normalizeName(query);
  if (["dog","domestic dog","labrador retriever","golden retriever","chihuahua","german shepherd"].includes(key)) return domestic("Domestic Dog","Canis lupus familiaris");
  if (["cat","domestic cat"].includes(key)) return domestic("Domestic Cat","Felis catus");
  if (["horse","domestic horse"].includes(key)) return domestic("Domestic Horse","Equus caballus");
  if (["domestic rabbit","netherland dwarf rabbit"].includes(key)) return domestic("Domestic Rabbit","Oryctolagus cuniculus");
  return undefined;
}
