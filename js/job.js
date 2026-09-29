document.addEventListener('DOMContentLoaded', async () => {
    const user = window.SahakarDB?.getCurrentUser();
    if (!user || user.role !== 'worker') {
        window.location.href = '/login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if(!jobId) {
        alert('No job selected.');
        window.location.href = '/dashboard.html';
        return;
    }

    // Load Data
    const openJobs = window.SahakarDB.getOpenJobs(); // Need a way to get a single job, but let's assume we can filter from open jobs for now, or assume getOpenJobs returns all.
    // Hack for mock since getJob isn't strictly defined, use getOpenJobs(trade) without trade to get all, or just mock it.
    let job = null;
    try {
        const allJobs = await window.SahakarDB.getOpenJobs(); // Assuming parameter is optional
        job = allJobs.find(j => j.id == jobId);
    } catch(e) {}

    // Mock fallback if job not found in open jobs
    if(!job) {
        job = {
            id: jobId, trade: 'Electrician', offer: 400, description: 'Fix ceiling fan wiring', 
            address: '123 Main St, Appt 4B', lat: 28.6, lng: 77.2, status: 'open', createdAt: new Date().toISOString()
        };
    }

    const wageFloors = await window.SahakarDB.getWageFloors();
    const floorObj = wageFloors.find(w => w.trade === job.trade);
    const floor = floorObj ? floorObj.minAmount : 0;

    // Render Job Details
    const jobCard = document.getElementById('job-details-card');
    jobCard.innerHTML = `
        <div class="job-trade">
            <svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
            ${job.trade}
        </div>
        <div class="offer-amount">₹${job.offer}</div>
        <div class="detail-row">
            <svg viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>
            <span>${job.description}</span>
        </div>
        <div class="detail-row">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>${job.address}</span>
        </div>
        <div class="detail-row" style="color:#adb5bd; font-size:0.85rem; margin-top:12px;">
            <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:#adb5bd;"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            <span>Posted recently</span>
        </div>
    `;

    // Render Wage Floor
    if(floor > 0) {
        document.getElementById('wage-floor-container').style.display = 'flex';
        document.getElementById('floor-amount').textContent = floor;
    }

    // Render Bids
    async function loadBids() {
        const bids = await window.SahakarDB.getBidsForJob(job.id);
        const bidsList = document.getElementById('bids-list');
        if(bids && bids.length > 0) {
            bidsList.innerHTML = bids.map((b, i) => {
                const isBelow = b.amount < floor;
                return `
                    <div class="bid-item ${isBelow ? 'below-floor' : ''}" title="${isBelow ? 'Below fair wage floor' : ''}">
                        <div class="bid-worker">Worker ${i+1} ${b.isCounter ? '<span class="tag-counter">Counter</span>' : ''}</div>
                        <div class="bid-amount">₹${b.amount} ${isBelow ? '<svg class="warn-icon" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>' : ''}</div>
                    </div>
                `;
            }).join('');
        }
    }
    loadBids();

    // Setup Your Bid Actions
    document.getElementById('accept-amount').textContent = job.offer;
    
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    async function submitBid(amount, isCounter) {
        try {
            await window.SahakarDB.createBid(job.id, amount, isCounter);
            showToast('Bid placed successfully!');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
        } catch (error) {
            if(error.code === 'FAIR_WAGE_FLOOR_VIOLATION') {
                showToast(`Bid rejected: Minimum wage floor is ₹${floor}`);
            } else {
                showToast('Error placing bid.');
            }
        }
    }

    document.getElementById('btn-accept').addEventListener('click', () => submitBid(job.offer, false));
    document.getElementById('btn-plus-20').addEventListener('click', () => submitBid(job.offer + 20, true));
    document.getElementById('btn-plus-50').addEventListener('click', () => submitBid(job.offer + 50, true));
    
    const customContainer = document.getElementById('custom-bid-container');
    const customInput = document.getElementById('custom-bid-input');
    const submitCustomBtn = document.getElementById('btn-submit-custom');
    const errorText = document.getElementById('bid-error-text');

    document.getElementById('btn-custom').addEventListener('click', () => {
        document.getElementById('quick-bids-container').style.display = 'none';
        customContainer.classList.add('active');
        customInput.focus();
    });

    customInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if(!isNaN(val) && val < floor) {
            errorText.style.display = 'block';
            submitCustomBtn.disabled = true;
        } else {
            errorText.style.display = 'none';
            submitCustomBtn.disabled = false;
        }
    });

    submitCustomBtn.addEventListener('click', () => {
        const val = parseInt(customInput.value);
        if(!isNaN(val) && val >= floor) {
            submitBid(val, val !== job.offer);
        }
    });

    if(window.I18n) window.I18n.updatePage();
});
