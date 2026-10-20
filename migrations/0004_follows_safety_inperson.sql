-- Safety tools, in-person lessons, following people, topics, archiving, material links and teacher notes.

ALTER TABLE users ADD COLUMN agreed_at TEXT;                                  -- accepted the community rules (18+)
ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;               -- suspended by the site owner
ALTER TABLE users ADD COLUMN approve_followers INTEGER NOT NULL DEFAULT 0;    -- 1 = follow requests need approval
ALTER TABLE users ADD COLUMN interests TEXT NOT NULL DEFAULT '[]';            -- topic keys, for "For you"

ALTER TABLE lessons ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;      -- 1 = hidden after 3 reports, until reviewed
ALTER TABLE lessons ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;    -- 1 = only the teacher still sees it
ALTER TABLE lessons ADD COLUMN visibility TEXT NOT NULL DEFAULT 'club'; -- club | followers (club + people who follow the teacher)
ALTER TABLE lessons ADD COLUMN mode TEXT NOT NULL DEFAULT 'online';    -- online | in_person | both
ALTER TABLE lessons ADD COLUMN place TEXT NOT NULL DEFAULT '';         -- exact place, shown only to people who said "I'm in"
ALTER TABLE lessons ADD COLUMN area TEXT NOT NULL DEFAULT '';          -- neighbourhood/city, shown to everyone who can see the lesson
ALTER TABLE lessons ADD COLUMN map_link TEXT NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN seats INTEGER NOT NULL DEFAULT 0;       -- 0 = no limit
ALTER TABLE lessons ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';        -- up to 3 topic keys
ALTER TABLE lessons ADD COLUMN materials TEXT NOT NULL DEFAULT '[]';   -- [{ url, title }] links to slides, docs, etc.
ALTER TABLE lessons ADD COLUMN notes TEXT NOT NULL DEFAULT '[]';       -- the teacher's private notes, one per plan part

ALTER TABLE rsvps ADD COLUMN waitlist INTEGER NOT NULL DEFAULT 0;      -- 1 = on the waitlist (lesson full)

CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT    NOT NULL DEFAULT 'accepted',   -- accepted | pending
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX follows_followee ON follows(followee_id, status);

CREATE TABLE blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX blocks_blocked ON blocks(blocked_id);

-- Simple counters that stop one person or bot from doing too much too fast.
CREATE TABLE rate_limits (
  key    TEXT    NOT NULL,
  bucket INTEGER NOT NULL,   -- start of the time window, in seconds
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);

CREATE INDEX lessons_host_visibility ON lessons(host_id, visibility, starts_at);
