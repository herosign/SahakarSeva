document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = window.SahakarDB?.getCurrentUser();
    if (!user || user.role !== 'worker') {
        window.location.href = '/login.html'; // Assuming redirect needed
        return;
    }

    const workerProfile = await window.SahakarDB.getWorkerProfile(user.id);
    if (!workerProfile || !workerProfile.approved) {
        alert('Your profile is pending approval.');
        return;
    }

    // Header Setup
    document.getElementById('worker-name').textContent = user.name || 'Worker';
    document.getElementById('worker-trade-badge').textContent = workerProfile.trade;

    // Load Welfare Account
    const welfare = await window.SahakarDB.getWelfareAccount(user.id);
    if (welfare) {
        document.getElementById('pf-balance').textContent = `₹${welfare.pfBalance}`;
        document.getElementById('pool-balance').textContent = `₹${welfare.poolBalance}`;
    }

    // Load Insurance Policies
    const policies = await window.SahakarDB.getInsurancePolicies(user.id);
    const insuranceDetails = document.getElementById('insurance-details');
    if (policies && policies.length > 0) {
        insuranceDetails.innerHTML = policies.map(p => `<div><strong>${p.scheme}:</strong> ${p.policyNo} (Valid: ${p.validTill})</div>`).join('');
    } else {
        insuranceDetails.innerHTML = '<span data-i18n="not_enrolled">Not enrolled. <a href="#">Learn more</a></span>';
    }

    // Load Trust Score
    const trust = await window.SahakarDB.getTrustScore(user.id);
    if (trust) {
        document.getElementById('overall-score').textContent = trust.overall;
        document.getElementById('score-rating').innerHTML = `★${trust.avgRating} &rarr; ${trust.ratingComponent}`;
        document.getElementById('score-completion').innerHTML = `${trust.completionRate}% &rarr; ${trust.completionComponent}`;
        document.getElementById('score-tenure').innerHTML = `${trust.tenureYears} yrs &rarr; ${trust.tenureComponent}`;
    }

    // Trust Card Toggle
    const trustCard = document.getElementById('trust-card');
    const trustDetails = document.getElementById('trust-details');
    trustCard.addEventListener('click', () => {
        trustDetails.classList.toggle('expanded');
        trustCard.setAttribute('aria-expanded', trustDetails.classList.contains('expanded'));
    });

    // Distance Calculation (Haversine)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;  
        const dLon = (lon2 - lon1) * Math.PI / 180; 
        const a = 
            0.5 - Math.cos(dLat)/2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            (1 - Math.cos(dLon))/2;
        return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1);
    }

    // Jobs Subscription
    let unsubscribeJobs = window.SahakarDB.subscribeToOpenJobs((jobs) => {
        const jobsContainer = document.getElementById('jobs-container');
        const emptyState = document.getElementById('empty-jobs');
        const jobCount = document.getElementById('job-count');

        // Filter jobs by trade (optional but good practice)
        const myJobs = jobs.filter(j => j.trade === workerProfile.trade);
        jobCount.textContent = `(${myJobs.length})`;

        if (myJobs.length === 0) {
            jobsContainer.innerHTML = '';
            jobsContainer.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        jobsContainer.innerHTML = '';
        
        myJobs.forEach(job => {
            const distance = calculateDistance(workerProfile.lat, workerProfile.lng, job.lat, job.lng);
            const a = document.createElement('a');
            a.className = 'job-card';
            a.href = `/job.html?id=${job.id}`;
            a.innerHTML = `
                <div class="job-header">
                    <div class="job-trade">
                        <svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                        ${job.trade}
                    </div>
                    <div class="job-offer">₹${job.offer}</div>
                </div>
                <div class="job-desc">${job.description.length > 50 ? job.description.substring(0, 50) + '...' : job.description}</div>
                <div class="job-meta">
                    <div>
                        <span style="display:block;">${job.address}</span>
                        <span style="display:block; margin-top:2px; font-weight:bold;">~${distance} km</span>
                    </div>
                    <button class="btn-icon read-aloud-btn" data-text="Job for ${job.trade}. Offer is ${job.offer} rupees. ${job.description}" aria-label="Read Aloud">
                        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    </button>
                </div>
            `;
            jobsContainer.appendChild(a);
        });

        // Attach Read Aloud events
        document.querySelectorAll('.read-aloud-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent navigating to job
                if(window.Voice && window.Voice.speak) {
                    window.Voice.speak(btn.getAttribute('data-text'));
                }
            });
        });
    });

    // Cleanup on unload
    window.addEventListener('unload', () => {
        if(unsubscribeJobs) unsubscribeJobs();
    });

    // Toast Utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    // SOS Button
    document.getElementById('btn-sos').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await window.SahakarDB.submitSos(position.coords.latitude, position.coords.longitude);
                    showToast('SOS Alert Sent with your location!');
                },
                () => {
                    showToast('SOS Sent, but location access was denied.');
                    window.SahakarDB.submitSos(workerProfile.lat, workerProfile.lng); // fallback
                }
            );
        } else {
            window.SahakarDB.submitSos(workerProfile.lat, workerProfile.lng);
            showToast('SOS Sent!');
        }
    });

    // Grievance Modal
    const gModal = document.getElementById('grievance-modal');
    document.getElementById('btn-grievance').addEventListener('click', () => {
        gModal.style.display = 'flex';
    });
    document.getElementById('btn-cancel-grievance').addEventListener('click', () => {
        gModal.style.display = 'none';
    });
    document.getElementById('btn-submit-grievance').addEventListener('click', async () => {
        const sub = document.getElementById('g-subject').value;
        const body = document.getElementById('g-body').value;
        if(sub && body) {
            await window.SahakarDB.submitGrievance(sub, body);
            gModal.style.display = 'none';
            showToast('Grievance submitted successfully.');
        } else {
            alert('Please fill out both fields.');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        // Mock logout
        window.location.href = '/login.html';
    });

    // Lang select
    const langSelect = document.getElementById('lang-select');
    langSelect.addEventListener('change', (e) => {
        if(window.I18n) window.I18n.setLanguage(e.target.value);
    });

    if(window.I18n) window.I18n.updatePage();
});
