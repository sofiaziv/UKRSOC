import {createHash,randomUUID} from 'node:crypto';
import {rawDb} from '../scripts/database.mjs';
const base=()=>process.env.APP_URL||'';
export function notify(email:string,title:string,body:string,href:string,key?:string,categoryOverride?:string){
 const id=key||randomUUID(),db=rawDb(),now=new Date().toISOString(),category=categoryOverride||(href.startsWith('/chat')?'messages':/membership|profile/i.test(title)?'account':'updates');
 db.prepare('INSERT OR IGNORE INTO notifications(id,email,title,body,href,created,category) VALUES(?,?,?,?,?,?,?)').run(id,email.toLowerCase(),title,body,href,now,category);
 db.prepare('INSERT OR IGNORE INTO mail_queue(id,email,title,body,href,created,category) VALUES(?,?,?,?,?,?,?)').run(id,email.toLowerCase(),title,body,href,now,category);
}
export function notifyCommittee(title:string,body:string,href:string,categoryOverride?:string){notify(process.env.COMMITTEE_INBOX_EMAIL||'rhulua.notifications@gmail.com',title,body,href,undefined,categoryOverride);for(const email of (process.env.COMMITTEE_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)){const id=randomUUID();rawDb().prepare('INSERT INTO notifications(id,email,title,body,href,created,category) VALUES(?,?,?,?,?,?,?)').run(id,email,title,body,href,new Date().toISOString(),categoryOverride||(href.startsWith('/chat')?'messages':/membership|profile/i.test(title)?'account':'updates'));}}
export function eventNotice(registration:any,event:any,kind:'confirmed'|'updated'|'cancelled',previous?:any){
 const db=rawDb(),id=randomUUID(),email=registration.email.toLowerCase(),now=new Date().toISOString();
 const title=kind==='confirmed'?"You're registered: "+event.title:kind==='cancelled'?'Event cancelled: '+event.title:'Event updated: '+event.title;
 const when=(date:string)=>new Date(date).toLocaleString('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
 const body=kind==='confirmed'?"Your place has been approved. We look forward to seeing you!":kind==='cancelled'?'This event has been cancelled. Please do not attend. Contact the committee if you have any questions.':'The date, time or venue has changed. Please use the updated details below.';
 const partySize=1+Number(registration.guestCount??registration.guest_count??0);const messageBody=kind==='confirmed'&&partySize>1?body+' This approval includes you and '+(partySize-1)+' guest(s), '+partySize+' places in total.':body;
 const payload={kind,title:event.title,date:when(event.date)+' (UK time)',location:event.location,description:event.description,cost:event.cost,ticketUrl:event.ticketUrl||'',image:event.image?.startsWith('/')?base()+event.image:event.image||'',previous:previous?{date:when(previous.date)+' (UK time)',location:previous.location}:undefined};
 db.prepare('INSERT INTO notifications(id,email,title,body,href,created,category) VALUES(?,?,?,?,?,?,?)').run(id,email,title,messageBody,'/profile',now,'events');
 db.prepare('INSERT INTO mail_queue(id,email,title,body,href,created,event_payload,registration_id,event_kind,category) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,email,title,messageBody,'/profile',now,JSON.stringify(payload),registration.id,kind,'events');
}
export function eventChanges(event:any,previous:any){
 const kind=event.status==='cancelled'?'cancelled':'updated';
 const recipients=rawDb().prepare("SELECT * FROM registrations WHERE event_id=? AND status='registered'").all(event.id);
 for(const reg of recipients)eventNotice(reg,event,kind,previous);
}
export {deliverNotifications} from '../scripts/mail-queue.mjs';
