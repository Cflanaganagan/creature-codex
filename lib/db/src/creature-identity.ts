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
  felidae: ["Domestic Cat", "Lion", "Cheetah"], canidae: ["Domestic Dog", "Gray Wolf"],
  panthera: ["Lion", "Tiger"], canis: ["Gray Wolf", "Domestic Dog"],
  whale: ["Blue Whale", "Sperm Whale"], whales: ["Blue Whale", "Sperm Whale"],
  dolphin: ["Common Bottlenose Dolphin", "Spinner Dolphin"],
  frog: ["American Bullfrog", "Red-eyed Tree Frog"], shark: ["Great White Shark", "Whale Shark"],
  beetle: ["Hercules Beetle", "Stag Beetle (Lucanus cervus)"],
  rabbit: ["Domestic Rabbit", "European Rabbit"], kangaroo: ["Red Kangaroo", "Eastern Grey Kangaroo"],
  seahorse: ["Lined Seahorse", "Dwarf Seahorse"], "sea horse": ["Lined Seahorse", "Dwarf Seahorse"],
  hippocampus: ["Lined Seahorse", "Dwarf Seahorse"],
  salamander: ["Fire Salamander", "Tiger Salamander"], salamandra: ["Fire Salamander", "Alpine Salamander"],
  bird: [], fish: [], mammal: [], reptile: [], amphibian: [], insect: [], dinosaur: [],
};
export function knownClarification(query: string): Clarification | undefined {
  const key = normalizeName(query);
  const suggestions = broadNames[key] ?? broadNames[key.replace(/s$/, "")];
  if (suggestions) return { status: "clarification_required", message: `“${query}” refers to a group of creatures. Please enter a specific species or its scientific name.`, suggestions };
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
