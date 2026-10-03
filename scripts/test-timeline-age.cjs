const assert=require('node:assert/strict');
const ts=require('typescript');const fs=require('node:fs');const Module=require('node:module');const path=require('node:path');
const file=path.resolve(__dirname,'../artifacts/every-creature/src/data/timeline-age.ts');const m=new Module(file,module);
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const {oldestAgeMa,timelineStartMa}=m.exports;
for(const [input,expected] of [['600,000–200,000',.6],['600000–200000 years ago',.6],['600–200 ka',.6],['0.6–0.2 Ma',.6],['68-66 Ma',68],['558–550 Ma',558],['Extinct 1681',0],['unknown',undefined]])assert.equal(oldestAgeMa(input),expected,input);
assert.equal(timelineStartMa({mya:'600,000–200,000',era:'Pleistocene'}),.6);
console.log('PASS: Steppe Mammoth year range, units, dinosaur/Ediacaran ages and unknown dates');
