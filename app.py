"""
AI Resume Screening Tool — Flask Backend
Run: python app.py
"""
import os
import uuid
import json
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sys

# Ensure the backend directory is in the path for imports to work on Vercel
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

# ── Path Setup ─────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.environ.get('UPLOAD_DIR')
if not UPLOAD_DIR:
    if os.environ.get('VERCEL'):
        UPLOAD_DIR = '/tmp/uploads'
    else:
        UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Internal Modules ───────────────────────────────────────────────────────────
from modules.parser   import extract_text, extract_candidate_name
from modules.scorer   import calculate_score
from modules.explainer import build_explanation
from modules.exporter  import export_excel, export_pdf
from database.db       import (init_db, save_job_profile, update_job_profile,
                                delete_job_profile, get_all_job_profiles,
                                get_job_profile, save_analysis_result,
                                get_session_results)

# ── App Init ───────────────────────────────────────────────────────────────────
is_vercel = os.environ.get('VERCEL') == '1'

if is_vercel:
    # Vercel handles static files via vercel.json
    app = Flask(__name__)
else:
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

CORS(app)

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# In-memory cache for current session uploaded files
_session_files = {}   # session_id -> [{filename, filepath, text, name}]
_session_results = {} # session_id -> [result_dicts]

# Initialize DB (wrapped in try-except for Vercel robustness)
try:
    print(f"Initializing database at: {os.environ.get('DATABASE_URL') or 'Local'}")
    init_db()
except Exception as e:
    print(f"Database initialization warning/error: {e}")

# ── Helpers ────────────────────────────────────────────────────────────────────

def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def error(msg, code=400):
    return jsonify({'success': False, 'error': msg}), code

def ok(data):
    return jsonify({'success': True, **data})

# ── Serve Frontend ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

# ════════════════════════════════════════════════════════════════════════════════
#  RESUME UPLOAD
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/upload-resumes', methods=['POST'])
def upload_resumes():
    """Upload one or more resume files. Returns session_id and file list."""
    if 'files' not in request.files:
        return error('No files provided')

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return error('No files selected')

    session_id = request.form.get('session_id') or str(uuid.uuid4())
    if session_id not in _session_files:
        _session_files[session_id] = []

    uploaded = []
    errors   = []

    for f in files:
        if not f.filename:
            continue
        if not allowed_file(f.filename):
            errors.append(f"{f.filename}: unsupported format")
            continue

        safe_name = secure_filename(f.filename)
        dest_path = os.path.join(UPLOAD_DIR, f"{session_id}_{safe_name}")
        f.save(dest_path)

        try:
            text = extract_text(dest_path)
            name = extract_candidate_name(text)
            _session_files[session_id].append({
                'filename': f.filename,
                'filepath': dest_path,
                'text': text,
                'candidate_name': name,
            })
            uploaded.append({'filename': f.filename, 'candidate_name': name})
        except Exception as e:
            errors.append(f"{f.filename}: {str(e)}")
            if os.path.exists(dest_path):
                os.remove(dest_path)

    return ok({
        'session_id': session_id,
        'uploaded': uploaded,
        'errors': errors,
        'total_uploaded': len(_session_files.get(session_id, [])),
    })

@app.route('/api/session-files/<session_id>', methods=['GET'])
def get_session_files(session_id):
    files = _session_files.get(session_id, [])
    return ok({'files': [{'filename': f['filename'],
                          'candidate_name': f['candidate_name']} for f in files]})

@app.route('/api/clear-session/<session_id>', methods=['DELETE'])
def clear_session(session_id):
    files = _session_files.pop(session_id, [])
    for f in files:
        try:
            if os.path.exists(f['filepath']):
                os.remove(f['filepath'])
        except Exception:
            pass
    _session_results.pop(session_id, None)
    return ok({'message': 'Session cleared'})

