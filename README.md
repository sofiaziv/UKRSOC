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
