import './globals.css';
import MemberPreviewBar from '../components/MemberPreviewBar';
export const metadata={title:'Ukrainian Society | Royal Holloway',manifest:'/manifest.webmanifest?v=sunflower2',appleWebApp:{capable:true,title:'RHUL UA',statusBarStyle:'default'},icons:{shortcut:'/favicon.ico?v=sunflower2',icon:[{url:'/favicon.ico?v=sunflower2',sizes:'any'},{url:'/icons/sunflower-192.png?v=sunflower2',sizes:'192x192',type:'image/png'}],apple:[{url:'/apple-touch-icon.png?v=sunflower2',sizes:'180x180',type:'image/png'}]},description:'Rooted in Ukraine. United at Royal Holloway. Meet your community, discover events and stay connected.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><MemberPreviewBar/>{children}</body></html>}
