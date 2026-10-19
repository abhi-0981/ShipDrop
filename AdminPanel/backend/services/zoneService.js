const axios = require("axios");

// ========================================
// SPECIAL ZONE STATES
// ========================================

const ZONE_E_STATES = [
  "jammu and kashmir",
  "jammu & kashmir",
  "ladakh",
  "himachal pradesh",
  "sikkim",
  "assam",
  "arunachal pradesh",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "tripura",
];

// ========================================
// ZONE F
// ========================================

const ZONE_F_STATES = [
  "andaman and nicobar",
  "andaman and nicobar islands",
  "andaman & nicobar",
  "andaman & nicobar islands",
  "lakshadweep",
];

// ========================================
// METRO CITIES
// ========================================

const METRO_CITIES = [
  "delhi",
  "new delhi",
  "mumbai",
  "hyderabad",
  "bengaluru",
  "bangalore",
  "chennai",
  "kolkata",
];

// ========================================
// AXIOS INSTANCES
// ========================================

const db = require("../config/db");

const postalApi = axios.create({
  timeout: 8000,
});

const nominatimApi = axios.create({
  timeout: 5000,
  headers: {
    "User-Agent": "ShipDrop/1.0 (support@shipdrop.in)",
  },
});

const osrmApi = axios.create({
  timeout: 5000,
});

// ========================================
// STATE & REGION CENTROID COORDINATES (FALLBACK)
// ========================================

const STATE_COORDINATES = {
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "new delhi": { lat: 28.6139, lon: 77.2090 },
  "maharashtra": { lat: 19.7515, lon: 75.7139 },
  "gujarat": { lat: 22.2587, lon: 71.1924 },
  "rajasthan": { lat: 27.0238, lon: 74.2179 },
  "uttar pradesh": { lat: 26.8467, lon: 80.9462 },
  "madhya pradesh": { lat: 22.9734, lon: 78.6569 },
  "punjab": { lat: 31.1471, lon: 75.3412 },
  "haryana": { lat: 29.0588, lon: 76.0856 },
  "karnataka": { lat: 15.3173, lon: 75.7139 },
  "tamil nadu": { lat: 11.1271, lon: 78.6569 },
  "kerala": { lat: 10.8505, lon: 76.2711 },
  "telangana": { lat: 18.1124, lon: 79.0193 },
  "andhra pradesh": { lat: 15.9129, lon: 79.7400 },
  "west bengal": { lat: 22.9868, lon: 87.8550 },
  "bihar": { lat: 25.0961, lon: 85.3131 },
  "odisha": { lat: 20.9517, lon: 85.0985 },
  "assam": { lat: 26.2006, lon: 92.9376 },
  "jharkhand": { lat: 23.6102, lon: 85.2799 },
  "chhattisgarh": { lat: 21.2787, lon: 81.8661 },
  "uttarakhand": { lat: 30.0668, lon: 79.0193 },
  "himachal pradesh": { lat: 31.1048, lon: 77.1734 },
  "jammu and kashmir": { lat: 33.7782, lon: 76.5762 },
  "jammu & kashmir": { lat: 33.7782, lon: 76.5762 },
  "goa": { lat: 15.2993, lon: 74.1240 },
  "chandigarh": { lat: 30.7333, lon: 76.7794 },
  "puducherry": { lat: 11.9416, lon: 79.8083 },
  "tripura": { lat: 23.9408, lon: 91.9882 },
  "meghalaya": { lat: 25.4670, lon: 91.3662 },
  "manipur": { lat: 24.6637, lon: 93.9063 },
  "nagaland": { lat: 26.1584, lon: 94.5624 },
  "mizoram": { lat: 23.1645, lon: 92.9376 },
  "sikkim": { lat: 27.5330, lon: 88.5122 },
  "arunachal pradesh": { lat: 28.2180, lon: 94.7278 },
  "ladakh": { lat: 34.1526, lon: 77.5771 }
};

// ========================================
// HAVERSINE DISTANCE (FALLBACK WITH ROAD FACTOR)
// ========================================

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Indian road route detour is typically ~1.25x straight-line distance
  return Number((straightDistance * 1.25).toFixed(2));
};

