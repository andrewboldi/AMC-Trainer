-- Single-row cache of the filterable problem columns.
--
-- Selecting a random problem used to run `ORDER BY RANDOM()`, which makes SQLite
-- scan every matching row into a temp B-tree; D1 bills rows *scanned*, so one
-- problem served cost ~4.6k row reads. The worker now filters an in-memory index
-- instead. Keeping that index in one row means a cold isolate rebuilds its cache
-- for a single row read rather than a full table scan -- which matters because
-- the Cache API is only functional on custom domains, not workers.dev.
CREATE TABLE IF NOT EXISTS problem_index (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
