-- Teach Club database: members, their log-in sessions, lessons, RSVPs and thank-you notes.

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  bio           TEXT    NOT NULL DEFAULT '',
  photo         TEXT,                          -- small JPEG as a data: URL, or NULL
  photo_v       INTEGER NOT NULL DEFAULT 0,    -- bumps on every change so browsers re-download it
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token_hash TEXT    PRIMARY KEY,              -- SHA-256 of the cookie value, never the cookie itself
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL                  -- milliseconds since 1970
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE lessons (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  pitch      TEXT    NOT NULL DEFAULT '',
  format     TEXT    NOT NULL,                 -- talk | demo | disc | show | read
  date       TEXT    NOT NULL,                 -- YYYY-MM-DD, the host's local day
  time       TEXT    NOT NULL,                 -- HH:MM, 24-hour
  length     INTEGER NOT NULL,                 -- minutes, 5 to 30
  answers    TEXT    NOT NULL DEFAULT '[]',    -- JSON: the host's answers to the planning prompts
  plan       TEXT    NOT NULL DEFAULT '[]',    -- JSON: [{ name, hint, desc, min }]
  class_link TEXT    NOT NULL DEFAULT '',
  surprise   INTEGER NOT NULL DEFAULT 0,       -- 1 = hide the plan from everyone but the host
  prep       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX lessons_date ON lessons(date);
CREATE INDEX lessons_host ON lessons(host_id);

CREATE TABLE rsvps (
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lesson_id, user_id)
);
CREATE INDEX rsvps_user ON rsvps(user_id);

CREATE TABLE notes (
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reactions  TEXT    NOT NULL DEFAULT '[]',    -- JSON list of quick reactions
  body       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lesson_id, user_id)
);
