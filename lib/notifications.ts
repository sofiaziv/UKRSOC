import {createHash,randomUUID} from 'node:crypto';
import {rawDb} from '../scripts/database.mjs';
const base=()=>process.env.APP_URL||'';
export function notify(email:string,title:string,body:string,href:string,key?:string){
 const id=key||randomUUID(),db=rawDb(),now=new Date().toISOString();
 db.prepare('INSERT OR IGNORE INTO notifications(id,email,title,body,href,created) VALUES(?,?,?,?,?,?)').run(id,email.toLowerCase(),title,body,href,now);
 db.prepare('INSERT OR IGNORE INTO mail_queue(id,email,title,body,href,created) VALUES(?,?,?,?,?,?)').run(id,email.toLowerCase(),title,body,href,now);
}
export function notifyCommittee(title:string,body:string,href:string){notify(process.env.COMMITTEE_INBOX_EMAIL||'rhulua.notifications@gmail.com',title,body,href);for(const email of (process.env.COMMITTEE_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)){const id=randomUUID();rawDb().prepare('INSERT INTO notifications(id,email,title,body,href,created) VALUES(?,?,?,?,?,?)').run(id,email,title,body,href,new Date().toISOString());}}
export function announceEvent(event:any){const db=rawDb();if(!db.prepare('INSERT OR IGNORE INTO event_announcements(event_id) VALUES(?)').run(event.id).changes)return;
 const people=db.prepare("SELECT DISTINCT lower(email) AS email FROM members WHERE status<>'declined'").all() as {email:string}[];
 for(const p of people)notify(p.email,'New event: '+event.title,new Date(event.date).toLocaleString('en-GB',{timeZone:'Europe/London'})+' UK · '+event.location,'/?event='+encodeURIComponent(event.id),'event:'+event.id+':'+p.email);
}
export {deliverNotifications} from '../scripts/mail-queue.mjs';
