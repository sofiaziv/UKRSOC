ALTER TABLE registrations ADD COLUMN requested_guest_count INTEGER CHECK(requested_guest_count IS NULL OR (requested_guest_count >= 0 AND requested_guest_count <= 20));
