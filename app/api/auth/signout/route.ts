import {cookies} from 'next/headers';
import {cookieName,hash,sameOrigin} from '../../../../lib/session';
import {rawDb} from '../../../../scripts/database.mjs';
export async function POST(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});const jar=await cookies();const token=jar.get(cookieName)?.value;if(token)rawDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));jar.delete(cookieName);return Response.json({ok:true});}
