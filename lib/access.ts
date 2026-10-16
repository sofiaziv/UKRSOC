import {currentUser} from './session';
import {rawDb} from '../scripts/database.mjs';
export function adminEmail(email:string){return (process.env.COMMITTEE_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).includes(email.toLowerCase());}
export async function access(){const user=await currentUser();const profile=user?rawDb().prepare('SELECT * FROM members WHERE user_id=?').get(user.userId) as any:null;const admin=!!user&&adminEmail(user.email);return {user,profile,admin,approved:admin||!!user&&profile?.status==='approved'};}
