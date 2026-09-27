# Publish Woolly with a shared collection

The `updates-test` branch includes a Render Blueprint for a Node web service serving both the website and API. A separate PostgreSQL database stores the worldwide collection.

## Required connections

- `DATABASE_URL`: a persistent PostgreSQL connection string from your database host. Use the host's TLS-enabled URL for remote connections. Do not use a local file or an expiring demo database for the public archive.
- `ANTHROPIC_API_KEY`: a server-side Anthropic API key for discovering new creatures. Existing Replit `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` settings remain supported.

Keep both values in the hosting service's Environment settings, never in GitHub or frontend code.

## Publish on Render

[Open Woolly’s prepared Render deployment](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FCflanaganagan%2Fcreature-codex%2Ftree%2Fupdates-test). This selects the correct repository and branch. The service requests the two server-side credentials below.

1. Sign into Render with GitHub, choose **New → Blueprint**, select **Cflanaganagan/creature-codex**, and choose **updates-test** as the Blueprint branch.
2. Supply `DATABASE_URL` and `ANTHROPIC_API_KEY` when requested, confirm the free web service, and deploy.
3. Open the resulting `.onrender.com` address. Tables and the initial 100 creatures are created automatically without replacing saved entries.

Render's free web service sleeps when idle. Its free PostgreSQL product currently expires after 30 days, so choose a persistent database plan/provider for the public archive. AI usage is billed separately from hosting. The configurable `DISCOVERY_DAILY_LIMIT` defaults to 100 new generation attempts per UTC database day; viewing saved creatures does not use AI.

## Shared behavior

- `GET /api/creatures` returns the shared collection and authoritative count.
- `POST /api/creatures/ai-lookup` checks saved aliases before generating, validates the returned entry, and saves successful discoveries centrally.
- Simultaneous searches for the same name are serialized; unique canonical taxon keys prevent duplicate records from concurrent synonyms.
- Other visitors refresh the collection every 15 seconds while their page is visible, or when returning to the page.
- Personal JSON imports and legacy browser entries remain on that device and cannot replace/delete the global archive. Export can back up the visible collection. Reset clears personal additions only.
- New AI-assisted entries remain subject to factual errors; community contributions are not independently reviewed scientific records.

## Development and persistence

`pnpm --filter @workspace/every-creature dev` serves the frontend on port 5000 and proxies `/api` to port 5001.

Run the API with `DATABASE_URL` and, for live generation, the AI key in its environment. `PORT=5001 pnpm --filter @workspace/api-server dev` starts it. With no database URL, the API serves a read-only preview of the founding collection and refuses to claim discoveries have been saved.

`pnpm run build:deploy`, followed by `NODE_ENV=production PORT=5001 pnpm start`, serves both the website and API. `/api/healthz` is the health endpoint. The Codespace preview uses a PostgreSQL Docker volume; that development database is not the future public hosting database.

## Integration test

`scripts/test-shared-collection.cjs` uses a dedicated PostgreSQL test database and a local Anthropic protocol stub. Set `TEST_DATABASE_URL`, build the app, then run `node scripts/test-shared-collection.cjs`. It verifies saving, separate clients, duplicate requests, alias reuse, invalid-response rejection, seed preservation, and restart persistence without making paid AI calls. The test database must have a name ending in `_test` and is emptied by the test.
