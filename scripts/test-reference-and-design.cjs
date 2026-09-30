/* Read-only preview server: verifies source-backed lookups and the requested UI. */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {readFileSync}=require('node:fs');
const root=path.resolve(__dirname,'..');
const snapshot=JSON.parse(readFileSync(path.join(root,'lib/db/src/taxon-reference.json'),'utf8'));
assert.ok(snapshot.records.length>100000);
assert.ok(snapshot.synonyms.length>10000);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/tmp/codex-browser/node_modules/playwright');
(async()=>{
 const server=spawn(process.execPath,['artifacts/api-server/dist/index.mjs'],{cwd:root,env:{...process.env,NODE_ENV:'production',PORT:'5130',DATABASE_URL:'',ANTHROPIC_API_KEY:'',AI_INTEGRATIONS_ANTHROPIC_API_KEY:''},stdio:'ignore'});
 let browser;
 try {
  for(let i=0;i<120;i++){try{if((await fetch('http://127.0.0.1:5130/api/healthz')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
  const ref=async q=>(await fetch(`http://127.0.0.1:5130/api/creatures/reference?q=${encodeURIComponent(q)}`)).json();
  const mammoth=await ref('mammoth');assert.equal(mammoth.verdict.status,'clarification_required');assert.ok(mammoth.matches.some(c=>c.scientificName==='Mammuthus columbi'));
  const columbian=await ref('Columbian mammoth');assert.equal(columbian.verdict.identity.scientificName,'Mammuthus columbi');assert.ok(columbian.verdict.identity.reference.url.startsWith('https://paleobiodb.org/'));
  assert.equal((await ref('Phascolarctos cinereus')).verdict.status,'living_species');
  assert.equal((await ref('Quagga')).verdict.identity.lifeStatus,'extinct');
  assert.equal((await ref('Equus quagga')).verdict.status,'living_species','extinct subspecies must not make living parent extinct');
  assert.equal((await ref('not-a-creature-xyz')).verdict.status,'unverified_name');
  assert.equal((await ref('Mammuthus columb')).verdict.status,'clarification_required','near matches cannot auto-resolve');
  assert.equal((await ref('Felidae')).verdict.status,'clarification_required');
  assert.ok((await ref('Mammuthus')).matches.length<=7);
  const dinosaurId=snapshot.records.find(r=>r[1]==='Tyrannosaurus rex')[0];
  const synonym=snapshot.synonyms.find(r=>r[1]===dinosaurId);
  if(synonym)assert.equal((await ref(synonym[0])).verdict.identity.scientificName,'Tyrannosaurus rex');
  browser=await chromium.launch({args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1080},reducedMotion:'reduce'});
  const page=await context.newPage();let paidRequests=0;page.on('request',r=>{if(r.url().includes('/ai-lookup'))paidRequests++});
  await page.goto('http://127.0.0.1:5130/');await page.waitForLoadState('networkidle');
  assert.ok(await page.getByTestId('tile-category-Aquatic').evaluate(el=>el.classList.contains('bg-teal-800')));
  for(const [name,rgb] of [['Mammals','rgb(147, 75, 43)'],['Reptiles','rgb(69, 104, 80)'],['Birds','rgb(193, 155, 95)'],['Amphibians','rgb(102, 41, 60)'],['Mystery Creatures','rgb(76, 55, 89)']])assert.equal(await page.getByTestId('tile-category-'+name).evaluate(el=>getComputedStyle(el).backgroundColor),rgb,name);
  assert.ok((await page.getByTestId('tile-category-Aquatic').locator('img').getAttribute('src')).includes('shark-badge'));
  await page.screenshot({path:'/tmp/woolly-reference-home.png',fullPage:true});
  await page.getByTestId('input-header-search').fill('Dodo');
  await page.getByRole('option').filter({hasText:'Dodo'}).waitFor();
  await page.getByTestId('input-header-search').fill('Columb');
  assert.equal(await page.getByRole('option').count(),0,'reference-only species must not appear in typing suggestions');
  await page.getByTestId('input-header-search').press('Enter');
  await page.getByText('Were you thinking of…',{exact:true}).waitFor();
  await page.getByRole('button',{name:/Columbian Mammoth|Mammuthus columbi/}).first().click();
  await page.getByText('Our reference identifies',{exact:false}).waitFor();
  assert.equal(paidRequests,0,'choosing a reference suggestion must not start paid discovery');
  await page.goto('http://127.0.0.1:5130/browse?q=not-a-creature-xyz');
  await page.getByText('Name not verified yet',{exact:true}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Discover extinct creature',exact:true}).isDisabled());
  assert.equal(paidRequests,0);
  // Deterministic photograph fixture isolates image-viewer behavior from Wikipedia availability.
  await context.route('https://en.wikipedia.org/api/rest_v1/page/summary/**',route=>route.fulfill({json:{thumbnail:{source:'https://images.test/dodo.svg'},originalimage:{source:'https://images.test/dodo.svg'},content_urls:{desktop:{page:'https://en.wikipedia.org/wiki/Dodo'}}}}));
  await context.route('https://images.test/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#456850"/></svg>'}));
  await page.goto('http://127.0.0.1:5130/creature/dodo');
  const button=page.getByRole('button',{name:'View full image of Dodo'});await button.waitFor();await button.hover();
  const cue=button.locator('.image-expand-cue');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.image-expand-cue')).opacity==='1');
  assert.ok(await cue.locator('svg.lucide-zoom-in').count());
  await page.screenshot({path:'/tmp/woolly-image-cue.png',fullPage:false});
  await button.click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const phone=await mobile.newPage();
  await phone.goto('http://127.0.0.1:5130/');await phone.waitForLoadState('networkidle');await phone.screenshot({path:'/tmp/woolly-reference-mobile.png',fullPage:true});
  await phone.goto('http://127.0.0.1:5130/browse?q=Mammuthus%20columb');await phone.getByText('Which creature did you mean?',{exact:true}).waitFor();
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('PASS: local taxonomy snapshot, source provenance, living/unknown/ambiguous rejection, synonym/typo handling, reference autocomplete without AI, palette/artwork, hover magnifier and modal dismissal, mobile layout');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