// ========================================
// CACHE (BOUNDED LRU)
// ========================================

const MAX_CACHE_SIZE = 10000;

const locationCache = new Map();
const coordinateCache = new Map();
const distanceCache = new Map();

const setBoundedCache = (cacheMap, key, value) => {
  if (cacheMap.size >= MAX_CACHE_SIZE) {
    const oldestKey = cacheMap.keys().next().value;
    if (oldestKey !== undefined) {
      cacheMap.delete(oldestKey);
    }
  }
  cacheMap.set(key, value);
};

// Pending request cache for deduplication
const pendingLocation = new Map();
const pendingCoordinate = new Map();
const pendingDistance = new Map();

// ========================================
// NORMALIZE TEXT
// ========================================

const normalizeText = (value) => {
  if (!value) {
    return "";
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

// ========================================
// VALIDATE PINCODE
// ========================================

const validatePincode = (pincode) => {
  const clean = String(pincode).trim();

  if (!/^\d{6}$/.test(clean)) {
    throw new Error(`Invalid pincode: ${clean}`);
  }

  return clean;
};

// ========================================
// GET PINCODE LOCATION
// ========================================

const getPincodeLocation = async (pincode) => {
  const cleanPincode = validatePincode(pincode);

  // 1. IN-MEMORY CACHE
  if (locationCache.has(cleanPincode)) {
    return locationCache.get(cleanPincode);
  }

  // 2. CHECK DATABASE PERSISTENCE
  try {
    const [rows] = await db.query(
      `SELECT pincode, city, state, region, district, country, lat, lon
       FROM pincode_cache
       WHERE pincode = ?
       LIMIT 1`,
      [cleanPincode]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      const location = {
        pincode: cleanPincode,
        city: normalizeText(row.city),
        state: normalizeText(row.state),
        region: normalizeText(row.region || row.state),
        district: normalizeText(row.district || row.city),
        country: "india",
      };

      setBoundedCache(locationCache, cleanPincode, location);

      if (row.lat && row.lon) {
        setBoundedCache(coordinateCache, cleanPincode, {
          lat: Number(row.lat),
          lon: Number(row.lon),
        });
      }

      return location;
    }
  } catch (dbErr) {
    // If DB check fails, continue to external API fallback
  }

  // 3. IN-FLIGHT DEDUPLICATION
  if (pendingLocation.has(cleanPincode)) {
    return pendingLocation.get(cleanPincode);
  }

  // 4. FETCH FROM EXTERNAL POSTAL API
  const requestPromise = postalApi
    .get(`https://api.postalpincode.in/pincode/${cleanPincode}`)
    .then((response) => {
      const data = response.data;

      if (
        !Array.isArray(data) ||
        !data[0] ||
        data[0].Status !== "Success" ||
        !data[0].PostOffice ||
        data[0].PostOffice.length === 0
      ) {
        throw new Error(`Unable to find location for pincode ${cleanPincode}`);
      }

      const postOffice = data[0].PostOffice[0];

      const location = {
        pincode: cleanPincode,
        city: normalizeText(postOffice.District),
        state: normalizeText(postOffice.State),
        region: normalizeText(postOffice.Region),
        district: normalizeText(postOffice.District),
        country: "india",
      };

      setBoundedCache(locationCache, cleanPincode, location);

      // Save to database asynchronously (fail-safe)
      db.query(
        `INSERT INTO pincode_cache (pincode, city, state, region, district, country)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           city = VALUES(city),
           state = VALUES(state),
           region = VALUES(region),
           district = VALUES(district)`,
        [
          location.pincode,
          location.city,
          location.state,
          location.region,
          location.district,
          location.country,
        ]
      ).catch(() => {});

      return location;
    })
    .finally(() => {
      pendingLocation.delete(cleanPincode);
    });

  pendingLocation.set(cleanPincode, requestPromise);
  return requestPromise;
};

// ========================================
// GET COORDINATES
// ========================================

const getCoordinates = async (pincode, city, state) => {
  const key = String(pincode).trim();

  // 1. IN-MEMORY CACHE
  if (coordinateCache.has(key)) {
    return coordinateCache.get(key);
  }

  // 2. CHECK DATABASE PERSISTENCE
  try {
    const [rows] = await db.query(
      `SELECT lat, lon
       FROM pincode_cache
       WHERE pincode = ? AND lat IS NOT NULL AND lon IS NOT NULL
       LIMIT 1`,
      [key]
    );

    if (rows && rows.length > 0 && rows[0].lat && rows[0].lon) {
      const coordinates = {
        lat: Number(rows[0].lat),
        lon: Number(rows[0].lon),
      };

      setBoundedCache(coordinateCache, key, coordinates);
      return coordinates;
    }
  } catch (dbErr) {
    // Continue to external lookup
  }

  // 3. IN-FLIGHT DEDUPLICATION
  if (pendingCoordinate.has(key)) {
    return pendingCoordinate.get(key);
  }

  const normalizedState = normalizeText(state);
  const normalizedCity = normalizeText(city);

  // 4. FETCH FROM NOMINATIM API (WITH FALLBACK)
  const query = `${key}, ${city}, ${state}, India`;

  const requestPromise = nominatimApi
    .get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 1,
        countrycodes: "in",
      },
    })
    .then((response) => {
      if (!response.data || response.data.length === 0) {
        throw new Error(`Nominatim returned empty for ${key}`);
      }

      const coordinates = {
        lat: Number(response.data[0].lat),
        lon: Number(response.data[0].lon),
      };

      setBoundedCache(coordinateCache, key, coordinates);

      // Persist in DB
      db.query(
        `UPDATE pincode_cache SET lat = ?, lon = ? WHERE pincode = ?`,
        [coordinates.lat, coordinates.lon, key]
      ).catch(() => {});

      return coordinates;
    })
    .catch((err) => {
      // SAFE FALLBACK: State / Region Centroid (prevents crashing when Nominatim blocks/times out)
      const fallback =
        STATE_COORDINATES[normalizedState] ||
        STATE_COORDINATES[normalizedCity] || {
          lat: 20.5937,
          lon: 78.9629, // India default centroid
        };

      const coordinates = {
        lat: fallback.lat,
        lon: fallback.lon,
      };

      setBoundedCache(coordinateCache, key, coordinates);
      return coordinates;
    })
    .finally(() => {
      pendingCoordinate.delete(key);
    });

  pendingCoordinate.set(key, requestPromise);
  return requestPromise;
};

