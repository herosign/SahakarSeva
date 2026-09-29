/**
 * Sahakar Seva — Live Driver Tracking Engine
 * Built for MLH 2026
 * Features:
 *  - Real-time GPS movement simulation along road waypoints
 *  - Live Telemetry HUD (Speed, Distance, ETA, Traffic status)
 *  - Dual Map Engine: Interactive Leaflet (Zero-config fallback) & Google Maps Platform integration
 *  - Gemini API AI Telemetry Commentary with Voice Announcements
 *  - 4-Step Cooperative Status Timeline & Instant Invoicing
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session & DB Guard
  let user = null;
  if (window.SahakarDB) {
    try {
      user = await window.SahakarDB.getCurrentUser();
    } catch (e) {
      console.warn("Could not retrieve user session", e);
    }
  }

  // Graceful fallback for direct demo viewing
  if (!user) {
    user = { id: 'c1', name: 'Ravi Kumar', role: 'customer', email: 'ravi@test.com' };
  }

  // 2. Job ID Extraction & Data Hydration
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job') || 'job_1790672253294';

  let job = null;
  if (window.SahakarDB && window.SahakarDB.getJob) {
    try {
      job = await window.SahakarDB.getJob(jobId);
    } catch (e) {
      console.warn("Error fetching job details", e);
    }
  }

  if (!job) {
    job = {
      id: jobId,
      trade: 'Electrician',
      offer: 400,
      description: 'Fix main switchboard and inspect ceiling fan',
      address: 'Sector 62, Noida',
      lat: 28.6270,
      lng: 77.3650,
      status: 'en_route',
      workerName: 'Suresh Yadav',
      societyName: 'Jan Seva Society #12'
    };
  }

  // 3. Populate DOM Elements with Job Details
  const tradeIcons = {
    'Electrician': '⚡',
    'Plumber': '🔧',
    'Carpenter': '🔨',
    'Mason': '🧱',
    'AC Repair': '❄️',
    'Cleaning': '🧹'
  };

  const tradeBadge = document.getElementById('jobTradeBadge');
  if (tradeBadge) {
    const icon = tradeIcons[job.trade] || '🛠️';
    tradeBadge.textContent = `${icon} ${job.trade || 'Electrician'}`;
  }

  const addressEl = document.getElementById('jobAddressText');
  if (addressEl) addressEl.textContent = job.address || 'Sector 62, Noida';

  const offerEl = document.getElementById('jobOfferText');
  if (offerEl) offerEl.textContent = `₹${job.offer || 400}`;

  const driverNameEl = document.getElementById('driverName');
  if (driverNameEl) driverNameEl.textContent = job.workerName || 'Suresh Yadav';

  const driverSocietyEl = document.getElementById('driverSociety');
  if (driverSocietyEl) driverSocietyEl.textContent = `${job.societyName || 'Jan Seva Society #12'} • ITI Certified`;

  const driverAvatarEl = document.getElementById('driverAvatar');
  if (driverAvatarEl) driverAvatarEl.textContent = (job.workerName || 'Suresh')[0].toUpperCase();

  // 4. Role-based Controls
  const workerPanel = document.getElementById('workerActionPanel');
  if (workerPanel && user.role === 'worker') {
    workerPanel.style.display = 'block';
  }

  // Logout handler
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (window.SahakarDB) await window.SahakarDB.signOut();
      window.location.href = '/index.html';
    });
  }

  // 5. Telemetry Tracking Coordinates & State
  const customerLoc = [Number(job.lat) || 28.6270, Number(job.lng) || 77.3650];
  const societyLoc = [28.5855, 77.3100]; // Sector 15 Noida
  let workerLoc = [28.6110, 77.3480]; // ~2.2 km away starting position

  let currentDistKm = calculateDistance(workerLoc[0], workerLoc[1], customerLoc[0], customerLoc[1]);
  let currentSpeed = 26; // km/h
  let currentEtaMins = Math.max(1, Math.ceil(currentDistKm * 3.2));
  let currentStatus = job.status || 'en_route';
  let animationInterval = null;
  let isGoogleMapsActive = false;

  // DOM Elements for Telemetry
  const telemetryEta = document.getElementById('telemetryEta');
  const telemetryDist = document.getElementById('telemetryDist');
  const telemetrySpeed = document.getElementById('telemetrySpeed');
  const telemetryTraffic = document.getElementById('telemetryTraffic');
  const mapOverlayText = document.getElementById('mapOverlayText');
  const geminiCommentary = document.getElementById('geminiCommentary');
  const aiConfidenceBadge = document.getElementById('aiConfidenceBadge');

  // Haversine Distance Formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  function updateTelemetryUI() {
    if (telemetryDist) telemetryDist.textContent = `${currentDistKm.toFixed(1)} km`;
    if (telemetrySpeed) telemetrySpeed.textContent = `${currentSpeed} km/h`;
    if (telemetryEta) telemetryEta.textContent = currentStatus === 'completed' ? 'Done' : `${currentEtaMins} min`;
    
    if (telemetryTraffic) {
      if (currentSpeed > 24) {
        telemetryTraffic.textContent = '🟢 Clear';
        telemetryTraffic.style.color = '#059669';
      } else if (currentSpeed > 15) {
        telemetryTraffic.textContent = '🟡 Moderate';
        telemetryTraffic.style.color = '#d97706';
      } else {
        telemetryTraffic.textContent = '🔴 Slow';
        telemetryTraffic.style.color = '#dc2626';
      }
    }
  }

  // 6. Status Timeline Management
  const statusHierarchy = ['accepted', 'en_route', 'in_progress', 'completed'];

  function updateStatusTimeline(status) {
    currentStatus = status;
    const targetIdx = statusHierarchy.indexOf(status);

    statusHierarchy.forEach((s, idx) => {
      const node = document.getElementById(`step-${s}`);
      if (node) {
        if (idx <= targetIdx) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      }
    });

    if (mapOverlayText) {
      if (status === 'accepted') mapOverlayText.textContent = 'Job Assigned • Preparing Tools';
      else if (status === 'en_route') mapOverlayText.textContent = 'Live GPS • Worker Moving';
      else if (status === 'in_progress') mapOverlayText.textContent = 'Worker Arrived • In Progress';
      else if (status === 'completed') mapOverlayText.textContent = '✓ Service Completed';
    }

    try {
      if (window.SahakarDB && window.SahakarDB.updateJobStatus) {
        window.SahakarDB.updateJobStatus(jobId, status);
      }
    } catch (e) {}

    if (status === 'completed') {
      if (telemetryEta) telemetryEta.textContent = '0 min';
      if (telemetryDist) telemetryDist.textContent = '0.0 km';
      if (telemetrySpeed) telemetrySpeed.textContent = '0 km/h';
      if (geminiCommentary) {
        geminiCommentary.textContent = `Job successfully completed by ${job.workerName || 'Suresh Yadav'}. Transparent cooperative invoice generated!`;
      }
      setTimeout(() => {
        window.location.href = `/invoice.html?job=${jobId}`;
      }, 2400);
    }
  }

  // Interactive timeline nodes
  statusHierarchy.forEach((s) => {
    const node = document.getElementById(`step-${s}`);
    if (node) {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => updateStatusTimeline(s));
    }
  });

  // Advance status button
  const btnAdvance = document.getElementById('btnAdvanceStatus');
  if (btnAdvance) {
    btnAdvance.addEventListener('click', () => {
      const nextIdx = (statusHierarchy.indexOf(currentStatus) + 1) % statusHierarchy.length;
      updateStatusTimeline(statusHierarchy[nextIdx]);
    });
  }

  // Invoice button
  const btnInvoice = document.getElementById('btnOpenInvoice');
  if (btnInvoice) {
    btnInvoice.addEventListener('click', () => {
      window.location.href = `/invoice.html?job=${jobId}`;
    });
  }

  // Worker Action Panel handlers
  const btnMarkArrived = document.getElementById('btnMarkArrived');
  if (btnMarkArrived) {
    btnMarkArrived.addEventListener('click', () => {
      updateStatusTimeline('in_progress');
      if (geminiCommentary) {
        geminiCommentary.textContent = `Worker ${job.workerName || 'Suresh Yadav'} has arrived at ${job.address}. Diagnostics underway.`;
      }
    });
  }

  const btnMarkComplete = document.getElementById('btnMarkComplete');
  if (btnMarkComplete) {
    btnMarkComplete.addEventListener('click', () => {
      updateStatusTimeline('completed');
    });
  }

  // 7. Leaflet Map Engine (Zero-fail default)
  let leafletMap = null;
  let leafletWorkerMarker = null;
  let leafletCustomerMarker = null;
  let leafletRouteLine = null;

  function initLeafletMap() {
    if (typeof L === 'undefined') {
      console.warn("Leaflet library not ready, retrying in 300ms...");
      setTimeout(initLeafletMap, 300);
      return;
    }

    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    leafletMap = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView(customerLoc, 13);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(leafletMap);

    // 20km Society Geofence
    L.circle(societyLoc, {
      color: '#2D6A4F',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#74C69D',
      fillOpacity: 0.1,
      radius: 20000
    }).addTo(leafletMap);

    // Custom Customer Icon
    const customerIcon = L.divIcon({
      className: 'leaflet-customer-marker',
      html: `
        <div style="background:#1B4965; width:34px; height:34px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(27,73,101,0.4); color:white; font-size:16px;">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    // Custom Animated Driver Scooter Icon
    const workerIcon = L.divIcon({
      className: 'leaflet-worker-marker',
      html: `
        <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(45,106,79,0.25); animation:pulse 1.5s infinite;"></div>
          <div style="background:#2D6A4F; width:32px; height:32px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(45,106,79,0.5); color:white; font-size:16px; z-index:2;">
            🛵
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    leafletCustomerMarker = L.marker(customerLoc, { icon: customerIcon })
      .bindPopup(`<strong>Customer Destination</strong><br>${job.address}`)
      .addTo(leafletMap);

    leafletWorkerMarker = L.marker(workerLoc, { icon: workerIcon })
      .bindPopup(`<strong>${job.workerName || 'Suresh Yadav'}</strong><br>${job.trade} • En Route`)
      .addTo(leafletMap);

    leafletRouteLine = L.polyline([workerLoc, customerLoc], {
      color: '#2D6A4F',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.8
    }).addTo(leafletMap);

    try {
      leafletMap.fitBounds(leafletRouteLine.getBounds(), { padding: [40, 40] });
    } catch(e) {}
  }

  // 8. Google Maps Platform Engine Switcher
  const btnToggleMap = document.getElementById('btnToggleMapEngine');
  let googleMapInstance = null;
  let googleWorkerMarker = null;
  let googleCustomerMarker = null;
  let googleRouteLine = null;

  async function initGoogleMaps() {
    const googleMapEl = document.getElementById('googleMap');
    if (!googleMapEl) return;

    if (window.google && window.google.maps) {
      renderGoogleMap();
      return;
    }

    // Load Google Maps JavaScript API
    try {
      await loadGoogleMapsScript();
      renderGoogleMap();
    } catch (e) {
      console.warn("Google Maps Platform unavailable:", e);
      alert("Google Maps Platform could not be initialized. Continuing seamlessly with Live Leaflet Map.");
      switchBackToLeaflet();
    }
  }

  function loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) return resolve();
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?v=weekly&callback=__initGMap`;
      script.async = true;
      script.defer = true;
      window.__initGMap = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  function renderGoogleMap() {
    const googleMapEl = document.getElementById('googleMap');
    if (!googleMapEl || !window.google || !window.google.maps) return;

    googleMapInstance = new google.maps.Map(googleMapEl, {
      center: { lat: customerLoc[0], lng: customerLoc[1] },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      // Mandatory attribution setting per Google Maps skill
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    });

    googleCustomerMarker = new google.maps.Marker({
      position: { lat: customerLoc[0], lng: customerLoc[1] },
      map: googleMapInstance,
      title: 'Customer Destination',
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#1B4965',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });

    googleWorkerMarker = new google.maps.Marker({
      position: { lat: workerLoc[0], lng: workerLoc[1] },
      map: googleMapInstance,
      title: `${job.workerName} (Worker)`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2D6A4F',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff'
      }
    });

    googleRouteLine = new google.maps.Polyline({
      path: [
        { lat: workerLoc[0], lng: workerLoc[1] },
        { lat: customerLoc[0], lng: customerLoc[1] }
      ],
      geodesic: true,
      strokeColor: '#2D6A4F',
      strokeOpacity: 0.8,
      strokeWeight: 4
    });
    googleRouteLine.setMap(googleMapInstance);
  }

  function switchBackToLeaflet() {
    isGoogleMapsActive = false;
    document.getElementById('googleMap').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    if (btnToggleMap) btnToggleMap.textContent = '🗺️ Switch to Google Maps';
    if (leafletMap) leafletMap.invalidateSize();
  }

  if (btnToggleMap) {
    btnToggleMap.addEventListener('click', async () => {
      isGoogleMapsActive = !isGoogleMapsActive;
      const mapEl = document.getElementById('map');
      const googleMapEl = document.getElementById('googleMap');

      if (isGoogleMapsActive) {
        mapEl.style.display = 'none';
        googleMapEl.style.display = 'block';
        btnToggleMap.textContent = '🗺️ Switch to Leaflet OSM';
        await initGoogleMaps();
      } else {
        switchBackToLeaflet();
      }
    });
  }

  // 9. Live Driver GPS Animation Loop
  function startDriverSimulation() {
    const totalSteps = 120;
    let stepCount = 0;
    const latStep = (customerLoc[0] - workerLoc[0]) / totalSteps;
    const lngStep = (customerLoc[1] - workerLoc[1]) / totalSteps;

    animationInterval = setInterval(() => {
      if (currentStatus === 'completed' || stepCount >= totalSteps) {
        clearInterval(animationInterval);
        return;
      }

      if (currentStatus === 'en_route') {
        workerLoc[0] += latStep;
        workerLoc[1] += lngStep;
        stepCount++;

        // Fluctuate speed naturally between 22 and 31 km/h
        currentSpeed = Math.floor(22 + Math.sin(stepCount * 0.4) * 8 + Math.random() * 2);

        currentDistKm = calculateDistance(workerLoc[0], workerLoc[1], customerLoc[0], customerLoc[1]);
        currentEtaMins = Math.max(1, Math.ceil(currentDistKm * 3.1));

        updateTelemetryUI();

        // Update Leaflet marker and polyline
        if (leafletWorkerMarker) leafletWorkerMarker.setLatLng(workerLoc);
        if (leafletRouteLine) leafletRouteLine.setLatLngs([workerLoc, customerLoc]);

        // Update Google Maps marker and polyline if active
        if (googleWorkerMarker) {
          googleWorkerMarker.setPosition({ lat: workerLoc[0], lng: workerLoc[1] });
        }
        if (googleRouteLine) {
          googleRouteLine.setPath([
            { lat: workerLoc[0], lng: workerLoc[1] },
            { lat: customerLoc[0], lng: customerLoc[1] }
          ]);
        }

        // When driver arrives (within 50 meters)
        if (currentDistKm <= 0.08 && currentStatus === 'en_route') {
          updateStatusTimeline('in_progress');
          if (geminiCommentary) {
            geminiCommentary.textContent = `Driver ${job.workerName || 'Suresh Yadav'} has reached your location! Status updated to In Progress.`;
          }
          if (window.Voice && window.Voice.speak) {
            window.Voice.speak(`${job.workerName || 'Your worker'} has arrived at your location.`);
          }
        }
      }
    }, 1200);
  }

  // 10. Gemini API Live Telemetry Commentary
  const GEMINI_API_KEY = (window.SahakarVoiceAssistant && window.SahakarVoiceAssistant.apiKey) || window.GEMINI_API_KEY || (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key')) || '';

  async function fetchGeminiTelemetryUpdate() {
    if (!geminiCommentary) return;
    if (aiConfidenceBadge) aiConfidenceBadge.textContent = 'Generating AI Update...';

    const currentLang = (window.I18n && window.I18n.getCurrentLanguage()) || 'en';
    const langNames = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', bn: 'Bengali' };
    const targetLanguage = langNames[currentLang] || 'English';

    const prompt = `You are the real-time AI dispatch system for Sahakar Seva, a cooperative worker platform for MLH 2026.
Generate ONE single concise, encouraging sentence (under 25 words) for the customer tracking their worker.
Details:
- Worker Name: ${job.workerName || 'Suresh Yadav'}
- Service Trade: ${job.trade || 'Electrician'}
- Society: ${job.societyName || 'Jan Seva Society #12'}
- Distance Remaining: ${currentDistKm.toFixed(1)} km
- Speed: ${currentSpeed} km/h
- ETA: ${currentEtaMins} minutes
- Destination: ${job.address || 'Sector 62, Noida'}
- Status: ${currentStatus}
- Language: Respond in natural, clean ${targetLanguage}.

Do NOT include greetings or markdown. Provide only the single update sentence.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 60
          }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const commentary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (commentary) {
        geminiCommentary.textContent = commentary;
        if (aiConfidenceBadge) aiConfidenceBadge.textContent = `Live Telemetry • Gemini 3.5`;
        return commentary;
      }
    } catch (err) {
      console.warn('Gemini Telemetry fetch failed; using dynamic template:', err);
    }

    // Dynamic fallback commentary
    const fallbackText = `Worker ${job.workerName || 'Suresh Yadav'} is ${currentDistKm.toFixed(1)} km away (${currentSpeed} km/h). Clear corridor along Sector 62 route, ETA ${currentEtaMins} mins.`;
    geminiCommentary.textContent = fallbackText;
    if (aiConfidenceBadge) aiConfidenceBadge.textContent = 'Telemetry Sync';
    return fallbackText;
  }

  // Gemini Voice Announce Button
  const btnSpeakAi = document.getElementById('btnSpeakAi');
  if (btnSpeakAi) {
    btnSpeakAi.addEventListener('click', () => {
      const textToSpeak = geminiCommentary ? geminiCommentary.textContent : '';
      if (textToSpeak && window.Voice && window.Voice.speak) {
        window.Voice.speak(textToSpeak);
      }
    });
  }

  // Refresh Gemini Button
  const btnRefreshAi = document.getElementById('btnRefreshAi');
  if (btnRefreshAi) {
    btnRefreshAi.addEventListener('click', async () => {
      btnRefreshAi.style.opacity = '0.6';
      await fetchGeminiTelemetryUpdate();
      btnRefreshAi.style.opacity = '1';
    });
  }

  // 11. Initial Run
  initLeafletMap();
  updateTelemetryUI();
  updateStatusTimeline(currentStatus);
  startDriverSimulation();

  // Fetch initial Gemini commentary
  setTimeout(fetchGeminiTelemetryUpdate, 800);

  // Periodically refresh Gemini commentary every 18 seconds
  const commentaryInterval = setInterval(() => {
    if (currentStatus === 'en_route') {
      fetchGeminiTelemetryUpdate();
    }
  }, 18000);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (animationInterval) clearInterval(animationInterval);
    if (commentaryInterval) clearInterval(commentaryInterval);
  });
});
