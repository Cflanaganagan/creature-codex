"""Refresh the checked-in PBDB reference; not run by Render builds or visitor searches."""
import json,re,urllib.request,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
URL='https://paleobiodb.org/data1.2/taxa/list.json?base_name=Animalia&rank=species,subspecies&taxon_status=valid&show=attr,common&limit=all'
def main():
 req=urllib.request.Request(URL,headers={'User-Agent':'WoollyMuseum/1.0 (taxonomy reference snapshot)'})
 with urllib.request.urlopen(req,timeout=180) as response:data=json.load(response)
 if data.get('errors') or data.get('warnings'):raise RuntimeError(str(data.get('errors') or data.get('warnings')))
 rows=[]
 for c in data['records']:
  if c.get('rnk') not in ('species','subspecies') or c.get('ext') not in ('0','1'):continue
  if c.get('tdf') or c.get('acn') or not re.fullmatch(r'[A-Z][a-z]+ [a-z]+(?: [a-z]+)?',c.get('nam','')):continue
  rows.append([c['oid'],c['nam'],c['ext']=='0',c.get('nm2',''),c.get('rid',''),c.get('att','')])
 rows.sort(key=lambda c:(c[1].lower(),c[0]))
 ids={r[0] for r in rows}
 synonyms=sorted({(c['nam'],c['acc']) for c in data['records'] if c.get('acc') in ids and 'synonym' in c.get('tdf','') and re.fullmatch(r'[A-Z][a-z]+ [a-z]+(?: [a-z]+)?',c.get('nam',''))})
 if len(rows)<10000:raise RuntimeError('Suspiciously small snapshot; existing file preserved')
 result={'source':'Paleobiology Database','sourceUrl':URL,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'columns':['id','scientificName','extinct','commonName','referenceId','attribution'],'records':rows,'synonyms':synonyms}
 dest=ROOT/'lib/db/src/taxon-reference.json'
 dest.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
 print('Saved',len(rows),'accepted species/subspecies;',sum(r[2] for r in rows),'marked extinct')
if __name__=='__main__':main()
