/**
 * AI Resume Screening Tool - Export Module
 */

const exporter = {
    init: () => {
        const excelBtn = document.getElementById('export-excel-btn');
        const pdfBtn = document.getElementById('export-pdf-btn');
        const navExport = document.getElementById('nav-export-btn');

        if (excelBtn) {
            excelBtn.addEventListener('click', () => exporter.run('excel'));
        }
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => exporter.run('pdf'));
        }
        if (navExport) {
            navExport.addEventListener('click', (e) => {
                e.preventDefault();
                if (app.state.results.length === 0) {
                    app.showToast("Run an analysis first to export results", "info");
                    app.switchView('results');
                } else {
                    exporter.run('excel');
                }
            });
        }
    },

    run: async (format) => {
        if (app.state.results.length === 0) {
            app.showToast("No results found to export", "error");
            return;
        }

        app.showLoading(`Generating ${format.toUpperCase()}`, "Preparing your detailed screening report...");

        try {
            const resp = await fetch(`${API_BASE}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: app.state.sessionId,
                    format: format,
                    job_title: app.state.jobTitle || "Resume Screening Report"
                })
            });

            if (!resp.ok) throw new Error("Export failed");

            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Screening_Report_${app.state.jobTitle.replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            app.hideLoading();
            app.showToast(`${format.toUpperCase()} report downloaded`, "success");
        } catch (e) {
            app.hideLoading();
            app.showToast("Failed to generate export file", "error");
            console.error(e);
        }
    }
};

document.addEventListener('DOMContentLoaded', exporter.init);
