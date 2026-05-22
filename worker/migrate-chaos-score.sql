-- Existing D1 databases created before 2026-05-22 used
-- CHECK (chaos <= 100), which rejects the current cumulative CHAOS score.
-- SQLite cannot alter CHECK constraints in place, so rebuild the table.

DROP TABLE IF EXISTS leaderboard_new;

CREATE TABLE leaderboard_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10000000),
  chaos INTEGER NOT NULL DEFAULT 0 CHECK (chaos >= 0 AND chaos <= 10000000),
  rats INTEGER NOT NULL DEFAULT 0 CHECK (rats >= 0 AND rats <= 1000000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO leaderboard_new (id, name, score, chaos, rats, created_at)
SELECT
  id,
  name,
  score,
  CASE
    WHEN chaos < 0 THEN 0
    WHEN chaos > 10000000 THEN 10000000
    ELSE chaos
  END,
  rats,
  created_at
FROM leaderboard;

DROP TABLE leaderboard;
ALTER TABLE leaderboard_new RENAME TO leaderboard;

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON leaderboard (score DESC, chaos DESC, created_at ASC);
