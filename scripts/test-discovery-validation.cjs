/* Dedicated *_test database only. No real AI calls or live collection changes. */
const assert=require('node:assert/strict');
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
const stub=http.createServer(async(req,res)=>{
 let body='';for await(const c of req)body+=c;
 const p=JSON.parse(body);requests.push(p);assert.equal(p.model,'claude-haiku-4-5-20251001');
 let result;const input=JSON.parse(p.messages[0].content);
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
async function start(){server=spawn(process.execPath,['artifacts/api-server/dist/index.mjs'],{cwd:root,env:{...process.env,NODE_ENV:'production',PORT:'5128',DATABASE_URL:url,AI_INTEGRATIONS_ANTHROPIC_BASE_URL:'http://127.0.0.1:5127',AI_INTEGRATIONS_ANTHROPIC_API_KEY:'local-test-only',DISCOVERY_DAILY_LIMIT:'100'},stdio:['ignore','ignore','pipe']});let log='';server.stderr.on('data',d=>log+=d);for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5128/api/healthz')).ok)return}catch{}if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,100))}throw Error('Startup failed')}
async function stop(){if(server&&server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}}
async function lookup(name){const r=await fetch('http://127.0.0.1:5128/api/creatures/ai-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});return {status:r.status,data:await r.json()}}
async function collection(){return (await fetch('http://127.0.0.1:5128/api/creatures')).json()}
(async()=>{
 await pool.query('DROP TABLE IF EXISTS creature_revision_backups,creature_aliases,creature_collection,creature_discovery_usage');
 await new Promise(r=>stub.listen(5127,'127.0.0.1',r));await start();
 for(const name of ['Felidae','whale','Panthera','frog','seahorse','salamander','Acinonyx','sea monster']){
  const r=await lookup(name);assert.equal(r.status,422,name);assert.equal(r.data.code,'clarification_required',name);
 }
 assert.equal((await collection()).total,100);
 await stop();await start(); // reset per-IP request window for the next scenario
 const before=requests.length;
 const same=await Promise.all(Array.from({length:10},()=>lookup('Koala')));
 assert.ok(same.every(r=>r.status===200&&r.data.mya==='Present'&&r.data.lifeStatus==='extant'));
 assert.equal(requests.length-before,2,'one resolver + one profile for concurrent search');
 assert.equal((await lookup('Australian koala')).data.id,'koala');
 assert.equal(requests.length-before,3,'resolved synonyms reuse existing profile');
 for(const name of ['Cheetah','Red Kangaroo']){const r=await lookup(name);assert.equal(r.status,200);assert.equal(r.data.mya,'Present');assert.equal(r.data.era,'Modern')}
 const dog=await lookup('Labrador Retriever');assert.equal(dog.status,200);assert.equal(dog.data.name,'Domestic Dog');assert.ok(!JSON.stringify(dog.data).includes('Labrador'));
 assert.equal((await lookup('Poodle')).data.id,dog.data.id);
 assert.equal((await lookup('dog')).data.id,dog.data.id);
 const rabbit=await lookup('Netherland Dwarf Rabbit');assert.equal(rabbit.status,200);assert.equal(rabbit.data.name,'Domestic Rabbit');assert.ok(!JSON.stringify(rabbit.data).includes('Netherland'));
 await stop();await start();
 const extinct=await lookup('Quagga');assert.equal(extinct.status,200);assert.equal(extinct.data.lifeStatus,'extinct');assert.equal(extinct.data.mya,'Extinct 1883');
 assert.equal((await lookup('Blue Whale')).status,200);
 // Seed the historical mistakes, then verify restart migration + backups + idempotence.
 const broad={...dog.data,id:'felidae',name:'Felidae',scientificName:'Felidae',genus:'Felidae',source:'ai'};delete broad.identityVersion;
 await pool.query("INSERT INTO creature_collection(id,taxon_key,data) VALUES('felidae','felidae',$1)",[JSON.stringify(broad)]);
 await pool.query("INSERT INTO creature_aliases(alias,creature_id) VALUES('felidae','felidae')");
 await pool.query("UPDATE creature_collection SET data=data-'identityVersion' WHERE id IN ('cheetah','domestic-dog','domestic-rabbit')");
 await pool.query("DELETE FROM creature_revision_backups WHERE creature_id IN ('cheetah','domestic-dog','domestic-rabbit')");
 await pool.query(`UPDATE creature_collection SET data=jsonb_set(data,'{mya}','"0.003"') WHERE id='cheetah'`);
 await pool.query(`UPDATE creature_collection SET data=jsonb_set(data,'{description}','"Labrador Retriever biography"') WHERE id='domestic-dog'`);
 await stop();await start();
 const all=await collection();assert.ok(!all.creatures.some(c=>c.id==='felidae'));
 assert.equal(all.creatures.find(c=>c.id==='cheetah').mya,'Present');
 assert.ok(!JSON.stringify(all.creatures.find(c=>c.id==='domestic-dog')).includes('Labrador'));
 assert.ok(!JSON.stringify(all.creatures.find(c=>c.id==='domestic-rabbit')).includes('Netherland'));
 assert.equal((await pool.query("SELECT count(*) FROM creature_collection WHERE id='felidae'")).rows[0].count,'1','withdrawal preserves original row');
 const backups=await pool.query('SELECT count(*) FROM creature_revision_backups');await stop();await start();assert.equal((await pool.query('SELECT count(*) FROM creature_revision_backups')).rows[0].count,backups.rows[0].count);
 if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE);const browser=await chromium.launch({args:['--no-sandbox']});
  try {
   const page=await browser.newPage();
   await page.goto('http://127.0.0.1:5128/browse?q=Felidae&discover=1');
   await page.getByText('Which creature did you mean?',{exact:true}).waitFor();
   await page.getByText(/No creature was added/).waitFor();
   await page.goto('http://127.0.0.1:5128/creature/cheetah');
   await page.getByText('Living Today',{exact:true}).waitFor();
   await page.goto('http://127.0.0.1:5128/creature/domestic-dog');
   await page.getByTestId('text-creature-name').filter({hasText:'Domestic Dog'}).waitFor();
   assert.ok(!(await page.locator('main').innerText()).includes('Labrador'));
   await page.setViewportSize({width:390,height:844});
   await page.goto('http://127.0.0.1:5128/browse?q=sea%20horse&discover=1');
   await page.getByText('Which creature did you mean?',{exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log('PASS: desktop/mobile clarification UI, no-card notice, Living Today and corrected dog biography');
  } finally {await browser.close()}
 }
 await pool.query('UPDATE creature_discovery_usage SET requests=100 WHERE day=CURRENT_DATE');
 assert.equal((await lookup('New species')).status,429);assert.equal((await lookup('Koala')).status,200);
 console.log('PASS: ambiguity rejection, invalid rank, no insertion on clarification, concurrency, canonical reuse, breed isolation, extant normalization, extinct retention, backed-up legacy repairs, idempotence, budget and persistence');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await stop();await new Promise(r=>stub.close(r));await pool.end()});
