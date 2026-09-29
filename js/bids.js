document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    if (!window.SahakarDB) {
        console.error("SahakarDB not loaded");
        return;
    }
    
    const user = window.SahakarDB.getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job');

    if (!jobId) {
        alert("No job ID specified.");
        window.location.href = '/booking.html';
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
        langSelect.addEventListener('change', (e) => {
            window.I18n.setLanguage(e.target.value);
            window.I18n.applyToPage();
            // Re-render bids to update text
            fetchAndRenderBids();
        });
    }

    btnLogout.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    // Mock loading job details (in reality this would fetch from DB)
    // We'll just show some placeholders or get from db if method existed
    // For now, let's assume we can fetch job or pass via storage/db
    // We rely on getBidsForJob to at least work.
    
    // In SahakarDB mock, we might not have a getJob(id), so we'll just populate from bids if needed or leave static.
    jobTradeEl.textContent = "Service Request";
    jobOfferEl.textContent = "Offer Pending";
    jobDescEl.textContent = "Loading job details...";

    function renderBids(bids) {
        if (!bids || bids.length === 0) {
            bidsListEl.innerHTML = '';
            bidsListEl.appendChild(emptyStateEl);
            bidCountEl.textContent = window.I18n ? window.I18n.t('bids.waiting') : 'Waiting for workers to bid...';
            return;
        }

        bids.sort((a, b) => a.amount - b.amount); // Sort by amount ascending
        
        bidCountEl.textContent = `${bids.length} bid${bids.length > 1 ? 's' : ''} received`;
        bidsListEl.innerHTML = '';

        // Update Job summary from first bid if possible
        if (bids.length > 0) {
            jobTradeEl.textContent = bids[0].trade || "Service";
            jobDescEl.textContent = "Job ID: " + bids[0].jobId;
        }

        bids.forEach(bid => {
            const card = document.createElement('div');
            card.className = 'bid-card';
            
            const ts = bid.trustScore || {overall: 90, avgRating: 4.5, completionRate: 95, tenureYears: 1};
            
            const ratingScore = (ts.avgRating / 5) * 60;
            const completionScore = (ts.completionRate / 100) * 30;
            const tenureScore = Math.min(ts.tenureYears * 5, 10);
            const totalScore = (ratingScore + completionScore + tenureScore).toFixed(1);

            let priceHtml = `₹${bid.amount}`;
            if (bid.isCounter) {
                priceHtml += `<span class="counter-tag">Counter</span>`;
            }

            card.innerHTML = `
                <div class="bid-header">
                    <div class="worker-info">
                        <span class="worker-name">${bid.workerName}</span>
                        <span class="society-name">${bid.societyName}</span>
                    </div>
                    <div class="trust-badge-container">
                        <div class="trust-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            ${ts.overall || Math.round(totalScore)}
                        </div>
                        <div class="trust-breakdown">
                            <div class="trust-row"><span>Rating (60%):</span> ★${ts.avgRating} -> ${ratingScore.toFixed(1)}</div>
                            <div class="trust-row"><span>Completion (30%):</span> ${ts.completionRate}% -> ${completionScore.toFixed(1)}</div>
                            <div class="trust-row"><span>Tenure (10%):</span> ${ts.tenureYears} yrs -> ${tenureScore.toFixed(1)}</div>
                            <div class="trust-row"><span>Total:</span> ${totalScore}</div>
                        </div>
                    </div>
                </div>
                <div class="bid-details">
                    <div class="logistics">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${bid.distance || '2.0 km'} • ~${bid.eta || '10 min'}
                    </div>
                    <div class="bid-price">
                        ${priceHtml}
                    </div>
                </div>
                <button class="btn-primary" style="margin-top: 12px; width: 100%;" data-bid-id="${bid.id}">Accept Bid</button>
            `;
            
            // Toggle trust breakdown
            const badgeContainer = card.querySelector('.trust-badge-container');
            const breakdown = card.querySelector('.trust-breakdown');
            badgeContainer.addEventListener('click', () => {
                breakdown.classList.toggle('show');
            });

            // Accept bid
            const acceptBtn = card.querySelector('.btn-primary');
            acceptBtn.addEventListener('click', () => {
                try {
                    window.SahakarDB.acceptBid(bid.id);
                    window.location.href = `/track.html?job=${jobId}`;
                } catch(e) {
                    console.error("Error accepting bid:", e);
                    alert("Failed to accept bid.");
                }
            });

            bidsListEl.appendChild(card);
        });
    }

    function fetchAndRenderBids() {
        try {
            const bids = window.SahakarDB.getBidsForJob(jobId);
            renderBids(bids);
        } catch(e) {
            console.error("Failed to fetch bids", e);
        }
    }

    // Initial fetch
    fetchAndRenderBids();

    // Subscribe
    try {
        unsubscribe = window.SahakarDB.subscribeToJobBids(jobId, (bids) => {
            renderBids(bids);
        });
    } catch(e) {
        console.warn("Realtime subscription failed, using mock", e);
    }

    window.addEventListener('unload', () => {
        if (unsubscribe) unsubscribe();
    });
});
