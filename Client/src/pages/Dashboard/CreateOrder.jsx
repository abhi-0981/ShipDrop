import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

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
  // CLASSES
  // ========================================

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition duration-150 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15";

  const readonlyClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-600 outline-none cursor-not-allowed select-none";

  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  // ========================================
  // REQUIRED FIELD VALIDATION
  // ========================================

  const validateRequiredFields = () => {
    // Pickup address
    if (!formData.pickup_address.trim()) {
      toast.error("Please enter pickup address");

      return false;
    }

    // Pickup pincode
    if (!/^\d{6}$/.test(formData.pickup_pincode)) {
      toast.error("Please enter a valid 6-digit pickup pincode");

      return false;
    }

    // Consignee
    if (!formData.consignee_name.trim()) {
      toast.error("Please enter consignee name");

      return false;
    }

    // Mobile
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");

      return false;
    }

    // Delivery address
    if (!formData.address_line1.trim()) {
      toast.error("Please enter delivery address");

      return false;
    }

    // Delivery pincode
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit delivery pincode");

      return false;
    }

    // City/state
    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error("Please enter a valid delivery pincode");

      return false;
    }

    // ======================================
    // PRODUCT VALIDATION
    // ======================================

    if (!Array.isArray(products) || products.length === 0) {
      toast.error("At least one product is required");

      return false;
    }

    for (let index = 0; index < products.length; index++) {
      const product = products[index];

      if (!product?.product || !product.product.trim()) {
        toast.error(`Please enter product title for product ${index + 1}`);

        return false;
      }

      if (!product.price || Number(product.price) <= 0) {
        toast.error(`Please enter valid price for product ${index + 1}`);

        return false;
      }

      if (!product.qty || Number(product.qty) <= 0) {
        toast.error(`Please enter valid quantity for product ${index + 1}`);

        return false;
      }
    }

    // ======================================
    // PACKAGE VALIDATION
    // ======================================

    if (!Array.isArray(packages) || packages.length === 0) {
      toast.error("At least one package is required");

      return false;
    }

    for (let index = 0; index < packages.length; index++) {
      const item = packages[index];

      if (!item.length || Number(item.length) <= 0) {
        toast.error(`Please enter package length for package ${index + 1}`);

        return false;
      }

      if (!item.width || Number(item.width) <= 0) {
        toast.error(`Please enter package width for package ${index + 1}`);

        return false;
      }

      if (!item.height || Number(item.height) <= 0) {
        toast.error(`Please enter package height for package ${index + 1}`);

        return false;
      }

      if (!item.weight || Number(item.weight) <= 0) {
        toast.error(`Please enter package weight for package ${index + 1}`);

        return false;
      }

      if (!item.count || Number(item.count) <= 0) {
        toast.error(`Please enter package count for package ${index + 1}`);

        return false;
      }
    }

    return true;
  };

  // ========================================
  // RESET SHIPPING RATE
  // ========================================

  const resetShippingRate = () => {
    setShippingRate(null);
    setShippingOptions(null);
    setSelectedShippingType(null);
  };

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
      "pickup_pincode",
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

    const volumetricWeight =
      (length * width * height) / 5000;

    return sum + volumetricWeight * count;
  }, 0);
};


// ========================================
// CHARGEABLE WEIGHT
// DEADWEIGHT vs VOLUMETRIC WEIGHT
// ========================================

const getChargeableWeight = () => {
  const deadWeight = getTotalWeight();

  const volumetricWeight =
    getTotalVolumetricWeight();

  return Math.max(
    deadWeight,
    volumetricWeight
  );
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

    setProducts([{ ...initialProduct }]);

    setPackages([{ ...initialPackage }]);

    resetShippingRate();
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

const volumetricWeight =
  getTotalVolumetricWeight();

const chargeableWeight =
  Math.max(
    deadWeight,
    volumetricWeight
  );

if (chargeableWeight <= 0) {
  toast.error(
    "Please enter valid package weight or dimensions"
  );

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

    // ======================================
    // CREATE ORDER
    // ======================================

    const orderPayload = {
      user_id: user.id,

      pickup_address: formData.pickup_address,

      pickup_pincode: formData.pickup_pincode,

      pickup_city: formData.pickup_city,

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

  // ========================================
  // CONFIRM & SHIP NOW
  // ========================================

  const handleConfirmShipment = async () => {
    if (!shippingRate) {
      toast.error("Please calculate shipping rate first");

      return;
    }

    if (!selectedShippingType) {
      toast.error("Please select a shipping service");

      return;
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

    // ======================================
    // SHIPMENT DATA
    // ======================================

    const shipmentData = {
      user_id: user.id,

      pickup_address: formData.pickup_address,

      pickup_pincode: formData.pickup_pincode,

      orderData,

      products: productData,
      packages: packageData,
      // ====================================
      // ROAD / AIR / SHADOWFAX
      // ====================================
      service_type:
        selectedShippingType === "SHADOWFAX_ROAD"
          ? "SHADOWFAX_ROAD"
          : shippingRate.service_type || selectedShippingType || "ROAD",

      shipping_charge: Number(shippingRate.shipping_charge),

      zone: shippingRate.zone,

      distance_km:
        shippingRate.distance_km === null
          ? null
          : Number(shippingRate.distance_km),
    };

    setLoading(true);

    try {
      const response = await api.post("/shipments/confirm", shipmentData);

      const result = response.data;

      if (!result?.success) {
        throw new Error(result?.message || "Unable to confirm shipment");
      }

      const serviceNames = {
        ROAD: "Delivery By Road",
        AIR: "Delivery By Air",
        SHADOWFAX_ROAD: "Shadowfax By Road",
      };

      toast.success(
        `Shipment confirmed ${serviceNames[selectedShippingType]} successfully`,
      );

      window.dispatchEvent(new Event("walletUpdated"));

      setShippingRate(null);

      setShippingOptions(null);

      setSelectedShippingType(null);

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
                Pickup Address
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
              <div>
                <label className={labelClass}>Pickup Address *</label>

                <input
                  name="pickup_address"
                  value={formData.pickup_address}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  placeholder="Enter complete pickup warehouse or store address"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Pickup Pincode *</label>

                <input
                  name="pickup_pincode"
                  value={formData.pickup_pincode}
                  onChange={handlePickupPincodeChange}
                  onKeyDown={handleEnterKey}
                  placeholder="6-digit PIN"
                  inputMode="numeric"
                  maxLength={6}
                  className={inputClass}
                  required
                />
              </div>
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
