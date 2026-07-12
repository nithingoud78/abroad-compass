-- Add constraints for username: unique, lowercase, valid characters (a-z, 0-9, ., _)
-- Clean existing data first
UPDATE profiles SET username = NULL WHERE username = '';
UPDATE profiles SET username = lower(username) WHERE username IS NOT NULL;

-- Since usernames might collide when lowercased or not match the pattern, we'll try to apply constraints.
ALTER TABLE profiles ADD CONSTRAINT username_unique UNIQUE (username);

ALTER TABLE profiles ADD CONSTRAINT username_valid_chars 
  CHECK (username IS NULL OR username ~ '^[a-z0-9._]+$');

ALTER TABLE profiles ADD CONSTRAINT username_min_length
  CHECK (username IS NULL OR length(username) >= 3);
