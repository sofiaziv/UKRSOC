export const googleMailScript = String.raw`// RHUL Ukrainian Society — sign-in, approval and society notifications.
// Create this project while signed in as rhulua.notifications@gmail.com.
// Project Settings > Script Properties: set SITE_MAIL_TOKEN to a long random secret.
// Store the same secret as GMAIL_WEBHOOK_TOKEN in the Site environment settings.
function authorizeMail() {
  MailApp.getRemainingDailyQuota();
}
function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return jsonReply({status:'ready'}); }
function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (_) { return jsonReply({status:'error',code:'invalid_request'}); }
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('SITE_MAIL_TOKEN');
  if (!token || token.length < 32 || data.token !== token) return jsonReply({status:'error',code:'unauthorized'});
  if (data.kind === 'notification') return notificationMail(data,props);
  if (data.kind === 'signin') return signInMail(data,props);
  if (typeof data.requestId !== 'string' || !/^[a-f0-9]{64}$/.test(data.requestId) || typeof data.to !== 'string' || data.to.length > 254 || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(data.to) || typeof data.firstName !== 'string' || data.firstName.length > 100) return jsonReply({status:'error',code:'invalid_request'});
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return jsonReply({status:'error',code:'busy'});
  try {
    var key = 'mail_' + data.requestId;
    var previous = props.getProperty(key);
    if (previous === 'sent') return jsonReply({status:'sent',duplicate:true});
    if (previous === 'sending' || previous === 'unknown') return jsonReply({status:'unknown',code:'check_sent_mail'});
    if (MailApp.getRemainingDailyQuota() < 1) return jsonReply({status:'error',code:'quota'});
    props.setProperty(key,'sending');
    var name = data.firstName.replace(/[\r\n]/g,' ');
    var profile = 'https://rhul-ukrainian-society.frostyloach256.chatgpt.site/profile';
    var allowedOrigin = 'https://ukrsoc-web-production.up.railway.app';
    if (allowedOrigin && /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(allowedOrigin) && data.profileUrl === allowedOrigin+'/profile') profile=data.profileUrl;
    var subject = 'Your Ukrainian Society profile has been approved';
    var body = 'Hi '+name+',\n\nYour Ukrainian Society member profile has been approved! You can now open your profile and apply for our events.\n\nOpen my profile: '+profile+'\n\nEvent applications are reviewed separately.\n\nSee you soon,\nRHUL Ukrainian Society Committee';
    var safeName = name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    var htmlBody = "<!doctype html><html lang=\"en\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta charset=\"utf-8\"><title>Welcome to RHUL Ukrainian Society</title></head><body style=\"margin:0;background:#f5f2e7;color:#18342d;font-family:Arial,sans-serif\"><div style=\"display:none;max-height:0;overflow:hidden\">Your profile is approved. Your next chapter starts here.</div><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\" style=\"padding:32px 16px\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;background:#fffdf5;border:1px solid #dedfce;border-radius:20px\"><tr><td style=\"padding:30px 28px;border-bottom:4px solid #f0cc58\"><p style=\"margin:0;color:#3156bd;font-size:12px;font-weight:bold;letter-spacing:2px\">RHUL UKRAINIAN SOCIETY</p><p style=\"margin:10px 0 0;font-size:12px;color:#64756b\">Royal Holloway, University of London</p></td></tr><tr><td style=\"padding:32px 28px\"><span style=\"display:inline-block;background:#edf1e4;border-radius:20px;padding:9px 14px;font-size:12px;color:#365637\">PROFILE APPROVED</span><h1 style=\"font-family:Georgia,serif;font-size:36px;font-weight:normal;line-height:1.15;margin:24px 0;color:#18342d\">You're part of<br>our community.</h1><p style=\"font-size:16px;line-height:1.7\">Hi {{NAME}},</p><p style=\"font-size:16px;line-height:1.7\">Your Ukrainian Society member profile has been approved. We’re looking forward to seeing you at our socials, cultural events and everything in between.</p><table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:28px 0\"><tr><td bgcolor=\"#3156bd\" style=\"border-radius:10px\"><a href=\"{{PROFILE}}\" style=\"display:inline-block;padding:17px 32px;color:#ffffff;font-weight:bold;text-decoration:none;font-size:16px\">My profile &rarr;</a></td></tr></table><p style=\"font-size:14px;line-height:1.7;color:#64756b\">You can now apply for events from your profile. Each event application is reviewed separately by the committee.</p><p style=\"font-size:16px;line-height:1.7;margin-top:28px\">See you soon,<br><strong>RHUL Ukrainian Society Committee</strong></p></td></tr><tr><td style=\"padding:24px 28px;background:#edf0e3;border-radius:0 0 20px 20px\"><p style=\"font-family:Georgia,serif;font-size:20px;line-height:1.4;margin:0;color:#3156bd\">Rooted in Ukraine.<br>United at Royal Holloway.</p><p style=\"font-size:11px;line-height:1.6;color:#64756b;margin-bottom:0\">You received this email because you applied for a member profile on our website.</p></td></tr></table></td></tr></table></body></html>".replace('{{NAME}}',safeName).replace('{{PROFILE}}',profile);
    try {
      MailApp.sendEmail({to:data.to,subject:subject,body:body,htmlBody:htmlBody,name:'RHUL Ukrainian Society',replyTo:'rhulua.notifications@gmail.com'});
      props.setProperty(key,'sent');
      return jsonReply({status:'sent'});
    } catch (_) {
      props.setProperty(key,'unknown');
      return jsonReply({status:'unknown',code:'check_sent_mail'});
    }
  } finally { lock.releaseLock(); }
}

function signInMail(data,props) {
  if (typeof data.to !== 'string' || data.to.length>254 || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(data.to) || typeof data.code!=='string' || !/^\d{6}$/.test(data.code) || typeof data.requestId!=='string' || !/^[a-f0-9]{64}$/.test(data.requestId)) return jsonReply({status:'error',code:'invalid_request'});
  var lock=LockService.getScriptLock();if(!lock.tryLock(10000))return jsonReply({status:'error',code:'busy'});
  try {
    var key='signin_'+data.requestId,previous=props.getProperty(key);
    if(previous==='sent')return jsonReply({status:'sent',duplicate:true});
    if(previous)return jsonReply({status:'unknown'});
    if(MailApp.getRemainingDailyQuota()<1)return jsonReply({status:'error',code:'quota'});
    props.setProperty(key,'sending');
    try {
      MailApp.sendEmail({to:data.to,subject:'Your RHUL Ukrainian Society sign-in code',name:'RHUL Ukrainian Society',body:'Your sign-in code is '+data.code+'. It expires in 10 minutes. If you did not request it, ignore this email.',htmlBody:'<div style="background:#f5f2e7;padding:32px;font-family:Arial,sans-serif;color:#18342d"><div style="max-width:500px;margin:auto;background:#fffdf5;padding:32px;border-radius:16px;border-top:4px solid #f0cc58"><p style="color:#3156bd;font-size:12px;letter-spacing:2px">RHUL UKRAINIAN SOCIETY</p><h1 style="font-family:Georgia,serif;font-weight:normal">Your sign-in code</h1><p>Enter this code on the website to sign in:</p><p style="font-size:36px;letter-spacing:8px;color:#3156bd;font-weight:bold">'+data.code+'</p><p>This code expires in 10 minutes. Do not share it with anyone.</p><p style="font-size:12px;color:#64756b">If you didn’t request this code, you can ignore this email.</p></div></div>'});
      props.setProperty(key,'sent');return jsonReply({status:'sent'});
    } catch (_) {props.setProperty(key,'unknown');return jsonReply({status:'unknown'});}
  } finally {lock.releaseLock();}
}

function notificationMail(data,props) {
  var origin='https://ukrsoc-web-production.up.railway.app';
  if(typeof data.to!=='string'||data.to.length>254||! /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(data.to)||typeof data.requestId!=='string'||! /^[a-f0-9]{64}$/.test(data.requestId)||typeof data.title!=='string'||data.title.length>250||typeof data.body!=='string'||data.body.length>3000||typeof data.url!=='string'||data.url.indexOf(origin+'/')!==0)return jsonReply({status:'error',code:'invalid_request'});
  var lock=LockService.getScriptLock();if(!lock.tryLock(10000))return jsonReply({status:'error',code:'busy'});
  try {
    var key='notification_'+data.requestId,previous=props.getProperty(key);
    if(previous==='sent')return jsonReply({status:'sent',duplicate:true});
    if(previous)return jsonReply({status:'unknown'});
    if(MailApp.getRemainingDailyQuota()<1)return jsonReply({status:'error',code:'quota'});
    var esc=function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');};
    var html='<div style="background:#f5f2e7;padding:32px 16px;font-family:Arial,sans-serif;color:#18342d"><div style="max-width:520px;margin:auto;background:#fffdf5;padding:32px;border-radius:16px;border-top:4px solid #f0cc58"><p style="color:#3156bd;font-size:12px;letter-spacing:2px">RHUL UKRAINIAN SOCIETY</p><h1 style="font-family:Georgia,serif;font-weight:normal">'+esc(data.title)+'</h1><p style="line-height:1.8">'+esc(data.body)+'</p><p style="margin:32px 0"><a href="'+esc(data.url)+'" style="display:inline-block;background:#3156bd;padding:16px 24px;color:white;border-radius:9px;text-decoration:none;font-weight:bold">Open on the website &rarr;</a></p><p style="font-family:Georgia,serif;color:#3156bd">Rooted in Ukraine.<br>United at Royal Holloway.</p></div></div>';
    if(data.event){var rich=eventMailHtml(data,esc);if(!rich)return jsonReply({status:'error',code:'invalid_request'});html=rich;}
    if(data.article){var newsletter=newsletterMailHtml(data,esc);if(!newsletter)return jsonReply({status:'error',code:'invalid_request'});html=newsletter;}
    props.setProperty(key,'sending');
    try{MailApp.sendEmail({to:data.to,subject:data.title.replace(/[\r\n]/g,' '),body:data.body+(data.event?'\n\n'+data.event.title+'\n'+data.event.date+'\n'+data.event.location+'\n'+data.event.description:'')+'\n\n'+data.url,htmlBody:html,inlineImages:data.event&&data.event.inlineImage?{eventCover:Utilities.newBlob(Utilities.base64Decode(data.event.inlineImage.data),data.event.inlineImage.contentType,'event-cover')}:undefined,name:'RHUL Ukrainian Society',replyTo:'rhulua.notifications@gmail.com'});props.setProperty(key,'sent');return jsonReply({status:'sent'});}catch(_){props.setProperty(key,'unknown');return jsonReply({status:'unknown'});}
  }finally{lock.releaseLock();}
}

function eventMailHtml(data,esc){
 var e=data.event;
 if(!e||['confirmed','updated','cancelled'].indexOf(e.kind)<0||typeof e.title!=='string'||e.title.length>300||typeof e.date!=='string'||e.date.length>200||typeof e.location!=='string'||e.location.length>3000||typeof e.description!=='string'||e.description.length>3000||typeof e.image!=='string'||e.image.length>2048||(e.image&&!/^https:\/\//.test(e.image))||typeof e.ticketUrl!=='string'||e.ticketUrl.length>2048||(e.ticketUrl&&!/^https:\/\//.test(e.ticketUrl)))return null;
 if(e.inlineImage&&(typeof e.inlineImage.data!=='string'||e.inlineImage.data.length>7500000||! /^[A-Za-z0-9+/=]+$/.test(e.inlineImage.data)||['image/png','image/jpeg','image/webp'].indexOf(e.inlineImage.contentType)<0))return null;
 var label=e.kind==='confirmed'?'YOUR PLACE IS CONFIRMED':e.kind==='cancelled'?'EVENT CANCELLED':'UPDATED EVENT DETAILS';
 var old='';if(e.kind==='updated'&&e.previous&&typeof e.previous.date==='string'&&typeof e.previous.location==='string')old='<div style="background:#f3f0e5;padding:16px;border-radius:10px;margin:20px 0"><strong>Previously</strong><p>'+esc(e.previous.date)+'<br>'+esc(e.previous.location)+'</p><strong>Please use the updated details below.</strong></div>';
 var image=(e.inlineImage||e.image)?'<img src="'+esc(e.inlineImage?'cid:eventCover':e.image)+'" alt="'+esc(e.title)+'" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:16px 16px 0 0">':'';
 var ticket=e.ticketUrl&&e.kind!=='cancelled'?'<p>A separate ticket may be required: <a href="'+esc(e.ticketUrl)+'">View tickets</a>. Your society approval does not confirm payment.</p>':'';
 return '<!doctype html><html><body style="margin:0;padding:28px 12px;background:#f5f2e7;color:#18342d;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:#fffdf5;border-radius:16px;border:1px solid #dadfcd">'+image+'<div style="padding:28px"><p style="font-size:12px;letter-spacing:2px;color:#3156bd">RHUL UKRAINIAN SOCIETY</p><p style="display:inline-block;padding:9px 13px;border-radius:20px;background:#f3db87;font-size:12px">'+label+'</p><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:normal">'+esc(e.title)+'</h1><p style="line-height:1.8">'+esc(data.body)+'</p>'+old+'<table role="presentation" width="100%" style="background:#edf1e4;border-radius:12px;padding:18px;line-height:1.7"><tr><td><strong>Date &amp; time</strong><br>'+esc(e.date)+'</td></tr><tr><td style="padding-top:14px"><strong>Location</strong><br>'+esc(e.location)+'</td></tr><tr><td style="padding-top:14px"><strong>Admission</strong><br>'+(e.cost==='free'?'Free':e.cost==='paid'?'Paid — check ticket details':'See event details')+'</td></tr></table><p style="line-height:1.8;white-space:pre-wrap">'+esc(e.description)+'</p>'+ticket+'<p style="margin:28px 0"><a href="'+esc(data.url)+'" style="display:inline-block;background:#3156bd;color:white;padding:16px 25px;border-radius:9px;text-decoration:none;font-weight:bold">My events &rarr;</a></p><p style="font-family:Georgia,serif;font-size:20px;color:#3156bd">Rooted in Ukraine.<br>United at Royal Holloway.</p><p style="font-size:12px;color:#64756b">This message relates to your approved event registration.</p></div></div></body></html>';
}

function newsletterMailHtml(data,esc){
 var a=data.article,origin='https://ukrsoc-web-production.up.railway.app';
 if(!a||typeof a.title!=='string'||a.title.length>200||typeof a.author!=='string'||a.author.length>120||typeof a.preview!=='string'||a.preview.length>500||typeof a.image!=='string'||a.image.length>2048||(a.image&&!/^https:\/\//.test(a.image))||typeof a.unsubscribeUrl!=='string'||a.unsubscribeUrl.indexOf(origin+'/newsletter?unsubscribe=')!==0)return null;
 var image=a.image?'<img src="'+esc(a.image)+'" alt="'+esc(a.title)+'" width="560" style="width:100%;max-width:560px;display:block;height:auto;border-radius:16px 16px 0 0">':'';
 return '<!doctype html><html><body style="margin:0;background:#f5f2e7;padding:28px 12px;font-family:Arial,sans-serif;color:#18342d"><div style="max-width:560px;margin:auto;background:#fffdf5;border:1px solid #d9dfcc;border-radius:16px">'+image+'<div style="padding:30px"><p style="color:#3156bd;font-size:12px;letter-spacing:2px">THE SOCIETY EDIT</p><h1 style="font-family:Georgia,serif;font-size:33px;font-weight:normal">'+esc(a.title)+'</h1><p style="font-size:14px;color:#65745e">By '+esc(a.author)+'</p><p style="font-size:17px;line-height:1.8">'+esc(a.preview)+'</p><p style="margin:30px 0"><a href="'+esc(data.url)+'" style="display:inline-block;background:#3156bd;padding:16px 25px;border-radius:8px;color:white;text-decoration:none;font-weight:bold">Read Article &rarr;</a></p><p style="font-family:Georgia,serif;font-size:20px;color:#3156bd">Rooted in Ukraine.<br>United at Royal Holloway.</p><p style="font-size:12px;color:#6d7a64">You opted in to our newsletter. <a href="'+esc(a.unsubscribeUrl)+'" style="color:#3156bd">Unsubscribe</a></p></div></div></body></html>';
}
`;
