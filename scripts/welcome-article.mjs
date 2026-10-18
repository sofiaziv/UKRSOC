/** One-time launch article. Subsequent edits/unpublishing stay under committee control. */
export function addWelcomeArticle(db){
 const marker='content-welcome-article-v1';
 if(db.prepare('SELECT name FROM app_migrations WHERE name=?').get(marker))return;
 const id='welcome-to-our-community',now=new Date().toISOString();
 const body=`Welcome to our new little corner of the internet! I’m Sofiia, your Ukrainian Society Secretary, and I’m so happy to welcome you here. Whether you’ve been coming to our socials for a while or you’re just getting to know us, this is a space to stay connected, make plans and share your ideas.

## Your society, all in one place

We’ve brought our events, member profiles, committee messages and community stories together to make taking part a little easier. You can open the website on your computer or phone — no app download needed.

## Getting started

- Buy your Ukrainian Society membership through the [Students’ Union](https://www.su.rhul.ac.uk/societies/a-z/ukrainianassociation/).
- [Sign in with your email and create your profile](https://ukrsoc-web-production.up.railway.app/profile), adding your name and Student ID.
- We’ll check your membership and approve your profile. Once approved, you can explore our private events calendar.

Already bought your membership? You still need to create your website profile so we can connect everything.

## Find your next plan

Choose an event, open its details and send a request for a place. Bringing someone along? Tell us how many guests you’d like to bring when you apply.

Your membership approval and your event place are **two separate things**. A pending request is not a confirmed place: check **My Events** for the decision. Once your event request is approved, you’re on the list! If your plans change, please cancel your place there so someone else can join.

## A question? Just ask

Use [Ask the committee](https://ukrsoc-web-production.up.railway.app/chat) for a private conversation with us — about membership, an event, volunteering or an idea you’d love to see happen.

## Your voice belongs here, too

**The Society Edit** is a place for our community’s stories. Ukrainian culture, student life, personal perspectives or something you’re passionate about — we’d love to hear your ideas. Message the committee to pitch an article, and we’ll help you bring it to the website.

You don’t need to be Ukrainian or speak Ukrainian to feel at home with us. Bring your curiosity, your ideas and yourself.

See you at the next event!

**Sofiia Ziv-Zaionchyk**
Secretary, RHUL Ukrainian Society

> Rooted in Ukraine. United at Royal Holloway.`;
 db.exec('BEGIN IMMEDIATE');
 try{
 db.prepare('INSERT OR IGNORE INTO articles(id,title,author,category,body,image,created,published_at,publication) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'Welcome to our new home online','Sofiia Ziv-Zaionchyk','Society news',body,'/community-group.jpeg',now,now,'published');
 // Publishing website content does not send an unsolicited launch email.
 db.prepare('INSERT OR IGNORE INTO newsletter_publications(article_id) VALUES(?)').run(id);
 db.prepare('INSERT INTO app_migrations(name) VALUES(?)').run(marker);
 db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e}
}
