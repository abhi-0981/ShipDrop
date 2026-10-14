import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import api from "../../services/api";

import {
  DEFAULT_LABEL_SETTINGS,
  printShippingLabels,
  downloadShippingLabels,
} from "../../services/shippingLabelService";

const PRIMARY = "#0788ca";
const PRIMARY_DARK = "#0579b1";

const Icon = ({ name, size = 15 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "check")
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );

  if (name === "printer")
    return (
      <svg {...common}>
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
        <path d="M18 12h.01" />
      </svg>
    );

  if (name === "download")
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    );

  if (name === "upload")
    return (
      <svg {...common}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    );

  if (name === "x")
    return (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );

  if (name === "eye")
    return (
      <svg {...common}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );

  if (name === "search")
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );

  if (name === "refresh")
    return (
      <svg {...common}>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </svg>
    );

  if (name === "box")
    return (
      <svg {...common}>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8" />
        <path d="M12 13v9" />
      </svg>
    );

  if (name === "location")
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );

  if (name === "file")
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h6" />
      </svg>
    );

  if (name === "copy")
    return (
      <svg {...common}>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      </svg>
    );

  if (name === "alert")
    return (
      <svg {...common}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      </svg>
    );

  if (name === "more")
    return (
      <svg {...common}>
        <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      </svg>
    );

  return null;
};

/* ============================================================
   BASIC HELPERS
============================================================ */

const getUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    return user?.id || user?.user_id || user?.userId || null;
  } catch {
    return null;
  }
};

const text = (value, fallback = "—") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getAWB = (order) => text(order.awb || order.waybill, "AWB unavailable");

const getOrderId = (order) =>
  text(
    order.display_order_id ||
      order.order_id ||
      order.orderId ||
      order.order_number ||
      order.id,
  );

const getCustomerName = (order) =>
  text(
    order.consignee_name || order.customer_name || order.customer || order.name,
  );

const getMobile = (order) =>
  text(
    order.mobile ||
      order.phone ||
      order.customer_mobile ||
      order.consignee_phone ||
      order.buyer_mobile,
    "",
  );

const getShipmentName = (order) =>
  text(
    order.product_name || order.products?.[0]?.product_name || order.shipment,
    "Shipment",
  );

const getPickupId = (order) =>
  text(order.pickup_id || order.pickup_request_id, "—");

const getPickupCity = (order) =>
  text(order.pickup_city || order.pickupCity || order.origin_city, "Pickup");

const getPickupPincode = (order) =>
  text(order.pickup_pincode || order.pickupPincode || order.origin_pincode, "");

const getDeliveryCity = (order) =>
  text(order.city || order.delivery_city || order.destination_city, "Delivery");

const getDeliveryPincode = (order) =>
  text(
    order.pincode || order.delivery_pincode || order.destination_pincode,
    "",
  );

const getServiceType = (order) =>
  String(order.service_type || order.serviceType || "ROAD").toUpperCase();

const getTrackingStatus = (order) =>
  String(
    order?.tracking_status ||
      order?.order_status ||
      order?.status ||
      "MANIFESTED",
  )
    .trim()
    .toUpperCase();

const getStatusBadgeClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "MANIFESTED":
      return "bg-blue-50 text-blue-600";
    case "NOT PICKED":
      return "bg-orange-50 text-orange-600";
    case "IN TRANSIT":
      return "bg-violet-50 text-violet-600";
    case "OUT FOR DELIVERY":
      return "bg-cyan-50 text-cyan-600";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-600";
    case "RTO IN TRANSIT":
      return "bg-rose-50 text-rose-600";
    case "RTO DELIVERED":
      return "bg-red-50 text-red-600";
    case "RETURNED":
      return "bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "bg-red-50 text-red-600";
    case "PENDING":
      return "bg-yellow-50 text-yellow-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPaymentType = (order) =>
  String(order.payment_type || order.paymentType || "PREPAID").toUpperCase();

const getWeight = (order) => {
  const packageWeight =
    order.packages?.reduce(
      (total, pkg) =>
        total + (Number(pkg.weight) || 0) * (Number(pkg.package_count) || 1),
      0,
    ) || 0;

  return (
    Number(
      order.total_weight ??
        order.weight ??
        order.package_weight ??
        packageWeight,
    ) || 0
  );
};

