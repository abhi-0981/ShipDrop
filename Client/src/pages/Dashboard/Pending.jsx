import React, { useEffect, useMemo, useState } from "react";

import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineFilter,
  HiOutlinePrinter,
  HiOutlineLocationMarker,
} from "react-icons/hi";

import toast from "react-hot-toast";

import api from "../../services/api";
import {
  notifyOrderChange,
  subscribeToOrderUpdates,
} from "../../services/orderEvents";
import OrderDetailsModal from "../../components/Common/OrderDetailsModal";
import {
  printShippingLabels,
  downloadShippingLabels,
} from "../../services/shippingLabelService";

/* =========================================================
   USER ID
========================================================= */

const getUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return user?.id ?? user?.user_id ?? user?.userId ?? null;
  } catch (error) {
    console.error("Unable to read user:", error);

    return null;
  }
};

/* =========================================================
   STATUS HELPERS
========================================================= */

const normalizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

  if (value === "NDR") {
    return "NDR";
  }

  if (value === "PENDING") {
    return "Pending";
  }

  if (value === "PROCESSING") {
    return "Processing";
  }

  if (value === "MANIFESTED") {
    return "Manifested";
  }

  if (value === "NOT PICKED") {
    return "Not Picked";
  }

  if (value === "IN TRANSIT") {
    return "In Transit";
  }

  if (value === "OUT FOR DELIVERY") {
    return "Out For Delivery";
  }

  if (value === "DELIVERED") {
    return "Delivered";
  }

  if (value === "RTO IN TRANSIT") {
    return "RTO In Transit";
  }

  if (value === "RTO DELIVERED") {
    return "RTO Delivered";
  }

  if (value === "RETURNED") {
    return "Returned";
  }

  if (value === "CANCELLED" || value === "CANCELED") {
    return "Cancelled";
  }

  return status ? String(status) : "Unknown";
};

/* =========================================================
   GET ACTUAL ORDER STATUS
========================================================= */

