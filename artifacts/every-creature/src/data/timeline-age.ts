/** Normalize ages to millions of years; unrecognised values stay unknown. */
export function oldestAgeMa(value:string):number|undefined {
 const text=value.toLowerCase().trim().replace(/(?<=\d),(?=\d{3}(?:\D|$))/g,'');
 if(/^(present|extant|ongoing)$/.test(text) || /^extinct\s+\d{3,4}$/.test(text))return 0;
 const numbers=(text.match(/\d+(?:\.\d+)?/g)||[]).map(Number);
 if(!numbers.length)return undefined;
 const oldest=Math.max(...numbers);
 if(/\b(ma|mya|million)\b/.test(text))return oldest;
 if(/\b(ka|kya|thousand)\b/.test(text))return oldest/1000;
 if(/\b(years?|yr|yrs)\b/.test(text) || oldest>10000)return oldest/1_000_000;
 // Legacy collection uses bare small decimal numbers for Ma.
 return oldest<=635?oldest:undefined;
}
export function timelineStartMa(creature:{mya:string;era:string}):number|undefined {
 const age=oldestAgeMa(creature.mya);
 if(age!==undefined)return age;
 // Named epochs provide a safe placement when the age text is incomplete.
 if(/pleistocene|holocene|quaternary/i.test(creature.era))return 2;
 return undefined;
}
