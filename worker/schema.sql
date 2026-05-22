CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10000000),
  chaos INTEGER NOT NULL DEFAULT 0 CHECK (chaos >= 0 AND chaos <= 10000000),
  rats INTEGER NOT NULL DEFAULT 0 CHECK (rats >= 0 AND rats <= 1000000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON leaderboard (score DESC, chaos DESC, created_at ASC);
