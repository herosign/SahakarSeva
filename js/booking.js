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

    // Elements
    const micBtn = document.getElementById('mic-btn');
    const micStatus = document.getElementById('mic-status');
    const form = document.getElementById('booking-form');
    const tradeTiles = document.querySelectorAll('.trade-tile');
    const descriptionInput = document.getElementById('description');
    const addressInput = document.getElementById('address');
    const offerInput = document.getElementById('offer');
    const fairRangeHint = document.getElementById('fair-range-hint');
    const wageWarning = document.getElementById('wage-warning');
    const wageWarningText = document.getElementById('wage-warning-text');
    const summaryCard = document.getElementById('summary-card');
    const langSelect = document.getElementById('lang-select');
    const btnLogout = document.getElementById('btn-logout');

    let selectedTrade = '';
    let wageFloors = [];
    let userLat = null;
    let userLng = null;

    // Load wage floors
    try {
        wageFloors = window.SahakarDB.getWageFloors();
    } catch(e) {
        console.error("Failed to load wage floors", e);
    }

    // Geolocation
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
        }, (err) => {
            console.warn("Geolocation error:", err);
            // Default location
            userLat = 18.5204;
            userLng = 73.8567;
        });
    }

    // i18n
    if (window.I18n) {
        window.I18n.applyToPage();
        langSelect.addEventListener('change', (e) => {
            window.I18n.setLanguage(e.target.value);
            window.I18n.applyToPage();
            updateFairRange(); // Update translated text
        });
    }

    // Logout
    btnLogout.addEventListener('click', () => {
        // Implement logout logic or redirection
        window.location.href = '/login.html';
    });

    // Trade Selection
    tradeTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tradeTiles.forEach(t => t.classList.remove('active'));
            tile.classList.add('active');
            selectedTrade = tile.dataset.trade;
            updateFairRange();
            showSummaryCard();
        });
        
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tile.click();
            }
        });
    });

    function updateFairRange() {
        if (!selectedTrade) {
            fairRangeHint.textContent = '';
            return;
        }
        
        const floor = wageFloors.find(f => f.trade === selectedTrade)?.minAmount || 0;
        if (floor > 0) {
            const translatedPrefix = window.I18n ? window.I18n.t('booking.fair_range') : 'Fair range:';
            fairRangeHint.textContent = `${translatedPrefix} ₹${floor} - ₹${floor + 200}`;
        }
    }

    function showSummaryCard() {
        summaryCard.classList.add('show');
    }

    // Input handlers
    descriptionInput.addEventListener('input', showSummaryCard);
    addressInput.addEventListener('input', showSummaryCard);
    offerInput.addEventListener('input', () => {
        wageWarning.classList.remove('show');
        showSummaryCard();
    });

    // Voice
    micBtn.addEventListener('click', () => {
        if (window.Voice && window.Voice.isSupported()) {
            micBtn.classList.add('mic-btn--active');
            micStatus.textContent = window.I18n ? window.I18n.t('booking.listening') : 'Listening...';
            
            window.Voice.startListening((transcript) => {
                micBtn.classList.remove('mic-btn--active');
                micStatus.textContent = window.I18n ? window.I18n.t('booking.processing') : 'Processing...';
                
                try {
                    const parsed = window.SahakarDB.parseBooking(transcript);
                    if (parsed.service_type) {
                        const tile = document.querySelector(`.trade-tile[data-trade="${parsed.service_type.toLowerCase()}"]`);
                        if (tile) tile.click();
                        else selectedTrade = parsed.service_type; // fallback
                    }
                    if (parsed.location) addressInput.value = parsed.location;
                    if (parsed.budget) {
                        offerInput.value = parsed.budget.replace(/[^0-9]/g, '');
                    }
                    descriptionInput.value = transcript;
                    
                    micStatus.textContent = window.I18n ? window.I18n.t('booking.tap_to_speak') : 'Tap to speak';
                    showSummaryCard();
                    
                    if (window.Voice) {
                         window.Voice.speak("I've filled out the form based on your request. Please review and confirm.");
                    }
                } catch (e) {
                    console.error("Parse error", e);
                    descriptionInput.value = transcript;
                    micStatus.textContent = window.I18n ? window.I18n.t('booking.tap_to_speak') : 'Tap to speak';
                    showSummaryCard();
                }
            });
        } else {
            alert("Voice recognition not supported in this browser.");
        }
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!selectedTrade) {
            alert("Please select a service.");
            return;
        }

        const offerAmt = parseInt(offerInput.value, 10);
        
        try {
            const job = window.SahakarDB.createJob({
                trade: selectedTrade,
                offer: offerAmt,
                description: descriptionInput.value,
                address: addressInput.value,
                lat: userLat,
                lng: userLng
            });
            
            window.location.href = `/bids.html?job=${job.id}`;
            
        } catch (error) {
            if (error.code === 'FAIR_WAGE_FLOOR_VIOLATION') {
                wageWarningText.textContent = `This amount is below the fair wage floor of ₹${error.floor} for ${selectedTrade}. Please increase your offer.`;
                wageWarning.classList.add('show');
                offerInput.focus();
            } else {
                console.error("Booking error", error);
                alert("An error occurred while booking.");
            }
        }
    });
});
