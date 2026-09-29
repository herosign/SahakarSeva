document.addEventListener('DOMContentLoaded', () => {
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
        return;
    }

    // UI Elements
    const langSelect = document.getElementById('lang-select');
    const btnLogout = document.getElementById('btn-logout');
    const steps = document.querySelectorAll('.step');
    const workerNameEl = document.getElementById('worker-name');
    const workerSocietyEl = document.getElementById('worker-society');
    const workerAvatarEl = document.getElementById('worker-avatar');
    const etaBanner = document.getElementById('eta-banner');
    const btnComplete = document.getElementById('btn-complete');

    // i18n
    if (window.I18n) {
        window.I18n.applyToPage();
        langSelect.addEventListener('change', (e) => {
            window.I18n.setLanguage(e.target.value);
            window.I18n.applyToPage();
        });
    }

    btnLogout.addEventListener('click', () => {
        window.location.href = '/login.html';
    });

    // Mock data for map and tracking
    let jobStatus = 'accepted';
    let customerLoc = [18.5204, 73.8567]; // Pune default
    let societyLoc = [18.53, 73.84];
    let workerLoc = [18.525, 73.845];
    let animationInterval = null;

    // Load mock worker details
    workerNameEl.textContent = "Suresh Yadav";
    workerSocietyEl.textContent = "Jan Seva Society #12";
    workerAvatarEl.textContent = "S";

    if (user.role === 'worker') {
        btnComplete.style.display = 'block';
    } else {
        // Customer view: click steps to mock progression
        steps.forEach((step, index) => {
            step.addEventListener('click', () => {
                const statuses = ['accepted', 'en_route', 'in_progress', 'completed'];
                updateStatus(statuses[index]);
            });
        });
    }

    btnComplete.addEventListener('click', () => {
        updateStatus('completed');
    });

    function updateStatus(status) {
        jobStatus = status;
        
        let found = false;
        steps.forEach(step => {
            if (!found) step.classList.add('active');
            else step.classList.remove('active');
            if (step.dataset.status === status) found = true;
        });

        try {
            window.SahakarDB.updateJobStatus(jobId, status);
        } catch(e) {
            console.log("Mock update status", status);
        }

        if (status === 'completed') {
            etaBanner.textContent = "Job Completed!";
            setTimeout(() => {
                window.location.href = `/invoice.html?job=${jobId}`;
            }, 2000);
        }
    }

    // Initialize Map
    let map;
    let workerMarker;
    let customerMarker;
    let routeLine;

    // Wait a bit for leaflet to load if script is defer
    setTimeout(initMap, 500);

    function initMap() {
        if (typeof L === 'undefined') {
            console.warn("Leaflet not loaded yet, retrying...");
            setTimeout(initMap, 500);
            return;
        }

        map = L.map('map').setView(customerLoc, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Geofence Circle
        L.circle(societyLoc, {
            color: '#86efac',
            fillColor: '#dcfce7',
            fillOpacity: 0.2,
            radius: 20000, // 20km
            dashArray: '5, 5'
        }).addTo(map);

        // Markers
        const customerIcon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background:#3b82f6; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const workerIcon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="background:#22c55e; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        customerMarker = L.marker(customerLoc, {icon: customerIcon}).addTo(map);
        workerMarker = L.marker(workerLoc, {icon: workerIcon}).addTo(map);

        // Route line
        routeLine = L.polyline([workerLoc, customerLoc], {color: '#94a3b8', dashArray: '5, 5'}).addTo(map);

        map.fitBounds(routeLine.getBounds(), {padding: [30, 30]});

        // DEMO MODE: Animate worker towards customer
        startDemoAnimation();
    }

    function startDemoAnimation() {
        const steps = 100;
        let currentStep = 0;
        const dLat = (customerLoc[0] - workerLoc[0]) / steps;
        const dLng = (customerLoc[1] - workerLoc[1]) / steps;

        animationInterval = setInterval(() => {
            if (jobStatus === 'completed' || currentStep >= steps) {
                clearInterval(animationInterval);
                return;
            }

            if (jobStatus === 'en_route') {
                workerLoc[0] += dLat;
                workerLoc[1] += dLng;
                workerMarker.setLatLng(workerLoc);
                routeLine.setLatLngs([workerLoc, customerLoc]);
                currentStep++;
            }
        }, 1000);
    }

    window.addEventListener('unload', () => {
        if (animationInterval) clearInterval(animationInterval);
    });

});
