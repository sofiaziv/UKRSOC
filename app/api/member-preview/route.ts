import {cookies} from 'next/headers';
import {access,adminEmail} from '../../../lib/access';
import {currentUser,hash,sameOrigin} from '../../../lib/session';
export const dynamic='force-dynamic';
export async function GET(){const a=await access();return Response.json({eligible:!!a.user&&adminEmail(a.user.email),active:a.preview},{headers:{'Cache-Control':'private, no-store'}});}
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});const u=await currentUser();if(!u||!adminEmail(u.email))return Response.json({error:'Administrator access required'},{status:403});const b=await req.json().catch(()=>null);if(typeof b?.active!=='boolean')return Response.json({error:'Invalid mode'},{status:400});(await cookies()).set('society_member_preview',b.active?hash(u.email):'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:b.active?3600:0});return Response.json({ok:true});}
