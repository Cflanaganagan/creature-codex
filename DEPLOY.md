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
3. Open the resulting `.onrender.com` address. Tables and the original founding records are created automatically without replacing saved entries. The public museum exhibits its 80 extinct founding entries; living entries are archived.

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

## AI model and spending setup

Woolly uses `claude-haiku-4-5-20251001` for identity resolution, profile generation, and an optional profile retry. Standard Haiku 4.5 pricing is US$1 per million input tokens and US$5 per million output tokens. At an illustrative 1,500 input and 800 output tokens, 10,000 new entries cost about US$55 before retries and taxes. Actual usage must be measured after connecting the API.

In the Claude Console, purchase prepaid API credits and set a US$20 monthly spend limit under Settings → Billing → Spend limits before public launch. Leave automatic credit reload disabled unless intentionally enabled. These account settings cannot be set by this repository: the existing daily discovery limit is not a monthly dollar cap.

## Species validation (v2)

New discoveries resolve a search into a high-confidence species, subspecies, or domestic form before generating prose. Families, genera (including new fossil-genus searches), broad names and uncertain names receive a clarification response without a new entry. Existing founding fossil entries remain available. Dog, cat and horse have explicit domestic defaults. Breeds resolve to their domestic species; the profile writer receives only the canonical identity, not the original query. Saved canonical species are reused before profile generation.

Every new profile has an explicit `lifeStatus`. The extinct-only museum now rejects extant identities before profile generation or insertion. The earlier living-date repair is retained for historical records before archiving. Resolution usually adds one short Haiku call to a new search; the existing daily allowance counts discovery attempts, not individual model calls. Model-based resolution is not independent scientific verification.

A one-time startup repair preserves original records in `creature_revision_backups`, fixes reviewed living-species dates and domestic dog/rabbit copy, relabels the existing fire salamander, and withdraws Felidae and the genus-wide Sea Horse entry without deleting their records. Those withdrawn entries are excluded from public counts and the sitemap. No public database editing endpoint is added.

Run `node scripts/test-discovery-validation.cjs` with a dedicated `TEST_DATABASE_URL` ending in `_test` after building. Tests use a local provider stub and verify rejected searches, breed isolation, extant/extinct handling, concurrency, persistence and reversible legacy repairs. The original collection integration test remains available separately.

## Museum of the Extinct migration

On startup, `prepareExtinctMuseum` runs in the same advisory-locked transaction as the existing legacy repair. Every pre-migration record is backed up under `version = 'extinct-museum-v1'` in `creature_revision_backups`. Living species and unverified legacy AI records are marked withdrawn, never deleted. All 100 original founding records remain recoverable. The 80 reviewed extinct founding records stay on display. Unknown legacy extinction status is withheld for review, not guessed from a numerical age. A restart does not repeat or overwrite backups.

The API collection and sitemap include only exhibited extinct records. Discovery refuses archived/living aliases, including canonical matches, and validates extinction again before saving. Common mammoth names require specificity. Legacy fossil-genus cards are retained; new genera do not receive invented species profiles.

Search typing, Enter, suggestion selection and old `?discover=1` URLs make no discovery request. Only **Discover extinct creature** triggers identification and, if eligible, creation. Known domestic animals and archived living species require no model call. An unfamiliar living species generally requires a short identification call but no profile call or database insert.

The browser uses a new extinct-only cache and filters personal records. Existing local JSON is preserved; imports must explicitly declare `lifeStatus: "extinct"` and have no living date label. Imports stay private to that browser. The shared archive never trusts browser imports.

To inspect recoverable originals (read-only):

```sql
SELECT creature_id, original_data, saved_at
FROM creature_revision_backups
WHERE version = 'extinct-museum-v1'
ORDER BY creature_id;
```

Restoring withdrawn records to public view requires an editorial decision and matching collection-policy changes; do not delete the backup table or blindly replace current data. Earlier raw AI mistakes are also preserved under `species-validation-v2`.

Reconstruction links use curated Natural History Museum pages where available and a clearly labelled Wikimedia Commons image search otherwise. No third-party reconstruction images are copied. Search results are not represented as independently verified scientific artwork.
