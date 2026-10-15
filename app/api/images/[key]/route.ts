import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {dataDir} from '../../../../scripts/database.mjs';
export async function GET(req:Request,{params}:{params:Promise<{key:string}>}){const {key}=await params;if(!/^[a-f0-9-]{36}$/.test(key))return new Response('Not found',{status:404});try{const p=path.join(dataDir,'uploads',key);const bytes=await readFile(p);const meta=JSON.parse(await readFile(p+'.json','utf8'));return new Response(bytes,{headers:{'Content-Type':meta.contentType,'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}}
