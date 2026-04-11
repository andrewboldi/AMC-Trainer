#!/usr/bin/env python3
"""
Migrate AMC problems from flat HTML files to D1 via the ingest API.

Usage:
    python migrate.py --problems-dir ../amcProblems --api-url http://localhost:8787 --api-key YOUR_KEY

Reads from problems/, solutions/, answers/ directories, parses filenames
into structured metadata, and POSTs batches to the ingest endpoint.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# Filename pattern: {YEAR}_{EXAM_NAME}_Problems_Problem_{NUM}.html
FILENAME_RE = re.compile(
    r"^(\d{4})_(.+)_Problems_Problem_(\d+)\.html$"
)

# Map exam_name to exam_base (for level filtering)
EXAM_BASE_MAP: dict[str, str] = {
    "AJHSME": "AJHSME",
    "AMC_8": "AMC_8",
    "AMC_10": "AMC_10",
    "AMC_10A": "AMC_10",
    "AMC_10B": "AMC_10",
    "AMC_12": "AMC_12",
    "AMC_12A": "AMC_12",
    "AMC_12B": "AMC_12",
    "AIME": "AIME",
    "AIME_I": "AIME",
    "AIME_II": "AIME",
}

# Extract variant from exam_name
VARIANT_MAP: dict[str, str | None] = {
    "AMC_10A": "A",
    "AMC_10B": "B",
    "AMC_12A": "A",
    "AMC_12B": "B",
    "AIME_I": "I",
    "AIME_II": "II",
}


def parse_filename(filename: str) -> dict | None:
    """Parse a problem filename into structured metadata."""
    match = FILENAME_RE.match(filename)
    if not match:
        return None

    year = int(match.group(1))
    exam_name = match.group(2)
    problem_num = int(match.group(3))

    exam_base = EXAM_BASE_MAP.get(exam_name)
    if not exam_base:
        print(f"  WARNING: Unknown exam type '{exam_name}' in {filename}", file=sys.stderr)
        return None

    return {
        "year": year,
        "exam_name": exam_name,
        "exam_base": exam_base,
        "variant": VARIANT_MAP.get(exam_name),
        "problem_num": problem_num,
    }


def read_file(path: Path) -> str:
    """Read a file and return its contents."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def post_batch(api_url: str, api_key: str, batch: list[dict]) -> int:
    """POST a batch of problems to the ingest endpoint. Returns count ingested."""
    url = f"{api_url}/api/problems/ingest"
    data = json.dumps(batch).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-API-Key", api_key)

    try:
        with urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("inserted", 0)
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  ERROR: HTTP {e.code} — {body}", file=sys.stderr)
        return 0


def migrate(problems_dir: Path, api_url: str, api_key: str, batch_size: int = 50):
    """Run the migration from local files to D1."""
    problems_path = problems_dir / "problems"
    solutions_path = problems_dir / "solutions"
    answers_path = problems_dir / "answers"

    for d in [problems_path, solutions_path, answers_path]:
        if not d.exists():
            print(f"ERROR: Directory not found: {d}", file=sys.stderr)
            sys.exit(1)

    filenames = sorted(f for f in os.listdir(problems_path) if f.endswith(".html"))
    print(f"Found {len(filenames)} problem files")

    batch: list[dict] = []
    total_ingested = 0
    skipped = 0

    for i, filename in enumerate(filenames):
        meta = parse_filename(filename)
        if not meta:
            skipped += 1
            continue

        problem_file = problems_path / filename
        solution_file = solutions_path / filename
        answer_file = answers_path / filename

        if not solution_file.exists() or not answer_file.exists():
            print(f"  SKIP: Missing solution or answer for {filename}", file=sys.stderr)
            skipped += 1
            continue

        problem_html = read_file(problem_file)
        solution_html = read_file(solution_file)
        answer = read_file(answer_file).strip()

        batch.append({
            **meta,
            "subject": None,
            "problem_html": problem_html,
            "solution_html": solution_html,
            "answer": answer,
        })

        if len(batch) >= batch_size:
            count = post_batch(api_url, api_key, batch)
            total_ingested += count
            print(f"  Batch {i // batch_size + 1}: {count} ingested ({i + 1}/{len(filenames)})")
            batch = []

    # Final batch
    if batch:
        count = post_batch(api_url, api_key, batch)
        total_ingested += count
        print(f"  Final batch: {count} ingested")

    print(f"\nDone: {total_ingested} ingested, {skipped} skipped out of {len(filenames)} files")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate AMC problems to D1")
    parser.add_argument("--problems-dir", type=Path, required=True, help="Path to amcProblems repo")
    parser.add_argument("--api-url", default="http://localhost:8787", help="Worker API URL")
    parser.add_argument("--api-key", required=True, help="Ingest API key")
    parser.add_argument("--batch-size", type=int, default=50, help="Problems per batch")
    args = parser.parse_args()

    migrate(args.problems_dir, args.api_url, args.api_key, args.batch_size)
