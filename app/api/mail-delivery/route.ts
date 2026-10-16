import {access} from '../../../lib/access';
import {rawDb} from '../../../scripts/database.mjs';
export const dynamic='force-dynamic';
export async function GET(){if(!(await access()).admin)return Response.json({error:'Administrator access required.'},{status:403});const db=rawDb();return Response.json({configured:!!(process.env.GMAIL_WEBHOOK_URL&&process.env.GMAIL_WEBHOOK_TOKEN),counts:Object.fromEntries((db.prepare('SELECT status,count(*) n FROM mail_queue GROUP BY status').all() as any[]).map(r=>[r.status,r.n])),items:db.prepare('SELECT id,email,title,created,status,category FROM mail_queue ORDER BY created DESC LIMIT 100').all()},{headers:{'Cache-Control':'private, no-store'}})}
