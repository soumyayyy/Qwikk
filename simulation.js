/**
 * RAPIDO CLONE - SIMULATION LAYER
 * Handles coordinate coordinates, distance/ETA calculations,
 * routing paths, and driver movement updates.
 */

// Presets for Jamshedpur & Telco Colony Landmarks (29 locations)
const LOCATION_PRESETS = [
    { name: "Telco Colony", lat: 22.7735, lng: 86.2505, address: "Telco Colony, Jamshedpur, Jharkhand 831004" },
    { name: "Telco Club & Sports Complex", lat: 22.7780, lng: 86.2520, address: "Telco Club, Jamshedpur, Jharkhand 831004" },
    { name: "Hudco Lake", lat: 22.7668, lng: 86.2492, address: "Govindpur Road, Telco Colony, Jamshedpur, Jharkhand 831004" },
    { name: "Plaza Market Telco", lat: 22.7752, lng: 86.2468, address: "Telco Town, Jamshedpur, Jharkhand 831004" },
    { name: "Tatanagar Railway Station", lat: 22.7698, lng: 86.2028, address: "Station Road, Parsudih, Jamshedpur, Jharkhand 831002" },
    { name: "Bistupur Market", lat: 22.8015, lng: 86.1798, address: "Main Road, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Sakchi Gol चक्कर (Roundabout)", lat: 22.8022, lng: 86.2025, address: "Sakchi Main Road, Jamshedpur, Jharkhand 831001" },
    { name: "Jubilee Park Main Gate", lat: 22.8080, lng: 86.1955, address: "Jubilee Park Road, Sakchi, Jamshedpur, Jharkhand 831001" },
    { name: "Golmuri Chowk", lat: 22.7885, lng: 86.2162, address: "Golmuri Road, Golmuri, Jamshedpur, Jharkhand 831003" },
    { name: "XLRI Campus", lat: 22.8018, lng: 86.1852, address: "Rivers Meet Road, Circuit House Area, Jamshedpur, Jharkhand 831001" },
    { name: "P&M Hi-Tech City Centre Mall", lat: 22.8105, lng: 86.1620, address: "Outer Circle Road, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Sonari Airport", lat: 22.8152, lng: 86.1685, address: "Airport Road, Sonari, Jamshedpur, Jharkhand 831011" },
    { name: "Kadma Market", lat: 22.7952, lng: 86.1582, address: "Main Road, Kadma, Jamshedpur, Jharkhand 831005" },
    { name: "Adityapur Industrial Area", lat: 22.7835, lng: 86.1420, address: "Tata Kandra Road, Adityapur, Jamshedpur, Jharkhand 831013" },
    { name: "Keenan Stadium", lat: 22.8042, lng: 86.1982, address: "Northern Town, Sakchi, Jamshedpur, Jharkhand 831001" },
    { name: "Tata Main Hospital (TMH)", lat: 22.7995, lng: 86.1895, address: "Inner Circle Road, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Bhalubasa Bridge", lat: 22.8068, lng: 86.2205, address: "Bhalubasa Main Road, Jamshedpur, Jharkhand 831009" },
    { name: "Baridih Market", lat: 22.7925, lng: 86.2458, address: "Baridih Chowk, Jamshedpur, Jharkhand 831017" },
    { name: "Sidhgora Town Hall", lat: 22.7988, lng: 86.2345, address: "Sidhgora Road, Jamshedpur, Jharkhand 831009" },
    { name: "Mango Chowk", lat: 22.8222, lng: 86.2095, address: "Purulia Road, Mango, Jamshedpur, Jharkhand 831012" },
    { name: "Dimna Lake Resort", lat: 22.8525, lng: 86.2305, address: "Dimna Road, Mirzadih, Jamshedpur, Jharkhand 831018" },
    { name: "Loyola School Ground", lat: 22.8002, lng: 86.1915, address: "Straight Mile Road, Beldih, Jamshedpur, Jharkhand 831001" },
    { name: "G-Town Club", lat: 22.7968, lng: 86.1822, address: "Road No 4, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Regal Ground", lat: 22.8032, lng: 86.1802, address: "Regal Circle, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Marine Drive Promenade", lat: 22.8188, lng: 86.1552, address: "Marine Drive Road, Sonari, Jamshedpur, Jharkhand 831011" },
    { name: "Govindpur Chowk", lat: 22.7552, lng: 86.2758, address: "Hata-Jamshedpur Highway, Govindpur, Jamshedpur, Jharkhand 831015" },
    { name: "Parsudih Market", lat: 22.7522, lng: 86.2085, address: "Haludbani Main Road, Parsudih, Jamshedpur, Jharkhand 831002" },
    { name: "Sundarnagar Chowk", lat: 22.7305, lng: 86.2125, address: "Sundarnagar Road, Jamshedpur, Jharkhand 831002" },
    { name: "Karandih Chowk", lat: 22.7482, lng: 86.2065, address: "Tata-Chaibasa Road, Karandih, Jamshedpur, Jharkhand 831002" },
    { name: "Beldih Club", lat: 22.8005, lng: 86.1870, address: "Beldih Triangle, Northern Town, Jamshedpur, Jharkhand 831001" },
    { name: "Circuit House Area", lat: 22.8048, lng: 86.1805, address: "Circuit House Road, Bistupur, Jamshedpur, Jharkhand 831001" },
    { name: "Gopal मैदान (Gopal Maidan)", lat: 22.8010, lng: 86.1835, address: "Bistupur Main Road, Jamshedpur, Jharkhand 831001" },
    { name: "Tata Steel Zoological Park", lat: 22.8095, lng: 86.1985, address: "Jubilee Park Road, Sakchi, Jamshedpur, Jharkhand 831001" },
    { name: "Dalma Wildlife Sanctuary Gate", lat: 22.8750, lng: 86.2180, address: "National Highway 33, Mango, Jamshedpur, Jharkhand 831012" },
    { name: "Jamshedpur Co-operative College", lat: 22.8090, lng: 86.1890, address: "College Road, Circuit House Area, Jamshedpur, Jharkhand 831001" },
    { name: "Karim City College", lat: 22.8008, lng: 86.2045, address: "Mango Road, Sakchi, Jamshedpur, Jharkhand 831001" },
    { name: "NML (National Metallurgical Laboratory)", lat: 22.7938, lng: 86.2090, address: "Burmamines Main Road, Jamshedpur, Jharkhand 831007" },
    { name: "Burmamines Market", lat: 22.7915, lng: 86.2135, address: "Station Road, Burmamines, Jamshedpur, Jharkhand 831007" },
    { name: "Jamshedpur Eye Hospital", lat: 22.8038, lng: 86.2005, address: "Sakchi Main Road, Jamshedpur, Jharkhand 831001" },
    { name: "Chhaya Nagar", lat: 22.8255, lng: 86.1995, address: "Mango Bridge Link Road, Jamshedpur, Jharkhand 831012" },
    { name: "Bhuvaneshwari Temple (Telco)", lat: 22.7635, lng: 86.2625, address: "Bhuvaneshwari Temple Road, Telco Colony, Jamshedpur, Jharkhand 831004" },
    { name: "Kharangajhar Market", lat: 22.7715, lng: 86.2585, address: "Telco Main Road, Kharangajhar, Jamshedpur, Jharkhand 831004" },
    { name: "Sabuj Kalyan Sangha", lat: 22.7792, lng: 86.2485, address: "Telco Town, Jamshedpur, Jharkhand 831004" },
    { name: "Vikas Vidyalaya Ground", lat: 22.7760, lng: 86.2645, address: "Hill Top Road, Telco Colony, Jamshedpur, Jharkhand 831004" },
    { name: "Telco Gurudwara", lat: 22.7745, lng: 86.2545, address: "Plaza Market Road, Telco Colony, Jamshedpur, Jharkhand 831004" },
    { name: "ISWP Sports Ground", lat: 22.7845, lng: 86.2365, address: "Telco Road, Jamshedpur, Jharkhand 831004" },
    { name: "Jamshedpur Public School (JPS)", lat: 22.7910, lng: 86.2485, address: "Baridih Main Road, Jamshedpur, Jharkhand 831017" },
    { name: "Govindpur Railway Overbridge", lat: 22.7610, lng: 86.2795, address: "Govindpur Road, Govindpur, Jamshedpur, Jharkhand 831015" },
    { name: "Dhatkidih Community Centre", lat: 22.7985, lng: 86.1730, address: "Dhatkidih Main Road, Jamshedpur, Jharkhand 831001" },
    { name: "Sonari Ram Mandir", lat: 22.8122, lng: 86.1645, address: "Ram Mandir Road, Sonari, Jamshedpur, Jharkhand 831011" }
];