const getOrderStatus = (order) => {
  const trackingStatus = String(order?.tracking_status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

  /*
    NDR must have priority over normal order status.
  */

  if (trackingStatus === "NDR") {
    return "NDR";
  }

  const status =
    order?.status ?? order?.order_status ?? order?.tracking_status ?? "";

  return normalizeStatus(status);
};

/* =========================================================
   NDR / PENDING CHECK
========================================================= */

const isNdrOrPending = (order) => {
  const trackingStatus = String(order?.tracking_status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
  const orderStatus = String(order?.status || order?.order_status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
  return trackingStatus === "PENDING" || orderStatus === "PENDING";
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   VALUE
========================================================= */

const valueOrDash = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "-";
  }

  return String(value);
};

/* =========================================================
   ADDRESS
========================================================= */

const buildAddress = (...parts) => {
  return (
    parts
      .filter(
        (part) =>
          part !== undefined && part !== null && String(part).trim() !== "",
      )
      .map((part) => String(part).trim())
      .join(", ") || "-"
  );
};

/* =========================================================
   CHARGE
========================================================= */

const getCharge = (order) => {
  const candidates = [
    order?.charge,
    order?.shipping_charge,
    order?.shippingCharge,
    order?.final_rate,
    order?.finalRate,
    order?.manifest_shipping_charge,
    order?.manifestShippingCharge,
  ];

  for (const value of candidates) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
};

/* =========================================================
   SERVICE
========================================================= */

const getServiceType = (order) => {
  const raw = String(
    order?.service_type ||
      order?.serviceType ||
      order?.service ||
      order?.shipping_mode ||
      "",
  )
    .trim()
    .toUpperCase();

  if (raw.includes("AIR")) {
    return "BY AIR";
  }

  if (raw.includes("ROAD")) {
    return "BY ROAD";
  }

  return raw || "-";
};

/* =========================================================
   PAYMENT
========================================================= */

const getPaymentType = (order) => {
  return String(
    order?.payment_type || order?.paymentType || order?.payment || "-",
  )
    .trim()
    .toUpperCase();
};

/* =========================================================
   CUSTOMER
========================================================= */

const getCustomerName = (order) => {
  return (
    order?.customer_name ||
    order?.customer ||
    order?.customer_company ||
    order?.consignee_name ||
    "-"
  );
};

/* =========================================================
   AWB
========================================================= */

const getAWB = (order) => {
  return order?.awb || order?.waybill || order?.AWB || "-";
};

/* =========================================================
   ORDER ID
========================================================= */

const getOrderId = (order) => {
  return order?.order_id || order?.id || "-";
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const styles = {
    NDR: "bg-rose-50 text-rose-600 border-rose-100",

    Pending: "bg-amber-50 text-amber-600 border-amber-100",

    Processing: "bg-blue-50 text-blue-600 border-blue-100",

    Manifested: "bg-amber-50 text-amber-600 border-amber-200",

    "Not Picked": "bg-orange-50 text-orange-600 border-orange-100",

    "In Transit": "bg-indigo-50 text-indigo-600 border-indigo-100",

    "Out For Delivery": "bg-purple-50 text-purple-600 border-purple-100",

    Delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",

    "RTO In Transit": "bg-red-50 text-red-500 border-red-100",

    "RTO Delivered": "bg-red-50 text-red-600 border-red-100",

    Returned: "bg-orange-50 text-orange-600 border-orange-100",

    Cancelled: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        styles[status] || "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {status || "Unknown"}
    </span>
  );
};

/* =========================================================
   DETAIL ROW
========================================================= */

const DetailRow = ({ label, value, strong = false }) => {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
      <span className="shrink-0 text-[11px] font-medium text-slate-400">
        {label}
      </span>

      <span
        className={`min-w-0 text-right text-[11px] ${
          strong ? "font-semibold text-slate-700" : "font-medium text-slate-600"
        }`}
      >
        {valueOrDash(value)}
      </span>
    </div>
  );
};

/* =========================================================
   DETAIL CARD
========================================================= */

const DetailCard = ({ title, children }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-[12px] font-semibold text-slate-800">{title}</h3>

      {children}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Pending() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [serviceFilter, setServiceFilter] = useState("ALL");

  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState([]);

  const [viewingOrder, setViewingOrder] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);

  /* =======================================================
     FETCH USER ORDERS
  ======================================================= */

  const fetchOrders = async () => {
    const userId = getUserId();

    if (!userId) {
      setOrders([]);
      setLoading(false);
      setError("User ID is required");

      toast.error("User ID is required");

      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
        IMPORTANT:
        User Panel API only.
        No adminToken.
        No localhost:5001.
      */

      const response = await api.get("/orders/all", {
        params: {
          user_id: userId,
          status: "PENDING",
          include_tracking: false,
        },
      });

      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to fetch orders");
      }

      const list = Array.isArray(data?.orders) ? data.orders : [];

      /*
        Keep only NDR/PENDING here.
        This means even if /orders/all
        returns every order, this page
        will only show NDR + Pending.
      */

      const filteredList = list.filter(
        (order) => getOrderStatus(order) === "Pending",
      );

      /*
        Remove duplicate rows
        caused by joins.
      */

      const uniqueOrders = Array.from(
        new Map(
          filteredList.map((order) => [
            String(order?.id ?? order?.order_id),
            order,
          ]),
        ).values(),
      );

      setOrders(uniqueOrders);

      setSelectedIds([]);
    } catch (err) {
      console.error("Get NDR/Pending orders error:", err);

      setOrders([]);

      const message =
        err?.response?.data?.message || err?.message || "Unable to load orders";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(() => {
      fetchOrders();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = getOrderStatus(order);

      const service = getServiceType(order);

      const payment = getPaymentType(order);

      const searchable = [
        getOrderId(order),
        order?.id,
        getAWB(order),
        getCustomerName(order),
        order?.user_id,
        order?.pickup_address_id,
        order?.pickup_city,
        order?.city,
        order?.state,
        order?.pincode,
        status,
        service,
        payment,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      const matchesStatus = status === "Pending";

      const matchesService =
        serviceFilter === "ALL" || service === serviceFilter;

      const matchesPayment =
        paymentFilter === "ALL" || payment === paymentFilter;

      return matchesSearch && matchesStatus && matchesService && matchesPayment;
    });
  }, [orders, search, statusFilter, serviceFilter, paymentFilter]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const ndrCount = useMemo(
    () => orders.filter((order) => getOrderStatus(order) === "NDR").length,
    [orders],
  );

  const pendingCount = useMemo(
    () => orders.filter((order) => getOrderStatus(order) === "Pending").length,
    [orders],
  );

  /* =======================================================
     SERVICES
  ======================================================= */

  const services = useMemo(() => {
    return [
      ...new Set(
        orders.map(getServiceType).filter((value) => value && value !== "-"),
      ),
    ];
  }, [orders]);

  /* =======================================================
     PAYMENT TYPES
  ======================================================= */

  const payments = useMemo(() => {
    const dynamicPayments = orders
      .map(getPaymentType)
      .filter((value) => value && value !== "-");

    return [
      "PREPAID",
      "COD",
      ...dynamicPayments.filter(
        (value) => value !== "PREPAID" && value !== "COD",
      ),
    ];
  }, [orders]);

  /* =======================================================
     SELECTED
  ======================================================= */

  const getOrderKey = (order) => String(order?.id ?? order?.order_id);

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(getOrderKey(order)));

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(getOrderKey(order))),
    [orders, selectedIds],
  );

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredOrders.map(getOrderKey);

      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    const visibleIds = filteredOrders.map(getOrderKey);

    setSelectedIds((previous) => [...new Set([...previous, ...visibleIds])]);
  };

  /* =======================================================
     SELECT ONE
  ======================================================= */

  const handleSelect = (order) => {
    const id = getOrderKey(order);

    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const handlePrintSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to print this label");
      return;
    }
    await printShippingLabels([order], "ParcelDrop Shipping Label");
  };

  const handleDownloadSingleLabel = async (order) => {
    if (!order) {
      toast.error("Unable to download this label");
      return;
    }
    await downloadShippingLabels([order]);
  };

  // Reuse the same detail loader and shared details modal as All Orders.
  const handleView = async (order) => {
    setViewingOrder(order);
    const orderId = order?.id ?? order?.order_id;
    const userId = getUserId();
    if (!orderId || !userId) return;

    setDetailLoading(true);
    try {
      const response = await api.get(`/orders/${orderId}`, {
        params: { user_id: userId },
      });
      if (response?.data?.success && response?.data?.order) {
        setViewingOrder((current) =>
          current &&
          String(current?.id ?? current?.order_id) === String(orderId)
            ? { ...current, ...response.data.order }
            : current,
        );
      }
    } catch (error) {
      console.error("Unable to load full order details:", error);
      toast.error(
        error?.response?.data?.message || "Unable to load order details",
      );
    } finally {
      setDetailLoading(false);
    }
  };

 
