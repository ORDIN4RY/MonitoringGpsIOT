// Frontend/js/app.js - GPS Monitoring Dashboard with Leaflet JS

document.addEventListener("DOMContentLoaded", () => {
  // --- State Variables ---
  let map = null;
  let gpsMarker = null;
  let pollInterval = null;
  let apiUrl = "/api/latest-gps.php"; // Default URL

  // Default Starting Position (Jakarta, Indonesia)
  const defaultLocation = {
    lat: -6.2088,
    lng: 106.8456,
    device_id: "GPS-IOT-001",
  };

  // --- DOM Elements ---
  const elDeviceStatus = document.getElementById("deviceStatus");
  const elLastUpdated = document.getElementById("lastUpdated");
  const elLatitude = document.getElementById("latitudeVal");
  const elLongitude = document.getElementById("longitudeVal");
  const btnCenterMap = document.getElementById("btnCenterMap");
  const btnCopyCoords = document.getElementById("btnCopyCoords");

  const ipAddressInput = document.getElementById("ipAddressInput");
  const btnSetIp = document.getElementById("btnSetIp");
  const ipStatusText = document.getElementById("ipStatusText");

  // --- Leaflet Map Initialization ---
  function initMap() {
    // Create Leaflet Map
    map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView([defaultLocation.lat, defaultLocation.lng], 15);

    // Add OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom Leaflet DivIcon
    const customIcon = L.divIcon({
      className: "custom-marker-container",
      html: `
                <div class="marker-pulse"></div>
                <div class="marker-icon"></div>
            `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

    // Add Marker
    gpsMarker = L.marker([defaultLocation.lat, defaultLocation.lng], {
      icon: customIcon,
    }).addTo(map);
    gpsMarker.bindPopup(createPopupContent(defaultLocation));

    // Set status badge ke "Menunggu" karena belum ada koneksi
    if (elDeviceStatus) {
      elDeviceStatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/40">
          <span class="w-2 h-2 rounded-full bg-slate-500"></span>
          Menunggu Koneksi
        </span>
      `;
    }
  }

  function createPopupContent(data) {
    return `
            <div class="p-1 text-sm font-sans">
                <div class="font-bold text-blue-400 mb-1 flex items-center gap-2">
                    <i class="fas fa-satellite-dish"></i> ${data.device_id || "GPS Tracker"}
                </div>
                <div class="text-xs text-slate-300 space-y-1">
                    <div><b>Lat:</b> ${Number(data.lat).toFixed(6)}</div>
                    <div><b>Lng:</b> ${Number(data.lng).toFixed(6)}</div>
                </div>
            </div>
        `;
  }

  function updateUI(data, shouldFocus = false) {
    const lat = parseFloat(data.lat || data.latitude);
    const lng = parseFloat(data.lng || data.longitude);
    const nowString = new Date().toLocaleTimeString();

    if (elLatitude) elLatitude.textContent = lat.toFixed(6);
    if (elLongitude) elLongitude.textContent = lng.toFixed(6);
    if (elLastUpdated) elLastUpdated.textContent = nowString;

    if (elDeviceStatus) {
      elDeviceStatus.innerHTML = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Aktif / Terhubung
                </span>
            `;
    }

    if (gpsMarker && map) {
      const newLatLng = new L.LatLng(lat, lng);
      gpsMarker.setLatLng(newLatLng);
      gpsMarker.setPopupContent(
        createPopupContent({
          device_id: data.device_id || "GPS-IOT-001",
          lat,
          lng,
        }),
      );

      if (shouldFocus) {
        map.flyTo(newLatLng, 16, { animate: true, duration: 1 });
      }
    }
  }

  function fetchLatestGPS(autoFocus = false) {
    fetch(apiUrl)
      .then((res) => res.json())
      .then((res) => {
        if (res && res.status && res.data) {
          updateUI(res.data, autoFocus);
          if (ipStatusText) {
            ipStatusText.textContent = "Terhubung! Menarik data terbaru...";
            ipStatusText.className = "text-2xs text-emerald-500 mt-1";
          }
        } else if (res && !res.status) {
          if (ipStatusText) {
            ipStatusText.textContent = "API merespons: " + (res.message || "Data kosong");
            ipStatusText.className = "text-2xs text-amber-500 mt-1";
          }
        }
      })
      .catch((err) => {
        console.warn("Gagal mengambil data dari:", apiUrl, err);
        if (ipStatusText) {
          ipStatusText.textContent = "Gagal terhubung ke API GPS (Periksa IP/URL/CORS)";
          ipStatusText.className = "text-2xs text-rose-500 mt-1";
        }
      });
  }

  function startPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    fetchLatestGPS(false);
    pollInterval = setInterval(() => fetchLatestGPS(false), 3000); 
  }

  if (btnSetIp) {
    btnSetIp.addEventListener("click", () => {
      const inputVal = ipAddressInput.value.trim();
      
      if (!inputVal) {
          apiUrl = "/api/latest-gps.php";
          if (ipStatusText) {
            ipStatusText.textContent = "Menggunakan API lokal default";
            ipStatusText.className = "text-2xs text-emerald-500 mt-1";
          }
          startPolling();
          return;
      }

      let urlStr = inputVal;
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = "http://" + urlStr;
      }

      let testApiUrl = "";
      let testStatusUrl = "";

      if (urlStr.endsWith("latest-gps.php")) {
        testApiUrl = urlStr;
        testStatusUrl = urlStr.replace("latest-gps.php", "status.php");
      } else {
        urlStr = urlStr.replace(/\/$/, "");
        if (urlStr.endsWith("api")) {
            testApiUrl = urlStr + "/latest-gps.php";
            testStatusUrl = urlStr + "/status.php";
        } else {
            testApiUrl = urlStr + "/api/latest-gps.php";
            testStatusUrl = urlStr + "/api/status.php";
        }
      }

      // UI Loading state
      btnSetIp.disabled = true;
      btnSetIp.classList.add("opacity-75", "cursor-not-allowed");
      const originalBtnHtml = btnSetIp.innerHTML;
      btnSetIp.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memeriksa`;
      
      if (ipStatusText) {
        ipStatusText.textContent = "Mengecek koneksi ke " + testStatusUrl + " ...";
        ipStatusText.className = "text-2xs text-blue-400 mt-1";
      }

      // 1. Check status.php first
      fetch(testStatusUrl)
        .then(res => res.json())
        .then(res => {
            if (res && res.status === true && res.database === "connected") {
                // Success! Set the real apiUrl
                apiUrl = testApiUrl;
                if (ipStatusText) {
                    ipStatusText.textContent = `Berhasil! Status: ${res.message}. Mengambil GPS...`;
                    ipStatusText.className = "text-2xs text-emerald-500 mt-1";
                }
                
                // Fetch GPS and focus map
                if (pollInterval) clearInterval(pollInterval);
                fetchLatestGPS(true); // Focus the map on this first pull
                pollInterval = setInterval(() => fetchLatestGPS(false), 3000);

            } else {
                throw new Error(res.message || "Status tidak valid");
            }
        })
        .catch(err => {
            console.error("Status Check Error:", err);
            if (ipStatusText) {
                // TypeError: Failed to fetch biasanya karena CORS atau server tidak bisa dicapai
                const isCors = err instanceof TypeError && err.message === "Failed to fetch";
                if (isCors) {
                    ipStatusText.innerHTML = `
                        ❌ CORS Error: Server ditemukan tapi tidak mengizinkan akses.<br>
                        <span class="text-slate-400">Tambahkan header berikut di <b>status.php</b> & <b>latest-gps.php</b> VPS kamu:</span><br>
                        <code class="text-amber-400">header("Access-Control-Allow-Origin: *");</code>
                    `;
                } else {
                    ipStatusText.textContent = "Gagal: " + err.message;
                }
                ipStatusText.className = "text-2xs text-rose-400 mt-1 leading-5";
            }
        })
        .finally(() => {
            // Restore button
            btnSetIp.disabled = false;
            btnSetIp.classList.remove("opacity-75", "cursor-not-allowed");
            btnSetIp.innerHTML = originalBtnHtml;
        });
    });
  }

  if (btnCenterMap) {
    btnCenterMap.addEventListener("click", () => {
      if (gpsMarker && map) {
        map.flyTo(gpsMarker.getLatLng(), 16, { animate: true, duration: 1 });
      }
    });
  }

  if (btnCopyCoords) {
    btnCopyCoords.addEventListener("click", () => {
      const lat = elLatitude ? elLatitude.textContent : "";
      const lng = elLongitude ? elLongitude.textContent : "";
      if (lat && lng) {
        navigator.clipboard.writeText(`${lat}, ${lng}`);
        const origText = btnCopyCoords.innerHTML;
        btnCopyCoords.innerHTML = `<i class="fas fa-check text-emerald-400"></i> Disalin!`;
        setTimeout(() => {
          btnCopyCoords.innerHTML = origText;
        }, 2000);
      }
    });
  }

  initMap();
  // Polling TIDAK dimulai otomatis. Dimulai hanya setelah user klik "Hubungkan".
});

