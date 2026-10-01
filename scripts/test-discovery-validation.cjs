/* Dedicated *_test database only. No real AI calls or live collection changes. */
const assert=require('node:assert/strict');
const taxonomyStub=require('./taxonomy-stub.cjs');
const researchStub=require('./research-stub.cjs');
const http=require('node:http');
const {spawn}=require('node:child_process');
const {createRequire}=require('node:module');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {Pool}=createRequire(path.join(root,'lib/db/package.json'))('pg');
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('_test'))throw Error('Dedicated TEST_DATABASE_URL ending in _test required');
const pool=new Pool({connectionString:url});let server;const requests=[];
const fixtures={
 'koala':['Koala','Phascolarctos cinereus','extant'],
 'cheetah':['Cheetah','Acinonyx jubatus','extant'],
 'red kangaroo':['Red Kangaroo','Osphranter rufus','extant'],
 'blue whale':['Blue Whale','Balaenoptera musculus','extant'],
 'quagga':['Quagga','Equus quagga quagga','extinct'],
 'australian koala':['Koala','Phascolarctos cinereus','extant'],
 'poodle':['Domestic Dog','Canis lupus familiaris','extant'],
};
const stub=http.createServer(async(req,res)=>{if(taxonomyStub(req,res))return;
 let body='';for await(const c of req)body+=c;
 const p=JSON.parse(body);requests.push(p);assert.equal(p.model,'claude-haiku-4-5-20251001');
 let result;const input=JSON.parse(p.messages[0].content);
 if(input.search){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'msg_research',type:'message',role:'assistant',content:researchStub(p),model:p.model,stop_reason:'end_turn',usage:{input_tokens:20,output_tokens:20}}));return;}
 if(input.search){
  const f=fixtures[input.search.toLowerCase()];
  result=f?{status:'resolved',name:f[0],scientificName:f[1],genus:f[1].split(' ')[0],rank:'species',lifeStatus:f[2],confidence:'high'}:{status:'clarification_required',message:'Please enter a specific species.',suggestions:['Blue Whale']};
  // Simulate an overconfident resolver returning a genus: schema must reject it.
  if(input.search==='Acinonyx')result={status:'resolved',name:'Acinonyx',scientificName:'Acinonyx',genus:'Acinonyx',rank:'genus',lifeStatus:'extant',confidence:'high'};
 }else{
  assert.ok(!body.includes('Labrador')&&!body.includes('Netherland')&&!body.includes('Poodle'));
  result={name:input.name,scientificName:input.scientificName,genus:input.genus,category:'Mammals',era:'Holocene',mya:input.lifeStatus==='extant'?'0.003':'Extinct 1883',diet:'Varied',size:'Varies',habitat:'Species habitat',description:`A species profile describing ${input.name}.`,funFacts:Array(5).fill('This is a complete species-level fact with more than ten words about this animal.'),family:[],mysteryLevel:0,regions:['Worldwide']};
 }
 await new Promise(r=>setTimeout(r,30));res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'msg_test',type:'message',role:'assistant',content:[{type:'text',text:JSON.stringify(result)}],model:p.model,stop_reason:'end_turn',usage:{input_tokens:20,output_tokens:20}}));
});
async function start(){server=spawn(process.execPath,['artifacts/api-server/dist/index.mjs'],{cwd:root,env:{...process.env,NODE_ENV:'production',PORT:'5128',DATABASE_URL:url,GBIF_API_BASE_URL:'http://127.0.0.1:5127/v1',AI_INTEGRATIONS_ANTHROPIC_BASE_URL:'http://127.0.0.1:5127',AI_INTEGRATIONS_ANTHROPIC_API_KEY:'local-test-only',DISCOVERY_DAILY_LIMIT:'100'},stdio:['ignore','ignore','pipe']});let log='';server.stderr.on('data',d=>log+=d);for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5128/api/healthz')).ok)return}catch{}if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,100))}throw Error('Startup failed')}
async function stop(){if(server&&server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}}
async function lookup(name){const r=await fetch('http://127.0.0.1:5128/api/creatures/ai-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});return {status:r.status,data:await r.json()}}
async function collection(){return (await fetch('http://127.0.0.1:5128/api/creatures')).json()}
(async()=>{
 await pool.query('DROP TABLE IF EXISTS creature_resolution_cache,creature_revision_backups,creature_aliases,creature_collection,creature_discovery_usage');
 await new Promise(r=>stub.listen(5127,'127.0.0.1',r));await start();
 for(const name of ['Felidae','whale','Panthera','mammoth','Mammuthus','pygmy mammoth','Smilodon','frog','Acinonyx','sea monster']){
  const r=await lookup(name);assert.equal(r.status,422,name);assert.ok(['clarification_required','unverified_name'].includes(r.data.code),name);
 }
 let all=await collection();assert.equal(all.total,80);assert.ok(all.creatures.every(c=>c.lifeStatus==='extinct'));

 const expectedExhibits={dimetrodon:'Synapsids',gorgonops:'Synapsids',lystrosaurus:'Synapsids',basilosaurus:'Mammals',mosasaurus:'Reptiles',tyrannosaurus:'Dinosaurs',raphus:'Birds',dunkleosteus:'Fish',hallucigenia:'Invertebrates'};
 for(const [genus,category] of Object.entries(expectedExhibits)){
  const card=all.creatures.find(c=>c.genus.toLowerCase()===genus);assert.ok(card,genus);assert.equal(card.category,category,genus);
  const original=(await pool.query("SELECT original_data FROM creature_revision_backups WHERE version='nine-exhibits-v1' AND creature_id=$1",[card.id])).rows[0].original_data;
  for(const key of Object.keys(original).filter(k=>!['category','classification','exhibitVersion','mysteryExhibit'].includes(k)))assert.deepEqual(card[key],original[key],`${genus}: preserved ${key}`);
 }
 assert.ok(all.creatures.find(c=>c.genus==='Hallucigenia').mysteryExhibit,'mystery membership survives biological reclassification');
 // Every original seed survives; living seeds have recoverable backups and cannot be retrieved as discoveries.
 assert.equal((await pool.query('SELECT count(*) FROM creature_collection')).rows[0].count,'100');
 assert.equal((await pool.query("SELECT original_data->>'name' AS name FROM creature_revision_backups WHERE version='extinct-museum-v1' AND creature_id='lion'")).rows[0].name,'Lion');
 let before=requests.length;
 for(const name of ['Lion','dog','cat','horse','Labrador Retriever','Netherland Dwarf Rabbit']){
  const r=await lookup(name);assert.equal(r.status,422,name);assert.equal(r.data.code,'living_species',name);
 }
 assert.equal(requests.length,before,'known living animals need no paid calls');
 await stop();await start();
 for(const name of ['Cheetah','Red Kangaroo','Blue Whale','Koala','Poodle']){
  const r=await lookup(name);assert.equal(r.status,422,name);assert.equal(r.data.code,'living_species',name);
 }
 assert.equal(requests.length-before,0,'living and ambiguous names use no paid AI calls');
 assert.equal((await collection()).total,80);
 assert.equal((await lookup('Aetobatus narinari')).data.code,'living_species','IUCN living status overrides incorrect fossil flags');
 assert.equal((await lookup('Mammuthus creticus')).data.code,'unverified_name','conflicting references block generation');
 assert.equal((await lookup('Mammuthus exilis')).data.code,'reference_unavailable','outages must not trigger paid research');
 assert.equal(requests.length,before+1,'only the reference conflict receives paid research');
 const rejectedUsage=(await pool.query('SELECT requests FROM creature_discovery_usage WHERE day=CURRENT_DATE')).rows[0].requests;
 await stop();await start();
 before=requests.length;
 const same=await Promise.all(Array.from({length:10},(_,i)=>lookup(i%2?'Quagga':'Equus quagga quagga')));
 assert.ok(same.every(r=>r.status===200&&r.data.mya==='Extinct 1883'&&r.data.lifeStatus==='extinct'));
 assert.equal(requests.length-before,1,'only one profile call for concurrent search; no paid resolution');
 assert.equal((await lookup('Equus quagga quagga')).data.id,'quagga');
 const extinct=same[0].data;
 assert.equal(extinct.reference.taxonId,'txn:236287');
 assert.ok(extinct.reference.source.includes('UCL'));
 assert.equal((await pool.query('SELECT requests FROM creature_discovery_usage WHERE day=CURRENT_DATE')).rows[0].requests,rejectedUsage+1,'paid research rejections count; profile-only discovery counts once');
 // Simulate old production mistakes. Unknown legacy status is quarantined, never guessed from an age.
 for(const [id,name] of [['cheetah','Cheetah'],['felidae','Felidae'],['unreviewed-old-entry','Unreviewed Old Entry']]) {
  const data={...extinct,id,name,mya:'0.003',source:'ai'};delete data.identityVersion;delete data.lifeStatus;
  await pool.query('INSERT INTO creature_collection(id,taxon_key,data) VALUES($1,$1,$2)',[id,JSON.stringify(data)]);
  await pool.query('INSERT INTO creature_aliases(alias,creature_id) VALUES($1,$2)',[name.toLowerCase(),id]);
 }
 await stop();await start();
 all=await collection();assert.equal(all.total,81);
 assert.ok(!all.creatures.some(c=>['cheetah','felidae','unreviewed-old-entry','lion'].includes(c.id)));
 assert.equal((await lookup('Cheetah')).data.code,'living_species');
 assert.equal((await pool.query("SELECT original_data->>'mya' AS mya FROM creature_revision_backups WHERE version='species-validation-v2' AND creature_id='cheetah'")).rows[0].mya,'0.003');
 const backups=await pool.query('SELECT count(*) FROM creature_revision_backups');await stop();await start();
 assert.equal((await pool.query('SELECT count(*) FROM creature_revision_backups')).rows[0].count,backups.rows[0].count,'migration is idempotent');
 if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE);const browser=await chromium.launch({args:['--no-sandbox']});
  try {
   const page=await browser.newPage({viewport:{width:1440,height:1080}});
   let lookupRequests=0;page.on('request',r=>{if(r.url().includes('/ai-lookup'))lookupRequests++});
   await page.goto('http://127.0.0.1:5128/browse?q=Felidae&discover=1');
   const discover=page.getByRole('button',{name:'Discover extinct creature',exact:true});
   await discover.waitFor();await page.waitForTimeout(600);assert.equal(lookupRequests,0,'legacy URL must not auto-discover');
   await page.getByTestId('input-search').press('Enter');await page.waitForTimeout(300);assert.equal(lookupRequests,0,'Enter must not auto-discover');
   await page.getByText('Which creature did you mean?',{exact:true}).waitFor();assert.ok(await discover.isDisabled());
   await page.getByText('Which creature did you have in mind? Try a specific species name.',{exact:true}).waitFor();
   await page.goto('http://127.0.0.1:5128/browse?q=lion');
   await page.getByText('Still living today',{exact:true}).waitFor();
   await page.goto('http://127.0.0.1:5128/');
   await page.getByTestId('collection-counter').filter({hasText:'81'}).waitFor();
   assert.equal(await page.title(),'Woolly — Museum of the Extinct');
   await page.screenshot({path:'/tmp/woolly-extinct-desktop.png',fullPage:true});
   // Old browser records cannot reintroduce living cards or unverified dates.
   await page.evaluate(()=>localStorage.setItem('every-creature-db',JSON.stringify([{id:'old-lion',name:'Old Lion',genus:'Panthera',lifeStatus:'extant',mya:'Present',category:'Mammals'},{id:'old-koala',name:'Old Koala',genus:'Phascolarctos',mya:'0.003',category:'Mammals'}])));
   await page.goto('http://127.0.0.1:5128/browse?q=Old');assert.equal(await page.locator('[data-testid^="card-creature-"]').count(),0);
   await page.goto('http://127.0.0.1:5128/creature/dodo');
   await page.getByRole('link',{name:'Museum illustrations'}).waitFor();
   await page.screenshot({path:'/tmp/woolly-extinct-detail.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});
   await page.goto('http://127.0.0.1:5128/');await page.getByTestId('collection-counter').filter({hasText:'81'}).waitFor();
   await page.screenshot({path:'/tmp/woolly-extinct-mobile.png',fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.goto('http://127.0.0.1:5128/browse?q=Koala');
   await page.getByText('Still living today',{exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS: explicit discovery only, living/ambiguous notices, old cache filtering, museum branding, reconstruction links, desktop/mobile layout');
  } finally {await browser.close()}
 }
   await pool.query("UPDATE creature_discovery_usage SET requests=0 WHERE day=CURRENT_DATE");
 await stop();await start();
 before=requests.length;
 const scuto=await Promise.all(Array.from({length:5},()=>lookup('Scutosaurus')));
 assert.ok(scuto.every(r=>r.status===200),JSON.stringify(scuto));
 assert.equal(scuto[0].data.name,'Scutosaurus');assert.equal(scuto[0].data.scientificName,'Scutosaurus karpinskii');
 assert.equal(scuto[0].data.reference.evidence.length,1);
 assert.equal(requests.length-before,2,'one research + one profile for simultaneous genus lookups');
 assert.equal((await pool.query('SELECT requests FROM creature_discovery_usage WHERE day=CURRENT_DATE')).rows[0].requests,1,'research+profile use one discovery allowance');
 assert.equal((await lookup('Scutosaurus karpinskii')).data.id,scuto[0].data.id);
 assert.equal(requests.length-before,2,'scientific alias reuses the card');
 for(const name of ['Mammuthus trogontherii','Adalatherium'])assert.equal((await lookup(name)).data.code,'unverified_name',name);
 assert.equal((await lookup('Mammuthus meridionalis')).data.code,'living_species');
 assert.equal((await lookup('Mammuthus africanavus')).data.code,'clarification_required');
 assert.equal((await lookup('Mammuthus subplanifrons')).data.code,'research_unavailable');
 const researchCount=requests.length;
 await stop();await start();
 assert.equal((await lookup('Mammuthus trogontherii')).data.code,'unverified_name');assert.equal(requests.length,researchCount,'negative research cache survives restart');
 // Removing this dedicated test card exercises positive research-cache reuse after a profile failure/removal.
 await pool.query("DELETE FROM creature_aliases WHERE creature_id=$1",[scuto[0].data.id]);
 await pool.query("DELETE FROM creature_collection WHERE id=$1",[scuto[0].data.id]);
 assert.equal((await lookup('Scutosaurus')).status,200);assert.equal(requests.length,researchCount+1,'cached research only needs a new profile');
 await pool.query("DELETE FROM creature_aliases WHERE creature_id=$1",[scuto[0].data.id]);
 await pool.query("DELETE FROM creature_collection WHERE id=$1",[scuto[0].data.id]);
 before=requests.length;const spellingConflict=await lookup('Scutosaurus karpinskii');
 assert.equal(spellingConflict.status,200,JSON.stringify(spellingConflict));assert.equal(spellingConflict.data.name,'Scutosaurus');
 assert.equal(requests.length-before,2,'GBIF name mismatch can be resolved by cited research');
 await pool.query("UPDATE creature_discovery_usage SET requests=100 WHERE day=CURRENT_DATE");
 before=requests.length;assert.equal((await lookup('Mammuthus rumanus')).status,429);assert.equal(requests.length,before,'budget stops research before any paid call');
 await stop();await start();
 before=requests.length;
 const usageBeforeSpam=(await pool.query('SELECT requests FROM creature_discovery_usage WHERE day=CURRENT_DATE')).rows[0].requests;
 for(let i=0;i<12;i++)assert.equal((await lookup(`fabricated beast xyz ${i}`)).status,422);
 assert.equal(requests.length,before,'different invented names never reach Claude');
 assert.equal((await pool.query('SELECT requests FROM creature_discovery_usage WHERE day=CURRENT_DATE')).rows[0].requests,usageBeforeSpam,'unmatched-name spam uses no paid allowance');
 const sitemap=await (await fetch('http://127.0.0.1:5128/sitemap.xml')).text();
 assert.ok(sitemap.includes('/creature/dodo'));assert.ok(!sitemap.includes('/creature/lion'));
 await pool.query('UPDATE creature_discovery_usage SET requests=100 WHERE day=CURRENT_DATE');
 assert.equal((await lookup('Mammuthus columbi')).status,429);assert.equal((await lookup('Quagga')).status,200);
 console.log('PASS: extinct-only admission, no profile calls for extant species, ambiguity/species checks, archived records/backups, migration idempotence, concurrency, aliases, sitemap, budget and persistence');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await stop();await new Promise(r=>stub.close(r));await pool.end()});
