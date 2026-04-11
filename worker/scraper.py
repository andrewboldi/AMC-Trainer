#!/usr/bin/env python3
"""
Scrape AMC/AIME problems from AoPS wiki and ingest into D1.

Fetches problems, solutions, and answers from artofproblemsolving.com,
optionally tags subjects from a local amcSubjects directory, and POSTs
everything to the worker's ingest API.

Usage:
    # Full scrape + ingest
    uv run python scraper.py --api-key YOUR_KEY

    # Scrape only 2025 problems
    uv run python scraper.py --api-key YOUR_KEY --year 2025

    # Also tag subjects
    uv run python scraper.py --api-key YOUR_KEY --subjects-dir ~/amc/amcSubjects

    # Save files locally as backup
    uv run python scraper.py --api-key YOUR_KEY --local-backup ./backup

Dependencies: aiohttp, tqdm (install via: uv add aiohttp tqdm)
"""

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import aiohttp
import tqdm

AOPS_WIKI = "https://artofproblemsolving.com/wiki/index.php"
PROXY_BASE = "https://wandering-sky-a896.cbracketdash.workers.dev/?"
DEFAULT_API_URL = "https://wandering-sky-a896.cbracketdash.workers.dev"
MAX_CONCURRENT = 20

EXAMS = [
    ("AJHSME",  range(1985, 1999), 25),
    ("AMC_8",   range(1999, 2027), 25),
    ("AMC_10",  range(2000, 2002), 25),
    ("AMC_10A", range(2002, 2026), 25),
    ("AMC_10B", range(2002, 2026), 25),
    ("AMC_12",  range(2000, 2002), 25),
    ("AMC_12A", range(2002, 2026), 25),
    ("AMC_12B", range(2002, 2026), 25),
    ("AIME",    range(1983, 2000), 15),
    ("AIME_I",  range(2000, 2026), 15),
    ("AIME_II", range(2000, 2026), 15),
]

AIME_NAMES = {"AIME", "AIME_I", "AIME_II"}

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

SUBJECT_DIR_MAP = {
    "Alg": "algebra",
    "CP": "combinatorics",
    "Geo": "geometry",
    "NT": "number_theory",
}


# ── HTML processing ──────────────────────────────────────────────

def process_html(html: str) -> str:
    html = html.replace("'", '"')
    html = html.replace('<a href="', f'<a href="{PROXY_BASE}https://www.artofproblemsolving.com')
    html = html.replace("//latex.artofproblemsolving.com", f"{PROXY_BASE}https://latex.artofproblemsolving.com")
    html = html.replace("</p><p><img src=", "<br></br></p><p><img src=")
    html = html.replace("<a href=", "<a target='_blank' href=")
    html = html.replace("<p>", '<p class="text">')
    return html


def extract_problem_and_solution(html: str) -> tuple[str, str]:
    if 'id="Problem' in html:
        data = html.split('<h2><span class="mw-headline" id="Problem')[1]
        prob = data.split("<h2>")[0]
        prob = prob.split("</span></h2>")[1]
    else:
        m = re.search(r'mw-parser-output"[^>]*>(.*?)<h2>', html, re.DOTALL)
        if not m or not m.group(1).strip():
            raise ValueError("no problem content found")
        prob = m.group(1).strip()

    sol_start = re.search(r'<h2><span[^>]*id="Solution', html)
    if not sol_start:
        raise ValueError("no solution section found")

    sol_text = html[sol_start.start():]

    if 'id="See_' in sol_text:
        sol_text = sol_text.split('<h2><span class="mw-headline" id="See_')[0]
    else:
        for marker in ['<!-- NewPP', '<div class="catlinks']:
            idx = sol_text.find(marker)
            if idx > 0:
                sol_text = sol_text[:idx]
                break

    sol_text = sol_text.replace(
        '><span class="mw-headline" ',
        ' class="text"><span class="mw-headline" ',
    )

    return prob, sol_text


def parse_answer_key(text: str) -> list:
    answers = re.findall(r"<li>([^<]+)</li>", text)
    if not answers:
        raise ValueError("no answer items found on page")
    return [None] + [a.strip() for a in answers]


def extract_answer(answer_list: list, prob_num: int, exam_name: str) -> str:
    raw = answer_list[prob_num]
    if exam_name in AIME_NAMES:
        return raw[:3].strip()
    return raw[0]


# ── Subject tagging ──────────────────────────────────────────────

def load_subject_tags(subjects_dir: Path) -> dict[str, str]:
    """Build a filename → subject map from the amcSubjects directory."""
    tags: dict[str, str] = {}
    for dir_name, subject in SUBJECT_DIR_MAP.items():
        subject_path = subjects_dir / dir_name
        if not subject_path.exists():
            continue
        for root, _, files in os.walk(subject_path):
            for f in files:
                if f.endswith(".html"):
                    tags[f] = subject
    return tags


# ── D1 ingestion ─────────────────────────────────────────────────

