import re

# ─── Education Levels ─────────────────────────────────────────────────────────
EDUCATION_LEVELS = {
    'phd': 100,
    'ph.d': 100,
    'doctorate': 100,
    'doctor of philosophy': 100,
    'master': 80,
    'msc': 80,
    'mba': 80,
    'm.sc': 80,
    'm.s.': 80,
    'postgraduate': 75,
    'bachelor': 60,
    'b.sc': 60,
    'b.s.': 60,
    'b.e.': 60,
    'b.tech': 60,
    'undergraduate': 55,
    'associate': 40,
    'diploma': 30,
    'high school': 10,
}

# ─── Experience Patterns ──────────────────────────────────────────────────────
EXPERIENCE_PATTERNS = [
    r'(\d+)\+?\s*years?\s+of\s+(?:professional\s+)?experience',
    r'(\d+)\+?\s*years?\s+(?:in|of|at)',
    r'experience\s+of\s+(\d+)\+?\s*years?',
    r'\|\s*(\d+)\s+years?\s*\|',
    r'\((\d{4})\s*[–\-]\s*(?:present|current|\d{4})\)',
]

def extract_years_experience(text):
    """Extract total years of experience from resume text."""
    text_lower = text.lower()

    # Try direct patterns first
    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        if matches:
            years = [int(m) for m in matches]
            return max(years)

    # Fallback: count date ranges in experience sections
    date_ranges = re.findall(
        r'(20\d{2}|19\d{2})\s*[–\-—]\s*(20\d{2}|present|current)',
        text_lower, re.IGNORECASE
    )
    total = 0
    import datetime
    current_year = datetime.datetime.now().year
    for start, end in date_ranges:
        try:
            s = int(start)
            e = current_year if end.lower() in ('present', 'current') else int(end)
            if 1980 <= s <= current_year and s <= e:
                total += (e - s)
        except ValueError:
            pass
    return min(total, 40)  # Cap at 40 years

def detect_education_level(text):
    """Return the highest detected education level with its score."""
    text_lower = text.lower()
    best_score = 0
    best_label = 'Not Detected'
    for keyword, score in EDUCATION_LEVELS.items():
        if keyword in text_lower and score > best_score:
            best_score = score
            best_label = keyword.title()
    return best_label, best_score

def score_keywords(text, keywords):
    """
    Score keyword matches.
    keywords: list of dicts {keyword, weight}
    Returns: {keyword: {matched, weight, occurrences}}
    """
    text_lower = text.lower()
    results = {}
    for kw_obj in keywords:
        kw = kw_obj.get('keyword', '').strip().lower()
        weight = float(kw_obj.get('weight', 1.0))
        if not kw:
            continue
        # Count occurrences (whole-word or substring)
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        occurrences = len(pattern.findall(text))
        matched = occurrences > 0
        results[kw] = {
            'keyword': kw_obj.get('keyword', kw),
            'matched': matched,
            'weight': weight,
            'occurrences': occurrences,
        }
    return results

def calculate_score(text, keywords, weights_config=None):
    """
    Master scoring function.
    weights_config: {keyword_weight, experience_weight, education_weight} (0-1 each, default 0.6/0.25/0.15)
    Returns full score breakdown dict.
    """
    if weights_config is None:
        weights_config = {
            'keyword_weight': 0.60,
            'experience_weight': 0.25,
            'education_weight': 0.15,
        }

    kw_weight = float(weights_config.get('keyword_weight', 0.60))
    exp_weight = float(weights_config.get('experience_weight', 0.25))
    edu_weight = float(weights_config.get('education_weight', 0.15))

    # ── Keyword Score ──────────────────────────────────────────────────────────
    kw_results = score_keywords(text, keywords)
    matched_kws = {k: v for k, v in kw_results.items() if v['matched']}
    missing_kws = {k: v for k, v in kw_results.items() if not v['matched']}

    if keywords:
        max_possible_kw = sum(float(k.get('weight', 1.0)) for k in keywords)
        achieved_kw = sum(v['weight'] for v in matched_kws.values())
        raw_keyword_score = (achieved_kw / max_possible_kw * 100) if max_possible_kw > 0 else 0
    else:
        raw_keyword_score = 0

    # ── Experience Score ───────────────────────────────────────────────────────
    years = extract_years_experience(text)
    # Score: 0 yrs=0, 2 yrs=40, 5 yrs=70, 10 yrs=100
    if years >= 10:
        raw_exp_score = 100
    elif years >= 5:
        raw_exp_score = 70 + (years - 5) * 6
    elif years >= 2:
        raw_exp_score = 40 + (years - 2) * 10
    else:
        raw_exp_score = years * 20

    # ── Education Score ────────────────────────────────────────────────────────
    edu_label, raw_edu_score = detect_education_level(text)

    # ── Final Weighted Score ───────────────────────────────────────────────────
    total = (raw_keyword_score * kw_weight +
             raw_exp_score * exp_weight +
             raw_edu_score * edu_weight)

    return {
        'total_score': round(total, 2),
        'keyword_score': round(raw_keyword_score, 2),
        'experience_score': round(raw_exp_score, 2),
        'education_score': round(raw_edu_score, 2),
        'years_experience': years,
        'education_level': edu_label,
        'matched_keywords': list(matched_kws.values()),
        'missing_keywords': list(missing_kws.values()),
        'kw_results': kw_results,
        'score_breakdown': {
            'keyword': {
                'raw': round(raw_keyword_score, 2),
                'weight': kw_weight,
                'contribution': round(raw_keyword_score * kw_weight, 2),
            },
            'experience': {
                'raw': round(raw_exp_score, 2),
                'weight': exp_weight,
                'contribution': round(raw_exp_score * exp_weight, 2),
                'years': years,
            },
            'education': {
                'raw': round(raw_edu_score, 2),
                'weight': edu_weight,
                'contribution': round(raw_edu_score * edu_weight, 2),
                'level': edu_label,
            },
        },
    }
