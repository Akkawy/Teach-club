-- Videos (links to YouTube, TikTok, Instagram, Vimeo, Google Drive), "I'd join a lesson", comments,
-- and in-app notifications.

CREATE TABLE videos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id    INTEGER REFERENCES clubs(id) ON DELETE CASCADE,       -- NULL = shared with followers only
  visibility TEXT    NOT NULL DEFAULT 'club',                       -- club | followers
  url        TEXT    NOT NULL,                                      -- the link as shared
  provider   TEXT    NOT NULL,                                      -- youtube | vimeo | tiktok | instagram | drive | link
  embed_id   TEXT    NOT NULL DEFAULT '',                           -- the video's id on that site
  vertical   INTEGER NOT NULL DEFAULT 0,                            -- 1 = tall video (Shorts, TikTok, Reels)
  title      TEXT    NOT NULL,
  caption    TEXT    NOT NULL DEFAULT '',
  topic      TEXT    NOT NULL DEFAULT '',
  thumb      TEXT    NOT NULL DEFAULT '',                           -- thumbnail picture link, when the site offers one
  hidden     INTEGER NOT NULL DEFAULT 0,                            -- 1 = hidden after 3 reports, until reviewed
  lesson_id  INTEGER REFERENCES lessons(id) ON DELETE SET NULL,     -- set when it's turned into a lesson
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX videos_club ON videos(club_id, created_at);
CREATE INDEX videos_user ON videos(user_id, created_at);

CREATE TABLE video_interest (
  video_id   INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (video_id, user_id)
);

CREATE TABLE video_comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id   INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT    NOT NULL,
  hidden     INTEGER NOT NULL DEFAULT 0,                            -- 1 = hidden after 3 reports, until reviewed
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX video_comments_video ON video_comments(video_id, created_at);

-- Reports can now be about a video or a comment, and needn't belong to a club
-- (follower-only videos go straight to the site owner). SQLite can't relax NOT NULL, so rebuild.
CREATE TABLE reports_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id     INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lesson_id   INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  video_id    INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  comment_id  INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
  reason      TEXT    NOT NULL,
  details     TEXT    NOT NULL DEFAULT '',
  resolved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO reports_new (id, club_id, reporter_id, lesson_id, user_id, reason, details, resolved, created_at)
  SELECT id, club_id, reporter_id, lesson_id, user_id, reason, details, resolved, created_at FROM reports;
DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;
CREATE INDEX reports_club ON reports(club_id, resolved);

CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- who gets it
  type       TEXT    NOT NULL,
  actor_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,             -- who did it
  lesson_id  INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  video_id   INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  data       TEXT    NOT NULL DEFAULT '{}',                               -- e.g. a cancelled lesson's title
  read       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL                                             -- milliseconds since 1970
);
CREATE INDEX notifications_user ON notifications(user_id, created_at);

-- Kinds of notification the member switched off: people | my_lessons | joined_lessons | videos | wishes
ALTER TABLE users ADD COLUMN notify_off TEXT NOT NULL DEFAULT '[]';
