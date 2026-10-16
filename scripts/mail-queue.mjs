import {createHash} from 'node:crypto';
import {rawDb} from './database.mjs';
const base=()=>process.env.APP_URL||'';
export async function deliverNotifications(){
 if(!process.env.GMAIL_WEBHOOK_TOKEN||!process.env.GMAIL_WEBHOOK_URL)return;
 const db=rawDb();const rows=db.prepare("SELECT * FROM mail_queue WHERE status='pending' ORDER BY created LIMIT 12").all();
 await Promise.all(rows.map(async row=>{if(row.registration_id){const reg=db.prepare('SELECT r.status,e.status AS event_status FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.id=?').get(row.registration_id);if(!reg||reg.status!=='registered'||(row.event_kind!=='cancelled'&&reg.event_status==='cancelled')){db.prepare("UPDATE mail_queue SET status='suppressed' WHERE id=? AND status='pending'").run(row.id);return;}}if(!db.prepare("UPDATE mail_queue SET status='sending' WHERE id=? AND status='pending'").run(row.id).changes)return;
 let status='unknown';try{const r=await fetch(process.env.GMAIL_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'notification',token:process.env.GMAIL_WEBHOOK_TOKEN,requestId:createHash('sha256').update(row.id).digest('hex'),to:row.email,title:row.title,body:row.body,url:base()+row.href,event:row.event_payload?JSON.parse(row.event_payload):undefined}),signal:AbortSignal.timeout(20000)});const j=await r.json();status=j.status==='sent'?'sent':['unsupported_kind','invalid_request'].includes(j.code)?'needs_script_update':j.status==='error'?'failed':'unknown';}catch{}db.prepare('UPDATE mail_queue SET status=? WHERE id=?').run(status,row.id);
 }));
}
