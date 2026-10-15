import {rawDb} from './database.mjs';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
rawDb();
const standalone=existsSync('server.js')?'server.js':'.next/standalone/server.js';
const proc=spawn(process.execPath,[standalone],{stdio:'inherit',env:{...process.env,HOSTNAME:'0.0.0.0'}});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>proc.kill(signal));
proc.on('exit',code=>process.exit(code??1));
