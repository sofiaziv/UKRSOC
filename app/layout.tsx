import './globals.css';
import MemberPreviewBar from '../components/MemberPreviewBar';
export const metadata={title:'Ukrainian Society | Royal Holloway',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'RHUL UA',statusBarStyle:'default'},icons:{icon:[{url:'/icons/sunflower-192.png',sizes:'192x192',type:'image/png'}],apple:[{url:'/icons/sunflower-apple-180.png',sizes:'180x180',type:'image/png'}]},description:'Rooted in Ukraine. United at Royal Holloway. Meet your community, discover events and stay connected.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><MemberPreviewBar/>{children}</body></html>}
