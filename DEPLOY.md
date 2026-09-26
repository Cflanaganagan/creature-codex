# Publish Every Creature on Render

The `updates-test` branch includes a Render Blueprint for one free web service serving both the website and its API.

1. Sign into Render with GitHub.
2. Choose **New → Blueprint**, select **Cflanaganagan/creature-codex**, and choose **updates-test** as the Blueprint branch.
3. Confirm the free service and deploy. Open the resulting `.onrender.com` address.

The existing collection, images, full-image viewer, search, timeline, and local imports work without an AI key. To enable AI creature discovery, add `ANTHROPIC_API_KEY` in the service's Environment settings. AI provider usage is billed separately from free website hosting. Existing Replit `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` settings remain supported. Never commit keys to GitHub.

Free Render web services sleep when idle, so the first visit can take a moment. Collection imports and AI-saved creatures continue to use the original browser-local storage behavior; they are not a shared online database.

## Local development

Run `pnpm --filter @workspace/every-creature dev` for the site on port 5000. For AI lookup, start the API in another terminal with `PORT=5001 pnpm --filter @workspace/api-server dev` and configure an AI key in that environment. The site forwards `/api` requests to port 5001.

## Production check

Run `pnpm run build:deploy`, then `NODE_ENV=production PORT=5001 pnpm start`. Both `/` and direct creature links are served by the same process; `/api/healthz` is the health endpoint.
