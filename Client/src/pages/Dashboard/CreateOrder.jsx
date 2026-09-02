import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const warehouseMarkerIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_WAREHOUSE_MAP_POSITION = [22.9734, 78.6569];

function WarehouseMapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function CreateOrder() {
  // ========================================
  // INITIAL FORM DATA
  // ========================================

  const initialFormData = {
    pickup_address: "",
    pickup_pincode: "",
    pickup_city: "",

    consignee_name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",

    gstin: "",
    company_name: "",
    floor_no: "",
    landmark: "",

    address_line1: "",
    address_line2: "",

    pincode: "",
    city: "",
    state: "",
    country: "India",

    payment_type: "Prepaid",
    risk_type: "Owner Risk",
  };

  const initialProduct = {
    product: "",
    sku: "",
    price: "",
    qty: 1,
    tax: 0,
  };

  const initialPackage = {
    length: "",
    width: "",
    height: "",
    weight: "",
    count: 1,
  };

  // ========================================
  // STATES
  // ========================================

  const [formData, setFormData] = useState(initialFormData);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [products, setProducts] = useState([{ ...initialProduct }]);

  const [packages, setPackages] = useState([{ ...initialPackage }]);

  const [loading, setLoading] = useState(false);

  const [pincodeLoading, setPincodeLoading] = useState(false);

  const [rateLoading, setRateLoading] = useState(false);

  // ========================================
  // SELECTED SHIPPING RATE
  // ========================================

  const [shippingRate, setShippingRate] = useState(null);

  // ========================================
  // ROAD + AIR + SHADOWFAX OPTIONS
  // ========================================

  const [shippingOptions, setShippingOptions] = useState(null);

  // ROAD / AIR / SHADOWFAX
  const [selectedShippingType, setSelectedShippingType] = useState(null);

  // ========================================
  // WAREHOUSE / PICKUP ADDRESS
  // ========================================

  const initialWarehouseForm = {
    warehouse_name: "",
    contact_name: "",
    phone: "",
    email: "",
    gstin: "",
    address_line1: "",
    address_line2: "",
    floor_no: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    return_address: "",
    return_city: "",
    return_pincode: "",
    return_state: "",
    return_country: "India",
  };

  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehouseSaving, setWarehouseSaving] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    ...initialWarehouseForm,
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehousePincodeLoading, setWarehousePincodeLoading] = useState(false);

  // ========================================
  // WAREHOUSE MAP
  // ========================================

  const [warehouseMapPosition, setWarehouseMapPosition] = useState(
    DEFAULT_WAREHOUSE_MAP_POSITION,
  );
  const [warehouseMapMarker, setWarehouseMapMarker] = useState(null);
  const [warehouseLocationSearch, setWarehouseLocationSearch] = useState("");
  const [warehouseLocationLoading, setWarehouseLocationLoading] =
    useState(false);

  // ========================================
  // CLASSES
  // ========================================

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition duration-150 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15";

  const readonlyClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-600 outline-none cursor-not-allowed select-none";

  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  // ========================================
  // ========================================
  // REQUIRED FIELD VALIDATION
  // ========================================

  const validateRequiredFields = () => {
    // ========================================
    // RESOLVE PICKUP WAREHOUSE
    // ========================================
    // selectedWarehouse is the primary source.
    // If React state is temporarily empty, resolve the
    // warehouse from the address currently shown in the field.

    const currentPickupAddress = String(
      formData.pickup_address || warehouseSearch || "",
    )
      .trim()
      .toLowerCase();

    const effectiveWarehouse = selectedWarehouse?.id
      ? selectedWarehouse
      : warehouses.find((warehouse) => {
          const warehouseAddress = getWarehouseDisplayAddress(warehouse)
            .trim()
            .toLowerCase();

          const addressLine = String(warehouse.address_line1 || "")
            .trim()
            .toLowerCase();

          return (
            warehouseAddress === currentPickupAddress ||
            addressLine === currentPickupAddress
          );
        }) || null;

    // ========================================
    // EFFECTIVE PICKUP ADDRESS
    // ========================================

    const effectivePickupAddress = String(
      formData.pickup_address ||
        warehouseSearch ||
        (effectiveWarehouse
          ? getWarehouseDisplayAddress(effectiveWarehouse)
          : ""),
    ).trim();

    // ========================================
    // EFFECTIVE PICKUP PINCODE
    // ========================================

    const effectivePickupPincode = String(
      formData.pickup_pincode || effectiveWarehouse?.pincode || "",
    ).trim();

    // ========================================
    // PICKUP WAREHOUSE
    // ========================================

    if (!effectiveWarehouse?.id) {
      toast.error("Please select a pickup warehouse");
      return false;
    }

    // ========================================
    // PICKUP ADDRESS
    // ========================================

    if (!effectivePickupAddress) {
      toast.error("Please enter pickup address");
      return false;
    }

    // ========================================
    // PICKUP PINCODE
    // ========================================

    if (!/^\d{6}$/.test(effectivePickupPincode)) {
      toast.error("Please enter a valid 6-digit pickup pincode");
      return false;
    }

    // ========================================
    // CONSIGNEE
    // ========================================

    if (!String(formData.consignee_name || "").trim()) {
      toast.error("Please enter consignee name");
      return false;
    }

    // ========================================
    // MOBILE
    // ========================================

    if (!/^\d{10}$/.test(String(formData.mobile || "").trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    // ========================================
    // DELIVERY ADDRESS
    // ========================================

    if (!String(formData.address_line1 || "").trim()) {
      toast.error("Please enter delivery address");
      return false;
    }

    // ========================================
    // DELIVERY PINCODE
    // ========================================

    if (!/^\d{6}$/.test(String(formData.pincode || "").trim())) {
      toast.error("Please enter a valid 6-digit delivery pincode");
      return false;
    }

    // ========================================
    // CITY / STATE
    // ========================================

    if (
      !String(formData.city || "").trim() ||
      !String(formData.state || "").trim()
    ) {
      toast.error("Please enter a valid delivery pincode");
      return false;
    }

    // ========================================
    // PRODUCT VALIDATION
    // ========================================

    if (!Array.isArray(products) || products.length === 0) {
      toast.error("At least one product is required");
      return false;
    }

    // ========================================
    // PACKAGE VALIDATION
    // ========================================

    if (!Array.isArray(packages) || packages.length === 0) {
      toast.error("At least one package is required");
      return false;
    }

    // ========================================
    // SUCCESS
    // ========================================

    return true;
  };
  // ========================================
  // RESET SHIPPING RATE
  // ========================================
  // ========================================
  // RESET SHIPPING RATE
  // ========================================

  const resetShippingRate = () => {
    setShippingRate(null);
    setShippingOptions(null);
    setSelectedShippingType(null);
  };

  // ========================================
  // WAREHOUSE HELPERS
  // ========================================

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.id || null;
    } catch (error) {
      return null;
    }
  };

  const getWarehouseDisplayAddress = (warehouse) => {
    if (!warehouse) return "";

    const parts = [
      warehouse.address_line1,
      warehouse.address_line2,
      warehouse.landmark,
      warehouse.city,
      warehouse.state,
    ].filter(Boolean);

    const address = parts.join(", ");
    return warehouse.pincode ? `${address} - ${warehouse.pincode}` : address;
  };

  const applyWarehouseToPickup = (warehouse) => {
    if (!warehouse) return;

    setSelectedWarehouse(warehouse);

    setFormData((prev) => ({
      ...prev,
      pickup_address: getWarehouseDisplayAddress(warehouse),
      pickup_pincode: String(warehouse.pincode || ""),
      pickup_city: warehouse.city || "",
    }));

    setWarehouseSearch("");
    setShowWarehouseDropdown(false);
    resetShippingRate();
  };

  // ========================================
  // DEFAULT PICKUP WAREHOUSE
  // ========================================

  const getStoredDefaultWarehouse = (userId, list) => {
    if (!userId || !Array.isArray(list) || list.length === 0) {
      return null;
    }

    // ================================================================
    // SOURCE OF TRUTH #1: backend default flag / default id
    // ================================================================
    // The Pickup Address page may save the default on the server.  The
    // pincode is NOT used here because two warehouses can share a pincode.
    const explicitDefault = list.find((warehouse) => {
      const values = [
        warehouse.is_default,
        warehouse.isDefault,
        warehouse.default,
        warehouse.is_default_pickup,
        warehouse.isDefaultPickup,
        warehouse.default_pickup,
        warehouse.defaultPickup,
        warehouse.is_primary,
        warehouse.isPrimary,
      ];

      return values.some(
        (value) =>
          value === true ||
          value === 1 ||
          String(value).trim().toLowerCase() === "true" ||
          String(value).trim().toLowerCase() === "default",
      );
    });

    if (explicitDefault) {
      return explicitDefault;
    }

    // ================================================================
    // SOURCE OF TRUTH #2: localStorage values used by Settings
    // ================================================================
    const possibleKeys = [
      `shipdrop_default_warehouse_${userId}`,
      "shipdrop_default_warehouse",
      `default_warehouse_${userId}`,
      "default_warehouse",
      `defaultWarehouseId_${userId}`,
      "defaultWarehouseId",
      `default_warehouse_id_${userId}`,
      "default_warehouse_id",
      "defaultPickupWarehouse",
      "default_pickup_warehouse",
      "defaultPickupAddress",
      "default_pickup_address",
    ];

    const readStoredValue = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      } catch {
        return null;
      }
    };

    const findFromStoredValue = (stored) => {
      if (stored === null || stored === undefined) return null;

      const findById = (id) => {
        if (id === null || id === undefined || String(id).trim() === "") {
          return null;
        }
        return (
          list.find((warehouse) => String(warehouse.id) === String(id)) || null
        );
      };

      if (typeof stored === "string" || typeof stored === "number") {
        return findById(stored);
      }

      if (typeof stored === "object") {
        const id =
          stored.id ??
          stored.warehouse_id ??
          stored.warehouseId ??
          stored.pickup_address_id ??
          stored.pickupAddressId ??
          stored.default_warehouse_id ??
          stored.defaultWarehouseId;

        const byId = findById(id);
        if (byId) return byId;

        const storedName =
          stored.warehouse_name || stored.warehouseName || stored.name;

        if (storedName) {
          const byName = list.find(
            (warehouse) =>
              String(warehouse.warehouse_name || "")
                .trim()
                .toLowerCase() === String(storedName).trim().toLowerCase(),
          );
          if (byName) return byName;
        }

        const storedAddress = [
          stored.address_line1,
          stored.address_line2,
          stored.landmark,
          stored.city,
          stored.state,
        ]
          .filter(Boolean)
          .join(", ");

        if (storedAddress) {
          const byAddress = list.find(
            (warehouse) =>
              getWarehouseDisplayAddress(warehouse)
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase() ===
              `${storedAddress}${stored.pincode ? ` - ${stored.pincode}` : ""}`
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase(),
          );
          if (byAddress) return byAddress;
        }
      }

      return null;
    };

    // First check known keys in a stable order.
    for (const key of possibleKeys) {
      const match = findFromStoredValue(readStoredValue(key));
      if (match) return match;
    }

    // Compatibility fallback for older Settings builds.
    // Only consider keys that clearly represent a default pickup/warehouse.
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) continue;

        const normalizedKey = key.toLowerCase();
        if (
          !normalizedKey.includes("default") ||
          (!normalizedKey.includes("warehouse") &&
            !normalizedKey.includes("pickup"))
        ) {
          continue;
        }

        const match = findFromStoredValue(readStoredValue(key));
        if (match) return match;
      }
    } catch (error) {
      console.log("Default warehouse storage read error:", error);
    }

    return null;
  };

  const applyDefaultWarehouseIfAvailable = (list = warehouses) => {
    const userId = getUserId();

    if (!userId || !Array.isArray(list) || list.length === 0) {
      return false;
    }

    // Never overwrite pickup details while editing an order.
    if (sessionStorage.getItem("editingProcessingOrder")) {
      return false;
    }

    const defaultWarehouse = getStoredDefaultWarehouse(userId, list);

    if (!defaultWarehouse) {
      return false;
    }

    applyWarehouseToPickup(defaultWarehouse);
    return true;
  };

  const loadWarehouses = async () => {
    const userId = getUserId();

    if (!userId) return;

    setWarehousesLoading(true);

    try {
      const response = await api.get("/warehouses", {
        params: { user_id: userId },
      });

      const list = Array.isArray(response.data?.warehouses)
        ? response.data.warehouses
        : [];

      const activeList = list.filter((item) => item.status !== "INACTIVE");

      setWarehouses(activeList);

      const apiDefaultId =
        response.data?.default_warehouse_id ??
        response.data?.defaultWarehouseId ??
        response.data?.default_pickup_address_id ??
        response.data?.defaultPickupAddressId ??
        response.data?.default_warehouse?.id ??
        response.data?.defaultWarehouse?.id;

      const apiDefaultWarehouse = apiDefaultId
        ? activeList.find(
            (warehouse) => String(warehouse.id) === String(apiDefaultId),
          )
        : null;

      if (apiDefaultWarehouse) {
        applyWarehouseToPickup(apiDefaultWarehouse);
      } else {
        // Settings -> Pickup Address -> Default
        // is automatically applied in Create Order.
        applyDefaultWarehouseIfAvailable(activeList);
      }
    } catch (error) {
      console.log("Warehouse load error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load pickup warehouses",
      );
    } finally {
      setWarehousesLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();

    const refreshDefaultWarehouse = () => {
      if (warehouses.length > 0) {
        applyDefaultWarehouseIfAvailable(warehouses);
      } else {
        loadWarehouses();
      }
    };

    window.addEventListener("warehouseDefaultChanged", refreshDefaultWarehouse);

    window.addEventListener(
      "pickupAddressDefaultChanged",
      refreshDefaultWarehouse,
    );

    window.addEventListener("defaultWarehouseChanged", refreshDefaultWarehouse);

    window.addEventListener("storage", refreshDefaultWarehouse);

    return () => {
      window.removeEventListener(
        "warehouseDefaultChanged",
        refreshDefaultWarehouse,
      );

      window.removeEventListener(
        "pickupAddressDefaultChanged",
        refreshDefaultWarehouse,
      );

      window.removeEventListener(
        "defaultWarehouseChanged",
        refreshDefaultWarehouse,
      );

      window.removeEventListener("storage", refreshDefaultWarehouse);
    };
  }, []);

  const openWarehouseModal = () => {
    setWarehouseForm({ ...initialWarehouseForm });
    setWarehouseMapPosition(DEFAULT_WAREHOUSE_MAP_POSITION);
    setWarehouseMapMarker(null);
    setWarehouseLocationSearch("");
    setShowWarehouseModal(true);
    setShowWarehouseDropdown(false);
  };

  const closeWarehouseModal = () => {
    if (warehouseSaving) return;

    setShowWarehouseModal(false);
    setWarehouseForm({ ...initialWarehouseForm });
    setWarehouseMapMarker(null);
    setWarehouseLocationSearch("");
  };

  // ========================================
  // WAREHOUSE MAP / LOCATION
  // ========================================

  const applyReverseGeocode = async (latitude, longitude) => {
    setWarehouseLocationLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          latitude,
        )}&lon=${encodeURIComponent(longitude)}&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to find this location");
      }

      const data = await response.json();
      const address = data?.address || {};

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";

      const state = address.state || "";
      const postcode = String(address.postcode || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      const roadParts = [
        address.house_number,
        address.road,
        address.neighbourhood,
        address.suburb,
      ].filter(Boolean);

      const detectedAddress = roadParts.join(", ");

      setWarehouseForm((prev) => ({
        ...prev,
        address_line1: detectedAddress || prev.address_line1,
        pincode: postcode || prev.pincode,
        city: city || prev.city,
        state: state || prev.state,
        country: "India",
      }));

      setWarehouseLocationSearch(
        data?.display_name ||
          [detectedAddress, city, state, postcode].filter(Boolean).join(", "),
      );

      return true;
    } catch (error) {
      console.log("Warehouse reverse geocode error:", error);
      toast.error("Unable to read address from this location");
      return false;
    } finally {
      setWarehouseLocationLoading(false);
    }
  };

  const handleWarehouseMapLocation = async (latitude, longitude) => {
    setWarehouseMapPosition([latitude, longitude]);
    setWarehouseMapMarker([latitude, longitude]);
    await applyReverseGeocode(latitude, longitude);
  };

  const searchWarehouseLocation = async (e) => {
    e?.preventDefault?.();

    const query = warehouseLocationSearch.trim();

    if (!query) {
      toast.error("Enter an area, street or building");
      return;
    }

    setWarehouseLocationLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&addressdetails=1&q=${encodeURIComponent(
          query,
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to search location");
      }

      const data = await response.json();
      const result = data?.[0];

      if (!result) {
        toast.error("Location not found");
        return;
      }

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Invalid map coordinates");
      }

      setWarehouseMapPosition([latitude, longitude]);
      setWarehouseMapMarker([latitude, longitude]);

      const address = result.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";
      const state = address.state || "";
      const postcode = String(address.postcode || "")
        .replace(/\D/g, "")
        .slice(0, 6);

      const roadParts = [
        address.house_number,
        address.road,
        address.neighbourhood,
        address.suburb,
      ].filter(Boolean);

      setWarehouseForm((prev) => ({
        ...prev,
        address_line1: roadParts.length
          ? roadParts.join(", ")
          : prev.address_line1,
        pincode: postcode || prev.pincode,
        city: city || prev.city,
        state: state || prev.state,
        country: "India",
      }));

      setWarehouseLocationSearch(result.display_name || query);
      toast.success("Location selected");
    } catch (error) {
      console.log("Warehouse location search error:", error);
      toast.error("Unable to search this location");
    } finally {
      setWarehouseLocationLoading(false);
    }
  };

  const detectWarehouseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not supported by this browser");
      return;
    }

    setWarehouseLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleWarehouseMapLocation(
          position.coords.latitude,
          position.coords.longitude,
        );
        setWarehouseLocationLoading(false);
      },
      (error) => {
        console.log("Warehouse geolocation error:", error);
        setWarehouseLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Please allow location access to use Detect");
        } else {
          toast.error("Unable to detect your location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleWarehouseFormChange = (e) => {
    const { name, value } = e.target;

    const numberOnlyFields = ["phone", "pincode", "return_pincode"];

    if (numberOnlyFields.includes(name)) {
      const maxLength = name === "phone" ? 10 : 6;
      const cleanValue = value.replace(/\D/g, "").slice(0, maxLength);

      setWarehouseForm((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));

      return;
    }

    setWarehouseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const lookupWarehousePincode = async (value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);

    setWarehouseForm((prev) => ({
      ...prev,
      pincode: cleanValue,
      city: "",
      state: "",
    }));

    if (cleanValue.length !== 6) return;

    setWarehousePincodeLoading(true);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanValue}`,
      );

      if (!response.ok) throw new Error("Unable to lookup pincode");

      const data = await response.json();

      if (
        !data?.[0] ||
        data[0].Status !== "Success" ||
        !data[0].PostOffice?.length
      ) {
        throw new Error("Invalid pincode");
      }

      const postOffice = data[0].PostOffice[0];

      setWarehouseForm((prev) => ({
        ...prev,
        pincode: cleanValue,
        city: postOffice.District || postOffice.Block || "",
        state: postOffice.State || "",
        country: "India",
      }));
    } catch (error) {
      console.log("Warehouse pincode lookup error:", error);

      setWarehouseForm((prev) => ({
        ...prev,
        city: "",
        state: "",
      }));

      toast.error("Unable to verify warehouse pincode");
    } finally {
      setWarehousePincodeLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();

    const userId = getUserId();

    if (!userId) {
      toast.error("User session not found. Please login again.");
      return;
    }

    if (!warehouseForm.warehouse_name.trim()) {
      toast.error("Please enter warehouse name");
      return;
    }

    if (!warehouseForm.contact_name.trim()) {
      toast.error("Please enter contact name");
      return;
    }

    if (!/^\d{10}$/.test(warehouseForm.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (!/^\d{6}$/.test(warehouseForm.pincode)) {
      toast.error("Please enter a valid 6-digit warehouse pincode");
      return;
    }

    if (!warehouseForm.address_line1.trim()) {
      toast.error("Please enter warehouse address");
      return;
    }

    if (!warehouseForm.city.trim() || !warehouseForm.state.trim()) {
      toast.error("Please enter a valid warehouse pincode");
      return;
    }

    const payload = {
      user_id: userId,
      ...warehouseForm,
      return_address:
        warehouseForm.return_address.trim() || warehouseForm.address_line1,
      return_city: warehouseForm.return_city || warehouseForm.city,
      return_pincode: warehouseForm.return_pincode || warehouseForm.pincode,
      return_state: warehouseForm.return_state || warehouseForm.state,
      return_country:
        warehouseForm.return_country || warehouseForm.country || "India",
    };

    setWarehouseSaving(true);

    try {
      const response = await api.post("/warehouses/create", payload);
      const result = response.data;

      if (!result?.success) {
        throw new Error(result?.message || "Unable to create warehouse");
      }

      toast.success("Warehouse created successfully");
      setShowWarehouseModal(false);
      setWarehouseForm({ ...initialWarehouseForm });

      await loadWarehouses();

      if (result.warehouse_id) {
        const refreshed = await api.get("/warehouses", {
          params: { user_id: userId },
        });

        const refreshedList = Array.isArray(refreshed.data?.warehouses)
          ? refreshed.data.warehouses
          : [];

        const newWarehouse = refreshedList.find(
          (item) => Number(item.id) === Number(result.warehouse_id),
        );

        if (newWarehouse) {
          setWarehouses(
            refreshedList.filter((item) => item.status !== "INACTIVE"),
          );
          applyWarehouseToPickup(newWarehouse);
        }
      }
    } catch (error) {
      console.log("Create warehouse error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create warehouse",
      );
    } finally {
      setWarehouseSaving(false);
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const search = warehouseSearch.trim().toLowerCase();

    // If the field currently contains a selected warehouse address,
    // opening the dropdown must show EVERY saved warehouse.  The full
    // address is a display string, while the DB fields are separate, so
    // searching that whole string otherwise produces "No warehouse found".
    if (
      selectedWarehouse &&
      search ===
        getWarehouseDisplayAddress(selectedWarehouse).trim().toLowerCase()
    ) {
      return true;
    }

    if (!search) return true;

    return [
      warehouse.warehouse_name,
      warehouse.contact_name,
      warehouse.address_line1,
      warehouse.address_line2,
      warehouse.landmark,
      warehouse.city,
      warehouse.state,
      warehouse.pincode,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  // ========================================
  // GENERAL FORM CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numberOnlyFields = ["mobile", "alternate_mobile"];

    if (numberOnlyFields.includes(name)) {
      const cleanValue = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "pincode" || name === "pickup_pincode") {
      resetShippingRate();
    }
  };

  // ========================================
  // ENTER KEY NAVIGATION
  // ========================================

  const handleEnterKey = (e) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const fieldOrder = [
      "pickup_address",
      "consignee_name",
      "mobile",
      "address_line1",
      "pincode",
    ];

    const currentName = e.currentTarget.name;

    const currentIndex = fieldOrder.indexOf(currentName);

    if (currentIndex !== -1) {
      if (currentIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIndex + 1];

        document.querySelector(`[name="${nextField}"]`)?.focus();

        return;
      }

      document.querySelector('[data-enter="product-title-0"]')?.focus();

      return;
    }

    const currentElement = e.currentTarget;

    const nextSelector = currentElement.getAttribute("data-next-enter");

    if (nextSelector) {
      document.querySelector(nextSelector)?.focus();

      return;
    }

    document.querySelector('[data-action="save-next"]')?.click();
  };

  // ========================================
  // PICKUP PINCODE
  // ========================================

  const handlePickupPincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);

    setFormData((prev) => ({
      ...prev,
      pickup_pincode: value,
    }));

    resetShippingRate();

    if (value.length !== 6) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
      );

      if (!response.ok) {
        throw new Error("Unable to lookup pincode");
      }

      const data = await response.json();

      if (
        !data ||
        !data[0] ||
        data[0].Status !== "Success" ||
        !data[0].PostOffice ||
        data[0].PostOffice.length === 0
      ) {
        setFormData((prev) => ({
          ...prev,
          pickup_city: "",
        }));

        toast.error("Invalid pickup pincode");

        return;
      }

      const postOffice = data[0].PostOffice[0];

      const pickupCity = postOffice.District || postOffice.Block || "";

      setFormData((prev) => ({
        ...prev,
        pickup_pincode: value,
        pickup_city: pickupCity,
      }));

      toast.success("Pickup pincode verified");
    } catch (error) {
      console.log("Pickup pincode lookup error:", error);

      toast.error("Unable to verify pickup pincode");
    }
  };

  // ========================================
  // DELIVERY PINCODE
  // ========================================

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);

    setFormData((prev) => ({
      ...prev,
      pincode: value,
      city: "",
      state: "",
      country: value.length === 6 ? "" : "India",
    }));

    resetShippingRate();

    if (value.length !== 6) {
      return;
    }

    setPincodeLoading(true);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
      );

      if (!response.ok) {
        throw new Error("Unable to lookup pincode");
      }

      const data = await response.json();

      if (
        !data ||
        !data[0] ||
        data[0].Status !== "Success" ||
        !data[0].PostOffice ||
        data[0].PostOffice.length === 0
      ) {
        setFormData((prev) => ({
          ...prev,
          city: "",
          state: "",
          country: "India",
        }));

        toast.error("Invalid pincode");

        return;
      }

      const postOffice = data[0].PostOffice[0];

      const city = postOffice.District || postOffice.Block || "";

      const state = postOffice.State || "";

      setFormData((prev) => ({
        ...prev,
        pincode: value,
        city,
        state,
        country: "India",
      }));
    } catch (error) {
      console.log("Pincode lookup error:", error);

      setFormData((prev) => ({
        ...prev,
        city: "",
        state: "",
        country: "India",
      }));

      toast.error("Unable to find this pincode");
    } finally {
      setPincodeLoading(false);
    }
  };

  // ========================================
  // PRODUCT LOGIC
  // ========================================

  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });

    resetShippingRate();
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, { ...initialProduct }]);

    resetShippingRate();
  };

  const removeProduct = (index) => {
    if (products.length === 1) {
      toast.error("At least one product is required");

      return;
    }

    setProducts((prev) => prev.filter((_, i) => i !== index));

    resetShippingRate();
  };

  // ========================================
  // PACKAGE LOGIC
  // ========================================

  const handlePackageChange = (index, field, value) => {
    setPackages((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });

    resetShippingRate();
  };

  const addPackage = () => {
    setPackages((prev) => [...prev, { ...initialPackage }]);

    resetShippingRate();
  };

  const removePackage = (index) => {
    if (packages.length === 1) {
      toast.error("At least one package is required");

      return;
    }

    setPackages((prev) => prev.filter((_, i) => i !== index));

    resetShippingRate();
  };

  // ========================================
  // PRODUCT CALCULATIONS
  // ========================================

  const getProductValues = (product) => {
    const price = Number(product.price) || 0;

    const qty = Number(product.qty) || 0;

    const tax = Number(product.tax) || 0;

    const total = price * qty;

    const taxableValue = tax > 0 ? total / (1 + tax / 100) : total;

    const taxAmount = total - taxableValue;

    return {
      taxableValue,
      taxAmount,
      total,
    };
  };

  const totalTaxableValue = products.reduce(
    (sum, product) => sum + getProductValues(product).taxableValue,
    0,
  );

  const totalGST = products.reduce(
    (sum, product) => sum + getProductValues(product).taxAmount,
    0,
  );

  const totalInvoiceValue = products.reduce(
    (sum, product) => sum + getProductValues(product).total,
    0,
  );

  // ========================================
  // VOLUMETRIC WEIGHT
  // ========================================

  const getVolumetricWeight = (item) => {
    const l = Number(item.length) || 0;

    const w = Number(item.width) || 0;

    const h = Number(item.height) || 0;

    if (!l || !w || !h) {
      return "0.00";
    }

    return ((l * w * h) / 5000).toFixed(2);
  };

  // ========================================
  // TOTAL VOLUMETRIC WEIGHT
  // ========================================

  const getTotalVolumetricWeight = () => {
    return packages.reduce((sum, item) => {
      const length = Number(item.length) || 0;
      const width = Number(item.width) || 0;
      const height = Number(item.height) || 0;
      const count = Number(item.count) || 1;

      if (!length || !width || !height) {
        return sum;
      }

      const volumetricWeight = (length * width * height) / 5000;

      return sum + volumetricWeight * count;
    }, 0);
  };

  // ========================================
  // CHARGEABLE WEIGHT
  // DEADWEIGHT vs VOLUMETRIC WEIGHT
  // ========================================

  const getChargeableWeight = () => {
    const deadWeight = getTotalWeight();

    const volumetricWeight = getTotalVolumetricWeight();

    return Math.max(deadWeight, volumetricWeight);
  };

  // ========================================
  // TOTAL WEIGHT
  // ========================================

  const getTotalWeight = () => {
    return packages.reduce((sum, item) => {
      const weight = Number(item.weight) || 0;

      const count = Number(item.count) || 1;

      return sum + weight * count;
    }, 0);
  };

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("editingProcessingOrder");

    if (!storedOrder) return;

    try {
      const order = JSON.parse(storedOrder);

      setIsEditMode(true);
      setEditingOrderId(order.id);

      setFormData({
        pickup_address: order.pickup_address || "",
        pickup_pincode: order.pickup_pincode || "",
        pickup_city: order.pickup_city || "",

        consignee_name: order.consignee_name || "",
        mobile: order.mobile || "",
        alternate_mobile: order.alternate_mobile || "",
        email: order.email || "",

        gstin: order.gstin || "",
        company_name: order.company_name || "",
        floor_no: order.floor_no || "",
        landmark: order.landmark || "",

        address_line1: order.address_line1 || "",
        address_line2: order.address_line2 || "",

        pincode: order.pincode || "",
        city: order.city || "",
        state: order.state || "",
        country: order.country || "India",

        payment_type: order.payment_type || "Prepaid",
        risk_type: order.risk_type || "Owner Risk",
      });

      // Restore the exact warehouse used by this order.
      if (order.warehouse_id && warehouses.length) {
        const matchingWarehouse = warehouses.find(
          (warehouse) => Number(warehouse.id) === Number(order.warehouse_id),
        );

        if (matchingWarehouse) {
          setSelectedWarehouse(matchingWarehouse);
          setWarehouseSearch(getWarehouseDisplayAddress(matchingWarehouse));
        }
      }

      if (Array.isArray(order.products) && order.products.length) {
        setProducts(
          order.products.map((item) => ({
            product: item.product_name || item.product || "",
            sku: item.sku || "",
            price: item.price || "",
            qty: item.qty || 1,
            tax: item.tax || 0,
          })),
        );
      }

      if (Array.isArray(order.packages) && order.packages.length) {
        setPackages(
          order.packages.map((item) => ({
            length: item.length || "",
            width: item.width || "",
            height: item.height || "",
            weight: item.weight || "",
            count: item.package_count || item.count || 1,
          })),
        );
      }
    } catch (error) {
      console.log("Edit order load error:", error);
      toast.error("Unable to load order");
    }
  }, []);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("editingProcessingOrder");
    if (!storedOrder || !warehouses.length || selectedWarehouse) return;

    try {
      const order = JSON.parse(storedOrder);
      if (!order?.warehouse_id) return;

      const matchingWarehouse = warehouses.find(
        (warehouse) => Number(warehouse.id) === Number(order.warehouse_id),
      );

      if (matchingWarehouse) {
        setSelectedWarehouse(matchingWarehouse);
        setWarehouseSearch(getWarehouseDisplayAddress(matchingWarehouse));
        setFormData((prev) => ({
          ...prev,
          pickup_address: getWarehouseDisplayAddress(matchingWarehouse),
          pickup_pincode: String(matchingWarehouse.pincode || ""),
          pickup_city: matchingWarehouse.city || "",
        }));
      }
    } catch (error) {
      console.log("Edit warehouse restore error:", error);
    }
  }, [warehouses, selectedWarehouse]);

  useEffect(() => {
    if (!warehouses.length || selectedWarehouse) return;

    // IMPORTANT:
    // Never replace an already selected warehouse just because another
    // warehouse has the same pincode. Multiple warehouses can share one
    // pincode (for example Kunal and Abhishek both use 302012).
    // The selected warehouse/default warehouse must win.
    if (selectedWarehouse) {
      return;
    }

    const exactAddress = String(formData.pickup_address || "")
      .trim()
      .toLowerCase();

    const matchByAddress = exactAddress
      ? warehouses.find(
          (warehouse) =>
            getWarehouseDisplayAddress(warehouse).trim().toLowerCase() ===
            exactAddress,
        )
      : null;

    const match = matchByAddress;

    if (match) {
      setSelectedWarehouse(match);
      setWarehouseSearch(getWarehouseDisplayAddress(match));
    } else {
      setWarehouseSearch(formData.pickup_address || "");
    }
  }, [warehouses, formData.pickup_address, selectedWarehouse]);

  const cancelEdit = () => {
    sessionStorage.removeItem("editingProcessingOrder");

    setIsEditMode(false);
    setEditingOrderId(null);

    resetForm();
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setFormData({
      ...initialFormData,
    });

    setSelectedWarehouse(null);
    setWarehouseSearch("");
    setShowWarehouseDropdown(false);

    setProducts([{ ...initialProduct }]);

    setPackages([{ ...initialPackage }]);

    resetShippingRate();

    // Reset ke baad bhi Settings wala Default Pickup
    // Warehouse automatically select rahe.
    if (!sessionStorage.getItem("editingProcessingOrder")) {
      requestAnimationFrame(() => {
        applyDefaultWarehouseIfAvailable(warehouses);
      });
    }
  };

  // ========================================
  // BUILD ORDER DATA
  // ========================================

  const buildOrderData = () => {
    const productData = products.map((p) => ({
      product_name: p.product,

      sku: p.sku || null,

      price: Number(p.price) || 0,

      qty: Number(p.qty) || 1,

      tax: Number(p.tax) || 0,
    }));

    const packageData = packages.map((item) => ({
      length: Number(item.length) || 0,

      width: Number(item.width) || 0,

      height: Number(item.height) || 0,

      weight: Number(item.weight) || 0,

      package_count: Number(item.count) || 1,
    }));

    const orderData = {
      warehouse_id: selectedWarehouse?.id || null,
      warehouse_id: selectedWarehouse?.id || null,
      consignee_name: formData.consignee_name,

      mobile: formData.mobile,

      alternate_mobile: formData.alternate_mobile || null,

      email: formData.email || null,

      gstin: formData.gstin || null,

      company_name: formData.company_name || null,

      floor_no: formData.floor_no || null,

      landmark: formData.landmark || null,

      address_line1: formData.address_line1,

      address_line2: formData.address_line2 || null,

      pincode: formData.pincode,

      city: formData.city,

      state: formData.state,

      country: formData.country || "India",

      payment_type: formData.payment_type,

      risk_type: formData.risk_type,
    };

    return {
      productData,
      packageData,
      orderData,
    };
  };

  // ========================================
  // CALCULATE SHIPPING RATES
  // ========================================

  const handleShip = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    // const totalWeight = getTotalWeight();

    const deadWeight = getTotalWeight();

    const volumetricWeight = getTotalVolumetricWeight();

    const chargeableWeight = Math.max(deadWeight, volumetricWeight);

    if (chargeableWeight <= 0) {
      toast.error("Please enter valid package weight or dimensions");

      return;
    }

    setRateLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user?.id) {
        toast.error("User session not found. Please login again.");
        return;
      }

      const response = await api.post("/rate/calculate-options", {
        user_id: user.id,
        pickup_pincode: formData.pickup_pincode,
        delivery_pincode: formData.pincode,
        weight: chargeableWeight,

        // COD calculation ke liye
        payment_type: formData.payment_type,
        product_value: totalInvoiceValue,
      });

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to calculate shipping rates",
        );
      }

      if (!result.road && !result.air && !result.shadowfax) {
        throw new Error("No shipping rate available");
      }

      // ======================================
      // STORE ALL OPTIONS
      // ======================================

      setShippingOptions({
        road: result.road || null,
        air: result.air || null,
        shadowfax: result.shadowfax || null,
      });

      // ======================================
      // DEFAULT = ROAD → AIR → SHADOWFAX
      // ======================================

      if (result.road) {
        setSelectedShippingType("ROAD");
        setShippingRate(result.road);
      } else if (result.air) {
        setSelectedShippingType("AIR");
        setShippingRate(result.air);
      } else {
        setSelectedShippingType("SHADOWFAX_ROAD");
        setShippingRate(result.shadowfax);
      }
      toast.success("Shipping rates calculated");
    } catch (error) {
      console.log("Shipping rate error:", error);

      resetShippingRate();

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to calculate shipping rate",
      );
    } finally {
      setRateLoading(false);
    }
  };

  // ========================================
  // SELECT ROAD / AIR / SHADOWFAX
  // ========================================

  const selectShippingType = (type) => {
    const normalized = String(type).trim().toUpperCase();

    const optionMap = {
      ROAD: shippingOptions?.road,
      AIR: shippingOptions?.air,
      SHADOWFAX_ROAD: shippingOptions?.shadowfax,
    };
    const selected = optionMap[normalized];
    if (!selected) {
      const names = {
        ROAD: "Delivery By Road",
        AIR: "Delivery By Air",
        SHADOWFAX_ROAD: "Shadowfax By Road",
      };

      toast.error(`${names[normalized] || "Shipping"} rate is not available`);

      return;
    }

    setSelectedShippingType(normalized);
    setShippingRate(selected);
  };

  // ========================================
  // SAVE & NEXT
  // ========================================

  const handleUpdateOrder = async (e) => {
    e?.preventDefault();

    if (!validateRequiredFields()) {
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    const { productData, packageData, orderData } = buildOrderData();

    setLoading(true);

    try {
      const response = await api.put(`/orders/${editingOrderId}`, {
        user_id: user.id,
        pickup_address: formData.pickup_address,
        pickup_pincode: formData.pickup_pincode,
        pickup_city: formData.pickup_city,
        warehouse_id: selectedWarehouse?.id || null,
        orderData,
        products: productData,
        packages: packageData,
      });

      const result = response.data;

      if (!result?.success) {
        throw new Error(result?.message || "Unable to update order");
      }

      toast.success(`Order #${editingOrderId} updated successfully`);

      sessionStorage.removeItem("editingProcessingOrder");

      window.dispatchEvent(new Event("processingOrderUpdated"));

      setIsEditMode(false);
      setEditingOrderId(null);

      resetForm();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.log("Update order error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to update order",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (isEditMode) {
      return handleUpdateOrder(e);
    }

    if (!validateRequiredFields()) {
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      toast.error("User session not found. Please login again.");

      return;
    }

    const { productData, packageData, orderData } = buildOrderData();

    const effectivePickupAddress = String(
      formData.pickup_address ||
        (selectedWarehouse
          ? getWarehouseDisplayAddress(selectedWarehouse)
          : ""),
    ).trim();

    const effectivePickupPincode = String(
      formData.pickup_pincode || selectedWarehouse?.pincode || "",
    ).trim();

    // ======================================
    // CREATE ORDER
    // ======================================

    const orderPayload = {
      user_id: user.id,

      pickup_address: effectivePickupAddress,

      pickup_pincode: effectivePickupPincode,

      pickup_city: formData.pickup_city || selectedWarehouse?.city || "",
      warehouse_id: selectedWarehouse?.id || null,

      orderData,

      products: productData,

      packages: packageData,
    };

    setLoading(true);

    try {
      const response = await api.post("/orders/create", orderPayload);

      const result = response.data;

      if (!result || !result.order_id) {
        throw new Error(result?.message || "Unable to create order");
      }

      toast.success(`Order #${result.order_id} created successfully`);

      window.dispatchEvent(new Event("processingOrderCreated"));

      resetForm();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.log("Create order error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to create order",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipment = async () => {
    // ======================================================
    // SHIPPING RATE
    // ======================================================

    console.log("🔥 HANDLE CONFIRM SHIPMENT CLICKED");
    console.log("FORM DATA:", formData);
    console.log("SELECTED WAREHOUSE:", selectedWarehouse);
    console.log("WAREHOUSE SEARCH:", warehouseSearch);

    if (!shippingRate) {
      toast.error("Please calculate shipping rate first");
      return;
    }

    // ======================================================
    // SHIPPING SERVICE
    // ======================================================

    if (!selectedShippingType) {
      toast.error("Please select a shipping service");
      return;
    }

    // ======================================================
    // GET ACTUAL VISIBLE PICKUP INPUT VALUE
    // ======================================================
    // React state kabhi-kabhi selected warehouse ke display value
    // ke saath sync nahi hoti. Isliye actual input value ko bhi read
    // kar rahe hain.

    const pickupInput = document.querySelector('input[name="pickup_address"]');

    const visiblePickupAddress = String(pickupInput?.value || "").trim();

    // ======================================================
    // POSSIBLE PICKUP ADDRESSES
    // ======================================================

    const possiblePickupAddresses = [
      formData.pickup_address,
      warehouseSearch,
      visiblePickupAddress,
    ]
      .map((value) =>
        String(value || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    // ======================================================
    // RESOLVE WAREHOUSE
    // ======================================================

    let effectiveWarehouse = null;

    // ------------------------------------------------------
    // 1. SELECTED WAREHOUSE
    // ------------------------------------------------------

    if (selectedWarehouse?.id) {
      effectiveWarehouse = selectedWarehouse;
    }

    // ------------------------------------------------------
    // 2. MATCH USING PICKUP ADDRESS
    // ------------------------------------------------------

    if (!effectiveWarehouse && Array.isArray(warehouses)) {
      effectiveWarehouse =
        warehouses.find((warehouse) => {
          const warehouseFullAddress = getWarehouseDisplayAddress(warehouse)
            .trim()
            .toLowerCase();

          const warehouseAddressLine = String(warehouse.address_line1 || "")
            .trim()
            .toLowerCase();

          return possiblePickupAddresses.some(
            (pickupAddress) =>
              pickupAddress === warehouseFullAddress ||
              pickupAddress === warehouseAddressLine,
          );
        }) || null;
    }

    // ------------------------------------------------------
    // 3. MATCH USING PINCODE
    // ------------------------------------------------------

    if (!effectiveWarehouse && Array.isArray(warehouses)) {
      const pickupPincode = String(formData.pickup_pincode || "").trim();

      if (pickupPincode) {
        effectiveWarehouse =
          warehouses.find(
            (warehouse) =>
              String(warehouse.pincode || "").trim() === pickupPincode,
          ) || null;
      }
    }

    // ======================================================
    // EFFECTIVE PICKUP ADDRESS
    // ======================================================

    const effectivePickupAddress = String(
      formData.pickup_address ||
        visiblePickupAddress ||
        warehouseSearch ||
        (effectiveWarehouse
          ? getWarehouseDisplayAddress(effectiveWarehouse)
          : ""),
    ).trim();

    // ======================================================
    // EFFECTIVE PICKUP PINCODE
    // ======================================================

    const effectivePickupPincode = String(
      formData.pickup_pincode || effectiveWarehouse?.pincode || "",
    ).trim();

    // ======================================================
    // EFFECTIVE PICKUP CITY
    // ======================================================

    const effectivePickupCity = String(
      formData.pickup_city || effectiveWarehouse?.city || "",
    ).trim();

    // ======================================================
    // DEBUG
    // ======================================================

    console.log("========== CONFIRM SHIPMENT PICKUP DEBUG ==========");

    console.log("formData.pickup_address:", formData.pickup_address);

    console.log("warehouseSearch:", warehouseSearch);

    console.log("visiblePickupAddress:", visiblePickupAddress);

    console.log("selectedWarehouse:", selectedWarehouse);

    console.log("effectiveWarehouse:", effectiveWarehouse);

    console.log("effectivePickupAddress:", effectivePickupAddress);

    console.log("effectivePickupPincode:", effectivePickupPincode);

    console.log("effectivePickupCity:", effectivePickupCity);

    console.log("===================================================");

    // ======================================================
    // WAREHOUSE CHECK
    // ======================================================

    if (!effectiveWarehouse?.id) {
      toast.error("Please select a pickup warehouse");
      return;
    }

    // ======================================================
    // PICKUP ADDRESS CHECK
    // ======================================================

    if (!effectivePickupAddress) {
      toast.error("Pickup address is required");
      return;
    }

    // ======================================================
    // PICKUP PINCODE CHECK
    // ======================================================

    if (!/^\d{6}$/.test(effectivePickupPincode)) {
      toast.error("Valid 6-digit pickup pincode is required");
      return;
    }

    // ======================================================
    // NORMAL FORM VALIDATION
    // ======================================================

    if (!validateRequiredFields()) {
      return;
    }

    // ======================================================
    // USER
    // ======================================================

    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      user = null;
    }

    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    // ======================================================
    // BUILD ORDER DATA
    // ======================================================

    const {
      productData,
      packageData,
      orderData: baseOrderData,
    } = buildOrderData();

    // ======================================================
    // LOADING
    // ======================================================

    setLoading(true);

    try {
      let orderId = null;

      // ====================================================
      // EDIT EXISTING ORDER
      // ====================================================

      if (isEditMode && editingOrderId) {
        orderId = Number(editingOrderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
          throw new Error("Invalid order ID");
        }

        const updateResponse = await api.put(`/orders/${orderId}`, {
          user_id: Number(user.id),

          pickup_address: effectivePickupAddress,

          pickup_pincode: effectivePickupPincode,

          pickup_city: effectivePickupCity,

          warehouse_id: Number(effectiveWarehouse.id),

          orderData: {
            ...baseOrderData,

            id: Number(orderId),

            warehouse_id: Number(effectiveWarehouse.id),
          },

          products: productData,

          packages: packageData,
        });

        const updateResult = updateResponse.data;

        if (!updateResult?.success) {
          throw new Error(updateResult?.message || "Unable to update order");
        }
      }

      // ====================================================
      // CREATE NEW ORDER
      // ====================================================
      else {
        const orderPayload = {
          user_id: Number(user.id),

          pickup_address: effectivePickupAddress,

          pickup_pincode: effectivePickupPincode,

          pickup_city: effectivePickupCity,

          warehouse_id: Number(effectiveWarehouse.id),

          orderData: {
            ...baseOrderData,

            warehouse_id: Number(effectiveWarehouse.id),
          },

          products: productData,

          packages: packageData,
        };

        console.log("========== CREATE ORDER PAYLOAD ==========");

        console.log(JSON.stringify(orderPayload, null, 2));

        console.log("==========================================");

        const orderResponse = await api.post("/orders/create", orderPayload);

        const orderResult = orderResponse.data;

        if (!orderResult || !orderResult.order_id) {
          throw new Error(orderResult?.message || "Unable to create order");
        }

        orderId = Number(orderResult.order_id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
          throw new Error("Invalid order ID received from server");
        }

        window.dispatchEvent(new Event("processingOrderCreated"));
      }

      // ====================================================
      // FINAL ORDER ID
      // ====================================================

      if (!orderId) {
        throw new Error("Order ID is required");
      }

      // ====================================================
      // SERVICE TYPE
      // ====================================================

      const normalizedShippingType = String(selectedShippingType)
        .trim()
        .toUpperCase();

      const finalServiceType =
        normalizedShippingType === "SHADOWFAX_ROAD"
          ? "SHADOWFAX_ROAD"
          : shippingRate.service_type || normalizedShippingType || "ROAD";

      // ====================================================
      // SHIPMENT ORDER DATA
      // ====================================================

      const shipmentOrderData = {
        ...baseOrderData,

        id: Number(orderId),

        warehouse_id: Number(effectiveWarehouse.id),
      };

      // ====================================================
      // SHIPMENT DATA
      // ====================================================

      const shipmentData = {
        user_id: Number(user.id),

        order_id: Number(orderId),

        pickup_address: effectivePickupAddress,

        pickup_pincode: effectivePickupPincode,

        pickup_city: effectivePickupCity,

        warehouse_id: Number(effectiveWarehouse.id),

        orderData: shipmentOrderData,

        products: productData,

        packages: packageData,

        service_type: finalServiceType,

        shipping_charge: Number(shippingRate.shipping_charge),

        zone: shippingRate.zone,

        distance_km:
          shippingRate.distance_km === null ||
          shippingRate.distance_km === undefined
            ? null
            : Number(shippingRate.distance_km),
      };

      // ====================================================
      // DEBUG SHIPMENT
      // ====================================================

      console.log("========== CONFIRM SHIPMENT PAYLOAD ==========");

      console.log(JSON.stringify(shipmentData, null, 2));

      console.log("==============================================");

      // ====================================================
      // CONFIRM SHIPMENT
      // ====================================================

      const shipmentResponse = await api.post(
        "/shipments/confirm",
        shipmentData,
      );

      const shipmentResult = shipmentResponse.data;

      // ====================================================
      // RESPONSE CHECK
      // ====================================================

      if (!shipmentResult?.success) {
        throw new Error(
          shipmentResult?.message || "Unable to confirm shipment",
        );
      }

      // ====================================================
      // SERVICE NAME
      // ====================================================

      const serviceNames = {
        ROAD: "Delivery By Road",

        AIR: "Delivery By Air",

        SHADOWFAX_ROAD: "Shadowfax By Road",
      };

      // ====================================================
      // SUCCESS
      // ====================================================

      toast.success(
        `Shipment confirmed for Order #${orderId} — ${
          serviceNames[normalizedShippingType] || normalizedShippingType
        }`,
      );

      // ====================================================
      // WALLET UPDATE
      // ====================================================

      window.dispatchEvent(new Event("walletUpdated"));

      // ====================================================
      // PROCESSING ORDER UPDATE
      // ====================================================

      window.dispatchEvent(new Event("processingOrderUpdated"));

      // ====================================================
      // CLOSE SHIPPING MODAL
      // ====================================================

      setShippingRate(null);
      setShippingOptions(null);
      setSelectedShippingType(null);

      // ====================================================
      // RESET FORM
      // ====================================================

      resetForm();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.log("Confirm shipment error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to confirm shipment",
      );
    } finally {
      setLoading(false);
    }
  };
  // ========================================
  // JSX
  // ========================================
  // ========================================
  // JSX
  // ========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode
                ? `Edit Order #${editingOrderId}`
                : "Create New Order"}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Add recipient details, product manifest, and package parameters
            </p>
          </div>

          <button
            type="button"
            onClick={isEditMode ? cancelEdit : resetForm}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-xs"
          >
            Reset Form
          </button>
        </div>

        {/* ======================================
            MAIN FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden"
        >
          {/* ======================================
              SECTION 1 PICKUP
          ====================================== */}

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                1
              </span>

              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Pickup From
              </h2>
            </div>

            <div className="relative">
              <label className={labelClass}>Pickup Address *</label>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    name="pickup_address"
                    value={
                      selectedWarehouse
                        ? getWarehouseDisplayAddress(selectedWarehouse)
                        : warehouseSearch
                    }
                    onChange={(e) => {
                      const value = e.target.value;

                      setSelectedWarehouse(null);
                      setWarehouseSearch(value);
                      setShowWarehouseDropdown(true);

                      setFormData((prev) => ({
                        ...prev,
                        pickup_address: value,
                        pickup_pincode: "",
                        pickup_city: "",
                      }));

                      resetShippingRate();
                    }}
                    onFocus={() => {
                      // Search box is separate from the displayed selected address.
                      // Clearing only warehouseSearch makes the dropdown show all
                      // saved warehouses without clearing the visible address.
                      setWarehouseSearch("");
                      setShowWarehouseDropdown(true);
                    }}
                    onKeyDown={handleEnterKey}
                    placeholder="Select pickup warehouse or add a new warehouse"
                    className={`${inputClass} h-12 border-[#7451ff] focus:border-[#7451ff] focus:ring-[#7451ff]/15 pr-10`}
                    autoComplete="off"
                    required
                  />

                  {warehousesLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                      Loading...
                    </span>
                  )}

                  {showWarehouseDropdown && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Saved Pickup Warehouses
                        </div>
                      </div>

                      <div className="overflow-visible">
                        {filteredWarehouses.length > 0 ? (
                          filteredWarehouses.map((warehouse) => (
                            <button
                              key={warehouse.id}
                              type="button"
                              onClick={() => applyWarehouseToPickup(warehouse)}
                              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7451ff]/10 text-[#7451ff]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M4 20V8l8-4 8 4v12" />
                                  <path d="M8 20v-5h8v5M9 9h.01M15 9h.01" />
                                </svg>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-xs font-bold text-slate-800">
                                    {warehouse.warehouse_name}
                                  </span>

                                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                                    Active
                                  </span>

                                  {(() => {
                                    const defaultWarehouse =
                                      getStoredDefaultWarehouse(
                                        getUserId(),
                                        warehouses,
                                      );

                                    return defaultWarehouse &&
                                      Number(defaultWarehouse.id) ===
                                        Number(warehouse.id) ? (
                                      <span className="shrink-0 rounded-full bg-[#7451ff]/10 px-2 py-0.5 text-[9px] font-bold text-[#7451ff]">
                                        Default
                                      </span>
                                    ) : null;
                                  })()}
                                </div>

                                <div className="mt-1 line-clamp-2 min-h-[30px] text-[11px] leading-[15px] text-slate-500">
                                  {getWarehouseDisplayAddress(warehouse)}
                                </div>
                              </div>

                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4 shrink-0 text-slate-300"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <div className="text-xs font-semibold text-slate-600">
                              No warehouse found
                            </div>

                            <div className="mt-1 text-[11px] text-slate-400">
                              Add a pickup warehouse using the + button.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openWarehouseModal}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#7451ff] text-white shadow-sm transition hover:bg-[#6343ed] active:scale-95"
                  aria-label="Add pickup warehouse"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {selectedWarehouse && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-md bg-[#7451ff]/10 px-2 py-1 font-bold text-[#7451ff]">
                    {selectedWarehouse.warehouse_name}
                  </span>

                  <span>PIN {selectedWarehouse.pincode}</span>
                  <span>•</span>
                  <span>{selectedWarehouse.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* ======================================
              SECTION 2 CONSIGNEE
          ====================================== */}

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                2
              </span>

              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Consignee (Delivery Details)
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* NAME */}

              <div>
                <label className={labelClass}>Consignee Name *</label>

                <input
                  name="consignee_name"
                  value={formData.consignee_name}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  placeholder="Full Name"
                  className={inputClass}
                />
              </div>

              {/* MOBILE */}

              <div>
                <label className={labelClass}>Mobile Number *</label>

                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                />
              </div>

              {/* ALTERNATE */}

              <div>
                <label className={labelClass}>Alternate Mobile</label>

                <input
                  name="alternate_mobile"
                  value={formData.alternate_mobile}
                  onChange={handleChange}
                  placeholder="Optional alternate"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className={labelClass}>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@domain.com"
                  className={inputClass}
                />
              </div>

              {/* COMPANY */}

              <div>
                <label className={labelClass}>Company Name</label>

                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className={inputClass}
                />
              </div>

              {/* GSTIN */}

              <div>
                <label className={labelClass}>GSTIN</label>

                <input
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="GST Number"
                  className={inputClass}
                />
              </div>

              {/* FLOOR */}

              <div>
                <label className={labelClass}>Floor / Flat No</label>

                <input
                  name="floor_no"
                  value={formData.floor_no}
                  onChange={handleChange}
                  placeholder="Floor, Suite, Unit"
                  className={inputClass}
                />
              </div>

              {/* LANDMARK */}

              <div>
                <label className={labelClass}>Landmark</label>

                <input
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Nearby landmark"
                  className={inputClass}
                />
              </div>

              {/* ADDRESS 1 */}

              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 1 *</label>

                <input
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  placeholder="House/Plot no, Area, Main road"
                  className={inputClass}
                />
              </div>

              {/* ADDRESS 2 */}

              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 2</label>

                <input
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Locality, Sector, Apartment details"
                  className={inputClass}
                />
              </div>

              {/* PINCODE */}

              <div>
                <label className={labelClass}>Delivery Pincode *</label>

                <div className="relative">
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    onKeyDown={handleEnterKey}
                    placeholder="6-digit PIN"
                    inputMode="numeric"
                    maxLength={6}
                    className={inputClass}
                    required
                  />

                  {pincodeLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#008dd2]">
                      Checking...
                    </span>
                  )}
                </div>
              </div>

              {/* CITY */}

              <div>
                <label className={labelClass}>City</label>

                <input
                  name="city"
                  value={formData.city}
                  readOnly
                  placeholder="Auto-detected"
                  className={readonlyClass}
                />
              </div>

              {/* STATE */}

              <div>
                <label className={labelClass}>State</label>

                <input
                  name="state"
                  value={formData.state}
                  readOnly
                  placeholder="Auto-detected"
                  className={readonlyClass}
                />
              </div>

              {/* COUNTRY */}

              <div>
                <label className={labelClass}>Country</label>

                <input
                  name="country"
                  value={formData.country}
                  readOnly
                  className={readonlyClass}
                />
              </div>
            </div>
          </div>

          {/* ======================================
              SECTION 3 PRODUCTS
          ====================================== */}

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                  3
                </span>

                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Product Manifest
                </h2>
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="text-xs font-bold text-[#008dd2] hover:underline"
              >
                + Add Product
              </button>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="pb-3 w-[30%]">Product Title *</th>

                    <th className="pb-3 w-[14%]">SKU</th>

                    <th className="pb-3 w-[14%]">Price (₹) *</th>

                    <th className="pb-3 w-[10%]">Qty *</th>

                    <th className="pb-3 w-[10%]">Tax %</th>

                    <th className="pb-3 w-[18%] text-right">Total</th>

                    <th className="pb-3 w-8"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => {
                    const values = getProductValues(product);

                    return (
                      <tr key={index}>
                        <td className="py-2.5 pr-2">
                          <input
                            value={product.product}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "product",
                                e.target.value,
                              )
                            }
                            onKeyDown={handleEnterKey}
                            data-enter={`product-title-${index}`}
                            data-next-enter={`[data-enter="product-price-${index}"]`}
                            placeholder="Enter product title"
                            className={inputClass}
                          />
                        </td>

                        <td className="py-2.5 pr-2">
                          <input
                            value={product.sku}
                            onChange={(e) =>
                              handleProductChange(index, "sku", e.target.value)
                            }
                            placeholder="SKU"
                            className={inputClass}
                          />
                        </td>

                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.price}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "price",
                                e.target.value,
                              )
                            }
                            onKeyDown={handleEnterKey}
                            data-enter={`product-price-${index}`}
                            data-next-enter={`[data-enter="package-length-${index}"]`}
                            placeholder="0.00"
                            className={inputClass}
                          />
                        </td>

                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="1"
                            value={product.qty}
                            onChange={(e) =>
                              handleProductChange(index, "qty", e.target.value)
                            }
                            className={inputClass}
                          />
                        </td>

                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.tax}
                            onChange={(e) =>
                              handleProductChange(index, "tax", e.target.value)
                            }
                            placeholder="0"
                            className={inputClass}
                          />
                        </td>

                        <td className="py-2.5 text-right font-semibold text-sm text-slate-900">
                          ₹{values.total.toFixed(2)}
                        </td>

                        <td className="py-2.5 text-right pl-2">
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="text-slate-400 hover:text-red-600 transition font-bold text-sm"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE PRODUCTS */}

            <div className="space-y-3 lg:hidden">
              {products.map((product, index) => {
                const values = getProductValues(product);

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">
                        Item #{index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-xs text-red-500 font-bold"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      value={product.product}
                      onChange={(e) =>
                        handleProductChange(index, "product", e.target.value)
                      }
                      placeholder="Product Name"
                      className={inputClass}
                    />

                    <input
                      value={product.sku}
                      onChange={(e) =>
                        handleProductChange(index, "sku", e.target.value)
                      }
                      placeholder="SKU"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={(e) =>
                        handleProductChange(index, "price", e.target.value)
                      }
                      placeholder="Price"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="1"
                      value={product.qty}
                      onChange={(e) =>
                        handleProductChange(index, "qty", e.target.value)
                      }
                      placeholder="Qty"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.tax}
                      onChange={(e) =>
                        handleProductChange(index, "tax", e.target.value)
                      }
                      placeholder="Tax %"
                      className={inputClass}
                    />

                    <div className="text-right text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      Line Total: ₹{values.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUMMARY */}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-6 text-sm border-t border-slate-100 pt-4">
              <span className="text-slate-500">
                Taxable Base:
                <strong className="text-slate-800 font-semibold ml-1">
                  ₹{totalTaxableValue.toFixed(2)}
                </strong>
              </span>

              <span className="text-slate-500">
                GST Total:
                <strong className="text-slate-800 font-semibold ml-1">
                  ₹{totalGST.toFixed(2)}
                </strong>
              </span>

              <span className="text-slate-800 font-bold">
                Total Invoice:
                <strong className="text-[#008dd2] font-black text-base ml-1">
                  ₹{totalInvoiceValue.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {/* ======================================
              SECTION 4 PACKAGES
          ====================================== */}

          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                  4
                </span>

                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Packages & Deadweight
                </h2>
              </div>

              <button
                type="button"
                onClick={addPackage}
                className="text-xs font-bold text-[#008dd2] hover:underline"
              >
                + Add Package
              </button>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="pb-3">Length (cm) *</th>

                    <th className="pb-3">Width (cm) *</th>

                    <th className="pb-3">Height (cm) *</th>

                    <th className="pb-3">Vol. Wt (Kg)</th>

                    <th className="pb-3">Weight (Kg) *</th>

                    <th className="pb-3">Count</th>

                    <th></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {packages.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.length}
                          onChange={(e) =>
                            handlePackageChange(index, "length", e.target.value)
                          }
                          onKeyDown={handleEnterKey}
                          data-enter={`package-length-${index}`}
                          data-next-enter={`[data-enter="package-width-${index}"]`}
                          placeholder="L"
                          className={inputClass}
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.width}
                          onChange={(e) =>
                            handlePackageChange(index, "width", e.target.value)
                          }
                          onKeyDown={handleEnterKey}
                          data-enter={`package-width-${index}`}
                          data-next-enter={`[data-enter="package-height-${index}"]`}
                          placeholder="B"
                          className={inputClass}
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.height}
                          onChange={(e) =>
                            handlePackageChange(index, "height", e.target.value)
                          }
                          onKeyDown={handleEnterKey}
                          data-enter={`package-height-${index}`}
                          data-next-enter={`[data-enter="package-weight-${index}"]`}
                          placeholder="H"
                          className={inputClass}
                        />
                      </td>

                      <td className="py-2.5 pr-2 text-sm font-medium text-slate-600">
                        {getVolumetricWeight(item)}
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.weight}
                          onChange={(e) =>
                            handlePackageChange(index, "weight", e.target.value)
                          }
                          onKeyDown={handleEnterKey}
                          data-enter={`package-weight-${index}`}
                          placeholder="Weight"
                          className={`${inputClass} font-semibold`}
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.count}
                          onChange={(e) =>
                            handlePackageChange(index, "count", e.target.value)
                          }
                          className={inputClass}
                        />
                      </td>

                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removePackage(index)}
                          className="text-slate-400 hover:text-red-600 transition font-bold text-sm"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE PACKAGES */}

            <div className="space-y-3 lg:hidden">
              {packages.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">
                      Box #{index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="text-xs text-red-500 font-bold"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.length}
                      onChange={(e) =>
                        handlePackageChange(index, "length", e.target.value)
                      }
                      placeholder="L"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.width}
                      onChange={(e) =>
                        handlePackageChange(index, "width", e.target.value)
                      }
                      placeholder="B"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.height}
                      onChange={(e) =>
                        handlePackageChange(index, "height", e.target.value)
                      }
                      placeholder="H"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.weight}
                      onChange={(e) =>
                        handlePackageChange(index, "weight", e.target.value)
                      }
                      placeholder="Weight"
                      className={`${inputClass} col-span-2 font-semibold`}
                    />

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.count}
                      onChange={(e) =>
                        handlePackageChange(index, "count", e.target.value)
                      }
                      placeholder="Count"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-6 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <span>
                Deadweight:
                <strong className="text-slate-900 font-bold ml-1">
                  {getTotalWeight().toFixed(2)} Kg
                </strong>
              </span>

              <span>
                Volumetric Weight:
                <strong className="text-slate-900 font-bold ml-1">
                  {getTotalVolumetricWeight().toFixed(2)} Kg
                </strong>
              </span>

              <span>
                Chargeable Weight:
                <strong className="text-[#008dd2] font-black ml-1">
                  {getChargeableWeight().toFixed(2)} Kg
                </strong>
              </span>
            </div>
          </div>

          {/* ======================================
              SECTION 5 PAYMENT & ACTIONS
          ====================================== */}

          <div className="p-6 md:p-8 bg-slate-50/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* PAYMENT */}

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Payment Terms
                  </span>

                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          payment_type: "Prepaid",
                        }))
                      }
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
                        formData.payment_type === "Prepaid"
                          ? "bg-[#008dd2] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Prepaid
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          payment_type: "COD",
                        }))
                      }
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
                        formData.payment_type === "COD"
                          ? "bg-[#008dd2] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      COD
                    </button>
                  </div>
                </div>

                {/* RISK */}

                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Risk Coverage
                  </span>

                  <select
                    name="risk_type"
                    value={formData.risk_type}
                    onChange={handleChange}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#008dd2]"
                  >
                    <option value="Owner Risk">Owner Risk</option>

                    <option value="Courier Risk">Courier Risk</option>
                  </select>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleShip}
                  disabled={rateLoading}
                  className="h-11 rounded-lg bg-[#008dd2] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#007ab6] active:scale-95 shadow-sm shadow-[#008dd2]/25 disabled:opacity-50"
                >
                  {rateLoading ? "Calculating..." : "⚡ Calculate Rate"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  data-action="save-next"
                  className="h-11 rounded-lg border border-slate-300 bg-white px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95 shadow-xs disabled:opacity-50"
                >
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Order"
                      : "Save & Next"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================
          ADD PICKUP WAREHOUSE MODAL
      ======================================== */}

      {showWarehouseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 sm:p-5 backdrop-blur-[3px]">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  Add Pickup Address
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Register this pickup location with ShipDrop and Delhivery.
                </p>
              </div>

              <button
                type="button"
                onClick={closeWarehouseModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <form
              id="warehouse-create-form"
              onSubmit={handleCreateWarehouse}
              className="overflow-y-auto px-5 py-5 md:px-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Company / Warehouse Name *
                  </label>
                  <input
                    name="warehouse_name"
                    value={warehouseForm.warehouse_name}
                    onChange={handleWarehouseFormChange}
                    placeholder="Warehouse name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Contact Name *</label>
                  <input
                    name="contact_name"
                    value={warehouseForm.contact_name}
                    onChange={handleWarehouseFormChange}
                    placeholder="Contact person"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone *</label>
                  <input
                    name="phone"
                    value={warehouseForm.phone}
                    onChange={handleWarehouseFormChange}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={warehouseForm.email}
                    onChange={handleWarehouseFormChange}
                    placeholder="email@domain.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>GSTIN</label>
                  <input
                    name="gstin"
                    value={warehouseForm.gstin}
                    onChange={handleWarehouseFormChange}
                    placeholder="ENTER GSTIN"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Search Location</label>
                  <div className="flex gap-2">
                    <input
                      value={warehouseLocationSearch}
                      onChange={(e) =>
                        setWarehouseLocationSearch(e.target.value)
                      }
                      placeholder="Search area, street, building..."
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      onClick={searchWarehouseLocation}
                      disabled={warehouseLocationLoading}
                      className="h-11 shrink-0 rounded-lg border border-[#7451ff] bg-white px-4 text-xs font-bold text-[#7451ff] transition hover:bg-[#7451ff]/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {warehouseLocationLoading ? "..." : "Search"}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <label className={labelClass}>Location on Map</label>
                      <p className="text-[10px] text-slate-400">
                        Search a place, click on the map, or drag the marker.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={detectWarehouseLocation}
                      disabled={warehouseLocationLoading}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-[#7451ff]/40 hover:text-[#7451ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="12" cy="12" r="1" />
                      </svg>
                      Detect
                    </button>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <MapContainer
                      center={warehouseMapPosition}
                      zoom={13}
                      scrollWheelZoom={true}
                      className="h-[300px] w-full"
                      key={`${warehouseMapPosition[0]}-${warehouseMapPosition[1]}`}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <WarehouseMapClickHandler
                        onSelect={handleWarehouseMapLocation}
                      />

                      {warehouseMapMarker && (
                        <Marker
                          position={warehouseMapMarker}
                          icon={warehouseMarkerIcon}
                          draggable
                          eventHandlers={{
                            dragend: (event) => {
                              const marker = event.target;
                              const position = marker.getLatLng();
                              handleWarehouseMapLocation(
                                position.lat,
                                position.lng,
                              );
                            },
                          }}
                        />
                      )}
                    </MapContainer>

                    {warehouseLocationLoading && (
                      <div className="absolute left-3 top-3 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
                        Finding location...
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Address Line 1 *</label>
                  <input
                    name="address_line1"
                    value={warehouseForm.address_line1}
                    onChange={handleWarehouseFormChange}
                    placeholder="House / Plot no, Area, Main road"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Address Line 2</label>
                  <input
                    name="address_line2"
                    value={warehouseForm.address_line2}
                    onChange={handleWarehouseFormChange}
                    placeholder="Locality, Street, Market"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Floor No</label>
                  <input
                    name="floor_no"
                    value={warehouseForm.floor_no}
                    onChange={handleWarehouseFormChange}
                    placeholder="Ground Floor"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Landmark</label>
                  <input
                    name="landmark"
                    value={warehouseForm.landmark}
                    onChange={handleWarehouseFormChange}
                    placeholder="Near landmark"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Pincode *</label>
                    <div className="relative">
                      <input
                        name="pincode"
                        value={warehouseForm.pincode}
                        onChange={(e) => lookupWarehousePincode(e.target.value)}
                        placeholder="6-digit PIN"
                        inputMode="numeric"
                        maxLength={6}
                        className={inputClass}
                        required
                      />

                      {warehousePincodeLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7451ff]">
                          Checking...
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      name="city"
                      value={warehouseForm.city}
                      readOnly
                      placeholder="Auto-detected"
                      className={readonlyClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>State *</label>
                  <input
                    name="state"
                    value={warehouseForm.state}
                    readOnly
                    placeholder="Auto-detected"
                    className={readonlyClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    name="country"
                    value={warehouseForm.country}
                    readOnly
                    className={readonlyClass}
                  />
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 md:px-6">
              <button
                type="button"
                onClick={closeWarehouseModal}
                disabled={warehouseSaving}
                className="h-10 rounded-lg px-4 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector("#warehouse-create-form")
                    ?.requestSubmit()
                }
                disabled={warehouseSaving}
                className="h-10 rounded-lg bg-[#7451ff] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6343ed] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {warehouseSaving ? "Saving..." : "Save Warehouse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
    PREMIUM SHIPPING RATE MODAL
======================================== */}

      {shippingOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-5 backdrop-blur-[3px]">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.22)]">
            {/* ================= HEADER ================= */}

            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* Professional Truck Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7.5h11v9H3z" />
                    <path d="M14 10h3.5L21 14v2.5h-7z" />
                    <circle cx="7" cy="18" r="1.8" />
                    <circle cx="17.5" cy="18" r="1.8" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                    Shipping Rate Quotation
                  </h3>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Select how you want to ship this order
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetShippingRate}
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* ================= BODY ================= */}

            <div className="space-y-2.5 p-4">
              {/* ================= ROAD ================= */}

              {shippingOptions.road && (
                <button
                  type="button"
                  onClick={() => selectShippingType("ROAD")}
                  className={`group w-full rounded-lg border p-3 text-left transition-all ${
                    selectedShippingType === "ROAD"
                      ? "border-[#008dd2] bg-[#008dd2]/[0.035] shadow-[0_0_0_3px_rgba(0,141,210,0.07)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* ROAD ICON */}

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        selectedShippingType === "ROAD"
                          ? "bg-[#008dd2] text-white"
                          : "bg-[#008dd2]/10 text-[#008dd2]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 7.5h11v9H3z" />
                        <path d="M14 10h3.5L21 14v2.5h-7z" />
                        <circle cx="7" cy="18" r="1.8" />
                        <circle cx="17.5" cy="18" r="1.8" />
                      </svg>
                    </div>

                    {/* ROAD INFO */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          ShipDrop Express
                        </h4>

                        {selectedShippingType === "ROAD" && (
                          <span className="rounded-full bg-[#008dd2]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#008dd2]">
                            Selected
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        By Road
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#008dd2]/10 px-2 py-0.5 text-[10px] font-bold text-[#008dd2]">
                          Zone {shippingOptions.road.zone}
                        </span>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {shippingOptions.road.distance_km ?? "—"} Km
                        </span>
                      </div>
                    </div>

                    {/* ROAD PRICE */}

                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Road Charge
                      </div>

                      <div className="mt-0.5 text-lg font-extrabold tracking-tight text-[#008dd2]">
                        ₹
                        {Number(shippingOptions.road.shipping_charge).toFixed(
                          2,
                        )}
                      </div>
                    </div>

                    {/* CHECK */}

                    {selectedShippingType === "ROAD" && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#008dd2] text-white">
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.5 10l3.3 3.2L15.5 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {shippingOptions?.shadowfax && (
                <button
                  type="button"
                  onClick={() => selectShippingType("SHADOWFAX_ROAD")}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedShippingType === "SHADOWFAX_ROAD"
                      ? "border-[#0f766e] bg-[#0f766e]/5 ring-2 ring-[#0f766e]/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* ICON */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        selectedShippingType === "SHADOWFAX_ROAD"
                          ? "bg-[#0f766e] text-white"
                          : "bg-[#0f766e]/10 text-[#0f766e]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 7h11v10H3z" />
                        <path d="M14 10h4l3 4v3h-7z" />
                        <circle cx="7" cy="18" r="2" />
                        <circle cx="18" cy="18" r="2" />
                      </svg>
                    </div>

                    {/* NAME */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Shadowfax
                        </h4>

                        {selectedShippingType === "SHADOWFAX_ROAD" && (
                          <span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9px] font-bold text-[#0f766e]">
                            Selected
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        By Road
                      </p>

                      <div className="mt-1.5 flex gap-1.5">
                        <span className="rounded-md bg-[#0f766e]/10 px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">
                          Zone {shippingOptions.shadowfax.zone}
                        </span>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {shippingOptions.shadowfax.distance_km ?? "—"} Km
                        </span>
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase text-slate-400">
                        Road Charge
                      </div>

                      <div className="text-lg font-extrabold text-[#0f766e]">
                        ₹
                        {Number(
                          shippingOptions.shadowfax.shipping_charge,
                        ).toFixed(2)}
                      </div>
                    </div>

                    {/* CHECK */}
                    {selectedShippingType === "SHADOWFAX_ROAD" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f766e] text-white">
                        ✓
                      </div>
                    )}
                  </div>
                </button>
              )}

              {/* ================= AIR ================= */}

              {shippingOptions.air && (
                <button
                  type="button"
                  onClick={() => selectShippingType("AIR")}
                  className={`group w-full rounded-lg border p-3 text-left transition-all ${
                    selectedShippingType === "AIR"
                      ? "border-[#7451ff] bg-[#7451ff]/[0.035] shadow-[0_0_0_3px_rgba(116,81,255,0.07)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* AIR ICON */}

                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        selectedShippingType === "AIR"
                          ? "bg-[#7451ff] text-white"
                          : "bg-[#7451ff]/10 text-[#7451ff]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4.5 w-4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12.5l18-7-5.4 7.2L21 20.5l-18-8z" />
                        <path d="M10.5 14.2L8.7 21l3.6-4.3" />
                        <path d="M8.5 10.4L3 8.5" />
                      </svg>
                    </div>

                    {/* AIR INFO */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          ShipDrop Express
                        </h4>

                        {selectedShippingType === "AIR" && (
                          <span className="rounded-full bg-[#7451ff]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7451ff]">
                            Selected
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        By Air
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-[#7451ff]/10 px-2 py-0.5 text-[10px] font-bold text-[#7451ff]">
                          Zone {shippingOptions.air.zone}
                        </span>

                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {shippingOptions.air.distance_km ?? "—"} Km
                        </span>
                      </div>
                    </div>

                    {/* AIR PRICE */}

                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Air Charge
                      </div>

                      <div className="mt-0.5 text-lg font-extrabold tracking-tight text-[#7451ff]">
                        ₹
                        {Number(shippingOptions.air.shipping_charge).toFixed(2)}
                      </div>
                    </div>

                    {/* CHECK */}

                    {selectedShippingType === "AIR" && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7451ff] text-white">
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.5 10l3.3 3.2L15.5 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )}

              {/* ================= SELECTED SUMMARY ================= */}

              {shippingRate && (
                <div
                  className={`rounded-lg border px-3.5 py-2.5 ${
                    selectedShippingType === "AIR"
                      ? "border-[#7451ff]/15 bg-[#7451ff]/[0.035]"
                      : "border-[#008dd2]/15 bg-[#008dd2]/[0.035]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Selected Shipping
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedShippingType === "AIR"
                              ? "bg-[#7451ff]"
                              : "bg-[#008dd2]"
                          }`}
                        />

                        <span className="text-xs font-bold text-slate-800">
                          {selectedShippingType === "AIR"
                            ? "Delivery By Air"
                            : selectedShippingType === "SHADOWFAX_ROAD"
                              ? "Shadowfax By Road"
                              : "Delivery By Road"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Total Charge
                      </div>

                      <div
                        className={`mt-0.5 text-lg font-extrabold ${
                          selectedShippingType === "AIR"
                            ? "text-[#7451ff]"
                            : "text-[#008dd2]"
                        }`}
                      >
                        ₹{Number(shippingRate.shipping_charge).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= COMPACT DETAILS ================= */}

              {shippingRate && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2 text-center">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Deadweight
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-800">
                      {Number(shippingRate.weight || getTotalWeight()).toFixed(
                        2,
                      )}{" "}
                      Kg
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2 text-center">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Distance
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-800">
                      {shippingRate.distance_km ?? "—"} Km
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2 text-center">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Payment
                    </div>

                    <div className="mt-1 truncate text-xs font-bold text-[#008dd2]">
                      {formData.payment_type}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2 text-center">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Risk
                    </div>

                    <div className="mt-1 truncate text-xs font-bold text-slate-800">
                      {formData.risk_type}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ================= FOOTER ================= */}

            <div className="flex items-center gap-2.5 border-t border-slate-100 bg-slate-50/40 px-4 py-3">
              <button
                type="button"
                onClick={resetShippingRate}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmShipment}
                disabled={loading || !shippingRate || !selectedShippingType}
                className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[11px] font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedShippingType === "AIR"
                    ? "bg-[#7451ff] hover:bg-[#6545e8]"
                    : "bg-[#008dd2] hover:bg-[#007ab6]"
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 7.5h11v9H3z" />
                      <path d="M14 10h3.5L21 14v2.5h-7z" />
                      <circle cx="7" cy="18" r="1.8" />
                      <circle cx="17.5" cy="18" r="1.8" />
                    </svg>

                    {selectedShippingType === "AIR"
                      ? "Delivery By Air"
                      : selectedShippingType === "SHADOWFAX_ROAD"
                        ? "Shadowfax By Road"
                        : "Delivery By Road"}

                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateOrder;
