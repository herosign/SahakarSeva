document.addEventListener('DOMContentLoaded', async () => {
    if (!window.SahakarDB) return;
    
    // Auth Check
    const user = await window.SahakarDB.getCurrentUser();
    if (!user) {
        window.location.href = '/customer-login.html';
        return;
    }

    // Elements
    const micBtn = document.getElementById('voiceMicBtn');
    const micStatus = document.getElementById('voiceLabel');
    const form = document.getElementById('bookingForm');
    const tradeTiles = document.querySelectorAll('.trade-tile');
    const descriptionInput = document.getElementById('jobDescription');
    const addressInput = document.getElementById('locationInput');
    const offerInput = document.getElementById('offerPrice');
    const fairRangeHint = document.getElementById('fairRangeHint');
    const wageWarning = document.getElementById('wageWarning');
    const selectedTradeInput = document.getElementById('selectedTrade');
    const previewBtn = document.getElementById('previewBookingBtn');
    const summaryCard = document.getElementById('summaryCard');
    const sumTrade = document.getElementById('sumTrade');
    const sumOffer = document.getElementById('sumOffer');
    const sumDesc = document.getElementById('sumDesc');
    const sumLoc = document.getElementById('sumLoc');
    const editBtn = document.getElementById('editBookingBtn');
    const confirmBtn = document.getElementById('confirmBookingBtn');
    const langSelect = document.getElementById('lang-select');
    const btnLogout = document.getElementById('btn-logout');
    const voiceTranscriptBox = document.getElementById('voiceTranscriptBox');
    const voiceSuccessPill = document.getElementById('voiceSuccessPill');

    let selectedTrade = 'Electrician';
    let wageFloors = [];
    let userLat = 28.6270, userLng = 77.3650;

    try { wageFloors = await window.SahakarDB.getWageFloors(); } catch(e){}

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
            userLat = pos.coords.latitude; userLng = pos.coords.longitude;
        }, () => { userLat = 28.6270; userLng = 77.3650; });
    }

    if (window.I18n) {
        window.I18n.applyToPage();
        if(langSelect){
            langSelect.addEventListener('change', (e) => {
                window.I18n.setLanguage(e.target.value); 
                window.I18n.applyToPage(); 
                updateFairRange();
            });
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.SahakarDB.signOut();
            window.location.href = '/index.html';
        });
    }

    // Trade Selection Handlers
    tradeTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tradeTiles.forEach(t => {
                t.classList.remove('active');
                t.style.border = ''; 
                t.style.background = '';
            });
            tile.classList.add('active');
            tile.style.border = '2px solid var(--color-primary)';
            tile.style.background = 'rgba(45,106,79,0.1)';
            selectedTrade = tile.dataset.trade;
            if (selectedTradeInput) selectedTradeInput.value = selectedTrade;
            updateFairRange();
        });
    });

    function selectTradeByName(tradeName) {
        if (!tradeName) return;
        const normalized = tradeName.toLowerCase();
        let targetTile = null;
        tradeTiles.forEach(tile => {
            if (tile.dataset.trade.toLowerCase() === normalized) {
                targetTile = tile;
            }
        });
        if (targetTile) {
            targetTile.click();
        } else {
            selectedTrade = tradeName;
            if (selectedTradeInput) selectedTradeInput.value = selectedTrade;
            updateFairRange();
        }
    }

    function updateFairRange() {
        if (!selectedTrade || !fairRangeHint) return;
        const floor = wageFloors.find(f => f.trade.toLowerCase() === selectedTrade.toLowerCase())?.minAmount || 300;
        fairRangeHint.textContent = `Fair range: ₹${floor} - ₹${floor + 200}`;
    }

    updateFairRange();

    const voiceProcessingBox = document.getElementById('voiceProcessingBox');
    const voiceProcessingText = document.getElementById('voiceProcessingText');
    const aiLangTag = document.getElementById('aiLangTag');
    const aiSummaryDetails = document.getElementById('aiSummaryDetails');
    const voiceLangPills = document.querySelectorAll('.voice-lang-pill');

    let currentVoiceLang = localStorage.getItem('sahakar_voice_lang') || 'en';

    // Set initial active language pill
    voiceLangPills.forEach(pill => {
        if (pill.getAttribute('data-lang') === currentVoiceLang) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }

        pill.addEventListener('click', () => {
            voiceLangPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentVoiceLang = pill.getAttribute('data-lang');
            if (window.Voice) {
                window.Voice.setLanguage(currentVoiceLang);
            }
            if (micStatus) {
                const langName = pill.textContent.trim();
                micStatus.textContent = `Microphone ready: ${langName}. Tap to speak.`;
            }
        });
    });

    /**
     * Unified Speech & Multilingual Gemini NLP Processor
     * Fills directly all fields from spoken text or sample chips across Indian languages.
     */
    async function processVoiceCommand(transcript, langHint) {
        if (voiceTranscriptBox) {
            voiceTranscriptBox.style.display = 'block';
            voiceTranscriptBox.innerHTML = `<strong>You spoke:</strong> <em>"${transcript}"</em>`;
        }

        if (voiceSuccessPill) voiceSuccessPill.style.display = 'none';

        if (voiceProcessingBox) {
            voiceProcessingBox.style.display = 'flex';
            const displayLang = langHint || currentVoiceLang || 'Multilingual';
            if (voiceProcessingText) {
                voiceProcessingText.textContent = `🧠 Gemini 3.5 Flash-Lite analyzing ${displayLang} speech...`;
            }
        }

        if (micStatus) micStatus.textContent = 'Extracting service details with Gemini AI...';

        try {
            // Call SahakarVoiceAssistant directly with language hint
            let parsed;
            if (window.SahakarVoiceAssistant && window.SahakarVoiceAssistant.parse) {
                parsed = await window.SahakarVoiceAssistant.parse(transcript, langHint || currentVoiceLang);
            } else {
                parsed = await window.SahakarDB.parseBooking(transcript);
            }

            if (voiceProcessingBox) voiceProcessingBox.style.display = 'none';

            // 1. Fill Trade
            if (parsed.service_type) {
                selectTradeByName(parsed.service_type);
            }

            // 2. Fill Address
            if (parsed.location && addressInput) {
                addressInput.value = parsed.location;
                addressInput.style.backgroundColor = 'rgba(45,106,79,0.08)';
                setTimeout(() => addressInput.style.backgroundColor = '', 1500);
            }

            // 3. Fill Budget / Offer
            if (parsed.budget && offerInput) {
                offerInput.value = parsed.budget;
                offerInput.style.backgroundColor = 'rgba(45,106,79,0.08)';
                setTimeout(() => offerInput.style.backgroundColor = '', 1500);
            }

            // 4. Fill Task Description
            if (parsed.description && descriptionInput) {
                descriptionInput.value = parsed.description;
                descriptionInput.style.backgroundColor = 'rgba(45,106,79,0.08)';
                setTimeout(() => descriptionInput.style.backgroundColor = '', 1500);
            }

            if (micStatus) micStatus.textContent = '✅ Auto-filled! Tap mic to speak again';

            // 5. Update Rich Auto-Fill Pill
            if (voiceSuccessPill) {
                voiceSuccessPill.style.display = 'block';
                if (aiLangTag) aiLangTag.textContent = parsed.detected_language || 'Multilingual AI';
                if (aiSummaryDetails) {
                    aiSummaryDetails.innerHTML = `<strong>Service:</strong> ${parsed.service_type} &nbsp;•&nbsp; <strong>Offer:</strong> ₹${parsed.budget} &nbsp;•&nbsp; <strong>Location:</strong> ${parsed.location}`;
                }
            }

            // 6. Audio Confirmation back to user via SpeechSynthesis
            if (window.Voice && window.Voice.speak) {
                window.Voice.speak(`Selected ${parsed.service_type} in ${parsed.location} for ${parsed.budget} rupees.`);
            }

        } catch (e) {
            console.error('Voice parse error', e);
            if (voiceProcessingBox) voiceProcessingBox.style.display = 'none';
            if (descriptionInput) descriptionInput.value = transcript;
            if (micStatus) micStatus.textContent = 'Tap to speak';
        }
    }

    // Microphone Listener
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (window.Voice && window.Voice.isSupported()) {
                micBtn.classList.add('mic-btn--active');
                if (micStatus) micStatus.textContent = `Listening in ${currentVoiceLang.toUpperCase()}... Speak your request`;
                
                window.Voice.startListening((transcript) => {
                    micBtn.classList.remove('mic-btn--active');
                    processVoiceCommand(transcript, currentVoiceLang);
                }, (error) => {
                    micBtn.classList.remove('mic-btn--active');
                    if (micStatus) micStatus.textContent = `Mic error: ${error}. Tap to retry.`;
                });
            } else {
                alert('Web Speech API is not supported in this browser. Please try clicking the Quick Multilingual Speech Samples below to test instantly!');
            }
        });
    }

    // Multilingual Sample Voice Chips (instant 1-click testing)
    document.querySelectorAll('.sample-voice-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const sampleText = chip.getAttribute('data-sample');
            const chipLang = chip.getAttribute('data-lang') || 'en';

            // Sync language pill
            voiceLangPills.forEach(p => {
                if (p.getAttribute('data-lang') === chipLang) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
            currentVoiceLang = chipLang;
            if (window.Voice) window.Voice.setLanguage(chipLang);

            processVoiceCommand(sampleText, chipLang);
        });
    });

    // Form Submission & Preview
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const tradeVal = selectedTradeInput ? selectedTradeInput.value : selectedTrade;
            if (!tradeVal) { alert('Please select a service category'); return; }
            if (!descriptionInput.value) { alert('Please enter task details'); return; }
            if (!offerInput.value) { alert('Please enter your offer price'); return; }
            
            form.classList.add('hidden');
            summaryCard.classList.remove('hidden');
            if (sumTrade) sumTrade.textContent = tradeVal;
            if (sumOffer) sumOffer.textContent = offerInput.value;
            if (sumDesc) sumDesc.textContent = descriptionInput.value;
            if (sumLoc) sumLoc.textContent = addressInput.value || 'Sector 62, Noida';
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            form.classList.remove('hidden');
            summaryCard.classList.add('hidden');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const offerAmt = parseInt(offerInput.value, 10);
            const tradeVal = selectedTradeInput ? selectedTradeInput.value : selectedTrade;
            
            try {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Broadcasting to Workers...';

                const job = await window.SahakarDB.createJob({
                    trade: tradeVal,
                    offer: offerAmt,
                    description: descriptionInput.value,
                    address: addressInput.value || 'Sector 62, Noida',
                    lat: userLat,
                    lng: userLng
                });

                window.location.href = `/bids.html?job=${job.id}`;
            } catch (error) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm';

                if (error.code === 'FAIR_WAGE_FLOOR_VIOLATION') {
                    if (wageWarning) {
                        wageWarning.innerHTML = `⚠️ Offer ₹${offerAmt} is below the Federation fair wage floor of ₹${error.floor} for ${tradeVal}.`;
                        wageWarning.classList.remove('hidden');
                    }
                    if (editBtn) editBtn.click();
                } else {
                    alert('Error creating job. Please try again.');
                }
            }
        });
    }
});