# ════════════════════════════════════════════════════════════════════════════════
#  ANALYZE
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze uploaded resumes against a job description + keyword weights.
    Body JSON: {session_id, job_description, keywords:[{keyword,weight}],
                weights_config:{keyword_weight,experience_weight,education_weight},
                job_title, save_profile}
    """
    data = request.get_json(force=True)
    session_id = data.get('session_id')
    if not session_id or session_id not in _session_files:
        return error('Invalid or expired session_id. Please upload resumes first.')

    files = _session_files.get(session_id, [])
    if not files:
        return error('No resumes in this session.')

    keywords      = data.get('keywords', [])
    weights_config = data.get('weights_config', None)
    job_title     = data.get('job_title', 'Untitled Position')
    job_description = data.get('job_description', '')

    # Optionally save as a job profile
    profile_id = None
    if data.get('save_profile') and job_title:
        profile_id = save_job_profile(job_title, job_description, keywords)

    results = []
    for resume in files:
        text = resume['text']
        score_result = calculate_score(text, keywords, weights_config)
        explanation  = build_explanation(text, score_result)

        result = {
            'filename'        : resume['filename'],
            'candidate_name'  : resume['candidate_name'],
            'total_score'     : score_result['total_score'],
            'keyword_score'   : score_result['keyword_score'],
            'experience_score': score_result['experience_score'],
            'education_score' : score_result['education_score'],
            'years_experience': score_result['years_experience'],
            'education_level' : score_result['education_level'],
            'matched_keywords': score_result['matched_keywords'],
            'missing_keywords': score_result['missing_keywords'],
            'score_breakdown' : score_result['score_breakdown'],
            'snippets'        : explanation['snippets'],
            'summary'         : explanation['summary'],
            'strengths'       : explanation['strengths'],
            'gaps'            : explanation['gaps'],
        }
        results.append(result)
        # Persist to DB
        save_analysis_result(session_id, profile_id, result)

    # Sort by score descending
    results.sort(key=lambda x: x['total_score'], reverse=True)
    _session_results[session_id] = results

    return ok({
        'session_id': session_id,
        'job_title' : job_title,
        'count'     : len(results),
        'results'   : results,
    })

# ════════════════════════════════════════════════════════════════════════════════
#  GET RESULTS
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/get-results/<session_id>', methods=['GET'])
def get_results(session_id):
    results = _session_results.get(session_id)
    if results is None:
        # Try DB
        results = get_session_results(session_id)
    if not results:
        return error('No results found for this session.', 404)
    return ok({'results': results, 'count': len(results)})

# ════════════════════════════════════════════════════════════════════════════════
#  JOB PROFILES
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/job-profiles', methods=['GET'])
def list_job_profiles():
    profiles = get_all_job_profiles()
    return ok({'profiles': profiles})

@app.route('/api/job-profiles', methods=['POST'])
def create_job_profile():
    data = request.get_json(force=True)
    name = data.get('name', '').strip()
    desc = data.get('description', '')
    kws  = data.get('keywords', [])
    if not name:
        return error('Profile name is required')
    pid = save_job_profile(name, desc, kws)
    return ok({'id': pid, 'message': 'Profile saved'})

@app.route('/api/job-profiles/<int:profile_id>', methods=['GET'])
def get_profile(profile_id):
    p = get_job_profile(profile_id)
    if not p:
        return error('Profile not found', 404)
    return ok({'profile': p})

@app.route('/api/job-profiles/<int:profile_id>', methods=['PUT'])
def update_profile(profile_id):
    data = request.get_json(force=True)
    update_job_profile(profile_id, data.get('name'), data.get('description'), data.get('keywords', []))
    return ok({'message': 'Profile updated'})

@app.route('/api/job-profiles/<int:profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    delete_job_profile(profile_id)
    return ok({'message': 'Profile deleted'})

# ════════════════════════════════════════════════════════════════════════════════
#  EXPORT
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/export', methods=['POST'])
def export():
    """
    Export results.
    Body: {session_id, format: 'excel'|'pdf', job_title}
    """
    data       = request.get_json(force=True)
    session_id = data.get('session_id')
    fmt        = data.get('format', 'excel').lower()
    job_title  = data.get('job_title', 'Job Analysis')

    results = _session_results.get(session_id)
    if not results:
        results = get_session_results(session_id)
    if not results:
        return error('No results to export.', 404)

    if fmt == 'pdf':
        buf = export_pdf(results, job_title)
        return send_file(buf, mimetype='application/pdf',
                         as_attachment=True,
                         download_name=f'resume_screening_{session_id[:8]}.pdf')
    else:
        buf = export_excel(results, job_title)
        return send_file(buf,
                         mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         as_attachment=True,
                         download_name=f'resume_screening_{session_id[:8]}.xlsx')

# ════════════════════════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ════════════════════════════════════════════════════════════════════════════════
@app.route('/api/health', methods=['GET'])
def health():
    return ok({'status': 'running', 'version': '1.0.0'})

if __name__ == '__main__':
    print("=" * 55)
    print("  AI Resume Screening Tool — Backend")
    print("  Running at: http://localhost:5000")
    print("=" * 55)
    app.run(debug=True, host='0.0.0.0', port=5000)
