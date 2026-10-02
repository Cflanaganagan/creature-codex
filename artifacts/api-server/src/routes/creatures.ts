import { researchCreature } from "../research-creature";
import { applyCreatureNames, readCollection, discoverCreature, classifyExhibit, applyExhibitClassification, type Classification, CollectionError, knownClarification, knownIdentity, checkReferenceStatus, resolveReference, getResearchCandidate, suggestReference, referenceMetadata, type ResolvedIdentity } from "@workspace/db";
import { Router, type IRouter } from "express";
import { anthropic, anthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { AiCreatureLookupBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are the AI naturalist for Woolly — Museum of the Extinct. When given a resolved creature identity, respond with ONLY a valid JSON object in exactly this format with no other text:
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
- You receive ONLY a resolved species identity, never a raw visitor search. Write exclusively about that resolved creature.
- Never discuss or focus on a particular domestic breed. All biography, facts, size, habitat and relatives must describe the resolved creature as a whole.
- Do not change the resolved name, scientificName, genus, rank or lifeStatus.
- Only extinct creatures are admitted. Never use an evolutionary origin or domestication date as an extinction date.
- For extinct creatures use their actual known geological range in millions of years, or "Extinct YEAR" for a known recent extinction. Never infer a numerical date from uncertainty.
- The server supplies the category. Use that category exactly; do not classify by habitat or appearance.
- Exhibit groups: Invertebrates; Fish; Amphibians & Early Tetrapods; Synapsids (NON-mammalian only); Mammals; Reptiles (excluding dinosaurs and birds for exhibit purposes); Dinosaurs (NON-avian only); Birds; Mystery Creatures (unresolved placement).
- Mammals belong in Mammals even if aquatic. Dimetrodon, gorgonopsians and dicynodonts are non-mammalian synapsids, not reptiles or mammals. Pterosaurs, mosasaurs, plesiosaurs and crocodile relatives are Reptiles, not dinosaurs or fish. Birds are avian dinosaurs but have their own exhibit. Sharks and bony fishes belong in Fish. Arthropods, ammonites and other invertebrates stay in Invertebrates regardless of aquatic habitat.
- Do not change a biological group because mysteryLevel is high. Mystery is also a separate overlapping exhibit.
- For the regions field: list the continents or major world regions where this creature lived or where its fossils have been found. Use these values only: "North America", "South America", "Europe", "Africa", "Asia", "Australia", "Antarctica", "Worldwide". Include all that apply. For marine/aquatic creatures that roamed globally use ["Worldwide"].
- Never invent a creature. Mystery Creatures must also be real extinct animals supported by fossil evidence.
- Set scientificName to the accepted Latin species name when known, or the recognized fossil taxon. Use the same canonical name for synonyms and breeds, so each taxon has one shared entry.
- Respond with ONLY the JSON. No markdown, no code blocks, no explanation.`;

async function callClaude(identity: ResolvedIdentity, classification:Classification): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify({...identity,category:classification.group}) }],
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

async function resolveCreature(name: string, reserve: () => Promise<void>): Promise<ResolvedIdentity> {
  const verdict = resolveReference(name);
  if (verdict.status !== "resolved") {
    const candidate = verdict.researchAllowed ? getResearchCandidate(name) : undefined;
    if (candidate) return researchCreature(name, reserve, candidate);
    throw new CollectionError(422, verdict.message, verdict.status, verdict.suggestions);
  }
  try { return await checkReferenceStatus(verdict.identity); }
  catch (error) {
    if (error instanceof CollectionError && error.code === "unverified_name")
      return researchCreature(name, reserve, verdict.identity);
    throw error;
  }
}
async function generateCreature(identity: ResolvedIdentity): Promise<unknown> {
  const classification=await classifyExhibit(identity);
  let creature = await callClaude(identity, classification);
  if (!hasFiveFunFacts(creature)) creature = await callClaude(identity, classification);
  if (!creature || typeof creature !== "object") return creature;
  return { ...creature, ...applyExhibitClassification({genus:identity.genus,category:classification.group,mysteryLevel:Number((creature as Record<string,unknown>).mysteryLevel) || 0},classification), name:identity.name, scientificName:identity.scientificName, genus:identity.genus,
    lifeStatus:identity.lifeStatus, taxonRank:identity.rank, identityVersion:2, reference:identity.reference, monotypic:identity.monotypic,
    ...(identity.lifeStatus === "extant" ? {era:"Modern",mya:"Present"} : {}) };
}

router.get("/creatures", async (_req, res) => {
  try { res.setHeader("Cache-Control", "no-store"); res.json(await readCollection()); }
  catch(error) { res.status(503).json({error:"The shared collection is temporarily unavailable. Please try again shortly."}); }
});

// This endpoint reads only the bundled reference. It never contacts an AI provider.
router.get("/creatures/reference", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length > 160) { res.status(400).json({error:"Enter a name of up to 160 characters."}); return; }
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({matches:suggestReference(q), verdict:q.length>=2?resolveReference(q):null, reference:referenceMetadata});
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
    const known = knownIdentity(name);
    if (known?.lifeStatus === "extant") throw new CollectionError(422, `${known.name} is alive today. Woolly exhibits extinct creatures only, so no card was added.`, "living_species");
    const clarification = knownClarification(name);
    if (clarification) throw new CollectionError(422,clarification.message,"clarification_required",clarification.suggestions);
    const creature = await discoverCreature(name, resolveCreature, generateCreature, anthropicConfigured);
    res.json(applyCreatureNames(creature));
  } catch (error) {
    if (error instanceof CollectionError) { res.status(error.status).json({error:error.message,code:error.code,suggestions:error.suggestions}); return; }
    req.log.error({err:error}, "Creature discovery failed");
    res.status(503).json({error:"We couldn't complete that discovery right now. Please try again shortly."});
  }
});

export default router;
