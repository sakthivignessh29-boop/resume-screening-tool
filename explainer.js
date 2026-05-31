/**
 * AI Resume Screening Tool - Explainer Panel Module
 */

const explainer = {
    init: () => {
        const closeBtn = document.getElementById('drawer-close');
        const overlay = document.getElementById('drawer-overlay');
        
        if (!closeBtn) return;
        
        closeBtn.addEventListener('click', explainer.hide);
        overlay.addEventListener('click', explainer.hide);
    },

    show: (candidateName) => {
        const res = app.state.results.find(r => r.candidate_name === candidateName);
        if (!res) return;

        const drawer = document.getElementById('explainer-drawer');
        const overlay = document.getElementById('drawer-overlay');
        const content = document.getElementById('drawer-content');

        content.innerHTML = `
            <!-- Total Score & Gauges -->
            <div class="summary-box">
                <strong>AI Summary:</strong> ${res.summary}
            </div>

            <div class="score-gauges">
                <div class="gauge-card">
                    <div class="gauge-value">${res.score_breakdown.keyword.raw.toFixed(0)}</div>
                    <div class="gauge-label">Skills Match</div>
                    <div class="gauge-sub">${res.matched_keywords.length} found</div>
                </div>
                <div class="gauge-card">
                    <div class="gauge-value">${res.score_breakdown.experience.raw.toFixed(0)}</div>
                    <div class="gauge-label">Experience</div>
                    <div class="gauge-sub">${res.years_experience} Years</div>
                </div>
                <div class="gauge-card">
                    <div class="gauge-value">${res.score_breakdown.education.raw.toFixed(0)}</div>
                    <div class="gauge-label">Education</div>
                    <div class="gauge-sub">${res.education_level}</div>
                </div>
            </div>

            <!-- Strengths & Gaps -->
            <div>
                <div class="drawer-section-title">Key Strengths</div>
                <div class="sg-list">
                    ${res.strengths.map(s => `
                        <div class="sg-item strength">
                            <i class="fas fa-plus-circle sg-dot"></i>
                            <span>${s}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div>
                <div class="drawer-section-title">Missing Criteria</div>
                <div class="sg-list">
                    ${res.gaps.length > 0 ? res.gaps.map(g => `
                        <div class="sg-item gap">
                            <i class="fas fa-minus-circle sg-dot"></i>
                            <span>${g}</span>
                        </div>
                    `).join('') : '<div style="font-size:12px; color:var(--text-muted)">No major gaps identified.</div>'}
                </div>
            </div>

            <!-- Keywords chips -->
            <div>
                <div class="drawer-section-title">Skills Breakdown</div>
                <div class="kw-chips">
                    ${res.matched_keywords.map(k => `
                        <div class="kw-chip matched">
                            <i class="fas fa-check chip-icon"></i>
                            ${k.keyword}
                        </div>
                    `).join('')}
                    ${res.missing_keywords.map(k => `
                        <div class="kw-chip missing">
                            <i class="fas fa-times chip-icon"></i>
                            ${k.keyword}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Context Snippets -->
            <div>
                <div class="drawer-section-title">Verified Snippets from Resume</div>
                <div class="snippets-container">
                    ${Object.entries(res.snippets).length > 0 ? 
                        Object.entries(res.snippets).map(([kw, snips]) => `
                            ${snips.map(s => `
                                <div class="snippet-item">
                                    <div class="snippet-kw">${s.keyword}</div>
                                    <div class="snippet-text">"...${explainer.highlight(s.text, s.keyword)}..."</div>
                                </div>
                            `).join('')}
                        `).join('') : 
                        '<div style="font-size:12px; color:var(--text-muted)">No snippets extracted for this candidate.</div>'}
                </div>
            </div>
        `;

        drawer.classList.add('open');
        overlay.classList.add('open');
    },

    highlight: (text, kw) => {
        const regex = new RegExp(`(${kw})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },

    hide: () => {
        document.getElementById('explainer-drawer').classList.remove('open');
        document.getElementById('drawer-overlay').classList.remove('open');
    }
};

document.addEventListener('DOMContentLoaded', explainer.init);
