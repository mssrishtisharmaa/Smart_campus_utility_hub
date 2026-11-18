import fs from 'node:fs';
const ids=['forecast','gfs','era5','air-quality','marine','nasa-power'];
const results=await Promise.all(ids.map(async id=>{const start=Date.now();try{const response=await fetch(`${process.env.E2E_BASE_URL||'http://127.0.0.1:3000'}/api/datasets/${id}`,{signal:AbortSignal.timeout(60000)});const result=await response.json();return{id,status:response.status,ok:response.ok,source:result.source||null,isDemo:result.isDemo??null,retrievedAt:result.retrievedAt||null,durationMs:Date.now()-start,error:result.error||null};}catch(error){return{id,ok:false,error:error.message};}}));
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/source-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results,null,2));

