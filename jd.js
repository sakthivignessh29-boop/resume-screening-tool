/**
 * AI Resume Screening Tool - Job Description & Criteria Module
 */

const jd = {
    init: () => {
        const addBtn = document.getElementById('add-kw-btn');
        const extractBtn = document.getElementById('btn-extract-kws');
        const analyzeBtn = document.getElementById('run-analyze-btn');
        const saveProfileBtn = document.getElementById('save-profile-btn');
        
        if (!addBtn) return;

        addBtn.addEventListener('click', () => jd.addKeywordRow());
        
        extractBtn.addEventListener('click', jd.autoExtractKeywords);
        
        analyzeBtn.addEventListener('click', jd.runAnalysis);
        
        saveProfileBtn.addEventListener('click', jd.saveCurrentProfile);

        // Slider sync
        const sliders = ['w-keyword', 'w-exp', 'w-edu'];
        sliders.forEach(id => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(`val-${id}`);
            el.addEventListener('input', () => {
                valEl.innerText = `${el.value}%`;
                el.style.setProperty('--val', `${el.value}%`);
            });
            // Initial style
            el.style.setProperty('--val', `${el.value}%`);
        });

        // Add 3 default rows if empty
        if (app.state.keywords.length === 0) {
            ['Python', 'React.js', 'AWS'].forEach(kw => jd.addKeywordRow(kw, 1.5));
        }
    },

    addKeywordRow: (name = '', weight = 1.0) => {
        const container = document.getElementById('keywords-list');
        const row = document.createElement('div');
        row.className = 'keyword-row';
        
        const timestamp = Date.now() + Math.random();
        
        row.innerHTML = `
            <input type="text" class="keyword-input" placeholder="Skill/Keyword..." value="${name}">
            <span class="weight-label">Weight:</span>
            <input type="range" class="weight-slider" min="0.5" max="3.0" step="0.5" value="${weight}">
            <span class="weight-value">${weight.toFixed(1)}</span>
            <button class="kw-remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        const slider = row.querySelector('.weight-slider');
        const valDisp = row.querySelector('.weight-value');
        slider.addEventListener('input', () => {
            valDisp.innerText = parseFloat(slider.value).toFixed(1);
        });
        
        row.querySelector('.kw-remove-btn').addEventListener('click', () => row.remove());
        
        container.appendChild(row);
    },

    getCriteria: () => {
        const title = document.getElementById('jd-title').value.trim();
        const text = document.getElementById('jd-text').value.trim();
        
        const keywordRows = document.querySelectorAll('.keyword-row');
        const keywords = [];
        keywordRows.forEach(row => {
            const kw = row.querySelector('.keyword-input').value.trim();
            const wt = parseFloat(row.querySelector('.weight-slider').value);
            if (kw) keywords.push({ keyword: kw, weight: wt });
        });

        const weightsConfig = {
            keyword_weight: parseInt(document.getElementById('w-keyword').value) / 100,
            experience_weight: parseInt(document.getElementById('w-exp').value) / 100,
            education_weight: parseInt(document.getElementById('w-edu').value) / 100
        };

        return { title, text, keywords, weightsConfig };
    },

    autoExtractKeywords: () => {
        const text = document.getElementById('jd-text').value.trim();
        if (!text) {
            app.showToast("Paste a Job Description first", "info");
            return;
        }

        app.showLoading("Extracting Keywords", "Analyzing JD text for relevant skills...");
        
        // Simulating robust extraction (in real world might use an LLM or specific NLP module)
        // Here we use common tech keywords list to mock the "offline AI" behavior
        setTimeout(() => {
            const techList = ['Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB', 'REST', 'API', 'Microservices', 'CI/CD', 'Git', 'Agile', 'Scrum', 'C++', 'Go', 'PHP', 'Laravel', 'Django', 'Flask'];
            const found = [];
            techList.forEach(t => {
                if (new RegExp('\\b' + t + '\\b', 'i').test(text)) {
                    found.push(t);
                }
            });

            if (found.length > 0) {
                // Clear existing
                document.getElementById('keywords-list').innerHTML = '';
                found.forEach(f => jd.addKeywordRow(f, 1.0));
                app.showToast(`Found ${found.length} keywords in text`, "success");
            } else {
                app.showToast("No common keywords found. Try adding manually.", "info");
            }
            app.hideLoading();
        }, 1000);
    },

    saveCurrentProfile: async () => {
        const data = jd.getCriteria();
        if (!data.title) {
            app.showToast("Job Title is required to save a profile", "error");
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/job-profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.title,
                    description: data.text,
                    keywords: data.keywords
                })
            });
            const res = await resp.json();
            if (res.success) {
                app.showToast("Profile saved successfully", "success");
                app.loadProfiles();
            }
        } catch (e) {
            app.showToast("Error saving profile", "error");
        }
    },

    loadProfileData: (profile) => {
        document.getElementById('jd-title').value = profile.name;
        document.getElementById('jd-text').value = profile.description;
        
        const container = document.getElementById('keywords-list');
        container.innerHTML = '';
        profile.keywords.forEach(k => jd.addKeywordRow(k.keyword, k.weight));
        
        app.showToast(`Loaded profile: ${profile.name}`, "info");
    },

    renderProfiles: () => {
        const list = document.getElementById('saved-profiles-list');
        if (!list) return;
        
        if (app.state.profiles.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">No saved profiles yet.</p>';
            return;
        }

        list.innerHTML = app.state.profiles.map(p => `
            <div class="profile-item" onclick="jd.loadProfileData(app.state.profiles.find(x => x.id === ${p.id}))">
                <div class="profile-icon"><i class="fas fa-briefcase"></i></div>
                <div class="profile-info">
                    <div class="profile-name">${p.name}</div>
                    <div class="profile-meta">${p.keywords.length} keywords • Updated ${new Date(p.updated_at).toLocaleDateString()}</div>
                </div>
                <button class="btn btn-icon btn-sm" style="background:none; border:none; color:var(--text-danger)" onclick="event.stopPropagation(); jd.deleteProfile(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    deleteProfile: async (id) => {
        if (!confirm("Delete this profile?")) return;
        try {
            await fetch(`${API_BASE}/job-profiles/${id}`, { method: 'DELETE' });
            app.loadProfiles();
            app.showToast("Profile deleted", "success");
        } catch (e) { console.error(e); }
    },

    runAnalysis: async () => {
        if (app.state.resumes.length === 0) {
            app.showToast("Please upload resumes first", "error");
            app.switchView('upload');
            return;
        }

        const criteria = jd.getCriteria();
        if (criteria.keywords.length === 0) {
            app.showToast("Add at least one keyword for scoring", "error");
            return;
        }

        app.showLoading("Analyzing Candidates", "Running smart screening and scoring engine...");

        try {
            const resp = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: app.state.sessionId,
                    job_title: criteria.title || "Resume Screening",
                    job_description: criteria.text,
                    keywords: criteria.keywords,
                    weights_config: criteria.weightsConfig,
                    save_profile: false
                })
            });

            const data = await resp.json();
            app.hideLoading();

            if (data.success) {
                app.state.results = data.results;
                app.state.jobTitle = data.job_title;
                app.switchView('results');
                app.showToast(`Analysis complete for ${data.count} candidates`, "success");
                
                if (typeof results !== 'undefined') results.renderTable();
            } else {
                app.showToast(data.error || "Analysis failed", "error");
            }
        } catch (e) {
            app.hideLoading();
            app.showToast("Analysis request failed", "error");
        }
    }
};

document.addEventListener('DOMContentLoaded', jd.init);
