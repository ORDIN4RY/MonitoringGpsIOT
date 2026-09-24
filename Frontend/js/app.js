// Frontend/js/app.js - GPS Monitoring Dashboard with Leaflet JS

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let map = null;
    let gpsMarker = null;
    let pollInterval = null;
    let apiUrl = '../Backend/api/latest-gps.php'; // Default URL

    // Default Starting Position (Jakarta, Indonesia)
    const defaultLocation = {
        lat: -6.2088,
        lng: 106.8456,
        device_id: "GPS-IOT-001"
    };

    // --- DOM Elements ---
    const elDeviceStatus = document.getElementById('deviceStatus');
    const elLastUpdated  = document.getElementById('lastUpdated');
    const elLatitude     = document.getElementById('latitudeVal');
    const elLongitude    = document.getElementById('longitudeVal');
    const btnCenterMap   = document.getElementById('btnCenterMap');
    const btnCopyCoords  = document.getElementById('btnCopyCoords');
    
    const ipAddressInput = document.getElementById('ipAddressInput');
    const btnSetIp = document.getElementById('btnSetIp');
    const ipStatusText = document.getElementById('ipStatusText');

    // --- Leaflet Map Initialization ---
    function initMap() {
        // Create Leaflet Map
        map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([defaultLocation.lat, defaultLocation.lng], 15);

        // Add OpenStreetMap Dark / Standard Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Custom Leaflet DivIcon with pulsing animation
        const customIcon = L.divIcon({
            className: 'custom-marker-container',
            html: `
                <div class="marker-pulse"></div>
                <div class="marker-icon"></div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });

        // Add Marker
        gpsMarker = L.marker([defaultLocation.lat, defaultLocation.lng], { icon: customIcon }).addTo(map);
        gpsMarker.bindPopup(createPopupContent(defaultLocation));

        // Add Initial Data Point
        updateUI(defaultLocation);
    }

    // --- Create Leaflet Popup HTML ---
    function createPopupContent(data) {
        return `
            <div class="p-1 text-sm font-sans">
                <div class="font-bold text-blue-400 mb-1 flex items-center gap-2">
                    <i class="fas fa-satellite-dish"></i> ${data.device_id || 'GPS Tracker'}
                </div>
                <div class="text-xs text-slate-300 space-y-1">
                    <div><b>Lat:</b> ${Number(data.lat).toFixed(6)}</div>
                    <div><b>Lng:</b> ${Number(data.lng).toFixed(6)}</div>
                </div>
            </div>
        `;
    }

    // --- Update UI & Map Marker ---
    function updateUI(data) {
        const lat = parseFloat(data.lat || data.latitude);
        const lng = parseFloat(data.lng || data.longitude);
        const nowString = new Date().toLocaleTimeString();

        // Update Text Elements
        if (elLatitude) elLatitude.textContent = lat.toFixed(6);
        if (elLongitude) elLongitude.textContent = lng.toFixed(6);
        if (elLastUpdated) elLastUpdated.textContent = nowString;

        // Update Status Badge
        if (elDeviceStatus) {
            elDeviceStatus.innerHTML = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Aktif / Terhubung
                </span>
            `;
        }

        // Update Marker Position & Popup
        if (gpsMarker && map) {
            const newLatLng = new L.LatLng(lat, lng);
            gpsMarker.setLatLng(newLatLng);
            gpsMarker.setPopupContent(createPopupContent({
                device_id: data.device_id || 'GPS-IOT-001',
                lat, lng
            }));
        }
    }

    // --- Real Backend Polling Logic ---
    function fetchLatestGPS() {
        fetch(apiUrl)
            .then(res => res.json())
            .then(res => {
                if (res && res.data) {
                    updateUI(res.data);
                }
            })
            .catch(err => {
                console.warn('Gagal mengambil data dari:', apiUrl, err);
            });
    }

    function startPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        fetchLatestGPS();
        pollInterval = setInterval(fetchLatestGPS, 3000); // Poll setiap 3 detik
    }

    // --- Event Listeners ---
    if (btnSetIp) {
        btnSetIp.addEventListener('click', () => {
            const inputVal = ipAddressInput.value.trim();
            if (inputVal) {
                let urlStr = inputVal;
                // Tambahkan http:// jika tidak ada protokol
                if (!/^https?:\/\//i.test(urlStr)) {
                    urlStr = 'http://' + urlStr;
                }
                
                // Jika input tidak mengandung .php, asumsikan itu adalah base IP atau domain
                if (urlStr.includes('.php')) {
                    apiUrl = urlStr;
                } else {
                    urlStr = urlStr.replace(/\/$/, "");
                    apiUrl = urlStr + '/Backend/api/latest-gps.php';
                }

                if (ipStatusText) {
                    ipStatusText.textContent = 'Menghubungkan ke: ' + apiUrl;
                    ipStatusText.className = 'text-2xs text-blue-400 mt-1';
                }
                
                startPolling(); // Restart polling dengan URL baru
            } else {
                apiUrl = '../Backend/api/latest-gps.php';
                if (ipStatusText) {
                    ipStatusText.textContent = 'Menggunakan API lokal default';
                    ipStatusText.className = 'text-2xs text-emerald-500 mt-1';
                }
                startPolling();
            }
        });
    }

    if (btnCenterMap) {
        btnCenterMap.addEventListener('click', () => {
            if (gpsMarker && map) {
                map.flyTo(gpsMarker.getLatLng(), 16, { animate: true, duration: 1 });
            }
        });
    }

    if (btnCopyCoords) {
        btnCopyCoords.addEventListener('click', () => {
            const lat = elLatitude ? elLatitude.textContent : '';
            const lng = elLongitude ? elLongitude.textContent : '';
            if (lat && lng) {
                navigator.clipboard.writeText(`${lat}, ${lng}`);
                const origText = btnCopyCoords.innerHTML;
                btnCopyCoords.innerHTML = `<i class="fas fa-check text-emerald-400"></i> Disalin!`;
                setTimeout(() => { btnCopyCoords.innerHTML = origText; }, 2000);
            }
        });
    }

    // Initialize Map and start polling
    initMap();
    startPolling();
});
