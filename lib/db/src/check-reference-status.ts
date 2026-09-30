import { normalizeName, type ResolvedIdentity } from "./creature-identity";
import { CollectionError } from "./creature-store";

type Status = {kind:"extinct"|"living"|"uncertain"; url:string};
const cache = new Map<string,{until:number;status:Status}>();
const inFlight = new Map<string,Promise<Status>>();
const base = process.env.GBIF_API_BASE_URL || "https://api.gbif.org/v1";
async function json(path:string, optional=false):Promise<any> {
  const response=await fetch(`${base}${path}`,{signal:AbortSignal.timeout(7000),headers:{Accept:"application/json"}});
  if(optional && [204,404].includes(response.status))return {};
  if(!response.ok)throw new Error(`Taxonomy service ${response.status}`);
  const text=await response.text();
  if(optional && !text.trim())return {};
  return JSON.parse(text);
}
async function lookup(name:string):Promise<Status> {
  const match=await json(`/species/match?strict=true&kingdom=Animalia&name=${encodeURIComponent(name)}`);
  const uncertain:Status={kind:"uncertain",url:"https://www.gbif.org"};
  if(match.matchType!=="EXACT" || match.confidence<95 || match.kingdom!=="Animalia" || !["SPECIES","SUBSPECIES"].includes(match.rank) || normalizeName(match.canonicalName || "")!==normalizeName(name))return uncertain;
  const key=match.acceptedUsageKey || match.usageKey;
  if(!Number.isInteger(key) || key<=0)return uncertain;
  const url=`https://www.gbif.org/species/${key}`;
  const [profiles,redList]=await Promise.all([json(`/species/${key}/speciesProfiles?limit=1000`),json(`/species/${key}/iucnRedListCategory`,true)]);
  // IUCN categories for surviving species take precedence over fossil flags.
  // Extinct in the wild (EW) is not extinct: individuals still survive in captivity.
  if(["EW","CR","EN","VU","NT","LC"].includes(redList.code))return {kind:"living",url};
  if(redList.code==="DD")return {kind:"uncertain",url};
  if(profiles.endOfRecords!==true || !Array.isArray(profiles.results))return {kind:"uncertain",url};
  const extinct=profiles.results.some((p:{extinct?:boolean})=>p.extinct===true) || redList.code==="EX";
  const living=profiles.results.some((p:{extinct?:boolean})=>p.extinct===false);
  return {kind:extinct&&!living?"extinct":living&&!extinct?"living":"uncertain",url};
}
/** Free data lookup, never an AI fallback. Missing data or outages stop admission. */
export async function checkReferenceStatus(identity:ResolvedIdentity):Promise<ResolvedIdentity> {
  // Reviewed museum correction resolves the documented PBDB/CoL quagga conflict.
  if(identity.scientificName==="Equus quagga quagga" && identity.reference?.source==="UCL Grant Museum / Paleobiology Database")return identity;
  const key=normalizeName(identity.scientificName), cached=cache.get(key);
  let status=cached && cached.until>Date.now()?cached.status:undefined;
  if(!status){
    let pending=inFlight.get(key);
    if(!pending){
      pending=lookup(identity.scientificName);inFlight.set(key,pending);
      void pending.finally(()=>inFlight.delete(key)).catch(()=>{});
    }
    try { status=await pending; }
    catch {throw new CollectionError(503,"The free taxonomy check is temporarily unavailable. No AI request was made. Please try again shortly.","reference_unavailable");}
    if(cache.size>=2000)cache.delete(cache.keys().next().value!);
    cache.set(key,{until:Date.now()+(status.kind==="extinct"?86400000:3600000),status});
  }
  if(status.kind==="living")throw new CollectionError(422,`${identity.name} is listed as still living. No card was added and no AI request was made.`,"living_species");
  if(status.kind!=="extinct")throw new CollectionError(422,"The references could not consistently confirm this species is extinct. It needs review before a card can be created. No AI request was made.","unverified_name");
  return {...identity,reference:identity.reference?{...identity.reference,corroboratingUrl:status.url}:undefined};
}
