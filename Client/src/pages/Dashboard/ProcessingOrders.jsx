import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Icon = ({ name, size = 16 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      </svg>
    );
  }

  return null;
};

function ProcessingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [search, setSearch] = useState("");

  const [showShipPopup, setShowShipPopup] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [previewRates, setPreviewRates] = useState({});
  const [previewTotal, setPreviewTotal] = useState(0);

  const rateCacheRef = useRef(new Map());
  const previewRequestRef = useRef(0);
  const [shippingType, setShippingType] = useState("ROAD");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const [editingOrder, setEditingOrder] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const storedUser = localStorage.getItem("user");
      let user = {};
      try {
        user = storedUser ? JSON.parse(storedUser) : {};
      } catch (error) {
        console.log("User parse error:", error);
      }

      const userId = user.id || user.user_id || user.userId;
      if (!userId) {
        throw new Error("User session not found. Please login again.");
      }

      const response = await api.get(`/orders/processing?user_id=${userId}`);
      const data = response.data?.orders ?? response.data ?? [];

      rateCacheRef.current.clear();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Processing orders error:", error);
      setOrders([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleNewOrder = () => fetchOrders(false);
    window.addEventListener("processingOrderCreated", handleNewOrder);
    return () =>
      window.removeEventListener("processingOrderCreated", handleNewOrder);
  }, []);

  useEffect(() => {
    const handleOrderUpdated = () => fetchOrders(false);
    window.addEventListener("processingOrderUpdated", handleOrderUpdated);
    return () =>
      window.removeEventListener("processingOrderUpdated", handleOrderUpdated);
  }, []);

  const getId = (order, index = 0) => order.id ?? order.order_id ?? index;
  const getCustomer = (order) =>
    order.consignee_name || order.customer_name || order.name || "—";
  const getMobile = (order) =>
    order.mobile ||
    order.consignee_mobile ||
    order.phone ||
    order.mobile_number ||
    "—";
  const getPickupCity = (order) =>
    order.pickup_city ||
    order.pickupCity ||
    order.pickup?.city ||
    order.pickup_address_data?.city ||
    "—";
  const getPickupPincode = (order) =>
    order.pickup_pincode ||
    order.pickupPincode ||
    order.pickup?.pincode ||
    order.pickup_address_data?.pincode ||
    "—";
  const getDeliveryCity = (order) =>
    order.city || order.delivery_city || order.deliveryCity || "—";
  const getDeliveryPincode = (order) =>
    order.pincode || order.delivery_pincode || order.deliveryPincode || "—";

  const getProduct = (order) => {
    if (order.product_name) return order.product_name;
    if (order.product) return order.product;
    if (Array.isArray(order.products) && order.products.length) {
      return (
        order.products[0]?.product_name ||
        order.products[0]?.product_title ||
        order.products[0]?.product ||
        "—"
      );
    }
    return "—";
  };

  const getQty = (order) => {
    if (order.qty != null) return order.qty;
    if (order.quantity != null) return order.quantity;
    if (Array.isArray(order.products) && order.products.length) {
      return order.products[0]?.qty ?? order.products[0]?.quantity ?? 1;
    }
    return 1;
  };

  const getWeightNumber = (order) => {
    if (order.total_weight != null) return Number(order.total_weight) || 0;
    if (order.weight != null) return Number(order.weight) || 0;
    if (order.dead_weight != null) return Number(order.dead_weight) || 0;
    if (Array.isArray(order.packages) && order.packages.length) {
      return order.packages.reduce((total, pkg) => {
        const weight = Number(pkg?.weight) || 0;
        const count = Number(pkg?.package_count) || 1;
        return total + weight * count;
      }, 0);
    }
    return 0;
  };

  const getTotalWeight = (order) => {
    const weight = getWeightNumber(order);
    if (weight <= 0) return "—";
    return `${weight} kg`;
  };

  const getBoxCount = (order) => {
    if (Array.isArray(order.packages) && order.packages.length) {
      const total = order.packages.reduce(
        (sum, pkg) => sum + Number(pkg?.package_count ?? pkg?.count ?? 1),
        0
      );
      return total || 1;
    }
    return order.package_count ?? order.count ?? 1;
  };

  const getPayment = (order) => {
    const payment = (order.payment_type || order.payment_method || "PREPAID")
      .toString()
      .toUpperCase();
    return payment === "COD" ? "COD" : "PREPAID";
  };

  const getProductValue = (order) => {
    const candidates = [
      order.product_value,
      order.productValue,
      order.order_value,
      order.orderValue,
      order.total_amount,
      order.totalAmount,
      order.cod_amount,
      order.codAmount,
      order.invoice_value,
      order.invoiceValue,
      order.amount,
    ];

    for (const value of candidates) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue >= 0) {
        return numericValue;
      }
    }

    if (Array.isArray(order.products) && order.products.length) {
      const total = order.products.reduce((sum, product) => {
        const qty = Number(product?.qty ?? product?.quantity ?? 1) || 1;
        const price =
          Number(
            product?.price ??
              product?.selling_price ??
              product?.sellingPrice ??
              product?.amount ??
              0
          ) || 0;
        return sum + price * qty;
      }, 0);
      if (total >= 0) return total;
    }
    return 0;
  };

  const getDate = (order) => {
    const raw = order.created_at || order.createdAt || order.order_date;
    if (!raw) return "—";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (order) => order.status || "PROCESSING";

  // ========================================
  // EDIT ORDER: PUSH TO SESSION STORAGE & NAVIGATE
  // ========================================
  const handleEdit = async (order) => {
    const orderId = getId(order);
    if (!orderId) {
      showToast("Invalid order ID.", "error");
      return;
    }

    try {
      setEditingOrder(true);
      const storedUser = localStorage.getItem("user");
      let user = {};
      try {
        user = storedUser ? JSON.parse(storedUser) : {};
      } catch (error) {
        console.log("User parse error:", error);
      }

      const userId = user.id || user.user_id || user.userId;
      if (!userId) {
        throw new Error("User session not found. Please login again.");
      }

      const response = await api.get(`/orders/${orderId}?user_id=${userId}`);
      const result = response.data;

      if (!result?.success || !result?.order) {
        throw new Error(result?.message || "Unable to load order details");
      }

      // Store complete object for CreateOrder to read
      sessionStorage.setItem(
        "editingProcessingOrder",
        JSON.stringify(result.order)
      );
      navigate("/create-order");
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Unable to open order for editing",
        "error"
      );
      setEditingOrder(false);
    }
  };

  // ========================================
  // DUPLICATE ORDER
  // Creates a fresh Processing order using the
  // complete data of the selected order.
  // Original order remains unchanged.
  // ========================================
  const handleDuplicate = async (order) => {
    const orderId = getId(order);

    let user = {};
    try {
      const storedUser = localStorage.getItem("user");
      user = storedUser ? JSON.parse(storedUser) : {};
    } catch (error) {
      console.log("User parse error:", error);
    }

    const userId = user.id || user.user_id || user.userId;

    if (!orderId || !userId) {
      showToast("Unable to duplicate this order.", "error");
      return;
    }

    try {
      const response = await api.get(`/orders/${orderId}?user_id=${userId}`);
      const result = response?.data;

      if (!result?.success || !result?.order) {
        throw new Error(result?.message || "Unable to load order details");
      }

      const source = result.order;
      const warehouseId = Number(source.warehouse_id || order.warehouse_id);

      if (!warehouseId) {
        throw new Error("Pickup warehouse is missing");
      }

      const payload = {
        user_id: Number(userId),
        pickup_address: source.pickup_address || order.pickup_address || null,
        pickup_pincode: source.pickup_pincode || order.pickup_pincode || null,
        pickup_city: source.pickup_city || order.pickup_city || null,
        warehouse_id: warehouseId,
        pickup_address_id: source.pickup_address_id || order.pickup_address_id || null,
        orderData: {
          consignee_name: source.consignee_name,
          mobile: source.mobile,
          alternate_mobile: source.alternate_mobile || null,
          email: source.email || null,
          gstin: source.gstin || null,
          company_name: source.company_name || null,
          floor_no: source.floor_no || null,
          landmark: source.landmark || null,
          address_line1: source.address_line1,
          address_line2: source.address_line2 || null,
          pincode: source.pincode,
          city: source.city,
          state: source.state,
          country: source.country || "India",
          payment_type: source.payment_type || "Prepaid",
          risk_type: source.risk_type || "Owner Risk",
          warehouse_id: warehouseId,
        },
        products: Array.isArray(source.products) ? source.products : [],
        packages: Array.isArray(source.packages) ? source.packages : [],
      };

      const createResponse = await api.post("/orders/create", payload);
      const createResult = createResponse?.data;

      if (!createResult?.success || !createResult?.order_id) {
        throw new Error(createResult?.message || "Unable to duplicate order");
      }

      showToast(
        `Order duplicated successfully. New order #${createResult.order_id} is in Processing.`,
        "success"
      );
      await fetchOrders(false);
    } catch (error) {
      console.error("Duplicate order error:", error);
      showToast(
        error?.response?.data?.message || error?.message || "Unable to duplicate order",
        "error"
      );
    }
  };

  const searchText = search.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (!searchText) return true;
    const searchableText = [
      getId(order),
      getCustomer(order),
      getMobile(order),
      getPickupCity(order),
      getPickupPincode(order),
      getDeliveryCity(order),
      getDeliveryPincode(order),
      getProduct(order),
      getPayment(order),
      getStatus(order),
      order.awb,
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");

    return searchableText.includes(searchText);
  });

  const visibleIds = filteredOrders.map((order, index) => getId(order, index));
  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedOrders.includes(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedOrders((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
      return;
    }
    setSelectedOrders((prev) => [...new Set([...prev, ...visibleIds])]);
  };

  const toggleOrder = (id) => {
    setSelectedOrders((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      return [...prev, id];
    });
  };

  const getSelectedOrderObjects = () => {
    return orders.filter((order, index) =>
      selectedOrders.includes(getId(order, index))
    );
  };

  const calculatePreview = async (orderList, serviceType = shippingType) => {
    const currentRequest = ++previewRequestRef.current;
    if (!Array.isArray(orderList) || orderList.length === 0) {
      setPreviewLoading(false);
      setPreviewRates({});
      setPreviewTotal(0);
      return;
    }

    const normalizedService = String(serviceType || "ROAD")
      .trim()
      .toUpperCase();

    const getRateCacheKey = (order) => {
      const id = getId(order);
      const pickup = getPickupPincode(order);
      const delivery = getDeliveryPincode(order);
      const weight = getWeightNumber(order);
      const paymentType = getPayment(order);
      const productValue = getProductValue(order);
      return `${id}|${normalizedService}|${pickup}|${delivery}|${weight}|${paymentType}|${productValue}`;
    };

    const rateMap = {};
    const missingOrders = [];

    orderList.forEach((order) => {
      const cacheKey = getRateCacheKey(order);
      const cachedRate = rateCacheRef.current.get(cacheKey);
      if (cachedRate) {
        rateMap[cachedRate.id] = cachedRate;
      } else {
        missingOrders.push({ order, cacheKey });
      }
    });

    if (missingOrders.length === 0) {
      let total = 0;
      orderList.forEach((order) => {
        total += Number(rateMap[getId(order)]?.charge) || 0;
      });
      setPreviewRates(rateMap);
      setPreviewTotal(Number(total.toFixed(2)));
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);

    try {
      const freshResults = await Promise.all(
        missingOrders.map(async ({ order, cacheKey }) => {
          const pickupPincode = getPickupPincode(order);
          const deliveryPincode = getDeliveryPincode(order);
          const weight = getWeightNumber(order);

          if (!/^\d{6}$/.test(String(pickupPincode))) {
            throw new Error(`Pickup pincode missing for Order #${order.id}`);
          }
          if (!/^\d{6}$/.test(String(deliveryPincode))) {
            throw new Error(`Delivery pincode missing for Order #${order.id}`);
          }
          if (weight <= 0) {
            throw new Error(`Package weight missing for Order #${order.id}`);
          }

          const storedUser = localStorage.getItem("user");
          let user = {};
          try {
            user = storedUser ? JSON.parse(storedUser) : {};
          } catch (error) {
            console.log("User parse error:", error);
          }

          const userId = user.id || user.user_id || user.userId;
          if (!userId) {
            throw new Error("User session not found. Please login again.");
          }

          const response = await api.post("/rate/calculate", {
            user_id: userId,
            pickup_pincode: pickupPincode,
            delivery_pincode: deliveryPincode,
            weight,
            service_type: normalizedService,
            payment_type: getPayment(order),
            product_value: getProductValue(order),
          });

          const result = response.data;
          if (!result?.success) {
            throw new Error(
              result?.message ||
                `Unable to calculate rate for Order #${order.id}`
            );
          }

          const item = {
            id: getId(order),
            charge: Number(result.shipping_charge) || 0,
            zone: result.zone,
            distance_km: result.distance_km,
            weight,
          };

          rateCacheRef.current.set(cacheKey, item);
          return item;
        })
      );

      if (currentRequest !== previewRequestRef.current) return;

      freshResults.forEach((item) => {
        rateMap[item.id] = item;
      });

      let total = 0;
      orderList.forEach((order) => {
        total += Number(rateMap[getId(order)]?.charge) || 0;
      });

      setPreviewRates(rateMap);
      setPreviewTotal(Number(total.toFixed(2)));
    } catch (error) {
      if (currentRequest !== previewRequestRef.current) return;
      setPreviewRates(rateMap);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Unable to calculate shipping charges",
        "error"
      );
    } finally {
      if (currentRequest === previewRequestRef.current) {
        setPreviewLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedOrders.length === 0) return;
    const selected = getSelectedOrderObjects();
    if (selected.length === 0) return;
    calculatePreview(selected, "ROAD");
  }, [selectedOrders]);

  const handleShippingTypeChange = async (event) => {
    const newType = event.target.value;
    setShippingType(newType);
    if (selectedOrders.length === 0) return;
    const selected = getSelectedOrderObjects();
    await calculatePreview(selected, newType);
  };

  const openShipPopup = (ids) => {
    const selected = orders.filter((order, index) =>
      ids.includes(getId(order, index))
    );

    if (selected.length === 0) {
      showToast("Please select at least one order.", "error");
      return;
    }

    setSelectedOrders(ids);
    setShippingType("ROAD");
    setShowShipPopup(true);
  };

  const handleShip = () => {
    if (selectedOrders.length === 0) {
      showToast("Please select at least one order.", "error");
      return;
    }
    openShipPopup(selectedOrders);
  };

  const confirmShipNow = async () => {
    if (selectedOrders.length === 0) return;
    if (previewLoading) {
      showToast("Please wait while charges are calculated.", "error");
      return;
    }
    if (previewTotal <= 0) {
      showToast("Shipping charge could not be calculated.", "error");
      return;
    }

    try {
      setShipping(true);
      const storedUser = localStorage.getItem("user");
      let user = {};
      try {
        user = storedUser ? JSON.parse(storedUser) : {};
      } catch (error) {
        console.log("User parse error:", error);
      }

      const userId = user.id || user.user_id || user.userId;
      if (!userId) {
        showToast("User session not found.", "error");
        return;
      }

      const response = await api.post("/shipments/bulk-confirm", {
        user_id: userId,
        order_ids: selectedOrders,
        service_type: shippingType,
        total_shipping_charge: previewTotal,
      });

      const result = response.data;
      if (!result || result.success !== true) {
        throw new Error(result?.message || "Unable to ship selected orders");
      }

      const shippedCount =
        result.total_orders ??
        result.shipped_orders?.length ??
        selectedOrders.length;
      const chargedAmount = Number(result.total_charge ?? previewTotal);

      setShowShipPopup(false);
      setPreviewRates({});
      setPreviewTotal(0);
      rateCacheRef.current.clear();
      setSelectedOrders([]);
      setShippingType("ROAD");

      await fetchOrders(false);

      window.dispatchEvent(new Event("walletBalanceUpdated"));
      window.dispatchEvent(new Event("orderStatusUpdated"));
      window.dispatchEvent(new Event("walletUpdated"));

      showToast(
        `${shippedCount} order${
          shippedCount > 1 ? "s" : ""
        } shipped! ₹${chargedAmount.toFixed(2)} deducted from wallet.`,
        "success"
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Unable to ship selected orders",
        "error"
      );
    } finally {
      setShipping(false);
    }
  };

  const handleDelete = (ids) => {
    if (!Array.isArray(ids)) ids = selectedOrders;
    if (!ids || ids.length === 0) {
      showToast("Please select at least one order.", "error");
      return;
    }
    setDeleteIds(ids);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteIds.length) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeleting(true);
      const storedUser = localStorage.getItem("user");
      let user = {};
      try {
        user = storedUser ? JSON.parse(storedUser) : {};
      } catch (error) {
        console.log("User parse error:", error);
      }

      const userId = user.id || user.user_id || user.userId;
      if (!userId) {
        showToast("User session not found.", "error");
        return;
      }

      const response = await api.post("/orders/delete", {
        user_id: userId,
        order_ids: deleteIds,
      });

      const result = response.data;
      if (!result?.success) throw new Error("Unable to delete orders");

      const deletedCount = result.deleted_count ?? deleteIds.length;
      setShowDeleteConfirm(false);
      setDeleteIds([]);
      setSelectedOrders([]);
      rateCacheRef.current.clear();

      await fetchOrders(false);
      showToast(`${deletedCount} order(s) deleted successfully.`, "success");
    } catch (error) {
      showToast(error.message || "Failed to delete orders", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#f6f8fb] p-4 sm:p-6">
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#7451ff]" />
            <p className="text-xs font-semibold text-slate-500">
              Loading processing orders...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedOrderObjects = getSelectedOrderObjects();

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] p-3 sm:p-5 md:p-6 pb-20 lg:pb-8">
      {/* TOAST */}
      {toast && (
        <div className="fixed right-4 top-4 z-[11000] max-w-[90vw]">
          <div
            className={`flex items-center gap-3 rounded-xl border bg-white p-3.5 shadow-2xl ${
              toast.type === "success" ? "border-green-200" : "border-red-200"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                toast.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {toast.type === "success" ? "✓" : "!"}
            </div>
            <p className="text-xs font-semibold text-slate-700">{toast.message}</p>
          </div>
        </div>
      )}

      {/* HEADER & CONTROLS */}
      <div className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0ecff] text-[#7052ff]">
              <Icon name="truck" size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Processing Orders
              </h1>
              <p className="text-[11px] text-slate-400">
                {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SEARCH */}
            <div className="relative flex-1 sm:w-64">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={14} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, customers..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8.5 pr-8 text-xs text-slate-700 outline-none focus:border-[#7451ff] focus:bg-white focus:ring-2 focus:ring-[#7451ff]/10 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* DESKTOP ACTIONS */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleShip}
                disabled={selectedOrders.length === 0}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-[#7451ff] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#6745ec] active:scale-95 disabled:opacity-40"
              >
                <Icon name="truck" size={14} />
                Ship ({selectedOrders.length})
              </button>

              <button
                type="button"
                onClick={() => handleDelete()}
                disabled={selectedOrders.length === 0}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-600 active:scale-95 disabled:opacity-40"
              >
                <Icon name="trash" size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SELECT ALL + INLINE ACTIONS */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 sm:hidden">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded accent-[#7451ff]"
              />
              <span>
                Select All ({selectedOrders.length}/{filteredOrders.length})
              </span>
            </label>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDelete()}
                  className="flex h-8 items-center gap-1 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white shadow-xs active:scale-95"
                >
                  <Icon name="trash" size={12} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={handleShip}
                  className="flex h-8 items-center gap-1 rounded-lg bg-[#7451ff] px-3 text-[11px] font-bold text-white shadow-xs active:scale-95"
                >
                  <Icon name="truck" size={12} />
                  Ship ({selectedOrders.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="space-y-3 sm:hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="file" size={22} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">
              No processing orders found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Create a new order to see it processing here.
            </p>
          </div>
        ) : (
          filteredOrders.map((order, index) => {
            const id = getId(order, index);
            const selected = selectedOrders.includes(id);

            return (
              <div
                key={id}
                className={`relative rounded-2xl border bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)] transition-all ${
                  selected
                    ? "border-[#7451ff] ring-2 ring-[#7451ff]/10"
                    : "border-slate-200/80"
                }`}
              >
                {/* CARD TOP BAR */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleOrder(id)}
                      className="h-4 w-4 rounded accent-[#7451ff]"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      #{order.order_id || id}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                        getPayment(order) === "COD"
                          ? "border-rose-100 bg-rose-50 text-rose-600"
                          : "border-emerald-100 bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {getPayment(order)}
                    </span>
                    <span className="rounded-full bg-[#f2edff] px-2 py-0.5 text-[10px] font-semibold text-[#6847ed]">
                      {getStatus(order)}
                    </span>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">
                      {getCustomer(order)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {getMobile(order)}
                    </span>
                  </div>

                  {/* ROUTE */}
                  <div className="rounded-xl bg-slate-50/80 p-2 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="truncate">
                      <span className="font-semibold">{getPickupCity(order)}</span>
                      <span className="text-slate-400 ml-1">
                        ({getPickupPincode(order)})
                      </span>
                    </div>
                    <span className="text-slate-400 font-bold px-1.5">→</span>
                    <div className="truncate text-right">
                      <span className="font-semibold">{getDeliveryCity(order)}</span>
                      <span className="text-slate-400 ml-1">
                        ({getDeliveryPincode(order)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate max-w-[180px]">
                      {getProduct(order)} (Qty: {getQty(order)})
                    </span>
                    <span className="font-semibold text-slate-700">
                      {getTotalWeight(order)} • {getBoxCount(order)} Box
                    </span>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <div className="text-[10px] text-slate-400">
                    {getDate(order)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(order)}
                      disabled={editingOrder}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 active:scale-90 transition disabled:opacity-50"
                      title="Edit Order"
                    >
                      <Icon name="edit" size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(order)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 active:scale-90 transition"
                      title="Duplicate Order"
                    >
                      <Icon name="copy" size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete([id])}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-90 transition"
                      title="Delete Order"
                    >
                      <Icon name="trash" size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openShipPopup([id])}
                      className="flex h-8 items-center gap-1 rounded-lg bg-[#7451ff] px-3 text-[11px] font-bold text-white shadow-xs active:scale-95 transition"
                    >
                      <Icon name="truck" size={12} />
                      Ship
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TABLET & DESKTOP: TABLE VIEW */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded accent-[#7451ff] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order & Item</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Icon name="file" size={26} />
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      No Processing Orders
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const id = getId(order, index);
                  const selected = selectedOrders.includes(id);

                  return (
                    <tr
                      key={id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOrder(id)}
                          className="h-4 w-4 rounded accent-[#7451ff] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {getCustomer(order)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {getMobile(order)}
                        </div>
                        <span className="mt-1 inline-flex rounded-full bg-[#f2edff] px-2 py-0.5 text-[9px] font-bold text-[#6847ed]">
                          {getStatus(order)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span>{getPickupCity(order)}</span>
                          <span className="text-slate-400">→</span>
                          <span>{getDeliveryCity(order)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          PIN: {getPickupPincode(order)} to {getDeliveryPincode(order)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            getPayment(order) === "COD"
                              ? "border-rose-100 bg-rose-50 text-rose-600"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {getPayment(order)}
                        </span>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {getDate(order)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          #{order.order_id || id}
                        </div>
                        <div className="text-slate-600 truncate max-w-[150px]">
                          {getProduct(order)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Qty: {getQty(order)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">
                          {getTotalWeight(order)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {getBoxCount(order)} Box
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openShipPopup([id])}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ecff] text-[#7451ff] hover:bg-[#7451ff] hover:text-white transition active:scale-95"
                            title="Ship Order"
                          >
                            <Icon name="truck" size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(order)}
                            disabled={editingOrder}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white transition active:scale-95 disabled:opacity-50"
                            title="Edit Order"
                          >
                            <Icon name="edit" size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition active:scale-95"
                            title="Duplicate Order"
                          >
                            <Icon name="copy" size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete([id])}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition active:scale-95"
                            title="Delete Order"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM SHIPMENT MODAL */}
      {showShipPopup && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/55 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2edff] text-[#7451ff]">
                  <Icon name="truck" size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Confirm Bulk Shipment
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Review charges for {selectedOrderObjects.length} order(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowShipPopup(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div className="rounded-2xl border border-[#e5ddff] bg-[#faf8ff] p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Shipping Mode
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Applied to all selected orders
                  </p>
                </div>

                <select
                  value={shippingType}
                  onChange={handleShippingTypeChange}
                  disabled={previewLoading || shipping}
                  className="h-9.5 rounded-xl border border-[#a996ff] bg-white px-3 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="ROAD">Delivery By Road</option>
                  <option value="AIR">Delivery By Air</option>
                </select>
              </div>

              {previewLoading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-2.5 h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-[#7451ff]" />
                  <p className="text-xs font-medium text-slate-500">
                    Calculating shipping rates...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrderObjects.map((order, index) => {
                    const id = getId(order, index);
                    const rate = previewRates[id];

                    return (
                      <div
                        key={id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">
                            #{id} • {getCustomer(order)}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {getPickupCity(order)} → {getDeliveryCity(order)} •{" "}
                            {getTotalWeight(order)}
                          </div>
                        </div>

                        <span className="font-extrabold text-[#7451ff] text-sm shrink-0">
                          ₹{rate ? Number(rate.charge).toFixed(2) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">
                    Total Shipping Charge:
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Will be deducted from your wallet
                  </p>
                </div>

                <span className="text-xl font-black text-[#7451ff]">
                  ₹{previewLoading ? "..." : previewTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowShipPopup(false)}
                  disabled={shipping}
                  className="h-10.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmShipNow}
                  disabled={shipping || previewLoading || previewTotal <= 0}
                  className="flex-1 h-10.5 rounded-xl bg-[#7451ff] text-xs font-bold text-white shadow-xs active:scale-95 disabled:opacity-50 transition"
                >
                  {shipping ? "Processing..." : "Confirm & Ship Now →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Icon name="trash" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Orders
                </h3>
                <p className="text-xs text-slate-400">
                  Remove {deleteIds.length} order(s) permanently?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-rose-50/70 p-3 rounded-xl border border-rose-100">
              This action cannot be reversed. These processing shipments will be
              permanently discarded.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9.5 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="h-9.5 rounded-xl bg-rose-500 px-4 text-xs font-bold text-white shadow-xs active:scale-95 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessingOrders;