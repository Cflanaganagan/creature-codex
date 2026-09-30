// Free GBIF-protocol fixtures for tests. This branch must never count as a paid AI call.
module.exports=function taxonomyStub(req,res){
 if(req.method!=='GET')return false;
 const url=new URL(req.url,'http://localhost');let data;
 if(url.pathname.endsWith('/species/match')){
  const name=url.searchParams.get('name');
  const keys={'Mammuthus columbi':1,'Aetobatus narinari':2,'Mammuthus creticus':3,'Mammuthus exilis':4};
  data={usageKey:keys[name]||5,canonicalName:name,rank:name.split(' ').length===3?'SUBSPECIES':'SPECIES',kingdom:'Animalia',confidence:100,matchType:'EXACT'};
 }else if(url.pathname.includes('/species/4/')){
  res.writeHead(503,{'content-type':'application/json'});res.end('{}');return true;
 }else if(url.pathname.endsWith('/speciesProfiles')){
  data={endOfRecords:true,results:url.pathname.includes('/species/3/')?[{extinct:true},{extinct:false}]:[{extinct:true}]};
 }else if(url.pathname.endsWith('/iucnRedListCategory'))data={code:url.pathname.includes('/species/2/')?'EN':'NE'};
 else throw Error('Unexpected taxonomy request '+url.pathname);
 res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(data));return true;
};
