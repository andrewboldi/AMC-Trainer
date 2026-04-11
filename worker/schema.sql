CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  exam_name TEXT NOT NULL,
  exam_base TEXT NOT NULL,
  variant TEXT,
  problem_num INTEGER NOT NULL,
  subject TEXT,
  difficulty INTEGER NOT NULL,
  problem_html TEXT NOT NULL,
  solution_html TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(year, exam_name, problem_num)
);

CREATE INDEX IF NOT EXISTS idx_filter ON problems(exam_base, subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_exam ON problems(exam_name, year);
