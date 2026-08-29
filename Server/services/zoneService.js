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

const postalApi = axios.create({
  timeout: 10000,
});

const nominatimApi = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": "ShipDrop/1.0",
  },
});

const osrmApi = axios.create({
  timeout: 15000,
});

// ========================================
// CACHE
// ========================================

// Completed data cache

const locationCache = new Map();

const coordinateCache = new Map();

const distanceCache = new Map();

// Pending request cache

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
  const cleanPincode =
    validatePincode(pincode);

  // ----------------------------
  // CACHE
  // ----------------------------

  if (locationCache.has(cleanPincode)) {
    return locationCache.get(cleanPincode);
  }

  // ----------------------------
  // SAME REQUEST RUNNING
  // ----------------------------

  if (pendingLocation.has(cleanPincode)) {
    return pendingLocation.get(cleanPincode);
  }

  // ----------------------------
  // CREATE REQUEST
  // ----------------------------

  const requestPromise =
    postalApi
      .get(
        `https://api.postalpincode.in/pincode/${cleanPincode}`
      )
      .then((response) => {
        const data = response.data;

        if (
          !Array.isArray(data) ||
          !data[0] ||
          data[0].Status !== "Success" ||
          !data[0].PostOffice ||
          data[0].PostOffice.length === 0
        ) {
          throw new Error(
            `Unable to find location for pincode ${cleanPincode}`
          );
        }

        const postOffice =
          data[0].PostOffice[0];

        const location = {
          pincode: cleanPincode,

          city: normalizeText(
            postOffice.District
          ),

          state: normalizeText(
            postOffice.State
          ),

          region: normalizeText(
            postOffice.Region
          ),

          country: "india",
        };

        locationCache.set(
          cleanPincode,
          location
        );

        return location;
      })
      .finally(() => {
        pendingLocation.delete(
          cleanPincode
        );
      });

  pendingLocation.set(
    cleanPincode,
    requestPromise
  );

  return requestPromise;
};

// ========================================
// GET COORDINATES
// ========================================

const getCoordinates = async (
  pincode,
  city,
  state
) => {
  const key = String(pincode).trim();

  // ----------------------------
  // CACHE
  // ----------------------------

  if (coordinateCache.has(key)) {
    return coordinateCache.get(key);
  }

  // ----------------------------
  // SAME REQUEST RUNNING
  // ----------------------------

  if (pendingCoordinate.has(key)) {
    return pendingCoordinate.get(key);
  }

  const query =
    `${key}, ${city}, ${state}, India`;

  const requestPromise =
    nominatimApi
      .get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query,
            format: "json",
            limit: 1,
            countrycodes: "in",
          },
        }
      )
      .then((response) => {
        if (
          !response.data ||
          response.data.length === 0
        ) {
          throw new Error(
            `Unable to find coordinates for pincode ${key}`
          );
        }

        const coordinates = {
          lat: Number(
            response.data[0].lat
          ),

          lon: Number(
            response.data[0].lon
          ),
        };

        coordinateCache.set(
          key,
          coordinates
        );

        return coordinates;
      })
      .finally(() => {
        pendingCoordinate.delete(key);
      });

  pendingCoordinate.set(
    key,
    requestPromise
  );

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
  const distanceKey =
    `${pickupPincode}_${deliveryPincode}`;

  // ----------------------------
  // CACHE
  // ----------------------------

  if (distanceCache.has(distanceKey)) {
    return distanceCache.get(distanceKey);
  }

  // ----------------------------
  // SAME REQUEST RUNNING
  // ----------------------------

  if (pendingDistance.has(distanceKey)) {
    return pendingDistance.get(distanceKey);
  }

  const pickupLon =
    pickupCoordinates.lon;

  const pickupLat =
    pickupCoordinates.lat;

  const deliveryLon =
    deliveryCoordinates.lon;

  const deliveryLat =
    deliveryCoordinates.lat;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${pickupLon},${pickupLat};` +
    `${deliveryLon},${deliveryLat}`;

  const requestPromise =
    osrmApi
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
          throw new Error(
            "Unable to calculate road distance"
          );
        }

        const meters =
          response.data.routes[0].distance;

        const distance =
          Number(
            (meters / 1000).toFixed(2)
          );

        distanceCache.set(
          distanceKey,
          distance
        );

        return distance;
      })
      .finally(() => {
        pendingDistance.delete(
          distanceKey
        );
      });

  pendingDistance.set(
    distanceKey,
    requestPromise
  );

  return requestPromise;
};

// ========================================
// CHECK ZONE E
// ========================================

const isZoneE = (
  pickup,
  delivery
) => {
  return (
    ZONE_E_STATES.includes(
      pickup.state
    ) ||
    ZONE_E_STATES.includes(
      delivery.state
    )
  );
};

// ========================================
// CHECK ZONE F
// ========================================

const isZoneF = (
  pickup,
  delivery
) => {
  return (
    ZONE_F_STATES.includes(
      pickup.state
    ) ||
    ZONE_F_STATES.includes(
      delivery.state
    )
  );
};

// ========================================
// CHECK METRO
// ========================================

const isMetro = (location) => {
  if (location.state === "delhi") {
    return true;
  }

  return METRO_CITIES.includes(
    location.city
  );
};

// ========================================
// MAIN ZONE CALCULATOR
// ========================================

const calculateZone = async (
  pickupPincode,
  deliveryPincode
) => {
  // ======================================
  // PINCODE LOCATION PARALLEL
  // ======================================

  const [pickup, delivery] =
    await Promise.all([
      getPincodeLocation(
        pickupPincode
      ),

      getPincodeLocation(
        deliveryPincode
      ),
    ]);

  // ======================================
  // ZONE F
  // ======================================

  if (isZoneF(pickup, delivery)) {
    return {
      zone: "F",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  // ======================================
  // ZONE E
  // ======================================

  if (isZoneE(pickup, delivery)) {
    return {
      zone: "E",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  // ======================================
  // SAME CITY = ZONE A
  // ======================================

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

  // ======================================
  // METRO TO METRO
  // ======================================

  if (
    isMetro(pickup) &&
    isMetro(delivery)
  ) {
    return {
      zone: "C",
      distance_km: null,
      pickup,
      delivery,
    };
  }

  // ======================================
  // COORDINATES PARALLEL
  // ======================================

  const [
    pickupCoordinates,
    deliveryCoordinates,
  ] =
    await Promise.all([
      getCoordinates(
        pickup.pincode,
        pickup.city,
        pickup.state
      ),

      getCoordinates(
        delivery.pincode,
        delivery.city,
        delivery.state
      ),
    ]);

  // ======================================
  // ROAD DISTANCE
  // ======================================

  const distance =
    await getRoadDistance(
      pickupCoordinates,
      deliveryCoordinates,
      pickup.pincode,
      delivery.pincode
    );

  // ======================================
  // ZONE B
  // ======================================

  if (distance <= 500) {
    return {
      zone: "B",
      distance_km: distance,
      pickup,
      delivery,
    };
  }

  // ======================================
  // ZONE D
  // ======================================

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