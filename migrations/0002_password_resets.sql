-- One-time links for "Forgot it?". Only a hash of each link's token is stored.

CREATE TABLE password_resets (
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,                 -- milliseconds since 1970
  created_at INTEGER NOT NULL
);
CREATE INDEX password_resets_user ON password_resets(user_id);
