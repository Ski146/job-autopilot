/* ═══════════════════════════════════════════════════════
   JOB AUTOPILOT — Dashboard Frontend Logic
   ═══════════════════════════════════════════════════════ */

(() => {
    "use strict";

    // ─── State ──────────────────────────────────────────
    let allApplications = [];
    let currentView = "overview";

    // ─── DOM References ─────────────────────────────────
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
    const dateDisplay = document.getElementById("date-display");
    const nextRunTime = document.getElementById("next-run-time");
    const btnTrigger = document.getElementById("btn-trigger");
    const pipelineStatus = document.getElementById("pipeline-status");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalClose = document.getElementById("modal-close");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    // ─── Init ───────────────────────────────────────────
    dateDisplay.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "short", year: "numeric", month: "short", day: "numeric"
    });

    // ─── Navigation ─────────────────────────────────────
    const viewMeta = {
        overview: { title: "Overview", subtitle: "Today's application summary" },
        applications: { title: "Applications", subtitle: "All processed job applications" },
        runs: { title: "Run History", subtitle: "Pipeline execution history" },
        models: { title: "Model Stats", subtitle: "LLM performance comparison" },
        logs: { title: "CSV Logs", subtitle: "Raw log files" }
    };

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    document.getElementById("btn-view-all")?.addEventListener("click", () => {
        switchView("applications");
    });

    function switchView(view) {
        currentView = view;
        navItems.forEach(n => n.classList.toggle("active", n.dataset.view === view));
        views.forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
        pageTitle.textContent = viewMeta[view]?.title || view;
        pageSubtitle.textContent = viewMeta[view]?.subtitle || "";

        // Load view-specific data
        if (view === "applications") loadApplications();
        if (view === "runs") loadRuns();
        if (view === "models") loadModels();
        if (view === "logs") loadLogs();
    }

    // ─── Manual Trigger ─────────────────────────────────
    btnTrigger.addEventListener("click", async () => {
        if (btnTrigger.disabled) return;
        btnTrigger.disabled = true;
        btnTrigger.innerHTML = "<span>⏳</span> Running...";
        updatePipelineStatus(true);

        try {
            await fetch("/api/run-now", { method: "POST" });
            // Poll for completion
            const pollInterval = setInterval(async () => {
                const status = await fetch("/api/status").then(r => r.json());
                if (!status.pipelineRunning) {
                    clearInterval(pollInterval);
                    btnTrigger.disabled = false;
                    btnTrigger.innerHTML = "<span>▶</span> Run Now";
                    updatePipelineStatus(false);
                    loadOverview();
                }
            }, 5000);
        } catch {
            btnTrigger.disabled = false;
            btnTrigger.innerHTML = "<span>▶</span> Run Now";
            updatePipelineStatus(false);
        }
    });

    function updatePipelineStatus(running) {
        const indicator = pipelineStatus.querySelector(".status-indicator");
        const text = pipelineStatus.querySelector("span:last-child");
        indicator.className = `status-indicator ${running ? "running" : "idle"}`;
        text.textContent = running ? "Running" : "Idle";
    }

    // ─── Modal ──────────────────────────────────────────
    modalClose.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    function openModal(title, html) {
        modalTitle.textContent = title;
        modalBody.innerHTML = html;
        modalOverlay.classList.add("active");
    }

    function closeModal() {
        modalOverlay.classList.remove("active");
    }

    // ─── Load Overview ──────────────────────────────────
    async function loadOverview() {
        try {
            const [stats, history, status] = await Promise.all([
                fetch("/api/stats/today").then(r => r.json()),
                fetch("/api/stats/history").then(r => r.json()),
                fetch("/api/status").then(r => r.json())
            ]);

            // Update stat cards
            document.getElementById("stat-total-value").textContent = stats.totalApplications;
            document.getElementById("stat-success-value").textContent = stats.succeeded;
            document.getElementById("stat-failed-value").textContent = stats.failed;
            document.getElementById("stat-rate-value").textContent = `${stats.successRate}%`;
            document.getElementById("stat-runs-value").textContent = stats.runsToday;

            // Update next run
            if (stats.nextRun) {
                nextRunTime.textContent = new Date(stats.nextRun).toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit"
                });
            }

            // Update positions
            const positionsList = document.getElementById("positions-list");
            positionsList.innerHTML = (status.positions || []).map(p =>
                `<span class="position-tag">${escapeHtml(p)}</span>`
            ).join("") || '<span class="position-tag">Configure positions in .env</span>';

            // Load recent applications
            const apps = await fetch("/api/applications").then(r => r.json());
            allApplications = apps;
            renderRecentTable(apps.slice(0, 10));

            // Render chart
            renderChart(history);

            // Pipeline status
            updatePipelineStatus(status.pipelineRunning);

        } catch (err) {
            console.error("Failed to load overview:", err);
        }
    }

    // ─── Recent Table ───────────────────────────────────
    function renderRecentTable(apps) {
        const tbody = document.getElementById("recent-table-body");
        const empty = document.getElementById("recent-empty");

        if (apps.length === 0) {
            tbody.innerHTML = "";
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";
        tbody.innerHTML = apps.map(app => `
            <tr>
                <td><strong>${escapeHtml(app.company || "—")}</strong></td>
                <td>${escapeHtml(app.position || "—")}</td>
                <td>${escapeHtml(app.location || "—")}</td>
                <td><span class="badge ${app.status || ""}">${app.status || "—"}</span></td>
                <td>${escapeHtml(app.selectedAgent || "—")}</td>
                <td>${formatTime(app.timestamp)}</td>
            </tr>
        `).join("");
    }

    // ─── Chart ──────────────────────────────────────────
    function renderChart(history) {
        const container = document.getElementById("chart-container");
        if (!history || history.length === 0) {
            container.innerHTML = '<div class="table-empty"><div class="empty-icon">📊</div><p>No historical data yet</p></div>';
            return;
        }

        const data = history.slice(0, 14).reverse();
        const maxVal = Math.max(...data.map(d => d.total), 1);

        container.innerHTML = data.map(d => {
            const height = Math.max(4, (d.total / maxVal) * 160);
            const dateLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-value">${d.total}</div>
                    <div class="chart-bar" style="height:${height}px;" title="${d.date}: ${d.total} apps (${d.succeeded} ok, ${d.failed} fail)"></div>
                    <div class="chart-bar-label">${dateLabel}</div>
                </div>
            `;
        }).join("");
    }

    // ─── Applications View ──────────────────────────────
    async function loadApplications() {
        const apps = await fetch("/api/applications").then(r => r.json());
        allApplications = apps;
        renderApplicationsTable(apps);

        // Setup filters
        const searchInput = document.getElementById("app-search");
        const statusFilter = document.getElementById("app-status-filter");

        const applyFilters = () => {
            const q = (searchInput.value || "").toLowerCase();
            const s = statusFilter.value;
            const filtered = allApplications.filter(a => {
                const matchesSearch = !q ||
                    (a.company || "").toLowerCase().includes(q) ||
                    (a.position || "").toLowerCase().includes(q);
                const matchesStatus = !s || a.status === s;
                return matchesSearch && matchesStatus;
            });
            renderApplicationsTable(filtered);
        };

        searchInput.oninput = applyFilters;
        statusFilter.onchange = applyFilters;
    }

    function renderApplicationsTable(apps) {
        const tbody = document.getElementById("applications-table-body");
        tbody.innerHTML = apps.map((app, idx) => `
            <tr>
                <td>${formatDate(app.timestamp)}</td>
                <td><strong>${escapeHtml(app.company || "—")}</strong></td>
                <td>${escapeHtml(app.position || "—")}</td>
                <td>${escapeHtml(app.location || "—")}</td>
                <td><span class="badge ${app.status || ""}">${app.status || "—"}</span></td>
                <td>${escapeHtml(app.selectedAgent || "—")}</td>
                <td>${app.duration ? (app.duration / 1000).toFixed(1) + "s" : "—"}</td>
                <td>
                    ${app.url ? `<a href="${escapeHtml(app.url)}" target="_blank" class="btn-detail">🔗 Job</a>` : ""}
                    <button class="btn-detail" onclick="window.__showDetail(${idx})">Details</button>
                </td>
            </tr>
        `).join("");
    }

    // Detail click handler
    window.__showDetail = (idx) => {
        const app = allApplications[idx];
        if (!app) return;
        openModal(`${app.company} — ${app.position}`, `
            <div class="modal-section">
                <h4>Job Details</h4>
                <p><strong>Company:</strong> ${escapeHtml(app.company || "—")}</p>
                <p><strong>Position:</strong> ${escapeHtml(app.position || "—")}</p>
                <p><strong>Location:</strong> ${escapeHtml(app.location || "—")}</p>
                <p><strong>Status:</strong> <span class="badge ${app.status}">${app.status}</span></p>
                <p><strong>Model:</strong> ${escapeHtml(app.selectedAgent || "—")}</p>
                <p><strong>Duration:</strong> ${app.duration ? (app.duration / 1000).toFixed(1) + "s" : "—"}</p>
                ${app.url ? `<p><strong>URL:</strong> <a href="${escapeHtml(app.url)}" target="_blank" style="color:var(--accent-primary)">${escapeHtml(app.url)}</a></p>` : ""}
            </div>
            ${app.resumePdfPath ? `
            <div class="modal-section">
                <h4>Tailored Resume</h4>
                <p>📄 ${escapeHtml(app.resumePdfPath)}</p>
            </div>` : ""}
            ${app.error ? `
            <div class="modal-section">
                <h4>Error</h4>
                <pre>${escapeHtml(app.error)}</pre>
            </div>` : ""}
        `);
    };

    // ─── Runs View ──────────────────────────────────────
    async function loadRuns() {
        const runs = await fetch("/api/runs").then(r => r.json());
        const container = document.getElementById("runs-list");

        if (runs.length === 0) {
            container.innerHTML = '<div class="table-empty"><div class="empty-icon">⚡</div><p>No runs yet</p></div>';
            return;
        }

        container.innerHTML = runs.map(run => {
            const icon = run.status === "completed" ? "✅" : run.status === "running" ? "⏳" : "❌";
            const iconClass = run.status || "completed";
            const succeeded = run.summary?.succeeded || 0;
            const failed = run.summary?.failed || 0;
            const total = run.summary?.totalJobs || run.resultCount || 0;

            return `
                <div class="run-card" onclick="window.__showRun('${run.id}')">
                    <div class="run-card-left">
                        <div class="run-icon ${iconClass}">${icon}</div>
                        <div class="run-info">
                            <h4>${formatDate(run.startTime)}</h4>
                            <p>${formatTime(run.startTime)} — ${run.endTime ? formatTime(run.endTime) : "In progress"}</p>
                        </div>
                    </div>
                    <div class="run-stats">
                        <div class="run-stat">
                            <div class="run-stat-value" style="color:var(--accent-primary)">${total}</div>
                            <div class="run-stat-label">Total</div>
                        </div>
                        <div class="run-stat">
                            <div class="run-stat-value" style="color:var(--accent-success)">${succeeded}</div>
                            <div class="run-stat-label">Success</div>
                        </div>
                        <div class="run-stat">
                            <div class="run-stat-value" style="color:var(--accent-danger)">${failed}</div>
                            <div class="run-stat-label">Failed</div>
                        </div>
                        <span class="badge ${iconClass}">${run.status || "—"}</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    window.__showRun = async (runId) => {
        try {
            const run = await fetch(`/api/runs/${runId}`).then(r => r.json());
            openModal(`Run: ${formatDate(run.startTime)}`, `
                <div class="modal-section">
                    <h4>Run Summary</h4>
                    <p><strong>Status:</strong> <span class="badge ${run.status}">${run.status}</span></p>
                    <p><strong>Start:</strong> ${run.startTime}</p>
                    <p><strong>End:</strong> ${run.endTime || "—"}</p>
                    <p><strong>Duration:</strong> ${run.summary?.totalDurationMin || "—"} minutes</p>
                    <p><strong>Jobs processed:</strong> ${run.summary?.totalJobs || 0}</p>
                    <p><strong>Succeeded:</strong> ${run.summary?.succeeded || 0}</p>
                    <p><strong>Failed:</strong> ${run.summary?.failed || 0}</p>
                </div>
                ${run.scrapeStats ? `
                <div class="modal-section">
                    <h4>Scrape Stats</h4>
                    <p><strong>Raw jobs found:</strong> ${run.scrapeStats.raw || 0}</p>
                    <p><strong>After filtering:</strong> ${run.scrapeStats.filtered || 0}</p>
                    <p><strong>Unique:</strong> ${run.scrapeStats.unique || 0}</p>
                    <p><strong>Processed:</strong> ${run.scrapeStats.limited || 0}</p>
                </div>` : ""}
                ${run.summary?.modelSelections ? `
                <div class="modal-section">
                    <h4>Model Selections</h4>
                    <pre>${JSON.stringify(run.summary.modelSelections, null, 2)}</pre>
                </div>` : ""}
                ${(run.errors || []).length > 0 ? `
                <div class="modal-section">
                    <h4>Errors</h4>
                    <pre>${run.errors.map(e => `${e.timestamp}: ${e.message}`).join("\n")}</pre>
                </div>` : ""}
            `);
        } catch (err) {
            console.error("Failed to load run:", err);
        }
    };

    // ─── Models View ────────────────────────────────────
    async function loadModels() {
        const apps = await fetch("/api/applications").then(r => r.json());
        const grid = document.getElementById("models-grid");

        const models = [
            { id: "gpt-oss", name: "GPT-OSS 120B", color: "#6C5CE7", role: "General reasoning" },
            { id: "qwen3", name: "Qwen3 Coder", color: "#00B894", role: "Technical skills" },
            { id: "nemotron-nano", name: "Nemotron Nano", color: "#FDCB6E", role: "Quick analysis" },
            { id: "deepseek", name: "DeepSeek V4", color: "#E17055", role: "Deep analysis" },
            { id: "nemotron-super", name: "Nemotron Super", color: "#74B9FF", role: "Synthesis" },
            { id: "laguna", name: "Laguna XS.2", color: "#A29BFE", role: "ATS optimization" }
        ];

        // Count selections per model
        const selectionCounts = {};
        for (const app of apps) {
            const agent = app.selectedAgent || "";
            selectionCounts[agent] = (selectionCounts[agent] || 0) + 1;
        }

        const totalSelections = Object.values(selectionCounts).reduce((a, b) => a + b, 0) || 1;

        grid.innerHTML = models.map(m => {
            const count = selectionCounts[m.name] || 0;
            const pct = ((count / totalSelections) * 100).toFixed(1);
            return `
                <div class="model-card" style="--model-color:${m.color}">
                    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${m.color};border-radius:var(--radius-lg) var(--radius-lg) 0 0;"></div>
                    <div class="model-avatar" style="background:${m.color}">${m.name.charAt(0)}</div>
                    <div class="model-name">${m.name}</div>
                    <div class="model-role">${m.role}</div>
                    <div class="model-stat-row">
                        <span class="model-stat-key">Times Selected</span>
                        <span class="model-stat-val" style="color:${m.color}">${count}</span>
                    </div>
                    <div class="model-stat-row">
                        <span class="model-stat-key">Win Rate</span>
                        <span class="model-stat-val">${pct}%</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ─── Logs View ──────────────────────────────────────
    async function loadLogs() {
        const logs = await fetch("/api/logs").then(r => r.json());
        const container = document.getElementById("logs-list");

        if (logs.length === 0) {
            container.innerHTML = '<div class="table-empty"><div class="empty-icon">📁</div><p>No log files yet</p></div>';
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="log-item">
                <div class="log-item-left">
                    <span class="log-icon">📄</span>
                    <span class="log-name">${escapeHtml(log.name)}</span>
                </div>
                <div style="display:flex;gap:16px;align-items:center;">
                    <span class="log-size">${formatBytes(log.size)}</span>
                    <span class="log-date">${new Date(log.modified).toLocaleDateString()}</span>
                </div>
            </div>
        `).join("");
    }

    // ─── Utilities ──────────────────────────────────────
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    }

    function formatTime(dateStr) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit"
        });
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    // ─── Auto-Refresh ───────────────────────────────────
    loadOverview();
    setInterval(() => {
        if (currentView === "overview") loadOverview();
    }, 30000); // Refresh every 30 seconds

})();
