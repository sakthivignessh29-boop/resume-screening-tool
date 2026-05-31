import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get('DATABASE_URL')
if not DB_PATH:
    if os.environ.get('VERCEL'):
        DB_PATH = '/tmp/resume_tool.db'
    else:
        DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'resume_tool.db')

# If DATABASE_URL starts with sqlite:///, strip it
if DB_PATH and DB_PATH.startswith('sqlite:///'):
    DB_PATH = DB_PATH.replace('sqlite:///', '')

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS job_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            keywords TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            job_profile_id INTEGER,
            filename TEXT NOT NULL,
            candidate_name TEXT,
            total_score REAL,
            keyword_score REAL,
            experience_score REAL,
            education_score REAL,
            years_experience REAL,
            education_level TEXT,
            matched_keywords TEXT,
            missing_keywords TEXT,
            score_breakdown TEXT,
            snippets TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# ─── Job Profiles ─────────────────────────────────────────────────────────────

def save_job_profile(name, description, keywords):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute('''
        INSERT INTO job_profiles (name, description, keywords, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, description, json.dumps(keywords), now, now))
    conn.commit()
    profile_id = c.lastrowid
    conn.close()
    return profile_id

def update_job_profile(profile_id, name, description, keywords):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute('''
        UPDATE job_profiles SET name=?, description=?, keywords=?, updated_at=?
        WHERE id=?
    ''', (name, description, json.dumps(keywords), now, profile_id))
    conn.commit()
    conn.close()

def delete_job_profile(profile_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM job_profiles WHERE id=?', (profile_id,))
    conn.commit()
    conn.close()

def get_all_job_profiles():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM job_profiles ORDER BY updated_at DESC')
    rows = c.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['keywords'] = json.loads(d['keywords'])
        result.append(d)
    return result

def get_job_profile(profile_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM job_profiles WHERE id=?', (profile_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['keywords'] = json.loads(d['keywords'])
        return d
    return None

# ─── Analysis Results ─────────────────────────────────────────────────────────

def save_analysis_result(session_id, job_profile_id, result):
    conn = get_connection()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute('''
        INSERT INTO analysis_results
        (session_id, job_profile_id, filename, candidate_name, total_score,
         keyword_score, experience_score, education_score, years_experience,
         education_level, matched_keywords, missing_keywords, score_breakdown,
         snippets, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session_id,
        job_profile_id,
        result.get('filename'),
        result.get('candidate_name'),
        result.get('total_score'),
        result.get('keyword_score'),
        result.get('experience_score'),
        result.get('education_score'),
        result.get('years_experience'),
        result.get('education_level'),
        json.dumps(result.get('matched_keywords', [])),
        json.dumps(result.get('missing_keywords', [])),
        json.dumps(result.get('score_breakdown', {})),
        json.dumps(result.get('snippets', {})),
        now
    ))
    conn.commit()
    row_id = c.lastrowid
    conn.close()
    return row_id

def get_session_results(session_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM analysis_results WHERE session_id=? ORDER BY total_score DESC', (session_id,))
    rows = c.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        for field in ('matched_keywords', 'missing_keywords', 'score_breakdown', 'snippets'):
            d[field] = json.loads(d[field]) if d[field] else []
        results.append(d)
    return results
