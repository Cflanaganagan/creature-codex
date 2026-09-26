import Anthropic from "@anthropic-ai/sdk";

// Retain Replit integration support while allowing a standard key on other hosts.
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
export const anthropicConfigured = Boolean(apiKey);

// The collection can start without AI credentials; the lookup route explains
// missing configuration instead of crashing the entire website at startup.
export const anthropic = new Anthropic({
  apiKey: apiKey || "not-configured",
  ...(process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL
    ? { baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL }
    : {}),
});
