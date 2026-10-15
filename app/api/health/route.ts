import {rawDb} from '../../../scripts/database.mjs';
export const dynamic='force-dynamic';
export function GET(){rawDb().prepare('SELECT 1').get();return Response.json({status:'ok'});}
