document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if(!jobId) {
        alert('Invalid Job ID');
        return;
    }

    let invoice = null;
    try {
        invoice = await window.SahakarDB.getInvoice(jobId);
    } catch(e) {}

    // Mock fallback if invoice doesn't exist yet
    if(!invoice) {
        invoice = await window.SahakarDB.createInvoice(jobId, 0); 
        // fallback mock if DB fails
        if(!invoice) {
            invoice = {
                jobId: jobId, baseFare: 400, welfareAmount: 8, platformFee: 0, tip: 0, total: 408, workerReceives: 400
            };
        }
    }

    let currentTip = invoice.tip || 0;
    let currentRating = 0;
    const welfarePct = 0.02;

    function updateInvoiceDisplay() {
        const base = invoice.baseFare;
        const welfare = Math.round(base * welfarePct);
        const tip = currentTip;
        const total = base + tip;
        const workerReceives = (base - welfare) + tip;

        document.getElementById('inv-base').textContent = `₹${base}`;
        document.getElementById('inv-welfare').textContent = `₹${welfare}`;
        
        if(tip > 0) {
            document.getElementById('row-tip').style.display = 'flex';
            document.getElementById('inv-tip').textContent = `₹${tip}`;
        } else {
            document.getElementById('row-tip').style.display = 'none';
        }

        document.getElementById('inv-total').textContent = `₹${total}`;
        document.getElementById('inv-worker').textContent = `₹${workerReceives}`;

        // Update bars
        const totalAmountForCalc = base + tip;
        if(totalAmountForCalc > 0) {
            const workerPct = (workerReceives / totalAmountForCalc) * 100;
            const welfareBarPct = (welfare / totalAmountForCalc) * 100;
            
            document.getElementById('bar-worker').style.width = `${workerPct}%`;
            document.getElementById('bar-welfare').style.width = `${welfareBarPct}%`;
        }
    }

    updateInvoiceDisplay();

    // Rating Logic
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-val'));
            stars.forEach(s => {
                if(parseInt(s.getAttribute('data-val')) <= currentRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Tip Logic
    const tipBtns = document.querySelectorAll('.tip-btn');
    tipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTip = parseInt(btn.getAttribute('data-val'));
            updateInvoiceDisplay();
        });
    });

    // Submit Review
    document.getElementById('btn-submit-review').addEventListener('click', async () => {
        if(currentRating === 0) {
            alert('Please select a star rating.');
            return;
        }

        try {
            // WorkerId is assumed to be known or fetched via job details, mocking it here
            await window.SahakarDB.submitRating(jobId, 'worker-123', currentRating, currentTip);
            
            // Switch views
            document.getElementById('invoice-view').style.display = 'none';
            document.getElementById('thank-you-view').style.display = 'block';
            window.scrollTo(0,0);
        } catch(e) {
            alert('Error submitting rating.');
        }
    });

    if(window.I18n) window.I18n.updatePage();
});
