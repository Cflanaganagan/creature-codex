import { useEffect, useState } from "react";
export type ReferenceMatch = {taxonId:string;name:string;scientificName:string};
type ReferenceData = {matches:ReferenceMatch[];verdict:null|{status:"resolved"|"living_species"|"clarification_required"|"unverified_name";message?:string;suggestions?:string[];identity?:{name:string;scientificName:string}};reference:{extinctCount:number;retrievedAt:string}};
export function useTaxonReference(query:string) {
  const [state,setState]=useState<{query:string;data?:ReferenceData;failed?:boolean}>({query:""});
  useEffect(()=>{
    const q=query.trim();
    if(q.length<2||q.length>160)return;
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      fetch(`/api/creatures/reference?q=${encodeURIComponent(q)}`,{signal:controller.signal})
        .then(async r=>{if(!r.ok)throw Error("Reference unavailable");return r.json()})
        .then((data:ReferenceData)=>{if(!controller.signal.aborted)setState({query:q,data});})
        .catch(()=>{if(!controller.signal.aborted)setState({query:q,failed:true});});
    },200);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[query]);
  return state.query===query.trim()?state:{query:query.trim()};
}
