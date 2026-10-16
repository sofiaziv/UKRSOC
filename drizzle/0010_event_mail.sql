ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE mail_queue ADD COLUMN event_payload TEXT;
ALTER TABLE mail_queue ADD COLUMN registration_id TEXT;
ALTER TABLE mail_queue ADD COLUMN event_kind TEXT;
UPDATE mail_queue SET status='suppressed' WHERE id LIKE 'event:%' AND status IN ('pending','failed','needs_script_update');
