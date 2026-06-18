/**
 * RAPIDO CLONE - APPLICATION LOGIC
 * Coordinates user interface events, map markers,
 * and live booking state machines.
 */

document.addEventListener('DOMContentLoaded', () => {
    function logDebug(msg, isError = false) {
        if (isError) {
            console.error(msg);
        } else {
            console.log(msg);
        }
    }

    // Initial State
    const state = {
        user: {
            name: "Soumya Suman",
            phone: "+91 98765 43210",
            email: "rahul.verma@gmail.com",
            walletBalance: 120,
            homeAddress: "Hudco Lake, Telco Colony, Jamshedpur",
            workAddress: "Bistupur Market, Jamshedpur"
        },
        booking: {
            pickup: { name: "Telco Colony", lat: 22.7735, lng: 86.2505, address: "Telco Colony, Jamshedpur" },
            dropoff: null,
            vehicle: 'bike', // bike, auto, cab
            price: 0,
            distance: 0,
            eta: 0,
            activeRide: null // active captain details and status
        },
        transactions: [
            { id: "TXN-8902", type: "debit", title: "Ride to Domlur", amount: 49, date: "14 Jun, 06:15 PM" },
            { id: "TXN-8901", type: "credit", title: "Added to Wallet", amount: 100, date: "14 Jun, 12:00 PM" }
        ],
        history: [
            { id: "RPD-78190", date: "Yesterday, 06:15 PM", vehicle: "bike", pickup: "Telco Colony", dropoff: "Hudco Lake", cost: 49, rating: 5 },
            { id: "RPD-77291", date: "12 Jun, 09:30 AM", vehicle: "auto", pickup: "Telco Colony", dropoff: "Bistupur Market", cost: 79, rating: 4 }
        ],
        map: null,
        markers: {
            pickup: null,
            dropoff: null,
            nearbyDrivers: [],
            activeDriver: null
        },
        routePolyline: null,
        activeSearchInput: null, // 'pickup' or 'dropoff'
        simulationInterval: null
    };

    try {
        logDebug("Initializing onboarding flow...");
        initOnboardingFlow();
        logDebug("Initializing sidebar navigation...");
        initAppNavigation();
        logDebug("Initializing location autocompletes...");
        initLocationInputSuggestions();
        logDebug("Initializing wallet panel...");
        initWalletPage();
        logDebug("Initializing profile settings...");
        initProfilePage();
        logDebug("Initializing past ride records...");
        initHistoryPage();
        logDebug("Initialization complete!");
    } catch (err) {
        logDebug(`Init failed: ${err.message}`, true);
        console.error("App Init Error:", err);
        alert("App Init Error: " + err.message);
    }

    function switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    function initOnboardingFlow() {
        const welcomeGetStarted = document.getElementById('btn-welcome-get-started');
        const welcomeBookRide = document.getElementById('btn-welcome-book-ride');
        
        const loginNameInput = document.getElementById('login-name');
        const loginPhoneInput = document.getElementById('login-phone');
        const loginNextBtn = document.getElementById('btn-login-next');
        const backToWelcomeBtn = document.getElementById('btn-back-to-welcome');
        
        const otpInputs = document.querySelectorAll('.otp-input');
        const otpErrorMsg = document.getElementById('otp-error-msg');
        const verifyOtpBtn = document.getElementById('btn-verify-otp');
        const backToLoginBtn = document.getElementById('btn-back-to-login');

        // Transitions from Welcome screen
        welcomeGetStarted.addEventListener('click', () => switchScreen('screen-login'));
        welcomeBookRide.addEventListener('click', () => switchScreen('screen-login'));
        
        backToWelcomeBtn.addEventListener('click', () => {
            switchScreen('screen-welcome');
        });

        // Input validation for Login screen
        const validateLoginFields = () => {
            const nameVal = loginNameInput.value.trim();
            const phoneVal = loginPhoneInput.value.replace(/\D/g, '');
            loginPhoneInput.value = phoneVal;
            loginNextBtn.disabled = nameVal.length < 2 || phoneVal.length !== 10;
        };

        loginNameInput.addEventListener('input', validateLoginFields);
        loginPhoneInput.addEventListener('input', validateLoginFields);

        // Transition to OTP screen
        loginNextBtn.addEventListener('click', () => {
            const nameVal = loginNameInput.value.trim();
            const phoneVal = loginPhoneInput.value;
            
            document.getElementById('otp-display-name').textContent = nameVal;
            document.getElementById('otp-display-phone').textContent = `+91 ${phoneVal}`;
            
            // Clear old error & inputs
            otpErrorMsg.classList.add('hidden');
            otpInputs.forEach(input => input.value = '');
            
            switchScreen('screen-otp');
            setTimeout(() => otpInputs[0].focus(), 400);
        });

        backToLoginBtn.addEventListener('click', () => {
            switchScreen('screen-login');
        });

        // OTP focus chaining
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if (input.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });

        // Verify OTP constraint
        verifyOtpBtn.addEventListener('click', () => {
            let otpCode = '';
            otpInputs.forEach(input => otpCode += input.value);

            if (otpCode === "1234") {
                // Correct OTP
                otpErrorMsg.classList.add('hidden');
                
                // Update State and sidebar UI details
                state.user.name = loginNameInput.value.trim();
                state.user.phone = `+91 ${loginPhoneInput.value}`;
                
                document.getElementById('sidebar-user-name').textContent = state.user.name;
                document.getElementById('sidebar-user-phone').textContent = state.user.phone;
                document.querySelector('.wallet-val').textContent = `₹${state.user.walletBalance}`;
                document.getElementById('wallet-balance-display').textContent = `₹${state.user.walletBalance}`;
                
                // Sync profile page fields
                document.getElementById('profile-name').value = state.user.name;
                document.getElementById('profile-phone').value = state.user.phone;

                // Load application
                switchScreen('screen-app');
                initLeafletMap();
            } else {
                // Incorrect OTP -> show error, clear inputs
                otpErrorMsg.classList.remove('hidden');
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
            }
        });
    }

    // Map instances will load when #screen-app is activated



    /* ==========================================================================
       MAP & DRIVER VISUAL LAYER
       ========================================================================== */
    function initLeafletMap() {
        if (state.map) return; // Already init

        // Initial setup centered in Indiranagar Bengaluru
        state.map = L.map('leaflet-map-container', {
            zoomControl: false,
            attributionControl: false
        }).setView([state.booking.pickup.lat, state.booking.pickup.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(state.map);

        // Position zoom control in bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(state.map);

        // Add Initial Pickup Pin
        updatePickupMarker();

        // Generate nearby floating drivers
        renderNearbyDrivers();
        setInterval(moveNearbyDriversRandomly, 4000);
    }

    function updatePickupMarker() {
        if (!state.map) return;
        
        if (state.markers.pickup) {
            state.map.removeLayer(state.markers.pickup);
        }

        const pickupIcon = L.divIcon({
            html: '<div class="location-marker-pin pickup-pin"></div>',
            className: 'custom-div-icon',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        state.markers.pickup = L.marker([state.booking.pickup.lat, state.booking.pickup.lng], { icon: pickupIcon })
            .addTo(state.map)
            .bindPopup("<b>Current Location</b><br>" + state.booking.pickup.name)
            .openPopup();
        
        state.map.setView([state.booking.pickup.lat, state.booking.pickup.lng], 14);
    }

    function updateDropoffMarker() {
        if (!state.map || !state.booking.dropoff) return;

        if (state.markers.dropoff) {
            state.map.removeLayer(state.markers.dropoff);
        }

        const dropIcon = L.divIcon({
            html: '<div class="location-marker-pin"></div>',
            className: 'custom-div-icon',
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        state.markers.dropoff = L.marker([state.booking.dropoff.lat, state.booking.dropoff.lng], { icon: dropIcon })
            .addTo(state.map)
            .bindPopup("<b>Destination Location</b><br>" + state.booking.dropoff.name)
            .openPopup();

        // Fit map bounds to show both pickup & dropoff
        const group = new L.featureGroup([state.markers.pickup, state.markers.dropoff]);
        state.map.fitBounds(group.getBounds().pad(0.15));

        // Draw Route
        drawRoute();
    }

    function drawRoute() {
        if (!state.map) return;
        if (state.routePolyline) {
            state.map.removeLayer(state.routePolyline);
        }

        const points = generateRoutePoints(state.booking.pickup, state.booking.dropoff, 60);
        const polyPoints = points.map(p => [p.lat, p.lng]);

        state.routePolyline = L.polyline(polyPoints, {
            color: '#1F2229',
            weight: 5,
            opacity: 0.8,
            dashArray: '1, 10',
            lineCap: 'round'
        }).addTo(state.map);
    }

    function renderNearbyDrivers() {
        if (!state.map) return;
        
        // Remove old nearby markers
        state.markers.nearbyDrivers.forEach(m => state.map.removeLayer(m));
        state.markers.nearbyDrivers = [];

        const drivers = generateNearbyDrivers(state.booking.pickup.lat, state.booking.pickup.lng, 6);
        drivers.forEach(d => {
            const driverIcon = L.divIcon({
                html: `<div class="driver-marker-pulse"><i data-lucide="${d.type === 'bike' ? 'bike' : 'car'}"></i></div>`,
                className: 'map-driver-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });
            const marker = L.marker([d.lat, d.lng], { icon: driverIcon }).addTo(state.map);
            state.markers.nearbyDrivers.push(marker);
        });
        
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
    }

    function moveNearbyDriversRandomly() {
        if (!state.map || state.booking.activeRide) return; // Freeze simulation if in active ride

        state.markers.nearbyDrivers.forEach(m => {
            const pos = m.getLatLng();
            const offsetLat = (Math.random() - 0.5) * 0.003;
            const offsetLng = (Math.random() - 0.5) * 0.003;
            m.setLatLng([pos.lat + offsetLat, pos.lng + offsetLng]);
        });
    }

    /* ==========================================================================
       SIDEBAR & VIEW ROUTING
       ========================================================================== */
    function initAppNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const logoutBtn = document.getElementById('btn-logout');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-target');
                
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');

                // Close subpanels & activate target
                showPanel('panel-' + target);

                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                }
            });
        });

        // Close details back triggers
        document.querySelectorAll('.btn-close-subpanel').forEach(btn => {
            btn.addEventListener('click', () => {
                showPanel('panel-booking');
                // Set sidebar menu back to booking
                menuItems.forEach(mi => mi.classList.remove('active'));
                document.querySelector('.menu-item[data-target="dashboard"]').classList.add('active');
            });
        });

        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        logoutBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    function showPanel(panelId) {
        document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active-panel'));
        document.getElementById(panelId).classList.add('active-panel');
    }

    /* ==========================================================================
       AUTOCOMPLETE LOCATION INPUTS
       ========================================================================== */
    function initLocationInputSuggestions() {
        const pickupInput = document.getElementById('input-pickup');
        const dropoffInput = document.getElementById('input-dropoff');
        const suggestionsBox = document.getElementById('autocomplete-suggestions');
        
        const clearPickup = document.getElementById('clear-pickup');
        const clearDropoff = document.getElementById('clear-dropoff');
        
        const homeShortcut = document.getElementById('btn-home-shortcut');
        const workShortcut = document.getElementById('btn-work-shortcut');

        // Inputs focus and suggestions trigger
        pickupInput.addEventListener('focus', () => {
            logDebug("pickupInput focus event");
            state.activeSearchInput = 'pickup';
            triggerSuggestions(""); // Show all suggestions on focus
        });

        dropoffInput.addEventListener('focus', () => {
            logDebug("dropoffInput focus event");
            state.activeSearchInput = 'dropoff';
            triggerSuggestions(""); // Show all suggestions on focus
        });

        pickupInput.addEventListener('input', (e) => {
            logDebug(`pickupInput input event: "${e.target.value}"`);
            triggerSuggestions(e.target.value);
        });
        dropoffInput.addEventListener('input', (e) => {
            logDebug(`dropoffInput input event: "${e.target.value}"`);
            triggerSuggestions(e.target.value);
        });

        clearPickup.addEventListener('click', () => {
            logDebug("clearPickup click event");
            pickupInput.value = '';
            pickupInput.focus();
            hideSuggestions();
        });

        clearDropoff.addEventListener('click', () => {
            logDebug("clearDropoff click event");
            dropoffInput.value = '';
            dropoffInput.focus();
            hideSuggestions();
            document.getElementById('vehicle-picker').classList.add('hidden');
        });

        homeShortcut.addEventListener('click', () => {
            logDebug("homeShortcut click event");
            state.activeSearchInput = 'dropoff';
            dropoffInput.value = state.user.homeAddress;
            selectLocation({
                name: "Home",
                address: state.user.homeAddress,
                lat: 22.7668, // Hudco Lake
                lng: 86.2492
            });
        });

        workShortcut.addEventListener('click', () => {
            logDebug("workShortcut click event");
            state.activeSearchInput = 'dropoff';
            dropoffInput.value = state.user.workAddress;
            selectLocation({
                name: "Work Office",
                address: state.user.workAddress,
                lat: 22.8015, // Bistupur Market
                lng: 86.1798
            });
        });

        // Click outside suggestions hide
        document.addEventListener('click', (e) => {
            const isClickInsideInput = e.target.closest('.location-inputs');
            const isClickInsideSuggestions = e.target.closest('#autocomplete-suggestions');
            if (!isClickInsideInput && !isClickInsideSuggestions) {
                logDebug("Clicked outside: calling hideSuggestions");
                hideSuggestions();
            }
        });

        function triggerSuggestions(query) {
            try {
                logDebug(`triggerSuggestions called with query: "${query}"`);
                const list = searchPresetLocations(query); // show all if empty query
                logDebug(`searchPresetLocations returned ${list.length} matches.`);
                if (list.length === 0) {
                    hideSuggestions();
                    return;
                }

                suggestionsBox.innerHTML = '';
                suggestionsBox.classList.remove('hidden');
                logDebug(`Unhid suggestions box. Appending ${list.length} rows...`);

                list.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'suggestion-item';
                    row.innerHTML = `
                        <i data-lucide="map-pin"></i>
                        <div class="suggestion-details">
                            <span class="suggestion-name">${item.name}</span>
                            <span class="suggestion-address">${item.address}</span>
                        </div>
                    `;
                    row.addEventListener('click', () => {
                        logDebug(`Suggestion row clicked: "${item.name}"`);
                        selectLocation(item);
                    });
                    suggestionsBox.appendChild(row);
                });
                
                if (window.lucide && typeof lucide.createIcons === 'function') {
                    lucide.createIcons();
                } else {
                    logDebug("Lucide not found or createIcons is not a function", true);
                }
            } catch (err) {
                logDebug(`Error in triggerSuggestions: ${err.message}`, true);
                console.error("Error in triggerSuggestions:", err);
            }
        }

        function selectLocation(item) {
            try {
                logDebug(`selectLocation: "${item.name}"`);
                hideSuggestions();
                if (state.activeSearchInput === 'pickup') {
                    pickupInput.value = item.name;
                    state.booking.pickup = item;
                    updatePickupMarker();
                } else {
                    dropoffInput.value = item.name;
                    state.booking.dropoff = item;
                    updateDropoffMarker();
                    showVehiclePicker();
                }
            } catch (err) {
                logDebug(`Error in selectLocation: ${err.message}`, true);
                console.error("Error in selectLocation:", err);
                alert("Error selecting location: " + err.message);
            }
        }

        function hideSuggestions() {
            logDebug("hideSuggestions: adding class hidden");
            suggestionsBox.classList.add('hidden');
        }

        function showVehiclePicker() {
            try {
                if (!state.booking.pickup || !state.booking.dropoff) {
                    console.warn("Pickup or dropoff is missing!");
                    return;
                }
                const distance = calculateDistance(
                    state.booking.pickup.lat, state.booking.pickup.lng,
                    state.booking.dropoff.lat, state.booking.dropoff.lng
                );

                state.booking.distance = parseFloat(distance.toFixed(1));
                const details = calculatePrices(distance);

                // Update UI elements
                document.getElementById('price-bike').textContent = `₹${details.prices.bike}`;
                document.getElementById('eta-bike').textContent = `${details.etas.bike} mins`;
                document.getElementById('price-scooty').textContent = `₹${details.prices.scooty}`;
                document.getElementById('eta-scooty').textContent = `${details.etas.scooty} mins`;
                document.getElementById('price-auto').textContent = `₹${details.prices.auto}`;
                document.getElementById('eta-auto').textContent = `${details.etas.auto} mins`;
                document.getElementById('price-bike-pink').textContent = `₹${details.prices['bike-pink']}`;
                document.getElementById('eta-bike-pink').textContent = `${details.etas['bike-pink']} mins`;
                document.getElementById('price-cab-economy').textContent = `₹${details.prices['cab-economy']}`;
                document.getElementById('eta-cab-economy').textContent = `${details.etas['cab-economy']} mins`;
                document.getElementById('price-cab-priority').textContent = `₹${details.prices['cab-priority']}`;
                document.getElementById('eta-cab-priority').textContent = `${details.etas['cab-priority']} mins`;
                document.getElementById('price-cab-premium').textContent = `₹${details.prices['cab-premium']}`;
                document.getElementById('eta-cab-premium').textContent = `${details.etas['cab-premium']} mins`;
                document.getElementById('price-cab-xl').textContent = `₹${details.prices['cab-xl']}`;
                document.getElementById('eta-cab-xl').textContent = `${details.etas['cab-xl']} mins`;

                document.getElementById('vehicle-picker').classList.remove('hidden');
                
                // Set prices inside matching state
                state.booking.fares = details.prices;
                state.booking.etas = details.etas;

                // Trigger click listeners on option cards
                const cards = document.querySelectorAll('.ride-option-card');
                cards.forEach(card => {
                    card.addEventListener('click', () => {
                        cards.forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        state.booking.vehicle = card.getAttribute('data-vehicle');
                    });
                });
            } catch (err) {
                console.error("Error in showVehiclePicker:", err);
                alert("Error calculating fare options: " + err.message);
            }
        }
    }

    /* ==========================================================================
       BOOKING ENGINE & RIDE SIMULATION
       ========================================================================== */
    const requestRideBtn = document.getElementById('btn-request-ride');
    const cancelMatchingBtn = document.getElementById('btn-cancel-matching');
    const cancelRideBtn = document.getElementById('btn-cancel-ride');
    const doneRatingBtn = document.getElementById('btn-done-rating');

    requestRideBtn.addEventListener('click', () => {
        // Set Matching Header locations
        document.getElementById('matching-pickup').textContent = state.booking.pickup.name;
        document.getElementById('matching-drop').textContent = state.booking.dropoff.name;
        
        showPanel('panel-matching');

        // Hide regular nearby drivers on map
        state.markers.nearbyDrivers.forEach(m => state.map.removeLayer(m));
        
        // Setup Simulated Matching Delay (3 seconds)
        setTimeout(() => {
            if (document.getElementById('panel-matching').classList.contains('active-panel')) {
                startActiveRideSimulation();
            }
        }, 3000);
    });

    cancelMatchingBtn.addEventListener('click', () => {
        showPanel('panel-booking');
        renderNearbyDrivers();
    });

    cancelRideBtn.addEventListener('click', () => {
        // Cancel Ride
        stopSimulation();
        showPanel('panel-booking');
        renderNearbyDrivers();
    });

    function startActiveRideSimulation() {
        // Select random driver
        const captain = CAPTAINS_POOL[Math.floor(Math.random() * CAPTAINS_POOL.length)];
        state.booking.activeRide = captain;

        // Build active driver tracking marker icon
        const activeDriverIcon = L.divIcon({
            html: `<div class="driver-marker-pulse"><i data-lucide="${['bike', 'scooty', 'bike-pink'].includes(state.booking.vehicle) ? 'bike' : 'car'}"></i></div>`,
            className: 'map-driver-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        // Initialize driver marker somewhere offset to represent approaching pickup
        const approachOffsetLat = (Math.random() - 0.5) * 0.01;
        const approachOffsetLng = (Math.random() - 0.5) * 0.01;
        const startPos = {
            lat: state.booking.pickup.lat + approachOffsetLat,
            lng: state.booking.pickup.lng + approachOffsetLng
        };

        state.markers.activeDriver = L.marker([startPos.lat, startPos.lng], { icon: activeDriverIcon }).addTo(state.map);
        if (window.lucide && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }

        // Populate Panel UI
        document.getElementById('captain-name').textContent = captain.name;
        document.getElementById('vehicle-plate-num').textContent = captain.plate;
        document.getElementById('vehicle-model-desc').textContent = captain.model;
        document.getElementById('live-fare').textContent = `₹${state.booking.fares[state.booking.vehicle]}`;

        // 4 Digit Random OTP code
        const otp = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('ride-otp').textContent = otp;

        showPanel('panel-tracking');
        document.querySelector('.status-badge').className = 'status-badge green';
        document.querySelector('.status-badge').textContent = 'Captain Arriving';

        // Phase 1: Arriving to Pickup
        const routeToPickup = generateRoutePoints(startPos, state.booking.pickup, 40);
        let routeIndex = 0;

        state.simulationInterval = setInterval(() => {
            if (routeIndex < routeToPickup.length) {
                const nextPos = routeToPickup[routeIndex];
                state.markers.activeDriver.setLatLng([nextPos.lat, nextPos.lng]);
                
                // Live ETA recalculation
                const distToPickup = calculateDistance(nextPos.lat, nextPos.lng, state.booking.pickup.lat, state.booking.pickup.lng);
                document.getElementById('live-eta').textContent = `${Math.max(1, Math.round(distToPickup * 3))} min`;
                document.getElementById('live-distance').textContent = `${distToPickup.toFixed(2)} km`;
                
                routeIndex++;
            } else {
                // Arrived at Pickup!
                clearInterval(state.simulationInterval);
                document.querySelector('.status-badge').className = 'status-badge warning';
                document.querySelector('.status-badge').textContent = 'Arrived at Pickup';
                document.getElementById('live-eta').textContent = 'Arrived';
                document.getElementById('live-distance').textContent = '0.0 km';
                
                // Prompt OTP check delay (3 seconds before starting trip)
                setTimeout(() => {
                    startTripSimulation();
                }, 3000);
            }
        }, 150);
    }

    function startTripSimulation() {
        document.querySelector('.status-badge').className = 'status-badge green';
        document.querySelector('.status-badge').textContent = 'Ride In Progress';
        
        // Generate main routing path to Dropoff
        const routeToDropoff = generateRoutePoints(state.booking.pickup, state.booking.dropoff, 60);
        let routeIndex = 0;

        state.simulationInterval = setInterval(() => {
            if (routeIndex < routeToDropoff.length) {
                const nextPos = routeToDropoff[routeIndex];
                state.markers.activeDriver.setLatLng([nextPos.lat, nextPos.lng]);

                // Fit map frame around active driver marker dynamically
                state.map.setView([nextPos.lat, nextPos.lng]);

                const distLeft = calculateDistance(nextPos.lat, nextPos.lng, state.booking.dropoff.lat, state.booking.dropoff.lng);
                document.getElementById('live-eta').textContent = `${Math.max(1, Math.round(distLeft * 3))} min`;
                document.getElementById('live-distance').textContent = `${distLeft.toFixed(1)} km`;

                routeIndex++;
            } else {
                // Ride Completed!
                clearInterval(state.simulationInterval);
                finishRideSimulation();
            }
        }, 150);
    }

    function finishRideSimulation() {
        const fare = state.booking.fares[state.booking.vehicle];
        const tax = 5;
        const total = fare + tax;

        // Deduct balance
        state.user.walletBalance -= total;
        document.querySelector('.wallet-val').textContent = `₹${state.user.walletBalance}`;
        document.getElementById('wallet-balance-display').textContent = `₹${state.user.walletBalance}`;

        // Populate Receipt UI
        document.getElementById('comp-captain-name').textContent = state.booking.activeRide.name;
        document.getElementById('receipt-fare').textContent = `₹${fare}`;
        document.getElementById('receipt-total').textContent = `₹${total}`;

        // Append to Ride History
        const newRide = {
            id: `RPD-${Math.floor(10000 + Math.random() * 90000)}`,
            date: "Today, Just Now",
            vehicle: state.booking.vehicle,
            pickup: state.booking.pickup.name,
            dropoff: state.booking.dropoff.name,
            cost: total,
            rating: null
        };
        state.history.unshift(newRide);
        renderHistoryList();

        // Append to Wallet Ledger
        const newTxn = {
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            type: "debit",
            title: `Ride to ${state.booking.dropoff.name.split(',')[0]}`,
            amount: total,
            date: "Today, Just Now"
        };
        state.transactions.unshift(newTxn);
        renderTransactionsList();

        showPanel('panel-completed');
        
        // Stars Rating listener
        const stars = document.querySelectorAll('.star-rating i');
        let selectedStars = 5;
        stars.forEach(star => {
            star.classList.add('filled'); // Default 5 stars
            star.addEventListener('click', () => {
                const idx = parseInt(star.getAttribute('data-index'));
                selectedStars = idx;
                stars.forEach(s => {
                    const sIdx = parseInt(s.getAttribute('data-index'));
                    if (sIdx <= idx) {
                        s.classList.add('filled');
                    } else {
                        s.classList.remove('filled');
                    }
                });
            });
        });

        doneRatingBtn.onclick = () => {
            // Update rating in history
            state.history[0].rating = selectedStars;
            renderHistoryList();
            
            // Clean up markers
            stopSimulation();
            showPanel('panel-booking');
            
            // Reset input values
            document.getElementById('input-dropoff').value = '';
            document.getElementById('vehicle-picker').classList.add('hidden');
            
            // Redraw nearby
            renderNearbyDrivers();
        };
    }

    function stopSimulation() {
        clearInterval(state.simulationInterval);
        if (state.markers.activeDriver) {
            state.map.removeLayer(state.markers.activeDriver);
            state.markers.activeDriver = null;
        }
        if (state.markers.dropoff) {
            state.map.removeLayer(state.markers.dropoff);
            state.markers.dropoff = null;
        }
        if (state.routePolyline) {
            state.map.removeLayer(state.routePolyline);
            state.routePolyline = null;
        }
        state.booking.activeRide = null;
        state.booking.dropoff = null;
    }

    /* ==========================================================================
       WALLET LEDGER
       ========================================================================== */
    function initWalletPage() {
        const addFundBtn = document.getElementById('btn-wallet-add-fund');
        const addAmountInput = document.getElementById('add-wallet-input');
        const quickAmountBtns = document.querySelectorAll('.btn-amount');

        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                addAmountInput.value = btn.getAttribute('data-amount');
            });
        });

        addFundBtn.addEventListener('click', () => {
            const val = parseInt(addAmountInput.value);
            if (!val || val <= 0) return;

            state.user.walletBalance += val;
            
            // Update all displays
            document.querySelector('.wallet-val').textContent = `₹${state.user.walletBalance}`;
            document.getElementById('wallet-balance-display').textContent = `₹${state.user.walletBalance}`;
            document.getElementById('selected-payment-method').textContent = `Rapido Pay (₹${state.user.walletBalance})`;

            // Record Log
            state.transactions.unshift({
                id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
                type: "credit",
                title: "Added Funds to Wallet",
                amount: val,
                date: "Today, Just Now"
            });

            renderTransactionsList();
            addAmountInput.value = '';
        });

        renderTransactionsList();
    }

    function renderTransactionsList() {
        const container = document.getElementById('transaction-list-container');
        container.innerHTML = '';

        state.transactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
                <div class="txn-desc">
                    <span class="txn-title">${t.title}</span>
                    <span class="txn-time">${t.date} | ID: ${t.id}</span>
                </div>
                <span class="txn-amt ${t.type === 'credit' ? 'positive' : 'negative'}">
                    ${t.type === 'credit' ? '+' : '-'} ₹${t.amount}
                </span>
            `;
            container.appendChild(item);
        });
    }

    /* ==========================================================================
       PROFILE & SETTINGS
       ========================================================================== */
    function initProfilePage() {
        const saveProfileBtn = document.getElementById('btn-save-profile');
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const homeInput = document.getElementById('profile-home-addr');
        const workInput = document.getElementById('profile-work-addr');

        nameInput.value = state.user.name;
        emailInput.value = state.user.email;
        homeInput.value = state.user.homeAddress;
        workInput.value = state.user.workAddress;

        saveProfileBtn.addEventListener('click', () => {
            state.user.name = nameInput.value;
            state.user.email = emailInput.value;
            state.user.homeAddress = homeInput.value;
            state.user.workAddress = workInput.value;

            document.getElementById('sidebar-user-name').textContent = state.user.name;
            
            // Show alert
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed; bottom:20px; right:20px; background:var(--success); color:white; padding:12px 24px; border-radius:8px; z-index:999; font-weight:700; box-shadow:var(--shadow-md)';
            banner.textContent = 'Profile changes saved!';
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 2500);
        });
    }

    /* ==========================================================================
       HISTORY LIST
       ========================================================================== */
    function initHistoryPage() {
        renderHistoryList();
    }

    function renderHistoryList() {
        const container = document.getElementById('history-items-container');
        container.innerHTML = '';

        if (state.history.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-light); margin-top:20px">No rides taken yet.</p>';
            return;
        }

        state.history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-card-header">
                    <span>${item.date}</span>
                    <span>ID: ${item.id}</span>
                </div>
                <div class="history-card-body">
                    <div class="history-card-details">
                        <div class="history-card-locs">
                            <div>🟢 ${item.pickup.split(',')[0]}</div>
                            <div>🔴 ${item.dropoff.split(',')[0]}</div>
                        </div>
                    </div>
                    <span class="history-card-cost">₹${item.cost}</span>
                </div>
                <div class="history-card-footer">
                    <span class="vehicle-badge">${item.vehicle}</span>
                    <span>${item.rating ? '⭐ '.repeat(item.rating) : 'Unrated'}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
});
