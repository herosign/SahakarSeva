document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const user = window.SahakarDB ? window.SahakarDB.getCurrentUser() : null;
    if (!user || user.role !== 'admin') {
        console.log("Redirecting to login...");
        // window.location.href = 'login.html';
    }

    // Initialize i18n
    if (window.I18n && window.I18n.init) {
        window.I18n.init();
    }

    // UI Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.section-content');
    const toastContainer = document.getElementById('toastContainer');

    // 2. Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Load data for tab
            loadTabData(targetId);
        });
    });

    // Utilities
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHrs < 24) return `${diffHrs} hours ago`;
        return `${diffDays} days ago`;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // 3. Tab Data Loaders
    async function loadTabData(tabId) {
        if (!window.SahakarDB) return;

        switch (tabId) {
            case 'workers':
                await loadWorkers();
                break;
            case 'forecast':
                await loadForecast();
                break;
            case 'wages':
                await loadWages();
                break;
            case 'settings':
                await loadSettings();
                break;
            case 'alerts':
                await loadAlerts();
                break;
        }
    }

    // Tab 1: Workers
    async function loadWorkers() {
        const container = document.getElementById('workersList');
        const countBadge = document.getElementById('pendingCount');
        container.innerHTML = '<div class="empty-state">Loading...</div>';

        try {
            const workers = await window.SahakarDB.getPendingWorkers();
            countBadge.textContent = workers.length;

            if (workers.length === 0) {
                container.innerHTML = `<div class="empty-state" data-i18n="no_pending_workers">No pending applications. All workers have been reviewed.</div>`;
                return;
            }

            container.innerHTML = '';
            workers.forEach(w => {
                const card = document.createElement('div');
                card.className = 'card';
                card.id = `worker-${w.id}`;
                card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">${w.name}</h3>
                            <div class="card-meta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                ${w.phone} | ${w.email}
                            </div>
                            <div class="card-meta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="6.5"></line></svg>
                                Trade: ${w.trade}
                            </div>
                            <div class="card-meta">Society: ${w.societyName}</div>
                            <div class="card-meta">Applied: ${formatRelativeTime(w.joinedAt)}</div>
                        </div>
                    </div>
                    <div>
                        <a href="${w.itiCertUrl}" target="_blank" class="card-meta" style="color: var(--primary); text-decoration: underline;">View ITI Certificate</a>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success btn-approve" data-id="${w.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Approve
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            // Bind events
            document.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    try {
                        await window.SahakarDB.approveWorker(id);
                        const card = document.getElementById(`worker-${id}`);
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.remove();
                            countBadge.textContent = parseInt(countBadge.textContent) - 1;
                            if (container.children.length === 0) {
                                container.innerHTML = `<div class="empty-state" data-i18n="no_pending_workers">No pending applications. All workers have been reviewed.</div>`;
                            }
                        }, 300);
                        showToast('Worker approved successfully', 'success');
                    } catch (error) {
                        showToast('Failed to approve worker', 'error');
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<div class="empty-state" style="color:var(--danger)">Error loading workers</div>`;
        }
    }

    // Tab 2: Forecast
    const forecastTradeSelect = document.getElementById('forecastTrade');
    if (forecastTradeSelect) {
        forecastTradeSelect.addEventListener('change', () => loadForecast());
    }

    async function loadForecast() {
        const trade = document.getElementById('forecastTrade').value;
        const chartContainer = document.getElementById('forecastChart');
        chartContainer.innerHTML = '';

        try {
            const data = await window.SahakarDB.getDemandForecast(trade);
            const days = data.days;
            
            if (!days || days.length === 0) return;

            const maxDemand = Math.max(...days.map(d => d.demand));

            days.forEach(day => {
                const heightPct = Math.max((day.demand / maxDemand) * 100, 10);
                const dayName = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
                
                const group = document.createElement('div');
                group.className = 'chart-bar-group';
                group.innerHTML = `
                    <div class="chart-value">${day.demand}</div>
                    <div class="chart-bar" style="height: ${heightPct}%"></div>
                    <div class="chart-label">${dayName}</div>
                    <div class="chart-advice">${day.shift_advice}</div>
                `;
                chartContainer.appendChild(group);
            });
        } catch (error) {
            console.error("Error loading forecast", error);
        }
    }

    // Tab 3: Wage Floors
    async function loadWages() {
        const container = document.getElementById('wagesList');
        container.innerHTML = '<div class="empty-state">Loading...</div>';

        try {
            const wages = await window.SahakarDB.getWageFloors();
            container.innerHTML = '';
            
            wages.forEach(w => {
                const row = document.createElement('div');
                row.className = 'card';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                
                row.innerHTML = `
                    <div style="font-weight: 500;">
                        ${w.trade}
                    </div>
                    <div class="input-group">
                        <span style="color: var(--text-muted)">₹</span>
                        <input type="number" class="form-control wage-input" data-trade="${w.trade}" value="${w.minAmount}" min="1" style="width: 80px;">
                        <button class="btn btn-primary btn-small btn-save-wage" data-trade="${w.trade}">Save</button>
                    </div>
                `;
                container.appendChild(row);
            });

            document.querySelectorAll('.btn-save-wage').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const trade = e.target.getAttribute('data-trade');
                    const input = document.querySelector(`.wage-input[data-trade="${trade}"]`);
                    const val = parseInt(input.value, 10);
                    
                    if (isNaN(val) || val <= 0) {
                        showToast('Amount must be greater than 0', 'error');
                        return;
                    }

                    try {
                        await window.SahakarDB.updateWageFloor(trade, val);
                        showToast(`Wage floor updated for ${trade}`, 'success');
                    } catch(err) {
                        showToast('Error updating wage', 'error');
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<div class="empty-state" style="color:var(--danger)">Error loading wage floors</div>`;
        }
    }

    // Tab 4: Settings
    async function loadSettings() {
        try {
            const settings = await window.SahakarDB.getSettings();
            document.getElementById('settingFee').value = settings.platform_fee;
            document.getElementById('settingWelfare').value = settings.welfare_pct;
        } catch (error) {
            console.error("Error loading settings");
        }
    }

    const saveFeeBtn = document.getElementById('saveFeeBtn');
    if (saveFeeBtn) {
        saveFeeBtn.addEventListener('click', async () => {
            const val = parseInt(document.getElementById('settingFee').value, 10);
            if (val < 0 || val > 10) {
                showToast('Fee must be between 0 and 10', 'error');
                return;
            }
            try {
                await window.SahakarDB.updateSettings('platform_fee', val);
                showToast('Platform fee updated', 'success');
            } catch(e) {
                showToast('Error updating setting', 'error');
            }
        });
    }

    const saveWelfareBtn = document.getElementById('saveWelfareBtn');
    if (saveWelfareBtn) {
        saveWelfareBtn.addEventListener('click', async () => {
            const val = parseFloat(document.getElementById('settingWelfare').value);
            if (val < 1 || val > 5) {
                showToast('Welfare pct must be between 1 and 5', 'error');
                return;
            }
            try {
                await window.SahakarDB.updateSettings('welfare_pct', val);
                showToast('Welfare contribution updated', 'success');
            } catch(e) {
                showToast('Error updating setting', 'error');
            }
        });
    }

    // Tab 5: Alerts
    async function loadAlerts() {
        const sosContainer = document.getElementById('sosList');
        const grievContainer = document.getElementById('grievancesList');
        
        sosContainer.innerHTML = '<div class="empty-state">Loading SOS...</div>';
        grievContainer.innerHTML = '<div class="empty-state">Loading Grievances...</div>';

        try {
            const alerts = await window.SahakarDB.getSosAlerts();
            if (alerts.length === 0) {
                sosContainer.innerHTML = `<div class="empty-state">No SOS alerts</div>`;
            } else {
                sosContainer.innerHTML = '';
                alerts.forEach(a => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const badgeClass = a.resolved ? 'badge-success' : 'badge-danger';
                    const badgeText = a.resolved ? 'Resolved' : 'Unresolved';
                    
                    let resolveBtn = '';
                    if (!a.resolved) {
                        resolveBtn = `<div class="card-actions"><button class="btn btn-small btn-outline btn-resolve-sos" data-id="${a.id}">Mark Resolved</button></div>`;
                    }

                    card.innerHTML = `
                        <div class="card-header">
                            <span class="card-title">${a.userName}</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <div class="card-meta">Time: ${formatDate(a.createdAt)}</div>
                        <div class="card-meta">Location: ${a.lat}, ${a.lng}</div>
                        ${resolveBtn}
                    `;
                    sosContainer.appendChild(card);
                });
            }

            const grievances = await window.SahakarDB.getGrievances();
            if (grievances.length === 0) {
                grievContainer.innerHTML = `<div class="empty-state">No Grievances</div>`;
            } else {
                grievContainer.innerHTML = '';
                grievances.forEach(g => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const badgeClass = g.status === 'resolved' ? 'badge-success' : 'badge';
                    
                    let resolveBtn = '';
                    if (g.status === 'open') {
                        resolveBtn = `<div class="card-actions"><button class="btn btn-small btn-outline btn-resolve-griev" data-id="${g.id}">Mark Resolved</button></div>`;
                    }

                    card.innerHTML = `
                        <div class="card-header">
                            <span class="card-title">${g.subject}</span>
                            <span class="badge ${badgeClass}">${g.status}</span>
                        </div>
                        <div class="card-meta">By: ${g.userName} on ${formatDate(g.createdAt)}</div>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-main);">${g.body}</p>
                        ${resolveBtn}
                    `;
                    grievContainer.appendChild(card);
                });
            }

            // Bind resolve buttons
            document.querySelectorAll('.btn-resolve-sos').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    showToast('SOS Marked Resolved (mock)', 'success');
                    e.target.remove();
                });
            });
            document.querySelectorAll('.btn-resolve-griev').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    showToast('Grievance Marked Resolved (mock)', 'success');
                    e.target.remove();
                });
            });

        } catch (err) {
            console.error(err);
            sosContainer.innerHTML = `<div class="empty-state" style="color:var(--danger)">Error loading alerts</div>`;
        }
    }

    // Initial load
    loadTabData('workers');
});
