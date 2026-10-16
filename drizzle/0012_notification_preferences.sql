CREATE TABLE notification_preferences(email TEXT PRIMARY KEY COLLATE NOCASE,chat_email INTEGER NOT NULL DEFAULT 1,society_email INTEGER NOT NULL DEFAULT 1);
ALTER TABLE notifications ADD COLUMN category TEXT NOT NULL DEFAULT 'updates';
ALTER TABLE mail_queue ADD COLUMN category TEXT NOT NULL DEFAULT 'updates';
UPDATE notifications SET category=CASE WHEN href LIKE '/chat%' THEN 'messages' WHEN id IN (SELECT id FROM mail_queue WHERE registration_id IS NOT NULL OR id LIKE 'event:%') THEN 'events' WHEN lower(title) LIKE '%membership%' OR lower(title) LIKE '%profile%' THEN 'account' ELSE 'updates' END;
UPDATE mail_queue SET category=CASE WHEN registration_id IS NOT NULL THEN 'events' WHEN newsletter_email IS NOT NULL THEN 'newsletter' WHEN href LIKE '/chat%' THEN 'messages' WHEN href LIKE '/newsletter?confirm=%' THEN 'account' WHEN lower(title) LIKE '%membership%' OR lower(title) LIKE '%profile%' THEN 'account' ELSE 'updates' END;