def post_batch(api_url: str, api_key: str, batch: list[dict]) -> int:
    url = f"{api_url}/api/problems/ingest"
    data = json.dumps(batch).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-API-Key", api_key)
    req.add_header("User-Agent", "AMC-Trainer-Scraper/2.0")

    try:
        with urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("inserted", 0)
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        tqdm.tqdm.write(f"  INGEST ERROR: HTTP {e.code} — {body}")
        return 0


# ── Scraping ─────────────────────────────────────────────────────

async def fetch(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> str:
    async with sem:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            resp.raise_for_status()
            return await resp.text()


async def scrape_problem(
    session, sem, exam_name, year, prob_num, answer_key, pbar,
    subject_tags, local_backup,
):
    """Scrape a single problem. Returns a dict for ingestion or None on failure."""
    fname = f"{year}_{exam_name}_Problems_Problem_{prob_num}.html"
    try:
        url = f"{AOPS_WIKI}/{year}_{exam_name}_Problems/Problem_{prob_num}"
        raw_html = await fetch(session, url, sem)
        processed = process_html(raw_html)
        prob, sol = extract_problem_and_solution(processed)
        ans = extract_answer(answer_key, prob_num, exam_name)

        # Save local backup if requested
        if local_backup:
            for subdir, content in [("problems", prob), ("solutions", sol), ("answers", ans)]:
                path = local_backup / subdir
                path.mkdir(parents=True, exist_ok=True)
                (path / fname).write_text(content, encoding="utf-8")

        return {
            "year": year,
            "exam_name": exam_name,
            "exam_base": EXAM_BASE_MAP[exam_name],
            "variant": VARIANT_MAP.get(exam_name),
            "problem_num": prob_num,
            "subject": subject_tags.get(fname),
            "problem_html": prob,
            "solution_html": sol,
            "answer": ans,
        }
    except Exception as e:
        tqdm.tqdm.write(f"  Failed: {year} {exam_name} #{prob_num}: {e}")
        return None
    finally:
        pbar.update(1)


async def scrape(args):
    subject_tags = {}
    if args.subjects_dir:
        subject_tags = load_subject_tags(args.subjects_dir)
        print(f"Loaded {len(subject_tags)} subject tags")

    local_backup = Path(args.local_backup) if args.local_backup else None

    # Filter exams by year if specified
    exams = EXAMS
    if args.year:
        exams = [(name, [y for y in years if y == args.year], n) for name, years, n in EXAMS]
        exams = [(name, years, n) for name, years, n in exams if years]

    # Count total problems
    total = sum(len(years) * n for _, years, n in exams)
    print(f"{total} problems to fetch")

    sem = asyncio.Semaphore(MAX_CONCURRENT)
    pbar = tqdm.tqdm(total=total, desc="Scraping")

    # Group by (exam_name, year)
    grouped: dict[tuple[str, int], list[int]] = {}
    for exam_name, years, num_problems in exams:
        for year in years:
            for p in range(1, num_problems + 1):
                grouped.setdefault((exam_name, year), []).append(p)

    ingestion_batch: list[dict] = []
    total_ingested = 0
    batch_size = 50

    async with aiohttp.ClientSession() as session:
        for (exam_name, year), prob_nums in grouped.items():
            # Fetch answer key
            try:
                ak_url = f"{AOPS_WIKI}?title={year}_{exam_name}_Answer_Key"
                ak_text = await fetch(session, ak_url, sem)
                answer_key = parse_answer_key(ak_text)
            except Exception as e:
                tqdm.tqdm.write(f"  Skipping {year} {exam_name} answer key: {e}")
                pbar.update(len(prob_nums))
                continue

            coros = [
                scrape_problem(session, sem, exam_name, year, p, answer_key, pbar,
                               subject_tags, local_backup)
                for p in prob_nums
            ]
            results = await asyncio.gather(*coros)

            for r in results:
                if r is None:
                    continue
                ingestion_batch.append(r)
                if len(ingestion_batch) >= batch_size:
                    count = post_batch(args.api_url, args.api_key, ingestion_batch)
                    total_ingested += count
                    ingestion_batch = []

    # Final batch
    if ingestion_batch:
        count = post_batch(args.api_url, args.api_key, ingestion_batch)
        total_ingested += count

    pbar.close()
    print(f"Done! {total_ingested} problems ingested into D1")


def main():
    parser = argparse.ArgumentParser(description="Scrape AMC/AIME problems and ingest into D1")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Worker API URL")
    parser.add_argument("--api-key", required=True, help="Ingest API key")
    parser.add_argument("--subjects-dir", type=Path, help="Path to amcSubjects for tagging")
    parser.add_argument("--local-backup", help="Also save files locally to this directory")
    parser.add_argument("--year", type=int, help="Only scrape a specific year")
    args = parser.parse_args()

    asyncio.run(scrape(args))


if __name__ == "__main__":
    main()
