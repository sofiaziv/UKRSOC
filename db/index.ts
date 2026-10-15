import {drizzle} from 'drizzle-orm/sqlite-proxy';
import {rawDb} from '../scripts/database.mjs';
import * as schema from './schema';
export function getDb(){return drizzle(async(sql,params,method)=>{const stmt=rawDb().prepare(sql);if(method==='run'){stmt.run(...params);return {rows:[]};}const rows=stmt.all(...params).map((row:Record<string,unknown>)=>Object.values(row));return {rows:method==='get'?rows[0]:rows};},{schema});}
