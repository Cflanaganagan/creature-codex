/* Run only against a dedicated *_test database; never uses a real AI provider. */
const assert = require('node:assert/strict');
const taxonomyStub=require('./taxonomy-stub.cjs');
const researchStub=require('./research-stub.cjs');
const http = require('node:http');
const {spawn} = require('node:child_process');
const path = require('node:path');
const {createRequire} = require('node:module');
const root=path.resolve(__dirname,'..');
const {Pool}=createRequire(path.join(root,'lib/db/package.json'))('pg');
const databaseUrl=process.env.TEST_DATABASE_URL;
if(!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL must point to a dedicated *_test database.');
const pool=new Pool({connectionString:databaseUrl});
const apiPort=5128, stubPort=5127;let server, providerCalls=0;
const fixture={name:'Quagga',scientificName:'Equus quagga quagga',genus:'Equus',category:'Mammals',era:'Holocene',mya:'Extinct 1883',diet:'Herbivore',size:'60–85 cm',habitat:'Australian eucalyptus forests',description:'The quagga was a southern African zebra subspecies that became extinct in 1883.',funFacts:Array(5).fill('The quagga was a zebra whose stripes were concentrated on the front of its body.'),family:[{name:'Wombats',living:true}],mysteryLevel:0,regions:['Australia']};
const stub=http.createServer(async(req,res)=>{if(taxonomyStub(req,res))return;let body='';for await(const chunk of req)body+=chunk;const payload=JSON.parse(body);providerCalls++;const input=JSON.parse(payload.messages[0].content);if(input.search){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'msg_test',type:'message',role:'assistant',content:researchStub(payload),model:payload.model,stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}));return;}const name=input.search||input.name;const creature=input.search?(/dragon/i.test(name)?{status:'clarification_required',message:'Enter a recognized species.',suggestions:[]}:{status:'resolved',name:'Quagga',scientificName:'Equus quagga quagga',genus:'Equus',rank:'species',lifeStatus:'extinct',confidence:'high'}):/dragon/i.test(name)?{...fixture,name:'Dragon',genus:'Unknown',description:'A fictional creature that does not exist.'}:fixture;await new Promise(r=>setTimeout(r,150));res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'msg_test',type:'message',role:'assistant',content:[{type:'text',text:JSON.stringify(creature)}],model:'claude-haiku-4-5-20251001',stop_reason:'end_turn',usage:{input_tokens:1,output_tokens:1}}));});
async function start(){server=spawn(process.execPath,['artifacts/api-server/dist/index.mjs'],{cwd:root,env:{...process.env,NODE_ENV:'production',PORT:String(apiPort),DATABASE_URL:databaseUrl,GBIF_API_BASE_URL:'http://127.0.0.1:5127/v1',AI_INTEGRATIONS_ANTHROPIC_BASE_URL:`http://127.0.0.1:${stubPort}`,AI_INTEGRATIONS_ANTHROPIC_API_KEY:'local-test-only',DISCOVERY_DAILY_LIMIT:'20'},stdio:['ignore','ignore','pipe']});let logs='';server.stderr.on('data',d=>logs+=d);for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${apiPort}/api/healthz`);if(r.ok)return;}catch{}if(server.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,80));}throw new Error('Test API failed to start: '+logs);}
async function stop(){if(server && server.exitCode===null){const closed=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await closed;}}
const get=async()=>{const r=await fetch(`http://127.0.0.1:${apiPort}/api/creatures`);assert.equal(r.status,200);return r.json()};
const lookup=async name=>{const r=await fetch(`http://127.0.0.1:${apiPort}/api/creatures/ai-lookup`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name})});return {status:r.status,data:await r.json()};};
(async()=>{
 await pool.query('DROP TABLE IF EXISTS creature_resolution_cache, creature_revision_backups, creature_aliases, creature_collection, creature_discovery_usage');
 await new Promise(r=>stub.listen(stubPort,'127.0.0.1',r));await start();
 assert.equal((await get()).total,80);assert.equal((await get()).mode,'shared');
 assert.equal((await lookup('Dodo')).status,200);assert.equal(providerCalls,0);
 const results=await Promise.all(Array.from({length:10},()=>lookup('Quagga')));
 assert.ok(results.every(r=>r.status===200&&r.data.id==='quagga'));assert.equal(providerCalls,1);assert.equal((await get()).total,81);
 assert.equal((await lookup('QUAGGA')).data.id,'quagga');assert.equal((await lookup('Equus quagga quagga')).data.id,'quagga');assert.equal(providerCalls,1);
 assert.equal((await lookup('Plains quagga')).status,422);assert.equal(providerCalls,1);assert.equal((await get()).total,81);
 assert.equal((await lookup('Dragon')).status,422);assert.equal((await get()).total,81);
 await stop();await start();assert.equal((await get()).total,81);assert.equal((await lookup('Quagga')).data.id,'quagga');assert.equal(providerCalls,1);
 if(process.env.PLAYWRIGHT_MODULE){
  await pool.query("DELETE FROM creature_aliases WHERE creature_id='quagga'");
  await pool.query("DELETE FROM creature_collection WHERE id='quagga'");
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE);const browser=await chromium.launch({args:['--no-sandbox']});
  const visitorA=await browser.newContext(),visitorB=await browser.newContext();const a=await visitorA.newPage(),b=await visitorB.newPage();
  await a.goto(`http://127.0.0.1:${apiPort}/`);await b.goto(`http://127.0.0.1:${apiPort}/`);
  await a.getByTestId('collection-counter').filter({hasText:'80'}).waitFor();await b.getByTestId('collection-counter').filter({hasText:'80'}).waitFor();
  await a.getByTestId('input-header-search').fill('Quagga');await a.getByTestId('input-header-search').press('Enter');await a.getByRole('button',{name:'Discover extinct creature',exact:true}).click();await a.getByTestId('card-creature-quagga').waitFor();
  await b.reload();await b.getByTestId('collection-counter').filter({hasText:'81'}).waitFor();
  await a.getByTestId('input-header-search').fill('quag');await a.getByRole('option').filter({hasText:'Quagga'}).click();await a.waitForURL('**/creature/quagga');
  await b.goto(`http://127.0.0.1:${apiPort}/creature/quagga`);await b.getByTestId('text-creature-name').filter({hasText:'Quagga'}).waitFor();assert.equal(providerCalls,2);
  await b.getByTestId('link-about').click();await b.getByText('Built by curiosity.',{exact:true}).waitFor();assert.equal(await b.getByTestId('about-counter').textContent(),'81');
  await browser.close();
 }
 await pool.query("UPDATE creature_discovery_usage SET requests=20 WHERE day=CURRENT_DATE");
 assert.equal((await lookup('Mammuthus columbi')).status,429);assert.equal((await lookup('Quagga')).status,200);
 console.log('PASS: 80 seeds, 10 concurrent searches → 1 generation/1 shared entry, scientific/common aliases, invalid rejection, restart persistence, independent browsers, shared counters, About navigation, discovery budget with existing-entry reuse.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await stop();await new Promise(r=>stub.close(r));await pool.end()});