const getVolumetricWeight = (order) => {
  const packages = Array.isArray(order?.packages) ? order.packages : [];

  const total = packages.reduce((sum, pkg) => {
    const count = Number(pkg?.package_count) || 1;
    const supplied = Number(pkg?.volumetric_weight);
    const volumetric =
      Number.isFinite(supplied) && supplied > 0
        ? supplied
        : Number(
            (
              ((Number(pkg?.length) || 0) *
                (Number(pkg?.width) || 0) *
                (Number(pkg?.height) || 0)) /
              5000
            ).toFixed(2),
          );

    return sum + volumetric * count;
  }, 0);

  const orderValue = Number(
    order?.volumetric_weight ?? order?.vol_weight ?? order?.volumetricWeight,
  );

  return Number.isFinite(orderValue) && orderValue > 0 ? orderValue : total;
};

const getDistance = (order) => {
  const d = Number(order?.distance ?? order?.distance_km ?? 0);
  return Number.isFinite(d) ? d : 0;
};

const getCreatedAt = (order) =>
  order.manifest_created_at ||
  order.created_at ||
  order.manifestCreatedAt ||
  order.createdAt ||
  null;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSelectedKey = (order) =>
  order.manifest_id || order.id || order.order_id;

/* ============================================================
   COMPONENT
============================================================ */

