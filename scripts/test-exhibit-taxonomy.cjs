/* Compile the pure taxonomy modules in memory; no database or paid provider. */
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const loaded=new Map();
function load(name){
 const filename=path.resolve(__dirname,'../lib/db/src',name+'.ts');
 if(loaded.has(filename))return loaded.get(filename).exports;
 const m=new Module(filename,module);loaded.set(filename,m);
 m.require=id=>id.startsWith('./')?load(id.slice(2)):require(id);
 m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
 return m.exports;
}
const {groupFromLineage,knownClassification,applyExhibitClassification,isInExhibit,EXHIBITS}=load('exhibit-taxonomy');
assert.equal(EXHIBITS.length,9);
for(const [lineage,group] of [
 [['Animalia','Vertebrata','Osteichthyes','Tetrapoda','Synapsida','Mammalia'],'Mammals'],
 [['Animalia','Vertebrata','Reptilia','Dinosauria','Aves'],'Birds'],
 [['Animalia','Vertebrata','Reptilia','Dinosauria'],'Dinosaurs'],
 [['Animalia','Vertebrata','Tetrapoda','Synapsida'],'Synapsids'],
 [['Animalia','Vertebrata','Tetrapoda','Reptilia'],'Reptiles'],
 [['Animalia','Vertebrata','Osteichthyes','Tetrapoda'],'Amphibians & Early Tetrapods'],
 [['Animalia','Vertebrata','Chondrichthyes'],'Fish'],
 [['Animalia','Arthropoda'],'Invertebrates'],
 [[], 'Mystery Creatures'],
])assert.equal(groupFromLineage(lineage),group);
for(const [genus,group] of Object.entries({Inostrancevia:'Synapsids',Koolasuchus:'Amphibians & Early Tetrapods',Mastodonsaurus:'Amphibians & Early Tetrapods',Scutosaurus:'Reptiles',Basilosaurus:'Mammals',Tullimonstrum:'Mystery Creatures'}))assert.equal(knownClassification({genus}).group,group);
const card=applyExhibitClassification({genus:'Hallucigenia',category:'Mystery Creatures',description:'Preserve this',mysteryLevel:2});
assert.equal(card.category,'Invertebrates');assert.ok(isInExhibit(card,'Mystery Creatures'));assert.equal(card.description,'Preserve this');assert.deepEqual(applyExhibitClassification(card),card);
for(const genus of ['Hallucigenia','Andrewsarchus','Helicoprion','Anomalocaris']){
 const card=applyExhibitClassification({genus,category:'Mammals',mysteryLevel:0});
 assert.ok(isInExhibit(card,'Mystery Creatures'),genus);
 assert.notEqual(card.category,'Mystery Creatures','curation preserves biological exhibit');
}
(async()=>{
 const {classifyExhibit}=load('classify-exhibit');
 let calls=0;
 global.fetch=async()=>{calls++;return {ok:true,json:async()=>({records:[{oid:'1',nam:'Animalia'},{oid:'2',nam:'Vertebrata',par:'1'},{oid:'3',nam:'Tetrapoda',par:'2'},{oid:'4',nam:'Acanthostega gunnari',par:'3'}]})}};
 assert.equal((await classifyExhibit({scientificName:'Acanthostega gunnari'})).group,'Amphibians & Early Tetrapods');assert.equal(calls,1);
 global.fetch=async()=>({ok:true,json:async()=>({records:[{oid:'1',nam:'Ambiguous species'},{oid:'2',nam:'Ambiguous species'}]})});
 assert.equal((await classifyExhibit({scientificName:'Ambiguous species'})).group,'Mystery Creatures');
 global.fetch=async()=>{throw Error('offline')};
 assert.equal((await classifyExhibit({scientificName:'Unlisted species'})).source,'Classification pending review');
 console.log('PASS: lineage precedence, existing discoveries, mystery overlap, species-level ancestry, ambiguous/unavailable source safety');
})().catch(e=>{console.error(e);process.exitCode=1});
