import {currentUser,safeReturn} from '../lib/session';
import {redirect} from 'next/navigation';
export const getChatGPTUser=currentUser;
export async function requireChatGPTUser(returnTo:string){const u=await currentUser();if(u)return u;redirect(chatGPTSignInPath(returnTo));}
export function chatGPTSignInPath(returnTo:string){return '/signin?return_to='+encodeURIComponent(safeReturn(returnTo));}
export function chatGPTSignOutPath(){return '/profile';}
