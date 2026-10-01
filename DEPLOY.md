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

Woolly uses `claude-haiku-4-5-20251001` for profile generation and an optional profile retry. Identity checks now use reference data, not Claude. Standard Haiku 4.5 pricing is US$1 per million input tokens and US$5 per million output tokens. At an illustrative 1,500 input and 800 output tokens, 10,000 new entries cost about US$55 before retries and taxes. Actual usage must be measured after connecting the API.

In the Claude Console, purchase prepaid API credits and set a US$20 monthly spend limit under Settings → Billing → Spend limits before public launch. Leave automatic credit reload disabled unless intentionally enabled. These account settings cannot be set by this repository: the existing daily discovery limit is not a monthly dollar cap.

## Species validation (v2)

New discoveries resolve a search into a high-confidence species, subspecies, or domestic form before generating prose. Families, genera (including new fossil-genus searches), broad names and uncertain names receive a clarification response without a new entry. Existing founding fossil entries remain available. Dog, cat and horse have explicit domestic defaults. Breeds resolve to their domestic species; the profile writer receives only the canonical identity, not the original query. Saved canonical species are reused before profile generation.

Every new profile has an explicit `lifeStatus`. The extinct-only museum now rejects extant identities before profile generation or insertion. The earlier living-date repair is retained for historical records before archiving. The earlier paid resolution step has been replaced by the source-backed reference gate below. The daily allowance now counts profile-generation attempts, not rejected reference lookups or individual retry calls. Model-based resolution is not independent scientific verification.

A one-time startup repair preserves original records in `creature_revision_backups`, fixes reviewed living-species dates and domestic dog/rabbit copy, relabels the existing fire salamander, and withdraws Felidae and the genus-wide Sea Horse entry without deleting their records. Those withdrawn entries are excluded from public counts and the sitemap. No public database editing endpoint is added.

Run `node scripts/test-discovery-validation.cjs` with a dedicated `TEST_DATABASE_URL` ending in `_test` after building. Tests use a local provider stub and verify rejected searches, breed isolation, extant/extinct handling, concurrency, persistence and reversible legacy repairs. The original collection integration test remains available separately.

## Museum of the Extinct migration

On startup, `prepareExtinctMuseum` runs in the same advisory-locked transaction as the existing legacy repair. Every pre-migration record is backed up under `version = 'extinct-museum-v1'` in `creature_revision_backups`. Living species and unverified legacy AI records are marked withdrawn, never deleted. All 100 original founding records remain recoverable. The 80 reviewed extinct founding records stay on display. Unknown legacy extinction status is withheld for review, not guessed from a numerical age. A restart does not repeat or overwrite backups.

The API collection and sitemap include only exhibited extinct records. Discovery refuses archived/living aliases, including canonical matches, and validates extinction again before saving. Common mammoth names require specificity. Legacy fossil-genus cards are retained; new genera do not receive invented species profiles.

Search typing, Enter, suggestion selection and old `?discover=1` URLs make no discovery request. Only **Discover extinct creature** triggers identification and, if eligible, creation. Known domestic animals and archived living species require no model call. Unfamiliar names first pass through the free reference gate; explicit Discover can then request the evidence-backed fallback described below.

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

## Reference-gated discovery

`lib/db/src/taxon-reference.json` is a checked-in Paleobiology Database snapshot of accepted Animalia species/subspecies with explicit source living/extinct flags. It contains 179,206 accepted names (163,414 marked extinct) and 17,190 scientific synonyms, with source IDs, original authorship, bibliography reference IDs, retrieval time, URL and CC BY 4.0 attribution. The local quagga correction adds one extinct subspecies to the working index. These names are a lookup reference, not pre-generated museum cards.

`creature-reference.ts` performs exact normalized scientific-name and synonym matching, rejects known broad groups, and offers bounded prefix/near-name suggestions. Unreviewed source common names require the visitor to choose a scientific species rather than automatically treating one source match as globally unambiguous. Reviewed common-name bridges cover mammoth species and other familiar names. No fuzzy match can initiate generation. Unknown names remain unverified; they are not called nonexistent.

Before writing a new profile, `check-reference-status.ts` makes free GBIF data requests: an exact Animalia species/subspecies match, species profiles and IUCN category. Living conservation categories (including EW) override fossil flags. Conflicting or incomplete matches may use the evidence-backed fallback after an explicit Discover request; service outages do not. GBIF can aggregate PBDB data, so this is a conflict/status check, not two wholly independent scientific opinions. Successful checks are cached for a day, other verdicts for an hour, with bounded memory and in-flight deduplication. `GBIF_API_BASE_URL` exists for local protocol-stub tests; production uses the public GBIF API and needs no new key.

