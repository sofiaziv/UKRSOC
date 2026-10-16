import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
export const dataDir=process.env.DATA_DIR||path.join(process.cwd(),'data');
let database;
export function rawDb(){
 if(database)return database;
 mkdirSync(dataDir,{recursive:true});
 const db=new DatabaseSync(path.join(dataDir,'society.sqlite'));
 db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS app_migrations(name TEXT PRIMARY KEY);');
 db.exec(`CREATE TABLE IF NOT EXISTS login_codes(email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, requested INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);`);
 const pending=readdirSync(path.join(process.cwd(),'drizzle')).filter(n=>n.endsWith('.sql')&&!db.prepare('SELECT name FROM app_migrations WHERE name=?').get(n));
 if(pending.length&&existsSync(path.join(dataDir,'society.sqlite'))&&db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='members'").get().n){mkdirSync(path.join(dataDir,'backups'),{recursive:true});const backup=path.join(dataDir,'backups','before-'+Date.now()+'.sqlite');db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 for(const name of readdirSync(path.join(process.cwd(),'drizzle')).filter(n=>n.endsWith('.sql')).sort()){
  if(db.prepare('SELECT name FROM app_migrations WHERE name=?').get(name))continue;
  db.exec('BEGIN IMMEDIATE');try{db.exec(readFileSync(path.join(process.cwd(),'drizzle',name),'utf8'));db.prepare('INSERT INTO app_migrations(name) VALUES(?)').run(name);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }

 if(process.env.MIGRATION_DATA_JSON&&!db.prepare("SELECT name FROM app_migrations WHERE name='sites-import-v1'").get()){
  const data=JSON.parse(process.env.MIGRATION_DATA_JSON);db.exec('BEGIN IMMEDIATE');
  try{for(const table of ['articles','events','involvement','members','messages','registrations']){
   const columns=db.prepare('PRAGMA table_info('+table+')').all().map(c=>c.name);
   for(const row of data[table]||[]){const keys=Object.keys(row);if(!keys.length||keys.some(k=>!columns.includes(k)))throw Error('Invalid migration columns');db.prepare('INSERT INTO '+table+' ('+keys.map(k=>'"'+k+'"').join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...keys.map(k=>row[k]));}
  }db.prepare('INSERT INTO app_migrations(name) VALUES(?)').run('sites-import-v1');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }
 database=db;return db;
}
