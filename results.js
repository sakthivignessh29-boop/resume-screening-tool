/**
 * AI Resume Screening Tool - Results Table Module
 */

const results = {
    init: () => {
        const searchInput = document.getElementById('result-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => results.renderTable());

        // Sort handlers
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const sortBy = th.getAttribute('data-sort');
                results.sortResults(sortBy);
            });
        });

        // Filter tabs
        document.querySelectorAll('.tab[data-filter]').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                results.renderTable();
            });
        });
    },

    sortResults: (key) => {
        const currentSort = results.lastSort === key ? 'desc' : 'asc';
        app.state.results.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];
            
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return currentSort === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort === 'asc' ? 1 : -1;
            return 0;
        });
        
        results.lastSort = key === results.lastSort && results.lastDir === 'desc' ? null : key;
        results.lastDir = currentSort;
        
        // Update UI headers
        document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
        const activeTh = document.querySelector(`th[data-sort="${key}"]`);
        if (activeTh) activeTh.classList.add('sorted');
        
        results.renderTable();
    },

    renderTable: () => {
        const body = document.getElementById('results-body');
        const empty = document.getElementById('results-empty');
        const table = document.getElementById('results-table');
        const search = document.getElementById('result-search').value.toLowerCase();
        const activeFilter = document.querySelector('.tab.active').getAttribute('data-filter');

        if (!body) return;

        let filtered = app.state.results.filter(r => {
            const matchesSearch = 
                r.candidate_name.toLowerCase().includes(search) ||
                r.education_level.toLowerCase().includes(search) ||
                r.matched_keywords.some(k => k.keyword.toLowerCase().includes(search));
            
            let matchesTab = true;
            if (activeFilter === 'top') matchesTab = r.total_score >= 80;
            
            return matchesSearch && matchesTab;
        });

        if (filtered.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
            table.style.display = 'none';
            return;
        }

        empty.style.display = 'none';
        table.style.display = 'table';

        body.innerHTML = filtered.map((r, idx) => {
            const scoreClass = r.total_score >= 80 ? 'high' : (r.total_score >= 60 ? 'medium' : 'low');
            const rankClass = (idx + 1) <= 3 ? `rank-${idx + 1}` : 'rank-n';
            
            return `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
                    <td>
                        <div style="font-weight:600">${r.candidate_name}</div>
                        <div style="font-size:11px; color:var(--text-muted)">${r.filename}</div>
                    </td>
                    <td class="score-bar-cell">
                        <div class="score-bar-wrap">
                            <div class="score-bar-track">
                                <div class="score-bar-fill ${scoreClass}" style="width: ${r.total_score}%"></div>
                            </div>
                            <span class="score-val">${r.total_score.toFixed(1)}%</span>
                        </div>
                    </td>
                    <td>${r.years_experience} Years</td>
                    <td>${r.education_level}</td>
                    <td>
                        <div class="kw-tags">
                            ${r.matched_keywords.slice(0, 4).map(k => `<span class="kw-tag">${k.keyword}</span>`).join('')}
                            ${r.matched_keywords.length > 4 ? `<span class="kw-tag" style="background:none; border:none; opacity:0.6">+${r.matched_keywords.length - 4}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <button class="detail-btn" onclick="explainer.show('${r.candidate_name}')">Analyze</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

document.addEventListener('DOMContentLoaded', results.init);
