# RHUL Ukrainian Society

Royal Holloway Ukrainian Society website: events, member applications, committee inbox, newsletter and USU affiliation.

## Runtime

Node 22.16+ and Next.js. SQLite database, sessions and uploaded images live on a persistent Railway volume mounted at `/data`. Run one replica. Back up the volume regularly.

```
npm ci
npm run check
npm test
npm run build
npm start
```

For local development use `npm run dev`. Production uses the Dockerfile and Railway health check `/api/health`.

## Railway variables

- `DATA_DIR=/data`
- `APP_URL`: exact HTTPS origin of the deployment, without a trailing slash.
- `COMMITTEE_EMAILS`: comma-separated verified administrator email addresses.
- `EDITOR_EMAILS`: optional newsletter editors.
- `AUTH_SECRET`: random 48-byte or longer secret used to hash email verification codes.
- `GMAIL_WEBHOOK_URL`: existing Google Apps Script web app endpoint.
- `GMAIL_WEBHOOK_TOKEN`: same value as Google Script Property `SITE_MAIL_TOKEN`. Store only in Railway Variables, never commit.
- `PUBLIC_SITE=false`: private committee preview. Set `true` only after the owner authorizes public launch.
- `MIGRATION_DATA_JSON`: optional one-time database import, entered privately in Railway Variables after consent. NEVER commit personal records. Remove after a successful verified import.

Sign-in uses emailed six-digit codes valid for 10 minutes, with five attempts, per-email cooldown and per-IP throttling. Sessions last up to 30 days, with HttpOnly and SameSite cookies. Admin access is checked on the server. ChatGPT identity headers are never trusted on Railway.

## Mail relay

Download the prepared Google Apps Script from Admin → Email setup. It must support `kind: signin` and approval confirmations. Update the existing deployment to a new version; preserve the webhook URL and existing token. Set `RAILWAY_SITE_ORIGIN` Script Property to the deployment HTTPS origin so approval links can target it. Do not enable public sign-in until the relay is configured and tested.

## Handover

Transfer repository ownership/access and Railway project membership to the next committee through the providers' controls. Replace `COMMITTEE_EMAILS`, maintain access to the notifications Gmail and Apps Script, and review backups and billing. Do not share personal passwords.

## Migration status

This repository contains the portable application. The original Sites publication remains unchanged. Live mail setup, data import and owner testing must be verified before public launch.

## Society notifications and chat

Private conversations live at `/chat`. Existing question/reply records are copied into the new append-only history by migration 0008_notifications. The original records remain intact. Member APIs always select the authenticated user's records; committee access uses COMMITTEE_EMAILS.

The header bell shows private event and chat notifications. First publication of an event creates one notification per non-declined member profile; editing or republishing does not resend. Drafts never send. Messages and decisions create private notifications. Emails contain a website link, without the private message text.

A persistent mail queue is processed by `scripts/mail-worker.mjs` every 15 seconds and after relevant actions. Duplicate claims are guarded in SQLite. Uncertain deliveries are not automatically retried. Admin → Email setup shows delivery counts and can retry definite failures after correcting setup. Google sending quotas apply.

**Required relay update:** replace Code.gs in the existing notifications Gmail project with `scripts/google-mail.gs` (also downloadable from Admin → Email setup), save and deploy a new version of the existing Web app deployment. Keep SITE_MAIL_TOKEN and the existing webhook URL. The relay must support `kind: notification`. Pending notifications will show Needs script update until this is done. After updating, use Send queued notifications.

COMMITTEE_INBOX_EMAIL optionally changes the administrative notification destination; defaults to rhulua.notifications@gmail.com.

Validation: `npm run check`, `npm test`, `npm run build`, and `node tests/community.integration.mjs` (local fake mail relay; no real emails).
