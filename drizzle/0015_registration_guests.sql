ALTER TABLE registrations ADD COLUMN guest_count INTEGER NOT NULL DEFAULT 0 CHECK(guest_count >= 0 AND guest_count <= 20);
