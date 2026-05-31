/**
 * AI Resume Screening Tool - Resume Upload Module
 */

const upload = {
    init: () => {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const clearBtn = document.getElementById('clear-files-btn');

        if (!dropZone || !fileInput) return;

        // Drag & Drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        ['dragleave', 'dragend'].forEach(evt => {
            dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'));
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                upload.handleFileUpload(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                upload.handleFileUpload(fileInput.files);
            }
        });

        clearBtn.addEventListener('click', upload.clearSession);
    },

    handleFileUpload: async (files) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        if (app.state.sessionId) {
            formData.append('session_id', app.state.sessionId);
        }

        app.showLoading("Parsing Resumes", "Extracting text and identifying candidates...");

        try {
            const resp = await fetch(`${API_BASE}/upload-resumes`, {
                method: 'POST',
                body: formData
            });

            const data = await resp.json();
            app.hideLoading();

            if (data.success) {
                if (!app.state.sessionId) {
                    app.state.sessionId = data.session_id;
                    localStorage.setItem('screening_session_id', data.session_id);
                }
                
                app.state.resumes = data.total_uploaded ? 
                    (await (await fetch(`${API_BASE}/session-files/${app.state.sessionId}`)).json()).files : 
                    data.uploaded;

                app.showToast(`Successfully uploaded ${data.uploaded.length} resumes`, "success");
                if (data.errors && data.errors.length > 0) {
                    app.showToast(`Errors: ${data.errors.join(', ')}`, "error");
                }
                
                upload.renderFileList();
                app.updateDashboardStats();
            } else {
                app.showToast(data.error || "Upload failed", "error");
            }
        } catch (e) {
            app.hideLoading();
            app.showToast("Network error uploading files", "error");
        }
    },

    renderFileList: () => {
        const list = document.getElementById('file-list');
        if (!list) return;

        if (app.state.resumes.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <p style="color: var(--text-muted); font-size: 13px;">No files uploaded in this session.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = app.state.resumes.map(f => {
            const ext = f.filename.split('.').pop().toUpperCase();
            return `
                <div class="file-item">
                    <span class="file-type-badge">${ext}</span>
                    <div class="file-info">
                        <div class="file-name">${f.filename}</div>
                        <div class="file-candidate">${f.candidate_name || 'Extracting name...'}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    clearSession: async () => {
        if (!app.state.sessionId) return;
        
        if (!confirm("Are you sure you want to clear all uploaded resumes?")) return;

        try {
            const resp = await fetch(`${API_BASE}/clear-session/${app.state.sessionId}`, {
                method: 'DELETE'
            });
            const data = await resp.json();
            if (data.success) {
                app.state.sessionId = null;
                app.state.resumes = [];
                localStorage.removeItem('screening_session_id');
                upload.renderFileList();
                app.updateDashboardStats();
                app.showToast("Session cleared", "success");
            }
        } catch (e) {
            app.showToast("Error clearing session", "error");
        }
    }
};

// Initialize after app.js
document.addEventListener('DOMContentLoaded', upload.init);
