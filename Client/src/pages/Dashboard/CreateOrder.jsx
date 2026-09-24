import { useEffect, useRef, useState } from "react";
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

  const [formData, setFormData] = useState(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [products, setProducts] = useState([{ ...initialProduct }]);
  const [packages, setPackages] = useState([{ ...initialPackage }]);

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Previous customer autocomplete
 // Previous customer autocomplete
const [previousCustomers, setPreviousCustomers] = useState([]);
const [showPreviousCustomers, setShowPreviousCustomers] = useState(false);
const [previousCustomersLoading, setPreviousCustomersLoading] = useState(false);
const previousCustomerDropdownRef = useRef(null);

// Prevent autocomplete from reopening after selecting a previous customer
const skipPreviousCustomerSearchRef = useRef(false);

const [rateLoading, setRateLoading] = useState(false);
  const [shippingRate, setShippingRate] = useState(null);
  const [shippingOptions, setShippingOptions] = useState(null);
  const [selectedShippingType, setSelectedShippingType] = useState(null);
  const [defaultReturnAddress, setDefaultReturnAddress] = useState(null);
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
  const warehouseDropdownRef = useRef(null);

  const [warehouseMapPosition, setWarehouseMapPosition] = useState(
    DEFAULT_WAREHOUSE_MAP_POSITION,
  );
  const [warehouseMapMarker, setWarehouseMapMarker] = useState(null);
  const [warehouseLocationSearch, setWarehouseLocationSearch] = useState("");
  const [warehouseLocationLoading, setWarehouseLocationLoading] =
    useState(false);

  const inputClass =
    "h-10.5 sm:h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10";

  const readonlyClass =
    "h-10.5 sm:h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[13px] sm:text-sm font-medium text-slate-500 outline-none cursor-not-allowed select-none";

  const labelClass =
    "block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5";

  // ========================================
  // LOAD EDIT ORDER DATA FROM SESSION
  // ========================================
  useEffect(() => {
    const storedOrder = sessionStorage.getItem("editingProcessingOrder");
    if (!storedOrder) return;

    try {
      const order = JSON.parse(storedOrder);

      setIsEditMode(true);
      setEditingOrderId(order.id || order.order_id);

      setFormData({
        pickup_address: order.pickup_address || "",
        pickup_pincode: order.pickup_pincode || "",
        pickup_city: order.pickup_city || "",

        consignee_name: order.consignee_name || order.customer_name || "",
        mobile: order.mobile || order.consignee_mobile || "",
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

      if (Array.isArray(order.products) && order.products.length) {
        setProducts(
          order.products.map((item) => ({
            product: item.product_name || item.product || "",
            sku: item.sku || "",
            price: item.price || "",
            qty: item.qty || item.quantity || 1,
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
      toast.error("Unable to load order for editing");
    }
  }, []);

  // Restore warehouse when warehouses list is loaded in edit mode
  useEffect(() => {
    const storedOrder = sessionStorage.getItem("editingProcessingOrder");
    if (!storedOrder || !warehouses.length || selectedWarehouse) return;

    try {
      const order = JSON.parse(storedOrder);
      if (!order?.warehouse_id) return;

      const matchingWarehouse = warehouses.find(
        (w) => Number(w.id) === Number(order.warehouse_id),
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

  const cancelEdit = () => {
    sessionStorage.removeItem("editingProcessingOrder");
    setIsEditMode(false);
    setEditingOrderId(null);
    resetForm();
    toast("Edit cancelled");
  };

  const validateRequiredFields = () => {
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

    const effectivePickupAddress = String(
      formData.pickup_address ||
        warehouseSearch ||
        (effectiveWarehouse
          ? getWarehouseDisplayAddress(effectiveWarehouse)
          : ""),
    ).trim();

    const effectivePickupPincode = String(
      formData.pickup_pincode || effectiveWarehouse?.pincode || "",
    ).trim();

    if (!effectiveWarehouse?.id) {
      toast.error("Please select a pickup warehouse");
      return false;
    }

    if (!effectivePickupAddress) {
      toast.error("Please enter pickup address");
      return false;
    }

    if (!/^\d{6}$/.test(effectivePickupPincode)) {
      toast.error("Please enter a valid 6-digit pickup pincode");
      return false;
    }

    if (!String(formData.consignee_name || "").trim()) {
      toast.error("Please enter consignee name");
      return false;
    }

    if (!/^\d{10}$/.test(String(formData.mobile || "").trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    if (!String(formData.address_line1 || "").trim()) {
      toast.error("Please enter delivery address");
      return false;
    }

    if (!/^\d{6}$/.test(String(formData.pincode || "").trim())) {
      toast.error("Please enter a valid 6-digit delivery pincode");
      return false;
    }

    if (
      !String(formData.city || "").trim() ||
      !String(formData.state || "").trim()
    ) {
      toast.error("Please enter a valid delivery pincode");
      return false;
    }

    if (!Array.isArray(products) || products.length === 0) {
      toast.error("At least one product is required");
      return false;
    }

    if (!Array.isArray(packages) || packages.length === 0) {
      toast.error("At least one package is required");
      return false;
    }

    return true;
  };

  const resetShippingRate = () => {
    setShippingRate(null);
    setShippingOptions(null);
    setSelectedShippingType(null);
  };

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.id || null;
    } catch {
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

  const getStoredDefaultWarehouse = (userId, list) => {
    if (!userId || !Array.isArray(list) || list.length === 0) return null;

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

    if (explicitDefault) return explicitDefault;

    const possibleKeys = [
      `shipdrop_default_warehouse_${userId}`,
      "shipdrop_default_warehouse",
      `default_warehouse_${userId}`,
      "default_warehouse",
      `defaultWarehouseId_${userId}`,
      "defaultWarehouseId",
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
      const findById = (id) =>
        list.find((warehouse) => String(warehouse.id) === String(id)) || null;

      if (typeof stored === "string" || typeof stored === "number") {
        return findById(stored);
      }

      if (typeof stored === "object") {
        const id = stored.id ?? stored.warehouse_id ?? stored.warehouseId;
        return findById(id);
      }

      return null;
    };

    for (const key of possibleKeys) {
      const match = findFromStoredValue(readStoredValue(key));
      if (match) return match;
    }

    return null;
  };

  const applyDefaultWarehouseIfAvailable = (list = warehouses) => {
    const userId = getUserId();
    if (!userId || !Array.isArray(list) || list.length === 0) return false;
    if (sessionStorage.getItem("editingProcessingOrder")) return false;

    const defaultWarehouse = getStoredDefaultWarehouse(userId, list);
    if (!defaultWarehouse) return false;

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

      const activeList = list.filter(
        (item) => String(item.status || "ACTIVE").toUpperCase() === "ACTIVE",
      );
      setWarehouses(activeList);

      const apiDefaultId =
        response.data?.default_warehouse_id ??
        response.data?.defaultWarehouseId ??
        response.data?.default_warehouse?.id;

      const apiDefaultWarehouse = apiDefaultId
        ? activeList.find((w) => String(w.id) === String(apiDefaultId))
        : null;

      if (
        apiDefaultWarehouse &&
        !sessionStorage.getItem("editingProcessingOrder")
      ) {
        applyWarehouseToPickup(apiDefaultWarehouse);
      } else {
        applyDefaultWarehouseIfAvailable(activeList);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load pickup warehouses",
      );
    } finally {
      setWarehousesLoading(false);
    }
  };

  const loadDefaultReturnAddress = async () => {
    const userId = getUserId();

    if (!userId) return;

    try {
      const response = await api.get("/return-addresses/default", {
        params: {
          user_id: userId,
        },
      });

      const address =
        response.data?.return_address || response.data?.address || null;

      setDefaultReturnAddress(address);
      return address;
    } catch (error) {
      if (error.response?.status === 404) {
        setDefaultReturnAddress(null);
        return null;
      }

      console.log("Default return address load error:", error);

      setDefaultReturnAddress(null);
      return null;
    }
  };

  useEffect(() => {
    const handleOutsideWarehouseClick = (event) => {
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(event.target)
      ) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideWarehouseClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideWarehouseClick);
    };
  }, []);

  useEffect(() => {
    loadWarehouses();
    loadDefaultReturnAddress();
    const refreshDefaultWarehouse = () => {
      if (warehouses.length > 0) {
        applyDefaultWarehouseIfAvailable(warehouses);
      } else {
        loadWarehouses();
      }
    };

    window.addEventListener("warehouseDefaultChanged", refreshDefaultWarehouse);
    window.addEventListener("storage", refreshDefaultWarehouse);

    return () => {
      window.removeEventListener(
        "warehouseDefaultChanged",
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

  const applyReverseGeocode = async (latitude, longitude) => {
    setWarehouseLocationLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          latitude,
        )}&lon=${encodeURIComponent(longitude)}&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) throw new Error("Unable to find this location");

      const data = await response.json();
      const address = data?.address || {};

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
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
    } catch {
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
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) throw new Error("Unable to search location");

      const data = await response.json();
      const result = data?.[0];

      if (!result) {
        toast.error("Location not found");
        return;
      }

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      setWarehouseMapPosition([latitude, longitude]);
      setWarehouseMapMarker([latitude, longitude]);

      const address = result.address || {};
      const city = address.city || address.town || address.village || "";
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
    } catch {
      toast.error("Unable to search this location");
    } finally {
      setWarehouseLocationLoading(false);
    }
  };

  const detectWarehouseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not supported");
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
      () => {
        setWarehouseLocationLoading(false);
        toast.error("Unable to detect your location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleWarehouseFormChange = (e) => {
    const { name, value } = e.target;
    const numberOnlyFields = ["phone", "pincode", "return_pincode"];

    if (numberOnlyFields.includes(name)) {
      const maxLength = name === "phone" ? 10 : 6;
      const cleanValue = value.replace(/\D/g, "").slice(0, maxLength);
      setWarehouseForm((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }

    setWarehouseForm((prev) => ({ ...prev, [name]: value }));
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
      if (!data?.[0]?.PostOffice?.length) throw new Error("Invalid pincode");

      const postOffice = data[0].PostOffice[0];
      setWarehouseForm((prev) => ({
        ...prev,
        pincode: cleanValue,
        city: postOffice.District || postOffice.Block || "",
        state: postOffice.State || "",
        country: "India",
      }));
    } catch {
      toast.error("Unable to verify warehouse pincode");
    } finally {
      setWarehousePincodeLoading(false);
    }
  };

  const getDefaultReturnAddress = async (userId) => {
    try {
      const response = await api.get("/return-addresses/default", {
        params: {
          user_id: userId,
        },
      });

      return response.data?.return_address || response.data?.address || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }

      throw new Error(
        error.response?.data?.message ||
          "Unable to load default return address",
      );
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) {
      toast.error("User session not found");
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
      toast.error("Valid 10-digit phone number is required");
      return;
    }

    if (!/^\d{6}$/.test(warehouseForm.pincode)) {
      toast.error("Valid 6-digit warehouse pincode is required");
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

    setWarehouseSaving(true);

    try {
      // Use the current Default Return Address for Delhivery when one
      // already exists. If there is no Default Return Address yet, use
      // the pickup address as the temporary Delhivery return address.
      // The warehouse backend will automatically create the ShipDrop
      // Return Address after the warehouse is saved.
      const defaultReturnAddress = await getDefaultReturnAddress(userId);

      const delhiveryReturnAddress = defaultReturnAddress || {
        address_line1: warehouseForm.address_line1.trim(),
        address_line2: warehouseForm.address_line2.trim() || null,
        landmark: warehouseForm.landmark.trim() || null,
        city: warehouseForm.city.trim(),
        state: warehouseForm.state.trim(),
        pincode: warehouseForm.pincode.trim(),
        country: warehouseForm.country || "India",
      };

      const returnAddressLine = [
        delhiveryReturnAddress.address_line1,
        delhiveryReturnAddress.address_line2,
        delhiveryReturnAddress.landmark,
        delhiveryReturnAddress.city,
        delhiveryReturnAddress.state,
        delhiveryReturnAddress.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      if (!returnAddressLine) {
        throw new Error("Return address is incomplete");
      }

      const response = await api.post("/warehouses/create", {
        user_id: userId,
        ...warehouseForm,

        // Keep these legacy warehouse fields populated for the existing
        // Delhivery warehouse-registration flow. The source of truth for
        // return addresses is now /return-addresses.
        return_address: returnAddressLine,
        return_city: delhiveryReturnAddress.city || warehouseForm.city.trim(),
        return_pincode:
          delhiveryReturnAddress.pincode || warehouseForm.pincode.trim(),
        return_state:
          delhiveryReturnAddress.state || warehouseForm.state.trim(),
        return_country:
          delhiveryReturnAddress.country || warehouseForm.country || "India",
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save warehouse");
      }

      toast.success("Warehouse added successfully");
      setShowWarehouseModal(false);
      await loadWarehouses();
    } catch (error) {
      console.log("Create order warehouse error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to save warehouse",
      );
    } finally {
      setWarehouseSaving(false);
    }
  };

  const filteredWarehouses = warehouses.filter((w) => {
    const search = warehouseSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      w.warehouse_name?.toLowerCase().includes(search) ||
      w.city?.toLowerCase().includes(search) ||
      w.pincode?.includes(search)
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["mobile", "alternate_mobile"].includes(name)) {
      const clean = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: clean }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (["pincode", "pickup_pincode"].includes(name)) {
      resetShippingRate();
    }
  };

  // ========================================
  // PREVIOUS CUSTOMER AUTOCOMPLETE
  // ========================================
 useEffect(() => {
  if (isEditMode) {
    setShowPreviousCustomers(false);
    setPreviousCustomers([]);
    return;
  }

  // Previous customer select karne ke baad
  // autofilled name ko dobara search nahi karna
  if (skipPreviousCustomerSearchRef.current) {
    skipPreviousCustomerSearchRef.current = false;
    setPreviousCustomers([]);
    setShowPreviousCustomers(false);
    setPreviousCustomersLoading(false);
    return;
  }

  const search = String(formData.consignee_name || "").trim();

    if (search.length < 2) {
      setPreviousCustomers([]);
      setShowPreviousCustomers(false);
      setPreviousCustomersLoading(false);
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviousCustomersLoading(true);
      try {
        const response = await api.get("/orders/customers/search", {
          params: { user_id: userId, search },
        });

        if (cancelled) return;

        const customers = Array.isArray(response.data?.customers)
          ? response.data.customers
          : [];

        setPreviousCustomers(customers);
        setShowPreviousCustomers(customers.length > 0);
      } catch (error) {
        if (!cancelled) {
          setPreviousCustomers([]);
          setShowPreviousCustomers(false);
          console.log("Previous customer search error:", error);
        }
      } finally {
        if (!cancelled) setPreviousCustomersLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.consignee_name, isEditMode]);

  useEffect(() => {
    const handleOutsidePreviousCustomerClick = (event) => {
      if (
        previousCustomerDropdownRef.current &&
        !previousCustomerDropdownRef.current.contains(event.target)
      ) {
        setShowPreviousCustomers(false);
      }
    };

    document.addEventListener("mousedown", handleOutsidePreviousCustomerClick);
    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsidePreviousCustomerClick,
        
      );
    };
  }, []);

 const selectPreviousCustomer = (customer) => {
  if (!customer) return;

  // Selection ke baad autocomplete ko dobara open hone se roko
  skipPreviousCustomerSearchRef.current = true;

  setFormData((prev) => ({
      ...prev,
      consignee_name: customer.consignee_name || "",
      mobile: customer.mobile || "",
      alternate_mobile: customer.alternate_mobile || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      company_name: customer.company_name || "",
      floor_no: customer.floor_no || "",
      landmark: customer.landmark || "",
      address_line1: customer.address_line1 || "",
      address_line2: customer.address_line2 || "",
      pincode: customer.pincode || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "India",
      payment_type: customer.payment_type || "Prepaid",
      risk_type: customer.risk_type || "Owner Risk",
    }));

    setPreviousCustomers([]);
    setShowPreviousCustomers(false);
    resetShippingRate();
  };

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
    if (value.length !== 6) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
      );
      if (!response.ok) throw new Error("Pincode lookup failed");

      const data = await response.json();
      if (!data?.[0]?.PostOffice?.length) throw new Error("Invalid pincode");

      const postOffice = data[0].PostOffice[0];
      setFormData((prev) => ({
        ...prev,
        pincode: value,
        city: postOffice.District || postOffice.Block || "",
        state: postOffice.State || "",
        country: "India",
      }));
    } catch {
      toast.error("Unable to verify pincode");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
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

  const handlePackageChange = (index, field, value) => {
    setPackages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
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

  const getProductValues = (product) => {
    const price = Number(product.price) || 0;
    const qty = Number(product.qty) || 0;
    const tax = Number(product.tax) || 0;
    const total = price * qty;
    const taxableValue = tax > 0 ? total / (1 + tax / 100) : total;
    const taxAmount = total - taxableValue;
    return { taxableValue, taxAmount, total };
  };

  const totalInvoiceValue = products.reduce(
    (sum, product) => sum + getProductValues(product).total,
    0,
  );

  const getVolumetricWeight = (item) => {
    const l = Number(item.length) || 0;
    const w = Number(item.width) || 0;
    const h = Number(item.height) || 0;
    if (!l || !w || !h) return "0.00";
    return ((l * w * h) / 5000).toFixed(2);
  };

  const getTotalVolumetricWeight = () => {
    return packages.reduce((sum, item) => {
      const l = Number(item.length) || 0;
      const w = Number(item.width) || 0;
      const h = Number(item.height) || 0;
      const count = Number(item.count) || 1;
      if (!l || !w || !h) return sum;
      return sum + ((l * w * h) / 5000) * count;
    }, 0);
  };

  const getTotalWeight = () => {
    return packages.reduce((sum, item) => {
      const weight = Number(item.weight) || 0;
      const count = Number(item.count) || 1;
      return sum + weight * count;
    }, 0);
  };

  const getChargeableWeight = () => {
    return Math.max(getTotalWeight(), getTotalVolumetricWeight());
  };

  const resetForm = (preservePickup = false) => {
    const preservedPickup = preservePickup
      ? {
          pickup_address: formData.pickup_address,
          pickup_pincode: formData.pickup_pincode,
          pickup_city: formData.pickup_city,
        }
      : {};

    setFormData({ ...initialFormData, ...preservedPickup });
    setPreviousCustomers([]);
    setShowPreviousCustomers(false);
    setProducts([{ ...initialProduct }]);
    setPackages([{ ...initialPackage }]);
    resetShippingRate();
    setIsEditMode(false);
    setEditingOrderId(null);
    sessionStorage.removeItem("editingProcessingOrder");
  };

  const buildOrderData = (returnAddressOverride = null) => {
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

    const returnAddress = returnAddressOverride || defaultReturnAddress;

    const orderData = {
      warehouse_id: selectedWarehouse?.id || null,

      // Default Return Address
      return_address_id: returnAddress?.id || null,

      return_name: returnAddress?.name || null,

      return_phone: returnAddress?.phone || null,

      return_email: returnAddress?.email || null,

      return_address_line1: returnAddress?.address_line1 || null,

      return_address_line2: returnAddress?.address_line2 || null,

      return_landmark: returnAddress?.landmark || null,

      return_pincode: returnAddress?.pincode || null,

      return_city: returnAddress?.city || null,

      return_state: returnAddress?.state || null,

      return_country: returnAddress?.country || "India",

      // Delivery Address
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

    return { productData, packageData, orderData };
  };

  // ========================================
  // UPDATE ORDER (EDIT MODE)
  // ========================================
  const handleUpdateOrder = async (e) => {
    e?.preventDefault();

    if (!validateRequiredFields()) return;

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

      toast.success(`Order #${editingOrderId} updated successfully!`);
      sessionStorage.removeItem("editingProcessingOrder");
      window.dispatchEvent(new Event("processingOrderUpdated"));

      setIsEditMode(false);
      setEditingOrderId(null);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleShip = async () => {
    if (!validateRequiredFields()) return;

    const chargeableWeight = getChargeableWeight();
    if (chargeableWeight <= 0) {
      toast.error("Please enter valid package weight or dimensions");
      return;
    }

    setRateLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("Please login again");

      const response = await api.post("/rate/calculate-options", {
        user_id: user.id,
        pickup_pincode: formData.pickup_pincode,
        delivery_pincode: formData.pincode,
        weight: Math.round(chargeableWeight * 1000),       
         payment_type: formData.payment_type,
        product_value: totalInvoiceValue,
      });

      const result = response.data;
      if (
        !result?.success ||
        (!result.road && !result.air && !result.shadowfax)
      ) {
        throw new Error(result?.message || "No shipping options available");
      }

      setShippingOptions({
        road: result.road || null,
        air: result.air || null,
        shadowfax: result.shadowfax || null,
      });

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

      toast.success("Shipping rates calculated!");
    } catch (error) {
      resetShippingRate();
      toast.error(error.message || "Failed to calculate rates");
    } finally {
      setRateLoading(false);
    }
  };

  const selectShippingType = (type) => {
    const normalized = String(type).trim().toUpperCase();
    const optionMap = {
      ROAD: shippingOptions?.road,
      AIR: shippingOptions?.air,
      SHADOWFAX_ROAD: shippingOptions?.shadowfax,
    };
    setSelectedShippingType(normalized);
    setShippingRate(optionMap[normalized]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // If Edit Mode, route to update API
    if (isEditMode) {
      return handleUpdateOrder(e);
    }

    if (!validateRequiredFields()) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return toast.error("Please login again");

    setLoading(true);
    try {
      const freshReturnAddress = await loadDefaultReturnAddress();
      if (!freshReturnAddress?.id) {
        throw new Error(
          "Default return address is required. Please add a return address first.",
        );
      }

      const { productData, packageData, orderData } =
        buildOrderData(freshReturnAddress);
      const orderPayload = {
        user_id: user.id,
        pickup_address: formData.pickup_address,
        pickup_pincode: formData.pickup_pincode,
        pickup_city: formData.pickup_city,
        warehouse_id: selectedWarehouse?.id || null,
        orderData,
        products: productData,
        packages: packageData,
      };

      const response = await api.post("/orders/create", orderPayload);
      if (!response.data?.order_id) throw new Error("Order creation failed");

      toast.success(`Order #${response.data.order_id} created successfully!`);
      window.dispatchEvent(new Event("processingOrderCreated"));
      resetForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipment = async () => {
    if (!shippingRate || !selectedShippingType) {
      return toast.error("Please select a shipping rate first");
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return toast.error("Session expired");

    setLoading(true);
    try {
      const freshReturnAddress = await loadDefaultReturnAddress();
      if (!freshReturnAddress?.id) {
        throw new Error(
          "Default return address is required. Please add a return address first.",
        );
      }

      const {
        productData,
        packageData,
        orderData: baseOrderData,
      } = buildOrderData(freshReturnAddress);

      let orderId = null;

      // Edit existing order first if in edit mode
      if (isEditMode && editingOrderId) {
        orderId = Number(editingOrderId);
        await api.put(`/orders/${orderId}`, {
          user_id: Number(user.id),
          pickup_address: formData.pickup_address,
          pickup_pincode: formData.pickup_pincode,
          pickup_city: formData.pickup_city,
          warehouse_id: selectedWarehouse?.id || null,
          orderData: { ...baseOrderData, id: orderId },
          products: productData,
          packages: packageData,
        });
      } else {
        const orderPayload = {
          user_id: user.id,
          pickup_address: formData.pickup_address,
          pickup_pincode: formData.pickup_pincode,
          pickup_city: formData.pickup_city,
          warehouse_id: selectedWarehouse?.id || null,
          orderData: baseOrderData,
          products: productData,
          packages: packageData,
        };

        const orderResponse = await api.post("/orders/create", orderPayload);
        orderId = orderResponse.data?.order_id;
        if (!orderId) throw new Error("Order creation failed");
      }

      const shipmentData = {
        user_id: user.id,
        order_id: Number(orderId),
        pickup_address: formData.pickup_address,
        pickup_pincode: formData.pickup_pincode,
        pickup_city: formData.pickup_city,
        warehouse_id: selectedWarehouse?.id || null,
        orderData: { ...baseOrderData, id: Number(orderId) },
        products: productData,
        packages: packageData,
        service_type: selectedShippingType,
        shipping_charge: Number(shippingRate.shipping_charge),
        zone: shippingRate.zone,
        distance_km: shippingRate.distance_km || null,
      };

      const shipRes = await api.post("/shipments/confirm", shipmentData);
      if (!shipRes.data?.success) throw new Error("Shipment booking failed");

      toast.success(`Shipment confirmed for Order #${orderId}`);
      window.dispatchEvent(new Event("walletUpdated"));
      window.dispatchEvent(new Event("orderStatusUpdated"));
      resetShippingRate();
      resetForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error.message || "Unable to confirm shipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-16 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isEditMode
                ? `Edit Order #${editingOrderId}`
                : "Create New Order"}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
              {isEditMode
                ? "Update recipient details, items manifest or package specs"
                : "Enter customer address, items manifest and package dimensions"}
            </p>
          </div>

          <button
            type="button"
            onClick={isEditMode ? cancelEdit : () => resetForm()}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-xs"
          >
            {isEditMode ? "Cancel Edit" : "Reset Form"}
          </button>
        </div>

        {/* MAIN FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 md:p-7 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          {/* 1. PICKUP LOCATION */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                1
              </span>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700">
                Pickup From
              </h2>
            </div>

            <div className="relative">
              <label className={labelClass}>Pickup Warehouse *</label>
              <div className="flex items-center gap-2">
                <div ref={warehouseDropdownRef} className="relative flex-1">
                  <input
                    name="pickup_address"
                    value={
                      selectedWarehouse
                        ? getWarehouseDisplayAddress(selectedWarehouse)
                        : warehouseSearch
                    }
                    onChange={(e) => {
                      setSelectedWarehouse(null);
                      setWarehouseSearch(e.target.value);
                      setShowWarehouseDropdown(true);
                      resetShippingRate();
                    }}
                    onFocus={() => {
                      setWarehouseSearch("");
                      setShowWarehouseDropdown(true);
                    }}
                    placeholder="Search saved warehouse address..."
                    className={`${inputClass} pr-10`}
                    autoComplete="off"
                  />

                  {showWarehouseDropdown && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {filteredWarehouses.length > 0 ? (
                        filteredWarehouses.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => applyWarehouseToPickup(w)}
                            className="flex w-full flex-col rounded-lg p-2.5 text-left hover:bg-sky-50/60 transition"
                          >
                            <span className="text-xs font-bold text-slate-800">
                              {w.warehouse_name}
                            </span>
                            <span className="mt-0.5 text-[11px] text-slate-500 truncate">
                              {getWarehouseDisplayAddress(w)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-center text-xs text-slate-400">
                          No warehouse found
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openWarehouseModal}
                  className="flex h-10.5 sm:h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#008dd2] text-white shadow-xs transition hover:bg-[#007ab6] active:scale-90"
                  title="Add New Warehouse"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>

              {selectedWarehouse && (
                <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                    {selectedWarehouse.warehouse_name}
                  </span>
                  <span>PIN: {selectedWarehouse.pincode}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. CONSIGNEE / DELIVERY DETAILS */}
          <div className="space-y-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                2
              </span>
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700">
                Consignee Details (Delivery)
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div ref={previousCustomerDropdownRef} className="relative">
                <label className={labelClass}>Customer Name *</label>
                <div className="relative">
                  <input
                    name="consignee_name"
                    value={formData.consignee_name}
                    onChange={(e) => {
                      handleChange(e);
                      setShowPreviousCustomers(true);
                    }}
                    onFocus={() => {
                      if (previousCustomers.length > 0) {
                        setShowPreviousCustomers(true);
                      }
                    }}
                    placeholder="Receiver's name"
                    className={inputClass}
                    autoComplete="off"
                  />

                  {previousCustomersLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#008dd2]">
                      Searching...
                    </span>
                  )}
                </div>

                {showPreviousCustomers && previousCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+5px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Previous Customers
                    </div>

                    {previousCustomers.map((customer) => (
                      <button
                        key={`${customer.id}-${customer.mobile || ""}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectPreviousCustomer(customer)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-sky-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800">
                            {customer.consignee_name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {customer.mobile || "No mobile"}
                            {customer.city ? ` • ${customer.city}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-[#008dd2]">
                          Use
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Mobile Number *</label>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit phone"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Alternate Phone</label>
                <input
                  name="alternate_mobile"
                  value={formData.alternate_mobile}
                  onChange={handleChange}
                  placeholder="Optional phone"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Optional email"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Delivery Address *</label>
                <input
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  placeholder="Flat/House No, Building, Road"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 2</label>
                <input
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Area / Sector / Colony"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Destination Pincode *</label>
                <div className="relative">
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    placeholder="6-digit PIN"
                    inputMode="numeric"
                    maxLength={6}
                    className={inputClass}
                  />
                  {pincodeLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#008dd2]">
                      Checking...
                    </span>
                  )}
                </div>
              </div>

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

              <div>
                <label className={labelClass}>Landmark</label>
                <input
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Near landmark"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 3. PRODUCT MANIFEST */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                  3
                </span>
                <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700">
                  Item Manifest
                </h2>
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="text-xs font-bold text-[#008dd2] hover:underline"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {products.map((product, index) => {
                const values = getProductValues(product);
                return (
                  <div
                    key={index}
                    className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 transition hover:bg-white"
                  >
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-500 hover:bg-rose-100"
                      >
                        ✕
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 sm:gap-3">
                      <div className="col-span-2 sm:col-span-2">
                        <label className={labelClass}>Product Name *</label>
                        <input
                          value={product.product}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "product",
                              e.target.value,
                            )
                          }
                          placeholder="Item description"
                          className={inputClass}
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1">
                        <label className={labelClass}>SKU</label>
                        <input
                          value={product.sku}
                          onChange={(e) =>
                            handleProductChange(index, "sku", e.target.value)
                          }
                          placeholder="SKU"
                          className={inputClass}
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1">
                        <label className={labelClass}>Price (₹) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={product.price}
                          onChange={(e) =>
                            handleProductChange(index, "price", e.target.value)
                          }
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1">
                        <label className={labelClass}>Qty *</label>
                        <input
                          type="number"
                          min="1"
                          value={product.qty}
                          onChange={(e) =>
                            handleProductChange(index, "qty", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 flex flex-col justify-end">
                        <span className="text-[10px] font-bold text-slate-400">
                          Total
                        </span>
                        <span className="h-10.5 sm:h-11 flex items-center font-bold text-slate-800 text-[13px] sm:text-sm">
                          ₹{values.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-1">
              <span className="text-xs font-medium text-slate-500">
                Invoice Total:{" "}
                <b className="font-bold text-slate-900 text-sm">
                  ₹{totalInvoiceValue.toFixed(2)}
                </b>
              </span>
            </div>
          </div>

          {/* 4. PACKAGES & WEIGHT */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                  4
                </span>
                <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-700">
                  Parcel Specifications
                </h2>
              </div>
              <button
                type="button"
                onClick={addPackage}
                className="text-xs font-bold text-[#008dd2] hover:underline"
              >
                + Add Box
              </button>
            </div>

            <div className="space-y-2.5">
              {packages.map((item, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4 transition hover:bg-white"
                >
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-500 hover:bg-rose-100"
                    >
                      ✕
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
                    <div>
                      <label className={labelClass}>Length (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.length}
                        onChange={(e) =>
                          handlePackageChange(index, "length", e.target.value)
                        }
                        placeholder="L"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Width (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.width}
                        onChange={(e) =>
                          handlePackageChange(index, "width", e.target.value)
                        }
                        placeholder="W"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Height (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.height}
                        onChange={(e) =>
                          handlePackageChange(index, "height", e.target.value)
                        }
                        placeholder="H"
                        className={inputClass}
                      />
                    </div>

                    <div className="col-span-1.5 sm:col-span-1">
                      <label className={labelClass}>Weight (Kg) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.weight}
                        onChange={(e) =>
                          handlePackageChange(index, "weight", e.target.value)
                        }
                        placeholder="0.5"
                        className={inputClass}
                      />
                    </div>

                    <div className="col-span-1.5 sm:col-span-1 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-slate-400">
                        Volumetric Wt
                      </span>
                      <span className="h-10.5 sm:h-11 flex items-center text-xs font-semibold text-slate-600">
                        {getVolumetricWeight(item)} Kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] sm:text-xs text-slate-500 pt-1">
              <span>
                Deadweight:{" "}
                <b className="text-slate-800">
                  {getTotalWeight().toFixed(2)} Kg
                </b>
              </span>
              <span>•</span>
              <span>
                Chargeable:{" "}
                <b className="text-[#008dd2] font-extrabold">
                  {getChargeableWeight().toFixed(2)} Kg
                </b>
              </span>
            </div>
          </div>

          {/* 5. PAYMENT & NATURAL SCROLL ACTION BUTTONS */}
          <div className="pt-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  Payment:
                </span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, payment_type: "Prepaid" }))
                    }
                    className={`rounded-lg px-3.5 py-1 text-xs font-bold transition ${
                      formData.payment_type === "Prepaid"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    Prepaid
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, payment_type: "COD" }))
                    }
                    className={`rounded-lg px-3.5 py-1 text-xs font-bold transition ${
                      formData.payment_type === "COD"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    COD
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleShip}
                  disabled={rateLoading}
                  className="flex h-11 items-center justify-center rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-60"
                >
                  {rateLoading ? "Calculating..." : "⚡ Check Rate"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                >
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Saving..."
                    : isEditMode
                      ? "Update Order"
                      : "Save & Next"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ADD WAREHOUSE MODAL */}
      {showWarehouseModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Add Pickup Warehouse
              </h3>
              <button
                type="button"
                onClick={closeWarehouseModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form
              id="warehouse-form"
              onSubmit={handleCreateWarehouse}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Warehouse / Brand Name *</label>
                  <input
                    name="warehouse_name"
                    value={warehouseForm.warehouse_name}
                    onChange={handleWarehouseFormChange}
                    placeholder="Warehouse tag"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Contact Person *</label>
                  <input
                    name="contact_name"
                    value={warehouseForm.contact_name}
                    onChange={handleWarehouseFormChange}
                    placeholder="Manager name"
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
                  <label className={labelClass}>Pincode *</label>
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
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address Line 1 *</label>
                  <input
                    name="address_line1"
                    value={warehouseForm.address_line1}
                    onChange={handleWarehouseFormChange}
                    placeholder="Complete street address"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>City *</label>
                  <input
                    name="city"
                    value={warehouseForm.city}
                    readOnly
                    className={readonlyClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>State *</label>
                  <input
                    name="state"
                    value={warehouseForm.state}
                    readOnly
                    className={readonlyClass}
                    required
                  />
                </div>
              </div>
            </form>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeWarehouseModal}
                className="h-10 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  document.querySelector("#warehouse-form")?.requestSubmit()
                }
                disabled={warehouseSaving}
                className="h-10 rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white shadow-xs disabled:opacity-60"
              >
                {warehouseSaving ? "Saving..." : "Save Warehouse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATE QUOTATION MODAL */}
      {shippingOptions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select Courier Option
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compare assigned courier speeds and rates
                </p>
              </div>
              <button
                type="button"
                onClick={resetShippingRate}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2.5">
              {/* ROAD OPTION */}
              {shippingOptions.road && (
                <button
                  type="button"
                  onClick={() => selectShippingType("ROAD")}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${
                    selectedShippingType === "ROAD"
                      ? "border-[#008dd2] bg-[#008dd2]/5 ring-2 ring-[#008dd2]/10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        ShipDrop Express (Surface)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Zone: {shippingOptions.road.zone} •{" "}
                        {shippingOptions.road.distance_km ?? "—"} Km
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-[#008dd2]">
                      ₹{Number(shippingOptions.road.shipping_charge).toFixed(2)}
                    </span>
                  </div>
                </button>
              )}

              {/* AIR OPTION */}
              {shippingOptions.air && (
                <button
                  type="button"
                  onClick={() => selectShippingType("AIR")}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${
                    selectedShippingType === "AIR"
                      ? "border-[#7451ff] bg-[#7451ff]/5 ring-2 ring-[#7451ff]/10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        ShipDrop Air Express
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Zone: {shippingOptions.air.zone} • Fast Delivery
                      </p>
                    </div>
                    <span className="text-base font-extrabold text-[#7451ff]">
                      ₹{Number(shippingOptions.air.shipping_charge).toFixed(2)}
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-2">
              <button
                type="button"
                onClick={resetShippingRate}
                className="h-10 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShipment}
                disabled={loading || !shippingRate}
                className="flex-1 h-10 rounded-xl bg-[#008dd2] text-xs font-bold text-white shadow-xs active:scale-95 disabled:opacity-60"
              >
                {loading ? "Confirming..." : "Confirm & Ship Now →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateOrder;