// Mock Captain details pool
const CAPTAINS_POOL = [
    { name: "Ramesh Kumar", avatar: "🧑", rating: 4.8, rides: 1420, plate: "KA 03 EX 4598", model: "Honda Activa 6G (Yellow)" },
    { name: "Satish Gowda", avatar: "👨", rating: 4.9, rides: 2310, plate: "KA 51 HY 1102", model: "Suzuki Access 125 (Black)" },
    { name: "Amit Sharma", avatar: "👦", rating: 4.7, rides: 890, plate: "KA 01 EK 8812", model: "TVS Jupiter (Grey)" },
    { name: "Vikram Singh", avatar: "🧔", rating: 4.9, rides: 3150, plate: "KA 05 EM 9015", model: "Bajaj Pulsar 150 (Red)" }
];

/**
 * Calculates straight line distance (Haversine formula) in kilometers.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

/**
 * Perform custom mock geocoding/autocomplete search
 */
function searchPresetLocations(query) {
    if (!query || query.trim() === '') return LOCATION_PRESETS;
    const lowerQuery = query.toLowerCase();
    return LOCATION_PRESETS.filter(loc => 
        loc.name.toLowerCase().includes(lowerQuery) || 
        loc.address.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Generates an interpolated route array between two points
 * Add a slight curved offset to simulate real roads rather than straight lines
 */
function generateRoutePoints(start, end, stepsCount = 100) {
    const points = [];
    // Calculate control point for a quadratic bezier curve (slight curve)
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    // Add a perpendicular offset to curveness
    const latOffset = (end.lng - start.lng) * 0.15;
    const lngOffset = -(end.lat - start.lat) * 0.15;
    const control = { lat: midLat + latOffset, lng: midLng + lngOffset };

    for (let i = 0; i <= stepsCount; i++) {
        const t = i / stepsCount;
        // Quadratic Bezier Formula
        const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * control.lat + t * t * end.lat;
        const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * control.lng + t * t * end.lng;
        points.push({ lat, lng });
    }
    return points;
}

/**
 * Returns nearby coordinates to simulate floating drivers
 */
function generateNearbyDrivers(centerLat, centerLng, count = 5) {
    const drivers = [];
    const types = ['bike', 'auto', 'cab'];
    for (let i = 0; i < count; i++) {
        // Offset within ~1.5km
        const latOffset = (Math.random() - 0.5) * 0.015;
        const lngOffset = (Math.random() - 0.5) * 0.015;
        drivers.push({
            id: `driver-${i}-${Date.now()}`,
            type: types[i % 3],
            lat: centerLat + latOffset,
            lng: centerLng + lngOffset,
            angle: Math.random() * 360
        });
    }
    return drivers;
}

/**
 * Calculates pricing for various vehicle models based on distance
 */
function calculatePrices(distance) {
    // Base fares and rates per KM
    const prices = {
        bike: Math.max(25, Math.round(15 + distance * 12)),
        scooty: Math.max(28, Math.round(18 + distance * 13)),
        auto: Math.max(45, Math.round(30 + distance * 18)),
        'bike-pink': Math.max(25, Math.round(15 + distance * 12)),
        'cab-economy': Math.max(90, Math.round(60 + distance * 25)),
        'cab-priority': Math.max(110, Math.round(80 + distance * 29)),
        'cab-premium': Math.max(150, Math.round(100 + distance * 38)),
        'cab-xl': Math.max(180, Math.round(120 + distance * 45))
    };
    
    // ETAs based on average speed in traffic
    const etas = {
        bike: Math.max(2, Math.round(2 + distance * 1.5)),
        scooty: Math.max(2, Math.round(2 + distance * 1.6)),
        auto: Math.max(4, Math.round(3 + distance * 2)),
        'bike-pink': Math.max(3, Math.round(3 + distance * 1.6)),
        'cab-economy': Math.max(6, Math.round(5 + distance * 2.5)),
        'cab-priority': Math.max(3, Math.round(2 + distance * 2.2)),
        'cab-premium': Math.max(5, Math.round(4 + distance * 2.4)),
        'cab-xl': Math.max(7, Math.round(6 + distance * 2.6))
    };

    return { prices, etas };
}
