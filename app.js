/**
 * AI Resume Screening Tool - Core App State & Router
 */

const API_BASE = '/api';

const app = {
    state: {
        sessionId: localStorage.getItem('screening_session_id') || null,
        resumes: [],
        profiles: [],
        results: [],
        currentView: 'dashboard',
        jobTitle: '',
        jobDescription: '',
        keywords: [],
        weights: {
            keyword: 60,
            experience: 25,
            education: 15
        }
    },

    init: async () => {
        console.log("App initializing...");
        app.setupEventListeners();
        app.checkBackendStatus();
        app.loadSessionFiles();
        app.loadProfiles();
        
        // Initial view
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        app.switchView(hash);
    },

    setupEventListeners: () => {
        // Sidebar navigation
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                app.switchView(item.getAttribute('data-view'));
            });
        });

        // Quick analyze button
        document.getElementById('quick-analyze-btn').addEventListener('click', () => {
            if (app.state.resumes.length === 0) {
                app.showToast("Please upload resumes first", "info");
                app.switchView('upload');
            } else {
                app.switchView('jd');
            }
        });
    },

    switchView: (viewId) => {
        if (!viewId) return;
        
        // Update active class in sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === viewId) {
                item.classList.add('active');
            }
        });

        // Toggle sections
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.add('active');
            app.state.currentView = viewId;
            window.location.hash = viewId;
            
            // Update Page Title
            const titles = {
                'dashboard': 'Dashboard Overview',
                'upload': 'Upload Resumes',
                'jd': 'Define Screening Criteria',
                'results': 'Analysis Results'
            };
            const subtitles = {
                'dashboard': 'Monitor your screening progress and quick actions.',
                'upload': 'Add PDF or Word documents to the batch.',
                'jd': 'Paste your JD and adjust AI scoring logic.',
                'results': 'Compare candidates and export top matches.'
            };
            
            document.getElementById('view-title').innerText = titles[viewId] || 'Resume Tool';
            document.getElementById('view-subtitle').innerText = subtitles[viewId] || '';
        }

        // View specific logic
        if (viewId === 'results' && app.state.results.length === 0) {
            app.fetchResults();
        }
    },

    checkBackendStatus: async () => {
        const dot = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        
        try {
            const resp = await fetch(`${API_BASE}/health`);
            if (resp.ok) {
                dot.className = 'status-dot online';
                text.innerText = 'System Online (Ready)';
            } else {
                throw new Error();
            }
        } catch (e) {
            dot.className = 'status-dot offline';
            text.innerText = 'System Offline (Disconnected)';
            app.showToast("Cannot connect to backend. Please start app.py", "error");
        }
    },

    loadSessionFiles: async () => {
        if (!app.state.sessionId) return;
        
        try {
            const resp = await fetch(`${API_BASE}/session-files/${app.state.sessionId}`);
            const data = await resp.json();
            if (data.success) {
                app.state.resumes = data.files;
                app.updateDashboardStats();
                if (typeof upload !== 'undefined') upload.renderFileList();
            }
        } catch (e) {
            console.error("Failed to load session files", e);
        }
    },

    loadProfiles: async () => {
        try {
            const resp = await fetch(`${API_BASE}/job-profiles`);
            const data = await resp.json();
            if (data.success) {
                app.state.profiles = data.profiles;
                app.updateDashboardStats();
                if (typeof jd !== 'undefined') jd.renderProfiles();
            }
        } catch (e) {
            console.error("Failed to load profiles", e);
        }
    },

    updateDashboardStats: () => {
        const resumeBox = document.getElementById('stat-resumes');
        if (resumeBox) resumeBox.innerText = app.state.resumes.length;
        
        const badge = document.getElementById('resume-count-badge');
        if (badge) {
            badge.innerText = app.state.resumes.length;
            badge.style.display = app.state.resumes.length > 0 ? 'block' : 'none';
        }

        const profileBox = document.getElementById('stat-profiles');
        if (profileBox) profileBox.innerText = app.state.profiles.length;
    },

    showLoading: (text = "Processing...", sub = "") => {
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('.loading-text').innerText = text;
        overlay.querySelector('.loading-sub').innerText = sub;
        overlay.classList.add('active');
    },

    hideLoading: () => {
        document.getElementById('loading-overlay').classList.remove('active');
    },

    showToast: (msg, type = "info") => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-msg">${msg}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

document.addEventListener('DOMContentLoaded', app.init);