// ========================================
// GET ROAD DISTANCE
// ========================================

const getRoadDistance = async (
  pickupCoordinates,
  deliveryCoordinates,
  pickupPincode,
  deliveryPincode
) => {
  const distanceKey = `${pickupPincode}_${deliveryPincode}`;

  // 1. IN-MEMORY CACHE
  if (distanceCache.has(distanceKey)) {
    return distanceCache.get(distanceKey);
  }

  // 2. CHECK DATABASE PERSISTENCE
  try {
    const [rows] = await db.query(
      `SELECT distance_km
       FROM pincode_distances
       WHERE distance_key = ?
       LIMIT 1`,
      [distanceKey]
    );

    if (rows && rows.length > 0 && rows[0].distance_km !== null) {
      const distance = Number(rows[0].distance_km);
      setBoundedCache(distanceCache, distanceKey, distance);
      return distance;
    }
  } catch (dbErr) {
    // Continue to external lookup
  }

  // 3. IN-FLIGHT DEDUPLICATION
  if (pendingDistance.has(distanceKey)) {
    return pendingDistance.get(distanceKey);
  }

  const pickupLon = pickupCoordinates.lon;
  const pickupLat = pickupCoordinates.lat;
  const deliveryLon = deliveryCoordinates.lon;
  const deliveryLat = deliveryCoordinates.lat;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${pickupLon},${pickupLat};` +
    `${deliveryLon},${deliveryLat}`;

  const requestPromise = osrmApi
    .get(url, {
      params: {
        overview: "false",
      },
    })
    .then((response) => {
      if (
        !response.data ||
        response.data.code !== "Ok" ||
        !response.data.routes ||
        response.data.routes.length === 0
      ) {
        throw new Error("OSRM failed");
      }

      const meters = response.data.routes[0].distance;
      const distance = Number((meters / 1000).toFixed(2));

      setBoundedCache(distanceCache, distanceKey, distance);

      // Persist in DB
      db.query(
        `INSERT INTO pincode_distances (distance_key, pickup_pincode, delivery_pincode, distance_km, source)
         VALUES (?, ?, ?, ?, 'OSRM')
         ON DUPLICATE KEY UPDATE distance_km = VALUES(distance_km)`,
        [distanceKey, pickupPincode, deliveryPincode, distance]
      ).catch(() => {});

      return distance;
    })
    .catch(() => {
      // SAFE FALLBACK: HAVERSINE DISTANCE + 1.25x ROAD FACTOR
      // Never fails even if OSRM is down, rate limited, or slow!
      const fallbackDistance = calculateHaversineDistance(
        pickupLat,
        pickupLon,
        deliveryLat,
        deliveryLon
      );

      setBoundedCache(distanceCache, distanceKey, fallbackDistance);

      db.query(
        `INSERT INTO pincode_distances (distance_key, pickup_pincode, delivery_pincode, distance_km, source)
         VALUES (?, ?, ?, ?, 'HAVERSINE')
         ON DUPLICATE KEY UPDATE distance_km = VALUES(distance_km)`,
        [distanceKey, pickupPincode, deliveryPincode, fallbackDistance]
      ).catch(() => {});

      return fallbackDistance;
    })
    .finally(() => {
      pendingDistance.delete(distanceKey);
    });

  pendingDistance.set(distanceKey, requestPromise);
  return requestPromise;
};

// ========================================
// CHECK ZONE E
// ========================================

const isZoneE = (pickup, delivery) => {
  return (
    ZONE_E_STATES.includes(pickup.state) ||
    ZONE_E_STATES.includes(delivery.state)
  );
};

// ========================================
// CHECK ZONE F
// ========================================

const isZoneF = (pickup, delivery) => {
  return (
    ZONE_F_STATES.includes(pickup.state) ||
    ZONE_F_STATES.includes(delivery.state)
  );
};

// ========================================
// CHECK METRO
// ========================================

const isMetro = (location) => {
  if (location.state === "delhi") {
    return true;
  }

  return METRO_CITIES.includes(location.city);
};

// ========================================
// MAIN ZONE CALCULATOR
// ========================================

const calculateZone = async (pickupPincode, deliveryPincode) => {
  const [pickup, delivery] = await Promise.all([
    getPincodeLocation(pickupPincode),
    getPincodeLocation(deliveryPincode),
  ]);

  if (isZoneF(pickup, delivery)) {
    return {
      zone: "F",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  if (isZoneE(pickup, delivery)) {
    return {
      zone: "E",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  if (
    pickup.city &&
    delivery.city &&
    pickup.city === delivery.city
  ) {
    return {
      zone: "A",
      distance_km: 0,
      pickup,
      delivery,
    };
  }

  if (isMetro(pickup) && isMetro(delivery)) {
    return {
      zone: "C",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  const [pickupCoordinates, deliveryCoordinates] = await Promise.all([
    getCoordinates(pickup.pincode, pickup.city, pickup.state),
    getCoordinates(delivery.pincode, delivery.city, delivery.state),
  ]);

  const distance = await getRoadDistance(
    pickupCoordinates,
    deliveryCoordinates,
    pickup.pincode,
    delivery.pincode
  );

  if (distance <= 500) {
    return {
      zone: "B",
      distance_km: distance,
      pickup,
      delivery,
    };
  }

  return {
    zone: "D",
    distance_km: distance,
    pickup,
    delivery,
  };
};

// ========================================
// CACHE CLEAR
// ========================================

const clearZoneCache = () => {
  locationCache.clear();
  coordinateCache.clear();
  distanceCache.clear();

  pendingLocation.clear();
  pendingCoordinate.clear();
  pendingDistance.clear();
};

// ========================================
// CACHE STATS
// ========================================

const getZoneCacheStats = () => {
  return {
    locations: locationCache.size,
    coordinates: coordinateCache.size,
    distances: distanceCache.size,
  };
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  calculateZone,
  clearZoneCache,
  getZoneCacheStats,
};
