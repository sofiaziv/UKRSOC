'use client';
import {ArrowUpRight,MapPin} from 'lucide-react';
export default function EventPreviewCard({event:e,registration,busy,signedIn,onOpen}:{event:any;registration:any;busy:boolean;signedIn:boolean;onOpen:()=>void}){
 const date=new Date(e.date);
 return <article className={'society-event-card'+(e.image?' has-photo':'')} id={'event-'+e.id}>
  {e.image&&<img className="society-event-background" src={e.image} alt="" loading="lazy"/>}
  <div className="society-event-date"><b>{date.toLocaleDateString('en-GB',{timeZone:'Europe/London',day:'2-digit'})}</b><span>{date.toLocaleDateString('en-GB',{timeZone:'Europe/London',month:'short'})}</span></div>
  <div className="society-event-copy"><div className="society-event-tags">{e.status==='cancelled'&&<span className="status-badge status-cancelled">Event cancelled</span>}<span className="pill">{e.category}</span><span className="pill">{e.cost==='free'?'Free':e.cost==='paid'?'Paid':'See details'}</span>{(e.registrationOpen==='no'||e.status==='cancelled')&&<span className="pill">Registration closed</span>}{registration&&<span className={'status-badge status-'+registration.status}>{registration.status==='registered'?'Place confirmed':registration.status==='waitlisted'?'Waitlisted':'Pending approval'}</span>}</div>
   <h3><button className="event-title" onClick={onOpen}><span>{e.title}</span></button></h3>
   <p className="society-event-description"><span>{e.description}</span></p>
   <p className="society-event-venue"><span><MapPin size={14}/>{e.location} · {date.toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'})} UK time</span></p>
  </div>
  {signedIn?<button className="button dark society-event-action" disabled={busy} onClick={onOpen}>View details <ArrowUpRight size={16}/></button>:<a className="button dark society-event-action" href="/signin-with-chatgpt?return_to=%2F%23events">Sign in to join <ArrowUpRight size={16}/></a>}
 </article>;
}
