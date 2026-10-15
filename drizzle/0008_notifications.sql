CREATE TABLE IF NOT EXISTS chat_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS chat_user_time ON chat_entries(user_id,created);
CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, email TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, href TEXT NOT NULL, created TEXT NOT NULL, read_at TEXT);
CREATE INDEX IF NOT EXISTS notification_owner ON notifications(email,created);
CREATE TABLE IF NOT EXISTS mail_queue (id TEXT PRIMARY KEY, email TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, href TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS event_announcements (event_id TEXT PRIMARY KEY);
INSERT OR IGNORE INTO event_announcements(event_id) SELECT id FROM events WHERE publication='published';
INSERT OR IGNORE INTO chat_entries SELECT id||':member',user_id,email,'member',body,created FROM messages;
INSERT OR IGNORE INTO chat_entries SELECT id||':committee',user_id,email,'committee',reply,created FROM messages WHERE reply<>'';
