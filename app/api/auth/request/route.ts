import {randomInt,createHmac} from 'node:crypto';
import {rawDb} from '../../../../scripts/database.mjs';
import {sameOrigin} from '../../../../lib/session';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Invalid request origin'},{status:403});
 const b=await req.json().catch(()=>null);const email=typeof b?.email==='string'?b.email.trim().toLowerCase():'';
 if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)||email.length>254)return Response.json({error:'Enter a valid email address.'},{status:400});
 const admins=(process.env.COMMITTEE_EMAILS||'').toLowerCase().split(',').map(s=>s.trim());
 if(process.env.PUBLIC_SITE!=='true'&&!admins.includes(email))return Response.json({error:'This preview is currently open to the committee only.'},{status:403});
 if(!process.env.GMAIL_WEBHOOK_TOKEN||!process.env.AUTH_SECRET||!process.env.GMAIL_WEBHOOK_URL)return Response.json({error:'Email sign-in is being connected. Please try again shortly.'},{status:503});
 const db=rawDb(),now=Date.now();const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 const key='login:'+ip;const rate=db.prepare('INSERT INTO rate_limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END,until=CASE WHEN until<? THEN excluded.until ELSE until END RETURNING count').get(key,now+3600000,now,now) as {count:number};
 if(rate.count>20)return Response.json({error:'Too many requests. Please try again later.'},{status:429});
 const previous=db.prepare('SELECT requested FROM login_codes WHERE email=?').get(email) as {requested:number}|undefined;
 if(previous&&now-previous.requested<60000)return Response.json({error:'Please wait one minute before requesting another code.'},{status:429});
 const code=String(randomInt(0,1000000)).padStart(6,'0');const digest=createHmac('sha256',process.env.AUTH_SECRET).update(email+':'+code).digest('hex');
 db.prepare('INSERT INTO login_codes VALUES(?,?,?,0,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires=excluded.expires,attempts=0,requested=excluded.requested').run(email,digest,now+600000,now);
 try{const r=await fetch(process.env.GMAIL_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:process.env.GMAIL_WEBHOOK_TOKEN,kind:'signin',code,to:email,firstName:'there',requestId:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','')}),signal:AbortSignal.timeout(25000)});const j=await r.json();if(!r.ok||j.status!=='sent')throw Error('Mail unavailable');return Response.json({ok:true});}catch{db.prepare('DELETE FROM login_codes WHERE email=? AND code_hash=?').run(email,digest);return Response.json({error:'Could not send your code. Please try again later.'},{status:502});}
}