const triggerTracking = (awb) => {
  if (!awb || awb === "—" || awb === "-") return;

  window.dispatchEvent(
    new CustomEvent("shipdrop:openTracking", {
      detail: String(awb),
    })
  );
};


  const handleDuplicate = async (order) => {
    const orderId = order?.id;
    const userId = getUserId();
    if (!orderId || !userId)
      return toast.error("Unable to duplicate this order");
    try {
      const response = await api.get(`/orders/${orderId}`, {
        params: { user_id: userId },
      });
      const result = response?.data;
      if (!result?.success || !result?.order)
        throw new Error(result?.message || "Unable to load order details");
      const source = result.order;
      const warehouseId = Number(
        source?.warehouse_id ||
          source?.warehouse?.id ||
          order?.warehouse_id ||
          0,
      );
      if (!warehouseId) throw new Error("Pickup warehouse is missing");
      const payload = {
        user_id: Number(userId),
        pickup_address: source?.pickup_address || null,
        pickup_pincode: source?.pickup_pincode || null,
        pickup_city: source?.pickup_city || null,
        warehouse_id: warehouseId,
        pickup_address_id: source?.pickup_address_id || null,
        orderData: {
          consignee_name: source?.consignee_name || "",
          mobile: source?.mobile || "",
          alternate_mobile: source?.alternate_mobile || null,
          email: source?.email || null,
          gstin: source?.gstin || null,
          company_name: source?.company_name || null,
          floor_no: source?.floor_no || null,
          landmark: source?.landmark || null,
          address_line1: source?.address_line1 || "",
          address_line2: source?.address_line2 || null,
          pincode: source?.pincode || "",
          city: source?.city || "",
          state: source?.state || "",
          country: source?.country || "India",
          payment_type: source?.payment_type || "Prepaid",
          risk_type: source?.risk_type || "Owner Risk",
          warehouse_id: warehouseId,
          fragile_shipment: Number(source?.fragile_shipment) === 1 ? 1 : 0,
          dangerous_good: Number(source?.dangerous_good) === 1 ? 1 : 0,
        },
        products: Array.isArray(source?.products)
          ? source.products.map((product) => ({
              product_name: product?.product_name || "",
              sku: product?.sku || null,
              price: Number(product?.price) || 0,
              qty: Number(product?.qty) || 1,
              tax: Number(product?.tax) || 0,
            }))
          : [],
        packages: Array.isArray(source?.packages)
          ? source.packages.map((pkg) => ({
              length: Number(pkg?.length) || 0,
              width: Number(pkg?.width) || 0,
              height: Number(pkg?.height) || 0,
              weight: Number(pkg?.weight) || 0,
              package_count: Number(pkg?.package_count) || 1,
            }))
          : [],
      };
      const created = (await api.post("/orders/create", payload))?.data;
      if (!created?.success || !created?.order_id)
        throw new Error(created?.message || "Unable to duplicate order");
      toast.success(
        `Order duplicated successfully. New order #${created.order_id} is in Processing.`,
      );
      await fetchOrders();
      notifyOrderChange({ type: "created", orderId: created.order_id });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to duplicate order",
      );
    }
  };

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (text, label) => {
    if (!text || text === "-") {
      toast.error(`${label} not available`);

      return;
    }

    try {
      await navigator.clipboard.writeText(String(text));

      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setServiceFilter("ALL");
    setPaymentFilter("ALL");
    setSelectedIds([]);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-[#f8fafc] p-5">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-slate-800">
              Undelivered Orders
            </h1>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {orders.length}
            </span>
          </div>

          <p className="mt-1 text-[12px] text-slate-500">
            Manage undelivered orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-600">
              {selectedOrders.length} selected
            </div>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HiOutlineRefresh className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* =================================================
          SEARCH + FILTERS
      ================================================= */}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-2 lg:flex-row">
          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Order ID, AWB, Customer, UID or Pickup ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

         

          {/* PAYMENT */}

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="h-10 min-w-[135px] appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-medium text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Payment</option>

              {payments.map((payment) => (
                <option key={payment} value={payment}>
                  {payment}
                </option>
              ))}
            </select>

            <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400" />
          </div>

          <div className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-medium text-slate-400">
            <HiOutlineFilter />
            {filteredOrders.length} results
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div>
            <div className="text-[12px] font-semibold text-red-600">
              Unable to load orders
            </div>

            <div className="mt-0.5 text-[11px] text-red-500">{error}</div>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-[4%] px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAll}
                    disabled={filteredOrders.length === 0}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                  />
                </th>
                <th className="w-[17%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Customer
                </th>
                <th className="w-[17%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Shipment
                </th>
                <th className="w-[17%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Route
                </th>
                <th className="w-[11%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Payment
                </th>
                <th className="w-[10%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Weight
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                  Created
                </th>
                <th className="w-[12%] px-2 py-3 text-center text-[12px] font-medium text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
                    <div className="mt-3 text-[12px] font-medium text-slate-500">
                      Loading undelivered orders...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                      <HiOutlineSearch className="text-[21px]" />
                    </div>
                    <div className="mt-3 text-[13px] font-semibold text-slate-700">
                      No undelivered orders found
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Try changing your search or payment filter.
                    </div>
                    {(search || paymentFilter !== "ALL") && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 text-[11px] font-semibold text-[#008dd2] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderKey = getOrderKey(order);
                  const status = "Pending";
                  const payment = getPaymentType(order);
                  const pickupCity =
                    order?.pickup_city || order?.pickup_address_city || "-";
                  const pickupPin = order?.pickup_pincode || "";
                  const deliveryCity =
                    order?.city || order?.delivery_city || "-";
                  const deliveryPin =
                    order?.pincode || order?.delivery_pincode || "";
                  const packages = Array.isArray(order?.packages)
                    ? order.packages
                    : [];
                  const firstPackage = packages[0] || {};
                  const boxCount =
                    order?.package_count ??
                    firstPackage?.package_count ??
                    firstPackage?.count ??
                    1;
                  const weight =
                    order?.weight ??
                    order?.total_weight ??
                    firstPackage?.weight;
                  const length = order?.length ?? firstPackage?.length;
                  const width = order?.width ?? firstPackage?.width;
                  const height = order?.height ?? firstPackage?.height;
                  const volume =
                    order?.volumetric_weight ??
                    (length && width && height
                      ? (
                          (Number(length) * Number(width) * Number(height)) /
                          5000
                        ).toFixed(2)
                      : null);
                  const pickupId =
                    order?.pickup_request_id ||
                    order?.pickup_id ||
                    order?.pickup_address_id ||
                    "-";

                  console.log("PICKUP ID DEBUG:", {
                    pickup_request_id: order?.pickup_request_id,
                    pickup_id: order?.pickup_id,
                    pickup_address_id: order?.pickup_address_id,
                  });
                  const shipmentService = getServiceType(order);
                  const createdDate =
                    order?.manifest_created_at || order?.created_at;
                  return (
                    <tr
                      key={orderKey}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(orderKey)}
                          onChange={() => handleSelect(order)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                        />
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold text-slate-800">
                            {getCustomerName(order)}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {valueOrDash(order?.mobile || order?.phone)}
                          </div>
                          <span className=" inline-flex rounded-full bg-amber-50 p-0.5 text-[10px] font-medium text-amber-600">UNDELIVERED</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                       
<div className="flex min-w-0 items-center gap-1">
  <button
    type="button"
    onClick={() => triggerTracking(getAWB(order))}
    title="Track Shipment"
    className="min-w-0 truncate text-left text-[12px] font-semibold text-slate-800 hover:text-[#008dd2] "
  >
    {valueOrDash(getAWB(order))}
  </button>

  <button
    type="button"
    onClick={() => copyText(getAWB(order), "AWB")}
    title="Copy AWB"
    aria-label="Copy AWB"
    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-blue-50 hover:text-[#008dd2]"
  >
    <HiOutlineClipboardCopy className="text-[12px]" />
  </button>
</div>

                        <div className="mt-1 truncate text-[10px] text-slate-400">
                          Pickup ID: {valueOrDash(pickupId)}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {shipmentService === "-"
                            ? ""
                            : shipmentService.replace("BY ", "By ")}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="flex min-w-0 items-stretch gap-2">
                          <div className="flex w-3 shrink-0 flex-col items-center pt-0.5">
                            <HiOutlineLocationMarker className="text-[13px] text-[#008dd2]" />
                            <span className="my-0.5 h-3 border-l border-dashed border-slate-300" />
                            <HiOutlineLocationMarker className="text-[13px] text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-medium leading-5 text-slate-700">
                              {pickupCity}{" "}
                              <span className="text-slate-400">
                                {pickupPin ? `(${pickupPin})` : ""}
                              </span>
                            </div>
                            <div className="truncate text-[11px] font-medium leading-5 text-slate-700">
                              {deliveryCity}{" "}
                              <span className="text-slate-400">
                                {deliveryPin ? `(${deliveryPin})` : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="truncate text-[12px] font-semibold text-[#008dd2]">
                          {payment}
                        </div>
                        <div className="mt-1 truncate text-[10px] text-slate-400">
                          {payment === "COD" ? "Cash on Delivery" : "Prepaid"}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          Total: ₹{(getCharge(order) ?? 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="truncate text-[11px] font-medium text-slate-700">
                          Box: {valueOrDash(boxCount)}
                        </div>
                        <div className="mt-1 truncate text-[10px] text-slate-400">
                          Wt:{" "}
                          {weight !== undefined &&
                          weight !== null &&
                          weight !== ""
                            ? `${weight} kg`
                            : "-"}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          Vol:{" "}
                          {volume !== null &&
                          volume !== undefined &&
                          volume !== ""
                            ? `${volume} kg`
                            : "-"}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="truncate text-[12px] font-semibold text-slate-800">
                          #{getOrderId(order)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          Created: {formatDate(createdDate)}
                        </div>
                      </td>
                      <td className="px-2 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handlePrintSingleLabel(order)}
                            title="Print Shipping Label"
                            aria-label="Print Shipping Label"
                            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb]"
                          >
                            <HiOutlinePrinter className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(order)}
                            title="Duplicate Order"
                            aria-label="Duplicate Order"
                            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb]"
                          >
                            <HiOutlineClipboardCopy className="text-[16px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleView(order)}
                            title="View order details"
                            aria-label="View order details"
                            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] border border-slate-200 bg-white text-slate-600 transition hover:border-[#008dd2]/40 hover:bg-blue-50 hover:text-[#008dd2]"
                          >
                            <HiOutlineEye className="text-[16px]" />
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

      {/* =================================================
          MODAL
      ================================================= */}

      <OrderDetailsModal
        order={viewingOrder}
        loading={detailLoading}
        onClose={() => setViewingOrder(null)}
        onTrack={triggerTracking}
        onDownload={handleDownloadSingleLabel}
        onPrint={handlePrintSingleLabel}
      />
    </div>
  );
}

export default Pending;
