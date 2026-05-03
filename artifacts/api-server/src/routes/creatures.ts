import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { AiCreatureLookupBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a natural history expert. When given a creature name, respond with ONLY a valid JSON object in exactly this format with no other text:
{
  "name": "",
  "genus": "",
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
- For category use one of: Mammals, Reptiles, Birds, Aquatic, Invertebrates, Mystery Creatures.
- Mammals: any warm-blooded furry creature, prehistoric or living (mammoths, wolves, whales that are biological mammals but not primarily water-dwellers, etc.)
- Reptiles: all dinosaurs (theropods, sauropods, ceratopsians, armoured, hadrosaurs), pterosaurs, synapsids, prehistoric and living reptiles (crocodilians, lizards, snakes)
- Birds: all birds prehistoric and living, including recently extinct birds (dodo, great auk, terror bird, archaeopteryx, passenger pigeon, etc.)
- Aquatic: anything that lived primarily in water regardless of biological class (plesiosaurs, mosasaurs, prehistoric sharks, marine mammals like orca/sperm whale, sea cows, aquatic invertebrates, aquatic reptiles)
- Invertebrates: insects, arthropods, worms, molluscs, and all spineless creatures (prehistoric or living)
- Mystery Creatures: creatures with very little fossil evidence, debated classification, or so bizarre they defy easy categorisation. Use for mysteryLevel 2 or 3 creatures.
- For the regions field: list the continents or major world regions where this creature lived or where its fossils have been found. Use these values only: "North America", "South America", "Europe", "Africa", "Asia", "Australia", "Antarctica", "Worldwide". Include all that apply. For marine/aquatic creatures that roamed globally use ["Worldwide"].
- If the search term is not a real creature or is fictional, return a mysteryLevel 3 entry with category "Mystery Creatures", genus "Unknown", and still include exactly 5 funFacts explaining what is unknown. Set regions to [].
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

router.post("/creatures/ai-lookup", async (req, res) => {
  const parsed = AiCreatureLookupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { name } = parsed.data;

  try {
    let creature = await callClaude(name);

    if (!hasFiveFunFacts(creature)) {
      req.log.warn({ name }, "Fun facts missing or incomplete — retrying");
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

    res.json(creature);
  } catch (err) {
    req.log.error({ err }, "AI creature lookup failed");
    res.status(500).json({ error: "AI lookup failed" });
  }
});

export default router;
