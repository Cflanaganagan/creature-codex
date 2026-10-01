// Anthropic server-search protocol fixture. Never contacts a real provider.
module.exports=function researchStub(payload){
 const assert=require('node:assert/strict');const {search,candidate}=JSON.parse(payload.messages[0].content);
 assert.equal(payload.tools[0].type,'web_search_20250305');assert.equal(payload.tools[0].max_uses,2);
 const url='https://www.frontiersin.org/articles/10.3389/fevo.2021.692035/full';
 let data={status:'unverified_name'};let quote='Scutosaurus karpinskii is an extinct Permian reptile; Scutosaurus has one recognized species.';
 if(['Scutosaurus','Scutosaurus karpinskii','uncited fossil','conflicting genus','living mystery'].includes(search)) data={status:'resolved',name:'Scutosaurus',scientificName:'Scutosaurus karpinskii',genus:'Scutosaurus',rank:'species',lifeStatus:search==='living mystery'?'extant':'extinct',confidence:'high',monotypic:search!=='conflicting genus',sourceUrls:[url]};
 if(search==='ambiguous mystery')data={status:'clarification_required',suggestions:['Scutosaurus karpinskii','Mammuthus columbi']};
 if(search==='Adalatherium') {data={...data,status:'resolved',name:'Adalatherium',scientificName:'Adalatherium hui',genus:'Adalatherium',rank:'species',lifeStatus:'extinct',confidence:'high',monotypic:false,sourceUrls:[url]};quote='Adalatherium hui is extinct. Other proposed species are disputed.';}
 assert.ok(candidate,'research must always have a source-backed candidate');
 if(search==='Mammuthus trogontherii' || search==='Mammuthus meridionalis') {
  data={status:'resolved',name:search,scientificName:search,genus:'Mammuthus',rank:'species',lifeStatus:search.endsWith('meridionalis')?'extant':'extinct',confidence:'high',sourceUrls:[url]};quote=search+' is the species examined by this scientific source.';
 }
 if(search==='Mammuthus africanavus')data={status:'clarification_required',suggestions:['Mammuthus columbi']};
 return [{type:'web_search_tool_result',tool_use_id:'srv_test',content:search==='Mammuthus subplanifrons'?{type:'web_search_tool_result_error',error_code:'unavailable'}:[{type:'web_search_result',url,title:'Scientific species account',encrypted_content:'test'}]},
 {type:'text',text:'Verified research.',citations:search==='Mammuthus trogontherii'?[]:[{type:'web_search_result_location',url,title:'Scientific species account',cited_text:quote,encrypted_index:'test'}]},
 {type:'text',text:'```json\n'+JSON.stringify(data)+'\n```'}];
};
