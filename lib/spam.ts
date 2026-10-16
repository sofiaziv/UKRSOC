import {createHmac} from 'node:crypto';
import {rawDb} from '../scripts/database.mjs';
export function fingerprint(value:string){return createHmac('sha256',process.env.AUTH_SECRET||'local-development').update(value).digest('hex');}
export function ipKey(req:Request){return fingerprint(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown');}
export function limit(key:string,max:number,windowMs:number){const now=Date.now();const row=rawDb().prepare('INSERT INTO rate_limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END,until=CASE WHEN until<? THEN excluded.until ELSE until END RETURNING count').get(key,now+windowMs,now,now) as any;return row.count<=max;}
