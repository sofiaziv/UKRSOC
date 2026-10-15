export const googleMailScript = String.raw`// RHUL Ukrainian Society — approval confirmations only.
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
    var allowedOrigin = props.getProperty('RAILWAY_SITE_ORIGIN');
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
`;
