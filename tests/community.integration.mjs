import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {spawn} from 'node:child_process';import {createHash,randomBytes} from 'node:crypto';import assert from 'node:assert/strict';import {createServer} from 'node:http';
const dir=mkdtempSync(tmpdir()+'/society-integration-');process.env.DATA_DIR=dir;const {rawDb}=await import('../scripts/database.mjs');const db=rawDb();const tokens={};for(const email of ['admin@example.com','one@example.com','two@example.com']){const token=randomBytes(32).toString('base64url');tokens[email]=token;db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),email,Date.now()+3600000)}
const deliveries=[];const relay=createServer(async(req,res)=>{let text='';for await(const c of req)text+=c;deliveries.push(JSON.parse(text));res.setHeader('Content-Type','application/json');res.end('{"status":"sent"}')});await new Promise(r=>relay.listen(3212,r));const base='http://127.0.0.1:3211';const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3211'],{env:{...process.env,APP_URL:base,PUBLIC_SITE:'true',COMMITTEE_EMAILS:'admin@example.com',COMMITTEE_INBOX_EMAIL:'office@example.com',GMAIL_WEBHOOK_URL:'http://localhost:3212',GMAIL_WEBHOOK_TOKEN:'x'.repeat(40)},stdio:'ignore'});
async function call(path,email,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(email?{cookie:'rhul_session='+tokens[email]}:{}),...(body?{'Content-Type':'application/json',Origin:base}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,j:await r.json()}}
try{for(let i=0;i<60;i++){try{await fetch(base+'/api/health');break}catch{await new Promise(r=>setTimeout(r,300))}}
assert.equal((await call('/api/chat')).status,401);
assert.equal((await call('/api/chat','one@example.com',{body:'Private test',userId:'email:two@example.com'})).status,200);
assert.ok(db.prepare("SELECT body FROM mail_queue WHERE email='office@example.com' AND body LIKE '%Private test%'").get()?.body.includes('one@example.com'));
let a=await call('/api/chat?user=email:one@example.com','two@example.com');assert.equal(a.j.entries.length,0);assert.equal(a.j.threads.length,0);
a=await call('/api/chat?user='+encodeURIComponent('email:one@example.com'),'admin@example.com');assert.equal(a.j.entries.length,1);assert.equal(a.j.threads.length,1);
assert.equal((await call('/api/chat','admin@example.com',{userId:'email:one@example.com',body:'Committee response'})).status,200);
a=await call('/api/chat','one@example.com');assert.equal(a.j.entries.length,2);assert.equal(a.j.entries[1].sender,'committee');
a=await call('/api/notifications','one@example.com');assert.equal(a.j.items.length,1);const id=a.j.items[0].id;await call('/api/notifications','two@example.com',{id});assert.equal((await call('/api/notifications','one@example.com')).j.items[0].read_at,null);await call('/api/notifications','one@example.com',{id});assert.ok((await call('/api/notifications','one@example.com')).j.items[0].read_at);
assert.equal((await call('/api/community','one@example.com',{action:'join',firstName:'Test',lastName:'Member',studentId:'123'})).status,400);
assert.equal((await call('/api/community','one@example.com',{action:'join',firstName:'Test',lastName:'Member',studentId:'123',membershipConfirmed:'on'})).status,200);assert.equal((await call('/api/community','one@example.com')).j.profile.status,'pending');
const event={action:'event',title:'Test event',date:'2027-01-01T18:00:00Z',location:'Campus',category:'Social',description:'Testing',image:'',cost:'free',membership:'required',ticketUrl:'',capacity:20,registrationOpen:'yes',publication:'draft'};
assert.equal((await call('/api/community','one@example.com',event)).status,403);assert.equal((await call('/api/community','admin@example.com',event)).status,200);let ev=(await call('/api/community?admin=1','admin@example.com')).j.events[0];assert.equal(db.prepare('SELECT count(*) n FROM event_announcements').get().n,0);
await call('/api/community','admin@example.com',{...event,action:'edit-event',id:ev.id,publication:'published'});assert.equal(db.prepare("SELECT count(*) n FROM mail_queue WHERE registration_id IS NOT NULL").get().n,0);
for(const [uid,email,status] of [['one','one@example.com','pending'],['two','two@example.com','pending']])db.prepare("INSERT INTO registrations(id,event_id,user_id,email,status) VALUES(?,?,?,?,?)").run(uid,ev.id,'email:'+email,email,status);
await call('/api/community','admin@example.com',{...event,action:'edit-event',id:ev.id,publication:'published',location:'New venue'});assert.equal(db.prepare("SELECT count(*) n FROM mail_queue WHERE registration_id IS NOT NULL").get().n,0);
db.prepare("UPDATE members SET status='approved' WHERE user_id='email:one@example.com'").run();assert.equal((await call('/api/community','admin@example.com',{action:'approve',id:'one'})).status,200);assert.equal(db.prepare("SELECT count(*) n FROM mail_queue WHERE event_kind='confirmed'").get().n,1);
assert.equal((await call('/api/community','admin@example.com',{action:'approve',id:'one'})).status,409);
const updated={...event,action:'edit-event',id:ev.id,publication:'published',location:'Final venue',date:'2027-01-02T19:00:00Z'};
await call('/api/community','admin@example.com',updated);let queued=db.prepare("SELECT * FROM mail_queue WHERE event_kind='updated'").all();assert.equal(queued.length,1);assert.equal(queued[0].email,'one@example.com');let detail=JSON.parse(queued[0].event_payload);assert.equal(detail.location,'Final venue');assert.ok(detail.date.includes('19:00'));assert.equal(detail.previous.location,'New venue');
await call('/api/community','admin@example.com',updated);assert.equal(db.prepare("SELECT count(*) n FROM mail_queue WHERE event_kind='updated'").get().n,1);
assert.equal((await call('/api/community','two@example.com',{action:'cancel-event',id:ev.id})).status,403);
await call('/api/community','admin@example.com',{action:'cancel-event',id:ev.id});await call('/api/community','admin@example.com',{action:'cancel-event',id:ev.id});queued=db.prepare("SELECT * FROM mail_queue WHERE event_kind='cancelled'").all();assert.equal(queued.length,1);assert.equal(queued[0].email,'one@example.com');assert.equal((await call('/api/community','admin@example.com',{action:'approve',id:'two'})).status,403);
assert.equal(db.prepare("SELECT count(*) n FROM mail_queue WHERE registration_id='two'").get().n,0);
for(let i=0;i<30&&deliveries.length<4;i++)await new Promise(r=>setTimeout(r,100));assert.ok(deliveries.some(m=>m.to==='office@example.com'));assert.ok(deliveries.some(m=>m.to==='one@example.com'&&m.kind==='notification'));assert.equal((await call('/api/community?admin=1','two@example.com')).status,403);
// Reading chat clears its notifications; a later message creates a genuinely new unread item.
let thread=(await call('/api/chat','one@example.com')).j.entries;
await call('/api/chat','one@example.com',{action:'read',ids:thread.map(m=>m.id)});
let notices=(await call('/api/notifications','one@example.com')).j;
assert.equal(notices.unreadMessages,0);assert.ok(notices.items.filter(n=>n.category==='messages').every(n=>n.read_at));
await call('/api/chat','admin@example.com',{userId:'email:one@example.com',body:'A genuinely new reply'});
notices=(await call('/api/notifications','one@example.com')).j;
assert.equal(notices.unreadMessages,1);assert.equal(notices.items.filter(n=>n.category==='messages'&&!n.read_at).length,1);
// A stale read receipt must not clear the notification for an unseen new message.
await call('/api/chat','one@example.com',{action:'read',ids:thread.map(m=>m.id)});
assert.equal((await call('/api/notifications','one@example.com')).j.items.filter(n=>n.category==='messages'&&!n.read_at).length,1);
thread=(await call('/api/chat','one@example.com')).j.entries;
await call('/api/chat','one@example.com',{action:'read',ids:thread.map(m=>m.id)});
assert.equal((await call('/api/notifications','one@example.com')).j.items.filter(n=>n.category==='messages'&&!n.read_at).length,0);
await call('/api/notifications','one@example.com',{});
assert.ok((await call('/api/notifications','one@example.com')).j.items.every(n=>n.read_at));
console.log('PASS: chat privacy, multi-message history, notification ownership, membership review, approved-only event confirmation, changes, cancellation deduplication and mail relay.');
}finally{server.kill('SIGTERM');relay.close();db.close();rmSync(dir,{recursive:true,force:true})}
