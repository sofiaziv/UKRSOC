import {cookies} from 'next/headers';
import {hash} from './session';
import {currentUser} from './session';
import {rawDb} from '../scripts/database.mjs';
export function adminEmail(email:string){return (process.env.COMMITTEE_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).includes(email.toLowerCase());}
export async function access(){const user=await currentUser();const profile=user?rawDb().prepare('SELECT * FROM members WHERE user_id=?').get(user.userId) as any:null;const owner=!!user&&adminEmail(user.email);const preview=owner&&(await cookies()).get('society_member_preview')?.value===hash(user!.email);const admin=owner&&!preview;return {user,profile,admin,preview,approved:owner||!!user&&profile?.status==='approved'};}
