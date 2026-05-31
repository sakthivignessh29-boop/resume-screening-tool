import re

_SNIPPET_WINDOW = 80  # chars around match to show as context

def get_keyword_snippets(text, keywords):
    """
    For each matched keyword, extract up to 2 snippet contexts from the resume.
    Returns dict: {keyword_lower: [snippet1, snippet2, ...]}
    """
    snippets = {}
    for kw_obj in keywords:
        kw = kw_obj.get('keyword', '').strip().lower()
        if not kw:
            continue
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        matches = list(pattern.finditer(text))
        kw_snippets = []
        for m in matches[:3]:  # max 3 snippets per keyword
            start = max(0, m.start() - _SNIPPET_WINDOW)
            end = min(len(text), m.end() + _SNIPPET_WINDOW)
            snippet = text[start:end].replace('\n', ' ').strip()
            # Trim to sentence boundaries if possible
            snippet = re.sub(r'\s+', ' ', snippet)
            kw_snippets.append({
                'text': snippet,
                'keyword': kw_obj.get('keyword', kw),
                'start_offset': m.start(),
            })
        if kw_snippets:
            snippets[kw] = kw_snippets
    return snippets

def build_explanation(text, score_result):
    """
    Build a full explainability report for a single resume.
    Takes scoring result dict and adds snippet context.
    """
    matched = score_result.get('matched_keywords', [])
    missing = score_result.get('missing_keywords', [])
    breakdown = score_result.get('score_breakdown', {})

    # Get snippets for matched keywords
    snippets = get_keyword_snippets(text, matched)

    explanation = {
        'matched_keywords': matched,
        'missing_keywords': missing,
        'snippets': snippets,
        'score_breakdown': breakdown,
        'summary': _build_summary(score_result),
        'strengths': _build_strengths(score_result),
        'gaps': _build_gaps(score_result),
    }
    return explanation

def _build_summary(score_result):
    total = score_result.get('total_score', 0)
    matched = score_result.get('matched_keywords', [])
    missing = score_result.get('missing_keywords', [])
    years = score_result.get('years_experience', 0)
    edu = score_result.get('education_level', 'Not Detected')

    if total >= 80:
        strength = 'Excellent'
    elif total >= 60:
        strength = 'Good'
    elif total >= 40:
        strength = 'Average'
    else:
        strength = 'Below Average'

    return (
        f"{strength} match ({total:.1f}/100). "
        f"Matched {len(matched)} of {len(matched)+len(missing)} keywords. "
        f"{years} year(s) of experience detected. "
        f"Education: {edu}."
    )

def _build_strengths(score_result):
    strengths = []
    matched = score_result.get('matched_keywords', [])
    years = score_result.get('years_experience', 0)
    edu = score_result.get('education_level', 'Not Detected')

    high_value = [k for k in matched if k.get('weight', 1.0) >= 1.5]
    if high_value:
        kw_names = ', '.join(k['keyword'] for k in high_value[:5])
        strengths.append(f"Has high-priority skills: {kw_names}")

    if years >= 5:
        strengths.append(f"Strong experience: {years} years")
    elif years >= 2:
        strengths.append(f"Solid experience: {years} years")

    if edu.lower() in ('phd', 'ph.d', 'doctorate', 'doctor of philosophy'):
        strengths.append("Doctoral-level education")
    elif edu.lower() in ('master', 'msc', 'mba', 'm.sc', 'm.s.'):
        strengths.append("Master's degree education")
    elif edu.lower() in ('bachelor', 'b.sc', 'b.s.', 'b.e.', 'b.tech'):
        strengths.append("Bachelor's degree education")

    return strengths

def _build_gaps(score_result):
    gaps = []
    missing = score_result.get('missing_keywords', [])
    years = score_result.get('years_experience', 0)

    critical_missing = [k for k in missing if k.get('weight', 1.0) >= 1.5]
    if critical_missing:
        kw_names = ', '.join(k['keyword'] for k in critical_missing[:5])
        gaps.append(f"Missing high-priority skills: {kw_names}")

    other_missing = [k for k in missing if k.get('weight', 1.0) < 1.5]
    if other_missing:
        kw_names = ', '.join(k['keyword'] for k in other_missing[:5])
        gaps.append(f"Missing skills: {kw_names}")

    if years < 2:
        gaps.append(f"Limited experience: only {years} year(s) detected")

    return gaps