function Manifested() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [labelSettings, setLabelSettings] = useState(DEFAULT_LABEL_SETTINGS);
  const [labelSettingsLoading, setLabelSettingsLoading] = useState(true);
  const [customLogo, setCustomLogo] = useState(null);

  /* ==========================================================
     FETCH MANIFESTED
  ========================================================== */

  const fetchManifestedOrders = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("User session not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/manifests", {
        params: {
          user_id: userId,
        },
      });

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to fetch manifested orders");
      }

      setOrders(Array.isArray(data.manifests) ? data.manifests : []);
      setSelectedIds([]);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load manifested orders",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     FETCH LABEL SETTINGS
  ========================================================== */

  const fetchLabelSettings = async () => {
    const userId = getUserId();
    if (!userId) {
      setLabelSettingsLoading(false);
      return;
    }

    try {
      setLabelSettingsLoading(true);

      const response = await api.get("/label-settings", {
        params: {
          user_id: userId,
        },
      });

      if (response.data?.success && response.data?.settings) {
        const data = response.data.settings;

        setLabelSettings({
          orderValue: Boolean(data.order_value),
          codAmount: Boolean(data.cod_amount),
          buyerMobile: Boolean(data.buyer_mobile),
          shipperMobiles: Boolean(data.shipper_mobiles),
          shipperAddress: Boolean(data.shipper_address),
          productName: Boolean(data.product_name),
          servicesTnc: Boolean(data.services_tnc),
          orderId: Boolean(data.order_id),
          orderWeight: Boolean(data.order_weight),
          labelSize: data.label_size || "4x6",
        });

        setCustomLogo(data.custom_logo || null);
      }
    } catch {
      // ignore
    } finally {
      setLabelSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifestedOrders();
    fetchLabelSettings();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* ==========================================================
     MANIFESTED COUNT
  ========================================================== */

  const manifestedCount = useMemo(() => {
    return orders.filter((order) => getTrackingStatus(order) === "MANIFESTED")
      .length;
  }, [orders]);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const searchable = [
        getCustomerName(order),
        getMobile(order),
        getAWB(order),
        getOrderId(order),
        getShipmentName(order),
        getPickupCity(order),
        getDeliveryCity(order),
      ]
        .join(" ")
        .toLowerCase();

      const status = getTrackingStatus(order);
      const payment = getPaymentType(order);
      const service = getServiceType(order);

      return (
        status === "MANIFESTED" &&
        (!q || searchable.includes(q)) &&
        (statusFilter === "ALL" || status === statusFilter) &&
        (paymentFilter === "ALL" || payment === paymentFilter) &&
        (serviceFilter === "ALL" || service === serviceFilter)
      );
    });
  }, [orders, search, statusFilter, paymentFilter, serviceFilter]);

  /* ==========================================================
     SELECTION
  ========================================================== */

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(getSelectedKey(order))),
    [orders, selectedIds],
  );

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedIds.includes(getSelectedKey(order)),
    );

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visibleKeys = new Set(filteredOrders.map(getSelectedKey));
      setSelectedIds((prev) => prev.filter((id) => !visibleKeys.has(id)));
      return;
    }

    setSelectedIds((prev) => [
      ...new Set([...prev, ...filteredOrders.map(getSelectedKey)]),
    ]);
  };

  const toggleOne = (order) => {
    const id = getSelectedKey(order);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /* ==========================================================
     SHIPPING LABELS
  ========================================================== */

  const handlePrintLabels = async () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    if (labelSettingsLoading) {
      toast.error("Label settings are still loading");
      return;
    }

    try {
      setActionLoading(true);

      await printShippingLabels(
        selectedOrders,
        labelSettings,
        customLogo,
        "ShipDrop Shipping Labels",
      );

      toast.success(
        `${selectedOrders.length} ${selectedOrders.length === 1 ? "label" : "labels"} ready to print`,
      );
    } catch (error) {
      toast.error(error.message || "Unable to print labels");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintSingle = async (order) => {
    if (labelSettingsLoading) {
      toast.error("Label settings are still loading");
      return;
    }

    try {
      setActionLoading(true);

      await printShippingLabels(
        [order],
        labelSettings,
        customLogo,
        "ShipDrop Shipping Label",
      );

      toast.success("1 label ready to print");
    } catch (error) {
      toast.error(error.message || "Unable to print label");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadLabels = async () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    if (labelSettingsLoading) {
      toast.error("Label settings are still loading");
      return;
    }

    try {
      setActionLoading(true);

      await downloadShippingLabels(selectedOrders, labelSettings, customLogo);

      toast.success(
        `${selectedOrders.length} ${selectedOrders.length === 1 ? "label" : "labels"} downloaded`,
      );
    } catch (error) {
      toast.error(error.message || "Unable to download labels");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadSingle = async (order) => {
    if (labelSettingsLoading) {
      toast.error("Label settings are still loading");
      return;
    }

    try {
      setActionLoading(true);

      await downloadShippingLabels([order], labelSettings, customLogo);

      toast.success("1 label downloaded");
    } catch (error) {
      toast.error(error.message || "Unable to download label");
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     MANIFEST PRINT
  ========================================================== */

  const handlePrintManifests = () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    const builder = (order) => `
      <div
        style="
          font-family:Arial,sans-serif;
          width:760px;
          margin:0 auto 24px;
          padding:28px;
          border:1px solid #dbe3ef;
          border-radius:10px;
          page-break-after:always;
          color:#172033;
        "
      >
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            border-bottom:2px solid ${PRIMARY};
            padding-bottom:14px;
            margin-bottom:18px;
          "
        >
          <div>
            <div
              style="
                font-size:20px;
                font-weight:700;
                color:${PRIMARY};
              "
            >
              ShipDrop
            </div>

            <div
              style="
                font-size:12px;
                color:#718096;
                margin-top:4px;
              "
            >
              Shipment Manifest
            </div>
          </div>

          <div
            style="
              font-size:12px;
              font-weight:700;
            "
          >
            AWB ${escapeHtml(getAWB(order))}
          </div>
        </div>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            font-size:12px;
          "
        >
          <tr>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">
              Order ID
            </td>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;font-weight:700">
              #${escapeHtml(getOrderId(order))}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">
              Customer
            </td>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;font-weight:700">
              ${escapeHtml(getCustomerName(order))}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">
              Route
            </td>
            <td style="padding:8px;border-bottom:1px solid #edf1f6">
              ${escapeHtml(getPickupCity(order))}
              (${escapeHtml(getPickupPincode(order))})
              →
              ${escapeHtml(getDeliveryCity(order))}
              (${escapeHtml(getDeliveryPincode(order))})
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">
              Payment
            </td>
            <td style="padding:8px;border-bottom:1px solid #edf1f6">
              ${escapeHtml(getPaymentType(order))}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;color:#718096">
              Weight
            </td>
            <td style="padding:8px;font-weight:700">
              ${getWeight(order).toFixed(2)} Kg
            </td>
          </tr>
        </table>
      </div>
    `;

    const html = selectedOrders.map(builder).join("");
    const win = window.open("", "_blank", "width=900,height=700");

    if (!win) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Shipment Manifests</title>
        </head>
        <body style="margin:30px; background:white;">
          ${html}
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  /* ==========================================================
     CANCEL
  ========================================================== */

  const openCancelConfirmation = () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    setShowCancelConfirm(true);
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    const userId = getUserId();

    if (!userId) {
      toast.error("User session not found");
      return;
    }

    try {
      setActionLoading(true);

      const orderIds = selectedOrders
        .map((order) => Number(order.order_id || order.id))
        .filter(Boolean);

      const response = await api.post("/manifests/cancel", {
        user_id: userId,
        order_ids: orderIds,
      });

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Unable to cancel shipments");
      }

      const walletBalance = Number(
        data.wallet_balance ?? data.balance ?? data.new_balance,
      );

      if (Number.isFinite(walletBalance)) {
        window.dispatchEvent(
          new CustomEvent("walletUpdated", {
            detail: {
              balance: walletBalance,
            },
          }),
        );
      } else {
        window.dispatchEvent(new Event("walletUpdated"));
      }

      const refundAmount = Number(
        data.refund_amount ?? data.refunded_amount ?? data.refund ?? 0,
      );

      if (refundAmount > 0) {
        toast.success(
          `${
            orderIds.length === 1 ? "Shipment" : "Shipments"
          } cancelled successfully. ₹${refundAmount.toFixed(
            2,
          )} has been refunded to your wallet.`,
          {
            duration: 4500,
          },
        );
      } else {
        toast.success(
          data.message ||
            `${
              orderIds.length === 1 ? "Shipment" : "Shipments"
            } cancelled successfully`,
          {
            duration: 4000,
          },
        );
      }

      await fetchManifestedOrders();
      window.dispatchEvent(new Event("orderStatusUpdated"));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to cancel shipments",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     DUPLICATE ORDER
  ========================================================== */

  const handleDuplicate = async (order) => {
    const userId = getUserId();

    if (!userId) {
      toast.error("User session not found");
      return;
    }

    const orderId = Number(order?.order_id || order?.id || order?.orderId || 0);

    if (!orderId) {
      toast.error("Unable to identify this order");
      return;
    }

    try {
      setActionLoading(true);

      const response = await api.get(`/orders/${orderId}?user_id=${userId}`);
      const result = response?.data;

      if (!result?.success || !result?.order) {
        throw new Error(result?.message || "Unable to load order details");
      }

      const source = result.order;
      const warehouseId = Number(
        source?.warehouse_id || order?.warehouse_id || 0,
      );

      if (!warehouseId) {
        throw new Error("Pickup warehouse is missing");
      }

      const payload = {
        user_id: Number(userId),
        pickup_address: source?.pickup_address || order?.pickup_address || null,
        pickup_pincode: source?.pickup_pincode || order?.pickup_pincode || null,
        pickup_city: source?.pickup_city || order?.pickup_city || null,
        warehouse_id: warehouseId,
        pickup_address_id:
          source?.pickup_address_id || order?.pickup_address_id || null,
        orderData: {
          consignee_name: source?.consignee_name || source?.customer_name || "",
          mobile: source?.mobile || source?.phone || "",
          alternate_mobile: source?.alternate_mobile || null,
          email: source?.email || null,
          gstin: source?.gstin || null,
          company_name: source?.company_name || null,
          floor_no: source?.floor_no || null,
          landmark: source?.landmark || null,
          address_line1:
            source?.address_line1 || source?.delivery_address || "",
          address_line2: source?.address_line2 || null,
          pincode: source?.pincode || source?.delivery_pincode || "",
          city: source?.city || source?.delivery_city || "",
          state: source?.state || source?.delivery_state || "",
          country: source?.country || "India",
          payment_type: source?.payment_type || "Prepaid",
          risk_type: source?.risk_type || "Owner Risk",
          warehouse_id: warehouseId,
        },
        products: Array.isArray(source?.products) ? source.products : [],
        packages: Array.isArray(source?.packages) ? source.packages : [],
      };

      const createResponse = await api.post("/orders/create", payload);
      const createResult = createResponse?.data;

      if (!createResult?.success || !createResult?.order_id) {
        throw new Error(createResult?.message || "Unable to duplicate order");
      }

      toast.success(
        `Order duplicated successfully. New order #${createResult.order_id} is in Processing.`,
        { duration: 4500 },
      );

      await fetchManifestedOrders();
      window.dispatchEvent(new Event("orderStatusUpdated"));
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to duplicate order",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ==========================================================
     EXPORT
  ========================================================== */

  const handleExport = () => {
    if (!orders.length) {
      toast.error("No manifested orders to export");
      return;
    }

    const exportOrders = selectedOrders.length ? selectedOrders : orders;

    const headers = [
      "AWB",
      "Order ID",
      "Customer",
      "Mobile",
      "Pickup ID",
      "Shipment",
      "Service Type",
      "From",
      "To",
      "Payment",
      "Weight (Kg)",
      "Shipping Charge",
      "Created",
      "Status",
    ];

    const rows = exportOrders.map((order) => [
      getAWB(order),
      getOrderId(order),
      getCustomerName(order),
      getMobile(order),
      getPickupId(order),
      getShipmentName(order),
      getServiceType(order),
      getPickupCity(order),
      getDeliveryCity(order),
      getPaymentType(order),
      getWeight(order).toFixed(2),
      Number(order.shipping_charge || 0).toFixed(2),
      getCreatedAt(order) || "",
      order.order_status || order.status || "MANIFESTED",
    ]);

    const escapeCsv = (value) => {
      const s = String(value ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `shipdrop-manifest-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(
      `${exportOrders.length} ${
        exportOrders.length === 1 ? "shipment" : "shipments"
      } exported`,
    );
  };

  /* ==========================================================
     COPY HELPER
  ========================================================== */

  const copyAWB = async (awb) => {
    if (!awb || awb === "AWB unavailable") {
      toast.error("AWB not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(String(awb));
      toast.success("AWB copied to clipboard");
    } catch {
      toast.error("Unable to copy AWB");
    }
  };

  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] p-3 sm:p-5">
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-3 h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="mb-3 h-14 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-3 sm:p-5 pb-24 lg:pb-8">
      <div className="mx-auto max-w-[1450px]">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:px-5 sm:py-4 shadow-2xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf8ff]"
                style={{ color: PRIMARY }}
              >
                <Icon name="box" size={20} />
              </div>

              <div>
                <h1 className="text-base sm:text-[17px] font-bold tracking-tight text-slate-900">
                  Manifested Shipments
                </h1>

                <p className="mt-0.5 text-xs text-slate-400">
                  {manifestedCount}{" "}
                  {manifestedCount === 1 ? "shipment" : "shipments"} ready for
                  pickup
                </p>
              </div>
            </div>

            {/* TOP ACTIONS */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintLabels}
                disabled={actionLoading || !selectedOrders.length}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-2xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: PRIMARY }}
              >
                <Icon name="printer" />
                <span className="truncate">Print Label</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadLabels}
                disabled={actionLoading || !selectedOrders.length}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-2xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: PRIMARY_DARK }}
              >
                <Icon name="download" />
                <span className="truncate">Download</span>
              </button>

              <button
                type="button"
                onClick={handlePrintManifests}
                disabled={actionLoading || !selectedOrders.length}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-white shadow-2xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: PRIMARY }}
              >
                <Icon name="file" />
                <span className="truncate">Manifests</span>
              </button>

              <button
                type="button"
                onClick={openCancelConfirmation}
                disabled={actionLoading || !selectedOrders.length}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Icon name="x" />
                <span className="truncate">Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={!orders.length}
                className="col-span-2 sm:col-span-1 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Icon name="upload" />
                <span className="truncate">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}
        <div className="mb-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={15} />
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, AWB, Order ID or mobile..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#0788ca] focus:bg-white focus:ring-2 focus:ring-[#0788ca]/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-10 flex-1 sm:w-36 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#0788ca]"
              >
                <option value="ALL">All Services</option>
                <option value="ROAD">Road</option>
                <option value="AIR">Air</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-10 flex-1 sm:w-36 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[#0788ca]"
              >
                <option value="ALL">All Payment</option>
                <option value="PREPAID">Prepaid</option>
                <option value="COD">COD</option>
              </select>

              <button
                type="button"
                onClick={fetchManifestedOrders}
                disabled={loading}
                title="Refresh"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <Icon name="refresh" size={15} />
              </button>
            </div>
          </div>

          {/* MOBILE SELECT ALL BAR */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:hidden text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex h-4 w-4 items-center justify-center rounded border transition"
                  style={
                    allVisibleSelected
                      ? {
                          borderColor: PRIMARY,
                          background: PRIMARY,
                          color: "white",
                        }
                      : {
                          borderColor: "#cbd5e1",
                          background: "white",
                          color: "transparent",
                        }
                  }
                >
                  <Icon name="check" size={11} />
                </button>
                <span>Select Visible ({filteredOrders.length})</span>
              </label>

              {selectedIds.length > 0 && (
                <span className="text-[11px] font-bold text-[#0788ca]">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            1. MOBILE VIEW: TOUCH-FRIENDLY APP CARDS (WITH 1-TAP COPY)
        ===================================================== */}
        <div className="space-y-2.5 sm:hidden">
          {!filteredOrders.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon name="box" size={20} />
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                {orders.length
                  ? "No matching shipments"
                  : "No manifested shipments"}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                {orders.length
                  ? "Try changing your search or filters."
                  : "Orders will appear here after confirmation."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const key = getSelectedKey(order);
              const selected = selectedIds.includes(key);
              const service = getServiceType(order);
              const payment = getPaymentType(order);
              const created = getCreatedAt(order);
              const awb = getAWB(order);

              return (
                <div
                  key={key}
                  className={`rounded-2xl border bg-white p-3.5 space-y-2.5 shadow-2xs transition ${
                    selected
                      ? "border-[#0788ca] ring-2 ring-[#0788ca]/10"
                      : "border-slate-200/90"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleOne(order)}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition"
                        style={
                          selected
                            ? {
                                borderColor: PRIMARY,
                                background: PRIMARY,
                                color: "white",
                              }
                            : {
                                borderColor: "#cbd5e1",
                                background: "white",
                                color: "transparent",
                              }
                        }
                      >
                        <Icon name="check" size={11} />
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-800 truncate">
                        #{getOrderId(order)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${
                          payment === "COD"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {payment}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[9.5px] font-bold ${getStatusBadgeClass(
                          getTrackingStatus(order),
                        )}`}
                      >
                        {getTrackingStatus(order)}
                      </span>
                    </div>
                  </div>

                  {/* CUSTOMER & AWB BAR WITH 1-TAP COPY */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">
                        {getCustomerName(order)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {getMobile(order)}
                      </span>
                    </div>

                    {/* AWB + COPY BUTTON DOCK */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-sans text-[10px] text-slate-400 font-semibold uppercase">
                          AWB:
                        </span>
                        <span className="truncate font-semibold text-slate-800">
                          {awb}
                        </span>
                      </div>

                      {awb && awb !== "AWB unavailable" && (
                        <button
                          type="button"
                          onClick={() => copyAWB(awb)}
                          className="flex items-center gap-1 rounded-md bg-[#0788ca]/10 px-2 py-0.5 text-[10px] font-bold text-[#0788ca] active:scale-95 transition shrink-0"
                          title="Copy AWB"
                        >
                          <Icon name="copy" size={12} />
                          <span>Copy</span>
                        </button>
                      )}
                    </div>

                    {/* ROUTE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[125px]">
                        {getPickupCity(order)} ({getPickupPincode(order)})
                      </span>
                      <span className="text-slate-300 font-bold px-1">→</span>
                      <span className="truncate max-w-[125px] text-right">
                        {getDeliveryCity(order)} ({getDeliveryPincode(order)})
                      </span>
                    </div>

                    {/* SPECS & CHARGE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50 pt-1.5">
                      <span>
                        {service === "AIR" ? "By Air" : "By Surface"} •{" "}
                        {getWeight(order).toFixed(2)} Kg
                      </span>
                      <span className="font-bold text-slate-800">
                        ₹{Number(order.shipping_charge || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                    <span>
                      {formatDate(created)} {formatTime(created)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintSingle(order)}
                        disabled={actionLoading}
                        title="Print Label"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition active:scale-95 disabled:opacity-50 shadow-2xs"
                        style={{ background: PRIMARY }}
                      >
                        <Icon name="printer" size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(order)}
                        disabled={actionLoading}
                        title="Download Label"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition active:scale-95 disabled:opacity-50 shadow-2xs"
                        style={{ background: PRIMARY_DARK }}
                      >
                        <Icon name="download" size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingOrder(order)}
                        className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                      >
                        <Icon name="eye" size={13} />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* MOBILE FOOTER COUNTER */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-[11px] text-slate-500 shadow-2xs">
              <span>
                Showing <strong>{filteredOrders.length}</strong> of{" "}
                <strong>{manifestedCount}</strong> manifested
              </span>
              {selectedIds.length > 0 && (
                <span className="font-bold text-[#0788ca]">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            2. DESKTOP & TABLET VIEW: STRUCTURED DATA TABLE
        ===================================================== */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="w-full min-w-0">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="w-[4%] px-4 py-3.5 text-left">
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border"
                      style={
                        allVisibleSelected
                          ? {
                              borderColor: PRIMARY,
                              background: PRIMARY,
                              color: "white",
                            }
                          : {
                              borderColor: "#cbd5e1",
                              background: "white",
                              color: "transparent",
                            }
                      }
                    >
                      <Icon name="check" size={11} />
                    </button>
                  </th>

                  <th className="w-[17%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Customer
                  </th>

                  <th className="w-[15%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Shipment
                  </th>

                  <th className="w-[15%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Route
                  </th>

                  <th className="w-[12%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Payment
                  </th>

                  <th className="w-[12%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Weight
                  </th>

                  <th className="w-[13%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Created
                  </th>

                  <th className="w-[12%] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {!filteredOrders.length ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Icon name="box" size={21} />
                        </div>

                        <h3 className="text-[14px] font-semibold text-slate-800">
                          {orders.length
                            ? "No matching shipments"
                            : "No manifested shipments"}
                        </h3>

                        <p className="mt-1 text-[12px] text-slate-400">
                          {orders.length
                            ? "Try changing the search or filters."
                            : "Orders will appear here after successful shipment confirmation."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const key = getSelectedKey(order);
                    const selected = selectedIds.includes(key);
                    const service = getServiceType(order);
                    const payment = getPaymentType(order);
                    const created = getCreatedAt(order);

                    return (
                      <tr
                        key={key}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          selected
                            ? "bg-[#f7fcff]"
                            : "bg-white hover:bg-[#fcfdff]"
                        }`}
                      >
                        <td className="px-4 py-4 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleOne(order)}
                            className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border"
                            style={
                              selected
                                ? {
                                    borderColor: PRIMARY,
                                    background: PRIMARY,
                                    color: "white",
                                  }
                                : {
                                    borderColor: "#cbd5e1",
                                    background: "white",
                                    color: "transparent",
                                  }
                            }
                          >
                            <Icon name="check" size={11} />
                          </button>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="min-w-0 break-words">
                            <div className="text-[13px] font-medium leading-5 text-slate-800">
                              {getCustomerName(order)}
                            </div>

                            {getMobile(order) && (
                              <div className="text-[11px] leading-4 text-slate-400">
                                {getMobile(order)}
                              </div>
                            )}

                            <span
                              className={`-ml-1 mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium leading-none ${getStatusBadgeClass(
                                getTrackingStatus(order),
                              )}`}
                            >
                              {getTrackingStatus(order)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="min-w-0 break-words">
                            <div className="text-[13px] font-semibold leading-5 text-slate-800">
                              {getAWB(order)}
                            </div>

                            <div className="text-[11px] leading-4 text-slate-500">
                              Pickup ID: {getPickupId(order)}
                            </div>

                            <div className="text-[11px] leading-4 text-slate-500">
                              {getShipmentName(order)} ·{" "}
                              {service === "AIR" ? "By Air" : "By Surface"}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="min-w-0 break-words">
                            <div className="flex items-center gap-2">
                              <span
                                className="mt-[1px]"
                                style={{ color: PRIMARY }}
                              >
                                <Icon name="location" size={12} />
                              </span>

                              <div className="text-[12px] font-medium leading-4 text-slate-700">
                                {getPickupCity(order)}{" "}
                                <span className="font-normal text-slate-400">
                                  ({getPickupPincode(order)})
                                </span>
                              </div>
                            </div>

                            <div className="ml-[5px] h-2 border-l border-dashed border-slate-300" />

                            <div className="flex items-center gap-2">
                              <span className="mt-[1px] text-slate-400">
                                <Icon name="location" size={12} />
                              </span>

                              <div className="text-[12px] font-medium leading-4 text-slate-700">
                                {getDeliveryCity(order)}{" "}
                                <span className="font-normal text-slate-400">
                                  ({getDeliveryPincode(order)})
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div
                            className="text-[12px] font-semibold"
                            style={{
                              color: payment === "COD" ? "#dc2626" : PRIMARY,
                            }}
                          >
                            {payment}
                          </div>

                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {payment === "COD" ? "Cash on Delivery" : "Prepaid"}
                          </div>

                          <div className="text-[10px] text-slate-500">
                            Total: ₹
                            {Number(order.shipping_charge || 0).toFixed(2)}
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="text-[12px] font-medium text-slate-700">
                            Box:{" "}
                            {Number(
                              order.packages?.reduce(
                                (t, p) => t + (Number(p.package_count) || 1),
                                0,
                              ) || 1,
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500">
                            Wt: {getWeight(order).toFixed(2)} kg
                          </div>

                          <div className="text-[10px] text-slate-400">
                            Vol: {getVolumetricWeight(order).toFixed(2)} kg
                          </div>
                        </td>

                        <td className="px-3 py-4 align-middle">
                          <div className="text-[11px] font-medium text-slate-700">
                            #{getOrderId(order)}
                          </div>

                          <div className="text-[10px] leading-4 text-slate-400">
                            Manifested: {formatDate(created)}{" "}
                            {formatTime(created)}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-2 py-4 align-middle">
                          <div className="flex items-center justify-start gap-1">
                            <button
                              type="button"
                              onClick={() => handlePrintSingle(order)}
                              disabled={actionLoading}
                              title="Print Shipping Label"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ background: PRIMARY }}
                            >
                              <Icon name="printer" size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(order)}
                              disabled={actionLoading}
                              title="Download Shipping Label"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ background: PRIMARY_DARK }}
                            >
                              <Icon name="download" size={13} />
                            </button>

                            <div ref={actionMenuRef} className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenActionMenuId((previous) =>
                                    previous === key ? null : key,
                                  )
                                }
                                title="More Actions"
                                aria-label="More Actions"
                                aria-expanded={openActionMenuId === key}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#0788ca] hover:bg-[#edf8ff] hover:text-[#0788ca]"
                              >
                                <Icon name="more" size={15} />
                              </button>

                              {openActionMenuId === key && (
                                <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setViewingOrder(order);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Icon name="eye" size={15} />
                                    Details
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDuplicate(order);
                                    }}
                                    disabled={actionLoading}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    <Icon name="copy" size={15} />
                                    Duplicate Order
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex min-h-[45px] items-center justify-between border-t border-slate-100 bg-[#fcfdff] px-5">
            <div className="text-[11px] text-slate-400">
              Showing{" "}
              <span className="font-medium text-slate-600">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-600">
                {manifestedCount}
              </span>{" "}
              manifested shipments
            </div>

            {selectedIds.length > 0 && (
              <div className="text-[11px] text-slate-400">
                <span
                  className="font-semibold"
                  style={{ color: PRIMARY }}
                >
                  {selectedIds.length}
                </span>{" "}
                selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================
          CANCEL MODAL
      ======================================================= */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setShowCancelConfirm(false);
            }
          }}
        >
          <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-6 pb-5 pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <Icon name="x" size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold tracking-[-0.2px] text-slate-900">
                    Cancel Shipment
                    {selectedOrders.length === 1 ? "" : "s"}
                  </h2>

                  <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                    Are you sure you want to cancel{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedOrders.length}{" "}
                      {selectedOrders.length === 1
                        ? "selected shipment"
                        : "selected shipments"}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-red-500">
                    <Icon name="box" size={15} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-red-700">
                      Cancellation & Refund
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-red-600/80">
                      The selected shipment
                      {selectedOrders.length === 1 ? "" : "s"} will be
                      cancelled. Any applicable shipping charge will be refunded
                      to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={actionLoading}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Shipment
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-4 text-[12px] font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="x" size={14} />
                {actionLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          VIEW MODAL (RESPONSIVE)
      ======================================================= */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/45 p-0 sm:p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setViewingOrder(null);
            }
          }}
        >
          <div className="w-full max-w-[650px] max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Shipment Details
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  AWB:{" "}
                  <span
                    className="font-semibold font-mono"
                    style={{ color: PRIMARY }}
                  >
                    {getAWB(viewingOrder)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  ["Order ID", `#${getOrderId(viewingOrder)}`],
                  ["Customer", getCustomerName(viewingOrder)],
                  ["Mobile", getMobile(viewingOrder)],
                  ["Pickup ID", getPickupId(viewingOrder)],
                  ["Payment", getPaymentType(viewingOrder)],
                  [
                    "Service",
                    getServiceType(viewingOrder) === "AIR"
                      ? "By Air"
                      : "By Surface",
                  ],
                  ["Weight", `${getWeight(viewingOrder).toFixed(2)} Kg`],
                  ["Distance", `${getDistance(viewingOrder).toFixed(0)} Km`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-slate-800">
                      {text(value)}
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Delivery Address
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-700 font-medium">
                    {[
                      viewingOrder.address_line1,
                      viewingOrder.address_line2,
                      viewingOrder.city,
                      viewingOrder.state,
                      viewingOrder.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-3.5 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manifested;