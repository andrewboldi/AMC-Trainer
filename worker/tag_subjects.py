#!/usr/bin/env python3
"""
Tag problems in D1 with subjects based on amcSubjects directory structure.

The amcSubjects repo has problems sorted into directories:
  Alg/  → algebra
  CP/   → combinatorics
  Geo/  → geometry
  NT/   → number_theory

Each contains subdirectories (AMC 8/, AMC 10/, AMC 12/, AIME/) with HTML files
whose filenames match the D1 problem filenames.

Usage:
    python tag_subjects.py --subjects-dir ~/amc/amcSubjects --api-url https://wandering-sky-a896.cbracketdash.workers.dev --api-key YOUR_KEY
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUBJECT_MAP = {
    'Alg': 'algebra',
    'CP': 'combinatorics',
    'Geo': 'geometry',
    'NT': 'number_theory',
}

# Same regex as migrate.py
FILENAME_RE = re.compile(r"^(\d{4})_(.+)_Problems_Problem_(\d+)\.html$")

EXAM_BASE_MAP = {
    "AJHSME": "AJHSME", "AMC_8": "AMC_8",
    "AMC_10": "AMC_10", "AMC_10A": "AMC_10", "AMC_10B": "AMC_10",
    "AMC_12": "AMC_12", "AMC_12A": "AMC_12", "AMC_12B": "AMC_12",
    "AIME": "AIME", "AIME_I": "AIME", "AIME_II": "AIME",
}

VARIANT_MAP = {
    "AMC_10A": "A", "AMC_10B": "B",
    "AMC_12A": "A", "AMC_12B": "B",
    "AIME_I": "I", "AIME_II": "II",
}


def collect_subject_tags(subjects_dir: Path) -> dict[str, str]:
    """Walk the amcSubjects directories and build a filename → subject map."""
    tags: dict[str, str] = {}

    for dir_name, subject in SUBJECT_MAP.items():
        subject_path = subjects_dir / dir_name
        if not subject_path.exists():
            print(f"WARNING: {subject_path} not found", file=sys.stderr)
            continue

        for root, _, files in os.walk(subject_path):
            for f in files:
                if f.endswith('.html'):
                    tags[f] = subject

    return tags


def post_batch(api_url: str, api_key: str, batch: list[dict]) -> int:
    """POST a batch to the ingest endpoint."""
    url = f"{api_url}/api/problems/ingest"
    data = json.dumps(batch).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-API-Key", api_key)
    req.add_header("User-Agent", "AMC-Trainer-SubjectTagger/1.0")

    try:
        with urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("inserted", 0)
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  ERROR: HTTP {e.code} — {body}", file=sys.stderr)
        return 0


def tag_subjects(subjects_dir: Path, problems_dir: Path, api_url: str, api_key: str, batch_size: int = 50):
    """Update D1 problems with subject tags."""
    tags = collect_subject_tags(subjects_dir)
    print(f"Found {len(tags)} subject tags")

    # We need to re-ingest with the subject field set.
    # Read from the problems dir to get the full HTML content.
    problems_path = problems_dir / "problems"
    solutions_path = problems_dir / "solutions"
    answers_path = problems_dir / "answers"

    batch: list[dict] = []
    total = 0
    tagged = 0

    filenames = sorted(f for f in tags.keys())

    for i, filename in enumerate(filenames):
        match = FILENAME_RE.match(filename)
        if not match:
            continue

        year = int(match.group(1))
        exam_name = match.group(2)
        problem_num = int(match.group(3))
        exam_base = EXAM_BASE_MAP.get(exam_name)
        if not exam_base:
            continue

        problem_file = problems_path / filename
        solution_file = solutions_path / filename
        answer_file = answers_path / filename

        if not problem_file.exists() or not solution_file.exists() or not answer_file.exists():
            continue

        with open(problem_file, "r", encoding="utf-8", errors="replace") as f:
            problem_html = f.read()
        with open(solution_file, "r", encoding="utf-8", errors="replace") as f:
            solution_html = f.read()
        with open(answer_file, "r", encoding="utf-8", errors="replace") as f:
            answer = f.read().strip()

        batch.append({
            "year": year,
            "exam_name": exam_name,
            "exam_base": exam_base,
            "variant": VARIANT_MAP.get(exam_name),
            "problem_num": problem_num,
            "subject": tags[filename],
            "problem_html": problem_html,
            "solution_html": solution_html,
            "answer": answer,
        })

        if len(batch) >= batch_size:
            count = post_batch(api_url, api_key, batch)
            total += count
            tagged += sum(1 for p in batch if p["subject"])
            print(f"  Batch {i // batch_size + 1}: {count} updated ({i + 1}/{len(filenames)})")
            batch = []

    if batch:
        count = post_batch(api_url, api_key, batch)
        total += count
        tagged += sum(1 for p in batch if p["subject"])
        print(f"  Final batch: {count} updated")

    print(f"\nDone: {total} problems updated with subjects ({tagged} tagged)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tag D1 problems with subjects")
    parser.add_argument("--subjects-dir", type=Path, required=True, help="Path to amcSubjects repo")
    parser.add_argument("--problems-dir", type=Path, required=True, help="Path to amcProblems repo")
    parser.add_argument("--api-url", default="https://wandering-sky-a896.cbracketdash.workers.dev", help="Worker API URL")
    parser.add_argument("--api-key", required=True, help="Ingest API key")
    parser.add_argument("--batch-size", type=int, default=50, help="Problems per batch")
    args = parser.parse_args()

    tag_subjects(args.subjects_dir, args.problems_dir, args.api_url, args.api_key, args.batch_size)