Documented editorial exception: the PBDB snapshot flags `Equus quagga quagga` as living, while the [UCL Grant Museum quagga record](https://www.ucl.ac.uk/engage/museums-collections/grant-museum-zoology/top-ten-specimens-grant-museum/quagga-skeleton) explicitly records extinction in 1883. Only this exact subspecies is corrected; its living parent, `Equus quagga`, remains excluded.

Free reference checks occur before the daily generation budget. Canonical species locks prevent simultaneous synonyms from generating multiple paid profiles. Newly written cards retain their source reference and corroborating GBIF URL. Existing saved cards still reuse the database without a profile call.

`GET /api/creatures/reference?q=...` returns local matches/verdicts without contacting Claude. Autocomplete separates existing museum cards from reference names. A reference selection changes the search only; the visitor still clicks Discover. The full data file stays server-side and is copied beside the bundled server at build time; visitor browsers do not download the 14 MB snapshot.

Refresh manually with `python3 scripts/refresh-taxon-reference.py`, review the diff and source-status conflicts, then rebuild/test. This is never run on ordinary Render builds or visitor requests. The source record inclusion rules and editorial overrides are preserved in code. Source coverage and classifications can change; retaining a dated snapshot makes changes reviewable.

Validation: the PostgreSQL integration suites use local Anthropic/GBIF protocol stubs. They assert zero paid calls for known living/broad names, evidence-backed fallback for reference gaps, generation-budget preservation, one profile call for concurrent synonyms, shared persistence and browser behavior. `node scripts/test-reference-and-design.cjs` additionally checks the reference, suggestions, palette, supplied aquatic artwork, magnifier/modal and phone layout without paid AI calls.

Sources: [PBDB taxon API](https://paleobiodb.org/data1.2/taxa/list_doc.html), [PBDB data-service publication and license](https://doi.org/10.1017/PAB.2015.39), [GBIF extinct-species limitations](https://data-blog.gbif.org/post/2024-02-06-working-with-extinct-species-on-gbif/).


## Evidence-backed discovery fallback

The bundled reference remains the free first pass. Explicit Discover requests for exact reference-backed species with incomplete GBIF matches or status conflicts may invoke `research-creature.ts`. Known living animals, known broad groups, wholly unmatched names and mere fuzzy/prefix matches stop without AI. GBIF service outages do not trigger paid research. Exact genera with a single extinct candidate in the snapshot may request research of that candidate, but never automatically approve it. A genus is not assumed monotypic because the local snapshot has one row: research must support a single recognized species before resolving the short name. Full binomial identity remains the canonical database key; the familiar name is displayed.

Research uses Haiku 4.5 with Anthropic's `web_search_20250305` server tool, at most two searches, 2,200 output tokens, a 55-second timeout and no automatic retries. It searches a bounded list of scientific databases, museums and research publishers. Approval requires a schema-valid species identity, matching returned search URLs and actual citation evidence. Uncited responses, truncated/paused responses and unavailable search tools cannot approve cards. A researched candidate must retain the supplied scientific identity. Clearly living conservation statuses are still rejected by the free gate. Research sources are saved and linked from the creature detail page. This is AI-assisted review, not a guarantee of taxonomic correctness.

The existing discovery allowance is reserved BEFORE the first paid research/profile call, including failed research, and only once for a combined research+profile attempt. Web search incurs Anthropic search fees in addition to model tokens. The configured Anthropic organization must permit web search; if unavailable, discovery returns a retryable error without approving from memory. No extra key is required.

`creature_resolution_cache` stores successful researched identities for 30 days and negative/clarification results for one day across restarts. Search locks prevent duplicate research for simultaneous identical queries; canonical locks still deduplicate profile generation across aliases. Cache writes survive failed discovery transactions. Expired rows are removed on writes. Already-saved aliases bypass research entirely. A new alias may require research before it can be associated with an existing species.

Typing, autocomplete, Enter and reference suggestion selection never invoke research. The Discover button permits only source-backed research candidates while keeping unmatched, clearly living and broad queries disabled. PostgreSQL protocol-stub tests cover fallback, citations, monotypy, shared caching, concurrency and budget enforcement without spending real Anthropic credits.

Spam protection: arbitrary invented names cannot enter the paid fallback, including when POSTed directly to the API. Existing per-IP throttling, daily paid-attempt allowance, and shared positive/negative caching also apply. Valid reference names can still be abused; these controls bound that exposure rather than promising that abuse is impossible. A genuine species wholly missing from the source list requires an editorial reference addition before discovery.


### Nine-exhibit classification
The nine exhibits are based on ancestry, with birds and non-avian dinosaurs displayed separately and Synapsids reserved for non-mammalian synapsids. Mystery is an overlapping thematic exhibit. Existing cards are backed up under `nine-exhibits-v1` in `creature_revision_backups` before only their exhibit metadata is changed. No cards or biographies are deleted.

The bundled Paleobiology Database lineage snapshot (CC BY 4.0, attribution in the source) covers the current collection. New discoveries use that snapshot or a free PBDB ancestor lookup; the AI profile writer cannot override the resulting exhibit. Unresolved ancestry retains the card in Mystery for review. This classification adds no Claude calls.
