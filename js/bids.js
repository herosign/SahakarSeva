document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    if (!window.SahakarDB) {
        console.error("SahakarDB not loaded");
        return;
    }
    
    let user = null;
    try {
        user = await window.SahakarDB.getCurrentUser();
    } catch(e) {}

    if (!user) {
        // Fallback for demo mode
        user = { id: 'c1', name: 'Ravi Kumar', role: 'customer' };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job');

    if (!jobId) {
        alert("No job ID specified.");
        window.location.href = '/customer-dashboard.html';
        return;
    }

    // Elements
    const jobTradeEl = document.getElementById('job-trade');
    const jobOfferEl = document.getElementById('job-offer');
    const jobDescEl = document.getElementById('job-desc');
    const bidCountEl = document.getElementById('bid-count');
    const bidsListEl = document.getElementById('bids-list');
    const emptyStateEl = document.getElementById('empty-state');
    const langSelect = document.getElementById('lang-select');
    const btnLogout = document.getElementById('btn-logout');

    let unsubscribe = null;

    // Setup basic UI
    if (window.I18n) {
        window.I18n.applyToPage();
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                window.I18n.setLanguage(e.target.value);
                window.I18n.applyToPage();
                fetchAndRenderBids();
            });
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.SahakarDB.signOut();
            window.location.href = '/index.html';
        });
    }

    // Fetch actual job details
    try {
        const job = await window.SahakarDB.getJob(jobId);
        if (job) {
            if (jobTradeEl) jobTradeEl.textContent = `${job.trade} Service`;
            if (jobOfferEl) jobOfferEl.textContent = `₹${job.offer}`;
            if (jobDescEl) jobDescEl.textContent = job.description || job.address;
        } else {
            if (jobTradeEl) jobTradeEl.textContent = "Service Request";
            if (jobOfferEl) jobOfferEl.textContent = "Offer Active";
            if (jobDescEl) jobDescEl.textContent = "Reviewing bids from verified cooperative workers";
        }
    } catch(e) {
        console.warn("Could not load job details:", e);
    }

    function renderBids(bids) {
        if (!bids || bids.length === 0) {
            if (bidsListEl) {
                bidsListEl.innerHTML = '';
                if (emptyStateEl) bidsListEl.appendChild(emptyStateEl);
            }
            if (bidCountEl) bidCountEl.textContent = 'Waiting for workers to bid...';
            return;
        }

        bids.sort((a, b) => a.amount - b.amount); // Sort by amount ascending
        
        if (bidCountEl) bidCountEl.textContent = `${bids.length} bid${bids.length > 1 ? 's' : ''} received`;
        if (bidsListEl) bidsListEl.innerHTML = '';

        bids.forEach(bid => {
            const card = document.createElement('div');
            card.className = 'bid-card';
            
            const ts = bid.trustScore || {overall: 96.3, avgRating: 4.8, completionRate: 95.7, tenureYears: 2.3};
            
            const ratingScore = (ts.avgRating / 5) * 60;
            const completionScore = (ts.completionRate / 100) * 30;
            const tenureScore = Math.min(ts.tenureYears * 5, 10);
            const totalScore = (ratingScore + completionScore + tenureScore).toFixed(1);

            let priceHtml = `₹${bid.amount}`;
            if (bid.isCounter || bid.is_counter) {
                priceHtml += `<span class="counter-tag" style="background:rgba(217,119,6,0.15); color:#d97706; font-size:11px; font-weight:800; padding:2px 8px; border-radius:10px; margin-left:6px;">Counter</span>`;
            }

            card.innerHTML = `
                <div class="bid-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="worker-info">
                        <span class="worker-name" style="font-weight:800; font-size:16px; color:var(--color-secondary); display:block;">${bid.workerName || 'Suresh Yadav'}</span>
                        <span class="society-name" style="font-size:12px; color:var(--color-text-muted);">${bid.societyName || 'Jan Seva Society #12 • Verified'}</span>
                    </div>
                    <div class="trust-badge-container" style="cursor:pointer;" title="Click to view transparent Trust Score breakdown">
                        <div class="trust-badge" style="background:rgba(45,106,79,0.12); color:var(--color-primary); padding:4px 10px; border-radius:20px; font-weight:800; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
                            ★ ${ts.overall || Math.round(totalScore)}
                        </div>
                        <div class="trust-breakdown" style="display:none; font-size:11px; background:#f8fafb; border:1px solid #e5e7eb; border-radius:10px; padding:8px; margin-top:6px;">
                            <div class="trust-row"><span>Rating (60%):</span> ★${ts.avgRating} → ${ratingScore.toFixed(1)}</div>
                            <div class="trust-row"><span>Completion (30%):</span> ${ts.completionRate}% → ${completionScore.toFixed(1)}</div>
                            <div class="trust-row"><span>Tenure (10%):</span> ${ts.tenureYears} yrs → ${tenureScore.toFixed(1)}</div>
                            <div class="trust-row" style="font-weight:800; border-top:1px dashed #cbd5e1; margin-top:4px; padding-top:2px;"><span>Total:</span> ${totalScore}</div>
                        </div>
                    </div>
                </div>
                <div class="bid-details" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                    <div class="logistics" style="font-size:12px; color:var(--color-text-muted);">
                        📍 ~${bid.distance || '1.8'} km away • ETA: ~${bid.eta || '8'} min
                    </div>
                    <div class="bid-price" style="font-size:20px; font-weight:900; color:var(--color-primary);">
                        ${priceHtml}
                    </div>
                </div>
                <button class="btn btn-primary" style="margin-top:14px; width:100%; border-radius:12px; padding:12px; font-weight:800; font-size:14px; cursor:pointer;" data-bid-id="${bid.id}">
                    Accept Bid & Track Worker →
                </button>
            `;
            
            // Toggle trust breakdown
            const badgeContainer = card.querySelector('.trust-badge-container');
            const breakdown = card.querySelector('.trust-breakdown');
            if (badgeContainer && breakdown) {
                badgeContainer.addEventListener('click', () => {
                    breakdown.style.display = breakdown.style.display === 'none' ? 'block' : 'none';
                });
            }

            // Accept bid
            const acceptBtn = card.querySelector('.btn-primary');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', async () => {
                    try {
                        acceptBtn.disabled = true;
                        acceptBtn.textContent = 'Accepting...';
                        await window.SahakarDB.acceptBid(bid.id);
                        window.location.href = `/track.html?job=${jobId}`;
                    } catch(e) {
                        console.error("Error accepting bid:", e);
                        alert("Failed to accept bid.");
                        acceptBtn.disabled = false;
                        acceptBtn.textContent = 'Accept Bid & Track Worker →';
                    }
                });
            }

            if (bidsListEl) bidsListEl.appendChild(card);
        });
    }

    async function fetchAndRenderBids() {
        try {
            const bids = await window.SahakarDB.getBidsForJob(jobId);
            renderBids(bids);
        } catch(e) {
            console.error("Failed to fetch bids", e);
        }
    }

    // Initial fetch
    await fetchAndRenderBids();

    // Subscribe to bids
    try {
        if (window.SahakarDB.subscribeToJobBids) {
            unsubscribe = window.SahakarDB.subscribeToJobBids(jobId, (bids) => {
                renderBids(bids);
            });
        }
    } catch(e) {
        console.warn("Realtime subscription failed, using mock", e);
    }

    window.addEventListener('unload', () => {
        if (unsubscribe) unsubscribe();
    });
});
