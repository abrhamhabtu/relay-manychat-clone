-- Growth: a daily follower count for the account, and each contact's follow status as Relay last saw it.
CREATE TABLE IF NOT EXISTS follower_snapshots (
  day INTEGER PRIMARY KEY,          -- UTC day number (ms / 86400000)
  followers INTEGER NOT NULL,
  follows INTEGER,                  -- accounts the page follows
  media INTEGER,                    -- posts on the page
  at INTEGER NOT NULL               -- ms, when it was read
);
ALTER TABLE leads ADD COLUMN follows INTEGER;           -- 1 / 0: is_user_follow_business when last checked, NULL = never
ALTER TABLE leads ADD COLUMN follow_first INTEGER;      -- what the first check said: 1 = already a follower before Relay
ALTER TABLE leads ADD COLUMN follows_at INTEGER;        -- ms, first check that saw them following after a 0
ALTER TABLE leads ADD COLUMN follow_checked_at INTEGER; -- ms
