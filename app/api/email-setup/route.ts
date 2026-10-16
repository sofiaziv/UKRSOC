import {access} from '../../../lib/access';
const env=process.env;
import {getChatGPTUser} from '../../chatgpt-auth';
import {googleMailScript} from '../../../lib/google-mail-script';
export async function GET(){if(!(await access()).admin)return new Response('Administrator access required',{status:403});return new Response(googleMailScript,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="RHUL_Approval_Mail.gs"','Cache-Control':'private, no-store'}});}
