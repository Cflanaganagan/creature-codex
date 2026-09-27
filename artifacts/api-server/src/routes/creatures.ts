import { readCollection, discoverCreature, CollectionError } from "@workspace/db";
import { Router, type IRouter } from "express";
import { anthropic, anthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { AiCreatureLookupBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a natural history expert. When given a creature name, respond with ONLY a valid JSON object in exactly this format with no other text:
{
  "name": "",
  "genus": "",
  "scientificName": "",
  "category": "",
  "era": "",
  "mya": "",
  "diet": "",
  "size": "",
  "habitat": "",
  "description": "",
  "funFacts": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"],
  "family": [{"name": "", "living": true}],
  "mysteryLevel": 0,
  "regions": ["North America", "Asia"]
}

CRITICAL RULES:
- The funFacts array MUST contain EXACTLY 5 strings. No more, no fewer. This is mandatory.
- Each fun fact must be a complete, interesting sentence of at least 10 words.
- Do not leave any funFacts entries empty or as placeholders.
- For mysteryLevel: 0 = well known, 1 = some gaps in knowledge, 2 = very little known, 3 = almost unknown.
- CREATURE ENTRY BOUNDARY: Create entries for scientifically recognized species. A recognized subspecies or distinct fossil taxon may also receive its own entry when it is commonly treated as a meaningful taxonomic entity in reliable natural-history sources.
- Do NOT create separate entries for domestic breeds, cultivars, color morphs, pet varieties, sexes, life stages, or informal variants. For example, Golden Retriever, Chihuahua, and German Shepherd should resolve to the domestic dog (Canis lupus familiaris / Canis familiaris as appropriate), not become separate creature entries.
- If the user searches a breed or informal variant, return the parent species/taxon in the name/genus fields and describe the species, not the breed.
- Common umbrella words such as frog, shark, or beetle may refer to many species. When the search clearly names a recognized species (for example a specific poison dart frog species), that species can have its own entry.
- For extinct organisms, allow recognized genera or other established fossil taxa when a species-level assignment is uncertain or the creature is conventionally known by that taxon (for example Tyrannosaurus or Dimetrodon). Do not invent taxonomic precision.
- For category use one of: Mammals, Reptiles, Birds, Aquatic, Amphibians, Invertebrates, Mystery Creatures.
- Mammals: any warm-blooded furry creature, prehistoric or living (mammoths, wolves, whales that are biological mammals but not primarily water-dwellers, etc.)
- Reptiles: all dinosaurs (theropods, sauropods, ceratopsians, armoured, hadrosaurs), pterosaurs, synapsids, prehistoric and living reptiles (crocodilians, lizards, snakes)
- Birds: all birds prehistoric and living, including recently extinct birds (dodo, great auk, terror bird, archaeopteryx, passenger pigeon, etc.)
- Aquatic: vertebrates and invertebrates that lived primarily in water, EXCEPT amphibians, which always belong in Amphibians (plesiosaurs, mosasaurs, prehistoric sharks, marine mammals like orca/sperm whale, sea cows, aquatic invertebrates, aquatic reptiles)
- Amphibians: all living and extinct amphibians, including frogs, toads, salamanders, newts, caecilians, temnospondyls, and other scientifically recognized amphibian taxa.
- Invertebrates: insects, arthropods, worms, molluscs, and all spineless creatures (prehistoric or living)
- Mystery Creatures: creatures with very little fossil evidence, debated classification, or so bizarre they defy easy categorisation. Use for mysteryLevel 2 or 3 creatures.
- For the regions field: list the continents or major world regions where this creature lived or where its fossils have been found. Use these values only: "North America", "South America", "Europe", "Africa", "Asia", "Australia", "Antarctica", "Worldwide". Include all that apply. For marine/aquatic creatures that roamed globally use ["Worldwide"].
- If the search term is not a real creature or is fictional, return a mysteryLevel 3 entry with category "Mystery Creatures", genus "Unknown", and still include exactly 5 funFacts explaining what is unknown. Set regions to [].
- Set scientificName to the accepted Latin species name when known, or the recognized fossil taxon. Use the same canonical name for synonyms and breeds, so each taxon has one shared entry.
- Respond with ONLY the JSON. No markdown, no code blocks, no explanation.`;

async function callClaude(name: string): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: name }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  const rawText = block.text.trim();
  try {
    return JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  }
}

function hasFiveFunFacts(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.funFacts) && d.funFacts.length === 5 &&
    d.funFacts.every((f) => typeof f === "string" && f.trim().length > 5);
}

async function generateCreature(name: string): Promise<unknown> {
    let creature = await callClaude(name);

    if (!hasFiveFunFacts(creature)) {
      // Retry incomplete facts once before server-side validation.
      const retryMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: name },
          { role: "assistant", content: JSON.stringify(creature) },
          { role: "user", content: `The funFacts array must contain EXACTLY 5 complete facts. Please return the complete JSON again with exactly 5 fun facts filled in. Respond with ONLY valid JSON.` },
        ],
      });
      const retryBlock = retryMessage.content[0];
      if (retryBlock.type === "text") {
        try {
          const raw = retryBlock.text.trim();
          creature = JSON.parse(raw);
        } catch {
          const match = retryBlock.text.match(/\{[\s\S]*\}/);
          if (match) creature = JSON.parse(match[0]);
        }
      }
    }

    return creature;
}

router.get("/creatures", async (_req, res) => {
  try { res.setHeader("Cache-Control", "no-store"); res.json(await readCollection()); }
  catch(error) { res.status(503).json({error:"The shared collection is temporarily unavailable. Please try again shortly."}); }
});

const recentRequests = new Map<string, { count: number; until: number }>();
router.post("/creatures/ai-lookup", async (req, res) => {
  const parsed = AiCreatureLookupBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.name.trim() || parsed.data.name.trim().length > 160) {
    res.status(400).json({ error: "Enter a creature name of up to 160 characters." }); return;
  }
  const now = Date.now();
  for (const [key, value] of recentRequests) if (value.until < now) recentRequests.delete(key);
  const ip = req.ip || "unknown";
  const usage = recentRequests.get(ip) || { count: 0, until: now + 600000 };
  if (usage.count >= 20) { res.status(429).json({error:"Please wait a few minutes before making more discovery requests."}); return; }
  usage.count++; recentRequests.set(ip, usage);
  try {
    const name = parsed.data.name.trim();
    const creature = await discoverCreature(name, () => generateCreature(name), anthropicConfigured);
    res.json(creature);
  } catch (error) {
    if (error instanceof CollectionError) { res.status(error.status).json({error:error.message}); return; }
    req.log.error({err:error}, "Creature discovery failed");
    res.status(503).json({error:"We couldn't complete that discovery right now. Please try again shortly."});
  }
});

export default router;
