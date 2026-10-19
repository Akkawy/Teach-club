-- Private clubs, time zones, video rooms, wishlist, questions, lesson photos, reports and reminders.

-- Clubs: separate groups, each with its own calendar, wishlist and invite link.
CREATE TABLE clubs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  invite_code TEXT    NOT NULL UNIQUE,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE club_members (
  club_id   INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT    NOT NULL DEFAULT 'member',        -- admin | member
  joined_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (club_id, user_id)
);
CREATE INDEX club_members_user ON club_members(user_id);

ALTER TABLE users ADD COLUMN current_club_id INTEGER;
ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN tz TEXT NOT NULL DEFAULT 'Asia/Riyadh';
ALTER TABLE users ADD COLUMN email_reminders INTEGER NOT NULL DEFAULT 1;

ALTER TABLE lessons ADD COLUMN club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD COLUMN tz TEXT NOT NULL DEFAULT 'Asia/Riyadh';     -- the host's time zone
ALTER TABLE lessons ADD COLUMN starts_at INTEGER NOT NULL DEFAULT 0;       -- UTC milliseconds
ALTER TABLE lessons ADD COLUMN room TEXT NOT NULL DEFAULT '';              -- free Jitsi room name
ALTER TABLE lessons ADD COLUMN parent_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN recap TEXT NOT NULL DEFAULT '';
CREATE INDEX lessons_club_start ON lessons(club_id, starts_at);

-- Existing lessons were all planned in Saudi time (UTC+3, no daylight saving).
UPDATE lessons SET starts_at = (CAST(strftime('%s', date || ' ' || time) AS INTEGER) - 3 * 3600) * 1000;
UPDATE lessons SET room = 'TeachClub-' || lower(hex(randomblob(6))) WHERE room = '';

-- Everyone who joined before clubs existed goes into one club; the first member is its admin.
INSERT INTO clubs (name, invite_code, created_by)
  SELECT 'Teach Club', lower(hex(randomblob(5))), (SELECT MIN(id) FROM users)
  WHERE EXISTS (SELECT 1 FROM users);
INSERT INTO club_members (club_id, user_id, role)
  SELECT (SELECT MIN(id) FROM clubs), u.id, CASE WHEN u.id = (SELECT MIN(id) FROM users) THEN 'admin' ELSE 'member' END
  FROM users u WHERE EXISTS (SELECT 1 FROM clubs);
UPDATE users SET current_club_id = (SELECT MIN(id) FROM clubs);
UPDATE lessons SET club_id = (SELECT MIN(id) FROM clubs);

-- "Teach me…" wishlist.
CREATE TABLE wishes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id    INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  details    TEXT    NOT NULL DEFAULT '',
  lesson_id  INTEGER REFERENCES lessons(id) ON DELETE SET NULL,   -- set once someone teaches it
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX wishes_club ON wishes(club_id);

CREATE TABLE wish_votes (
  wish_id INTEGER NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (wish_id, user_id)
);

-- Questions friends ask before a lesson.
CREATE TABLE questions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT    NOT NULL,
  answer     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX questions_lesson ON questions(lesson_id);

-- Photos the host adds after a lesson (small JPEGs as data: URLs, max 4 per lesson).
CREATE TABLE lesson_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  data       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX lesson_photos_lesson ON lesson_photos(lesson_id);

-- Reports for club admins.
CREATE TABLE reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id     INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lesson_id   INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT    NOT NULL,
  details     TEXT    NOT NULL DEFAULT '',
  resolved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX reports_club ON reports(club_id, resolved);

-- Which reminder emails have gone out, so nobody gets the same one twice.
CREATE TABLE sent_reminders (
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind      TEXT    NOT NULL,                    -- day | soon
  sent_at   INTEGER NOT NULL,
  PRIMARY KEY (lesson_id, user_id, kind)
);
CREATE INDEX sent_reminders_time ON sent_reminders(sent_at);
