UPDATE chat_entries SET created=strftime('%Y-%m-%dT%H:%M:%fZ',created,'+1 second') WHERE sender='committee' AND id LIKE '%:committee';
