CREATE TABLE IF NOT EXISTS user_data (
  uid TEXT PRIMARY KEY,
  display_name TEXT,
  settings_json TEXT,
  stats_json TEXT,
  missed_ids_json TEXT,
  bookmarks_json TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
