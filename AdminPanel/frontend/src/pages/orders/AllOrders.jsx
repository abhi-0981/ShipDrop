import React, { useEffect, useMemo, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineLocationMarker,
  HiOutlineTruck,
  HiOutlineX,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_CONFIG = {
  All: {
    label: "All Orders",
    color: "text-slate-700",
  },
  Processing: {
    label: "Processing",
    color: "text-blue-600",
  },
  Booked: {
    label: "Booked",
    color: "text-sky-600",
  },
  Manifested: {
    label: "Manifested",
    color: "text-amber-600",
  },
  "Not Picked": {
    label: "Not Picked",
    color: "text-orange-600",
  },
  "In Transit": {
    label: "In Transit",
    color: "text-indigo-600",
  },
  "Out For Delivery": {
    label: "Out For Delivery",
    color: "text-purple-600",
  },
  Delivered: {
    label: "Delivered",
    color: "text-emerald-600",
  },
  "RTO In Transit": {
    label: "RTO In Transit",
    color: "text-rose-500",
  },
  "RTO Delivered": {
    label: "RTO Delivered",
    color: "text-red-600",
  },
  Returned: {
    label: "Returned",
    color: "text-orange-600",
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-600",
  },
  Pending: {
    label: "Pending",
    color: "text-slate-500",
  },
  "NDR & Pending": {
    label: "NDR & Pending",
    color: "text-orange-600",
  },
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const styles = {
    Processing: "bg-blue-50 text-blue-700 border-blue-200/80",
    Booked: "bg-sky-50 text-sky-700 border-sky-200/80",
    Manifested: "bg-amber-50 text-amber-700 border-amber-200/80",
    "Not Picked": "bg-orange-50 text-orange-700 border-orange-200/80",
    "In Transit": "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    "Out For Delivery": "bg-purple-50 text-purple-700 border-purple-200/80",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    "RTO In Transit": "bg-rose-50 text-rose-700 border-rose-200/80",
    "RTO Delivered": "bg-red-50 text-red-700 border-red-200/80",
    Returned: "bg-orange-50 text-orange-700 border-orange-200/80",
    Cancelled: "bg-red-50 text-red-700 border-red-200/80",
    Pending: "bg-slate-100 text-slate-700 border-slate-200/80",
    NDR: "bg-orange-50 text-orange-700 border-orange-200/80",
  };

  const dotColors = {
    Processing: "bg-blue-500",
    Booked: "bg-sky-500",
    Manifested: "bg-amber-500",
    "Not Picked": "bg-orange-500",
    "In Transit": "bg-indigo-500",
    "Out For Delivery": "bg-purple-500",
    Delivered: "bg-emerald-500",
    "RTO In Transit": "bg-rose-500",
    "RTO Delivered": "bg-red-500",
    Returned: "bg-orange-500",
    Cancelled: "bg-red-500",
    Pending: "bg-slate-400",
    NDR: "bg-orange-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight shadow-2xs ${
        styles[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
          dotColors[status] || "bg-slate-400"
        }`}
      />
      <span>{status || "Unknown"}</span>
    </span>
  );
};

/* =========================================================
   NORMALIZE STATUS
========================================================= */

const normalizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

  if (value === "PROCESSING") return "Processing";
  if (value === "BOOKED") return "Booked";
  if (value === "MANIFESTED") return "Manifested";
  if (value === "NOT PICKED" || value === "NOT_PICKED") return "Not Picked";
  if (value === "IN TRANSIT") return "In Transit";
  if (value === "OUT FOR DELIVERY" || value === "OUT_FOR_DELIVERY")
    return "Out For Delivery";
  if (value === "DELIVERED") return "Delivered";
  if (value === "RTO IN TRANSIT" || value === "RTO_IN_TRANSIT")
    return "RTO In Transit";
  if (value === "RTO DELIVERED" || value === "RTO_DELIVERED")
    return "RTO Delivered";
  if (value === "RETURNED") return "Returned";
  if (value === "CANCELLED" || value === "CANCELED") return "Cancelled";
  if (value === "PENDING") return "Pending";
  if (value === "NDR") return "NDR";

  return status || "Unknown";
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (date) => {
  if (!date) return "-";
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
   CHARGE HELPER
========================================================= */

const getCharge = (order) => {
  const candidates = [
    order.charge,
    order.shipping_charge,
    order.shippingCharge,
    order.final_rate,
    order.finalRate,
    order.manifest_shipping_charge,
    order.manifestShippingCharge,
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
   DETAIL HELPERS
========================================================= */

const valueOrDash = (value) =>
  value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : "-";

const buildAddress = (...parts) =>
  parts
    .filter(
      (part) =>
        part !== undefined && part !== null && String(part).trim() !== "",
    )
    .map((part) => String(part).trim())
    .join(", ") || "-";

const DetailRow = ({ label, value, strong = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-1.5 last:border-b-0">
    <span className="shrink-0 text-[11px] font-medium text-slate-400">
      {label}
    </span>
    <span
      className={`min-w-0 text-right text-[11px] ${
        strong ? "font-semibold text-slate-800" : "font-medium text-slate-600"
      }`}
    >
      {valueOrDash(value)}
    </span>
  </div>
);

const DetailCard = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
    <h3 className="mb-2.5 text-[12px] font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

/* =========================================================
   ORDER DETAILS MODAL (RESPONSIVE)
========================================================= */

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const status =
    String(order?.tracking_status || "")
      .trim()
      .toUpperCase()
      .replace(/_/g, " ") === "NDR"
      ? "NDR"
      : normalizeStatus(
          order?.tracking_status || order?.status || order?.order_status,
        );

  const charge = getCharge(order);

  const serviceRaw = String(
    order.service_type || order.serviceType || order.service || "",
  )
    .trim()
    .toUpperCase();

  const serviceLabel = serviceRaw.includes("AIR")
    ? "By Air"
    : serviceRaw.includes("ROAD")
      ? "By Road"
      : valueOrDash(order.service_type || order.serviceType || order.service);

  const buyerAddress = buildAddress(
    order.address_line1,
    order.address_line2,
    order.floor_no ? `Floor ${order.floor_no}` : null,
    order.landmark ? `Landmark: ${order.landmark}` : null,
    order.city,
    order.state,
    order.pincode,
    order.country,
  );

  const pickupAddress = buildAddress(
    order.pickup_address,
    order.pickup_address_line1,
    order.pickup_address_line2,
    order.pickup_city,
    order.pickup_state,
    order.pickup_pincode,
  );

  const warehouseAddress = buildAddress(
    order.warehouse_address_line1,
    order.warehouse_address_line2,
    order.warehouse_floor_no ? `Floor ${order.warehouse_floor_no}` : null,
    order.warehouse_landmark ? `Landmark: ${order.warehouse_landmark}` : null,
    order.warehouse_city,
    order.warehouse_state,
    order.warehouse_pincode,
    order.warehouse_country,
  );

  const rtoAddress = buildAddress(
    order.return_address_line1,
    order.return_address_line2,
    order.return_floor_no ? `Floor ${order.return_floor_no}` : null,
    order.return_landmark ? `Landmark: ${order.return_landmark}` : null,
    order.return_city,
    order.return_state,
    order.return_pincode,
    order.return_country,
  );

  const productName =
    order.product_name || order.products?.[0]?.product_name || "-";
  const sku = order.sku || order.products?.[0]?.sku || "-";
  const productPrice = order.price ?? order.products?.[0]?.price;
  const productQty = order.qty ?? order.products?.[0]?.qty;
  const packageLength = order.length ?? order.packages?.[0]?.length;
  const packageWidth = order.width ?? order.packages?.[0]?.width;
  const packageHeight = order.height ?? order.packages?.[0]?.height;
  const packageWeight = order.weight ?? order.packages?.[0]?.weight;
  const packageCount = order.package_count ?? order.packages?.[0]?.package_count;
  const createdAt = order.created_at || order.createdAt;
  const manifestAt = order.manifest_created_at || order.manifestCreatedAt;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-[960px] flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[12px] font-bold text-[#008dd2]">
              #
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm sm:text-base font-bold text-slate-800">
                  {order.order_id || order.id}
                </h2>
                <StatusBadge status={status} />
              </div>
              <p className="text-[10px] text-slate-400">
                AWB {valueOrDash(order.awb)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-3.5 sm:p-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <DetailCard title="Shipment">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow label="AWB" value={order.awb} strong />
                <DetailRow
                  label="Pickup Request ID"
                  value={order.pickup_request_id || order.pickupId}
                  strong
                />
                <DetailRow
                  label="Pickup Address ID"
                  value={order.pickup_address_id}
                />
                <DetailRow
                  label="Manifest ID"
                  value={order.manifest_id || order.manifestId}
                />
                <DetailRow label="Service" value={serviceLabel} strong />
              </div>
            </DetailCard>

            <DetailCard title="Customer & Payment">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Customer"
                  value={
                    order.customer ||
                    order.customer_name ||
                    order.customer_company
                  }
                  strong
                />
                <DetailRow label="UID" value={order.user_id} />
                <DetailRow
                  label="Payment"
                  value={order.payment_type || order.payment}
                />
                <DetailRow label="Risk Type" value={order.risk_type} />
                <DetailRow
                  label="Shipping Charge"
                  value={charge !== null ? `₹${charge.toFixed(2)}` : "-"}
                  strong
                />
                <DetailRow
                  label="Order Value"
                  value={
                    order.order_value ?? order.total_amount ?? order.total_value
                  }
                />
              </div>
            </DetailCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800">
                  Buyer / Consignee
                </h3>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                  DELIVERY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow label="Name" value={order.consignee_name} strong />
                <DetailRow label="Phone" value={order.mobile} />
                <DetailRow label="Alt Phone" value={order.alternate_mobile} />
                <DetailRow label="Email" value={order.email} />
              </div>

              <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-blue-500 mb-0.5">
                  Address
                </div>
                <div className="text-[11px] font-medium leading-relaxed text-slate-700">
                  {buyerAddress}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800">
                  Pickup Address
                </h3>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                  PICKUP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Name"
                  value={
                    order.pickup_contact_name ||
                    order.warehouse_contact_name ||
                    order.contact_name
                  }
                  strong
                />
                <DetailRow
                  label="Phone"
                  value={
                    order.pickup_phone || order.warehouse_phone || order.phone
                  }
                />
              </div>

              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                  Address
                </div>
                <div className="text-[11px] font-medium leading-relaxed text-slate-700">
                  {pickupAddress}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <DetailCard title="Route">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Pickup"
                  value={
                    order.pickup ||
                    buildAddress(
                      order.pickup_city,
                      order.pickup_state,
                      order.pickup_pincode,
                    )
                  }
                />
                <DetailRow
                  label="Delivery"
                  value={buildAddress(order.city, order.state, order.pincode)}
                />
                <DetailRow
                  label="Distance"
                  value={
                    order.distance_km !== undefined &&
                    order.distance_km !== null
                      ? `${order.distance_km} km`
                      : order.distance
                        ? `${order.distance} km`
                        : "-"
                  }
                />
                <DetailRow label="Zone" value={order.zone} />
              </div>
            </DetailCard>

            <DetailCard title="Package & Product">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Weight"
                  value={
                    packageWeight !== undefined && packageWeight !== null
                      ? `${packageWeight} kg`
                      : order.total_weight
                        ? `${order.total_weight} kg`
                        : "-"
                  }
                />
                <DetailRow label="Boxes" value={packageCount} />
                <DetailRow
                  label="Dimensions"
                  value={
                    packageLength !== undefined &&
                    packageWidth !== undefined &&
                    packageHeight !== undefined
                      ? `${packageLength} × ${packageWidth} × ${packageHeight}`
                      : "-"
                  }
                />
                <DetailRow label="Product" value={productName} strong />
                <DetailRow label="Quantity" value={productQty} />
                <DetailRow
                  label="Price"
                  value={
                    productPrice !== undefined && productPrice !== null
                      ? `₹${Number(productPrice).toFixed(2)}`
                      : "-"
                  }
                />
              </div>
            </DetailCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <DetailCard title="Warehouse">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Name"
                  value={
                    order.warehouse_name || order.warehouse?.warehouse_name
                  }
                  strong
                />
                <DetailRow
                  label="Phone"
                  value={order.warehouse_phone || order.warehouse?.phone}
                />
              </div>
              <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600">
                {warehouseAddress}
              </div>
            </DetailCard>

            <DetailCard title="RTO Address">
              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow label="Name" value={order.return_name} />
                <DetailRow label="Phone" value={order.return_phone} />
              </div>
              <div className="mt-2 rounded-lg border border-orange-100 bg-orange-50/50 p-2.5 text-[11px] text-slate-600">
                {rtoAddress}
              </div>
            </DetailCard>
          </div>

          <DetailCard title="Shipment Meta">
            <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-4">
              <DetailRow label="Order ID" value={order.order_id || order.id} strong />
              <DetailRow label="Status" value={status} />
              <DetailRow
                label="Created"
                value={createdAt ? formatDate(createdAt) : "-"}
              />
              <DetailRow
                label="Manifested"
                value={manifestAt ? formatDate(manifestAt) : "-"}
              />
            </div>
          </DetailCard>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   NDR / PENDING HELPER
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

  return (
    trackingStatus === "NDR" ||
    orderStatus === "NDR" ||
    trackingStatus === "PENDING" ||
    orderStatus === "PENDING"
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    All: 0,
    Processing: 0,
    Booked: 0,
    Manifested: 0,
    "Not Picked": 0,
    "In Transit": 0,
    "Out For Delivery": 0,
    Delivered: 0,
    "RTO In Transit": 0,
    "RTO Delivered": 0,
    Returned: 0,
    Cancelled: 0,
    Pending: 0,
    "NDR & Pending": 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courierFilter, setCourierFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch orders");
      }

      const apiOrders = Array.isArray(data?.orders) ? data.orders : [];

      const uniqueOrders = Array.from(
        new Map(apiOrders.map((order) => [order.id, order])).values(),
      );

      const normalizedOrders = uniqueOrders.map((order) => {
        const trackingStatus = String(order?.tracking_status || "")
          .trim()
          .toUpperCase()
          .replace(/_/g, " ");

        const status =
          trackingStatus === "NDR"
            ? "NDR"
            : normalizeStatus(
                order?.tracking_status || order?.status || order?.order_status,
              );

        const pickupParts = [order.pickup_city, order.pickup_pincode].filter(
          Boolean,
        );

        const destinationParts = [
          order.city,
          order.state,
          order.pincode,
        ].filter(Boolean);

        const pickupReqId =
          order.pickup_request_id ||
          order.pickupRequestId ||
          order.pickup_id ||
          null;

        return {
          ...order,
          id: order.id,
          order_id: order.order_id,
          user_id: order.user_id,
          customer:
            order.customer_name || order.customer_company || "Unknown Customer",
          uid: order.user_id || "-",
          awb: order.awb || "-",
          pickup_request_id: pickupReqId,
          pickup_address_id: order.pickup_address_id || null,
          pickupId: pickupReqId ? String(pickupReqId) : "—",
          courier:
            order.courier || order.courier_name || order.service_name || "-",
          charge: getCharge(order),
          pickup: pickupParts.length > 0 ? pickupParts.join(", ") : "-",
          destination:
            destinationParts.length > 0 ? destinationParts.join(", ") : "-",
          status,
          payment: order.payment_type || "-",
          date: formatDate(order.created_at),
        };
      });

      setOrders(normalizedOrders);

      if (data?.counts) {
        setCounts({
          All: Number(data.counts.All || 0),
          Processing: Number(data.counts.Processing || 0),
          Booked: Number(
            data.counts.Booked ||
              normalizedOrders.filter((o) => o.status === "Booked").length,
          ),
          Manifested: Number(data.counts.Manifested || 0),
          "Not Picked": Number(data.counts["Not Picked"] || 0),
          "In Transit": Number(data.counts["In Transit"] || 0),
          "Out For Delivery": Number(data.counts["Out For Delivery"] || 0),
          Delivered: Number(data.counts.Delivered || 0),
          "RTO In Transit": Number(data.counts["RTO In Transit"] || 0),
          "RTO Delivered": Number(data.counts["RTO Delivered"] || 0),
          Returned: Number(data.counts.Returned || 0),
          Cancelled: Number(data.counts.Cancelled || 0),
          Pending: Number(data.counts.Pending || 0),
          "NDR & Pending": normalizedOrders.filter(
            (o) => o.status === "NDR" || o.status === "Pending",
          ).length,
        });
      } else {
        setCounts({
          All: normalizedOrders.length,
          Processing: normalizedOrders.filter((o) => o.status === "Processing").length,
          Booked: normalizedOrders.filter((o) => o.status === "Booked").length,
          Manifested: normalizedOrders.filter((o) => o.status === "Manifested").length,
          "Not Picked": normalizedOrders.filter((o) => o.status === "Not Picked").length,
          "In Transit": normalizedOrders.filter((o) => o.status === "In Transit").length,
          "Out For Delivery": normalizedOrders.filter((o) => o.status === "Out For Delivery").length,
          Delivered: normalizedOrders.filter((o) => o.status === "Delivered").length,
          "RTO In Transit": normalizedOrders.filter((o) => o.status === "RTO In Transit").length,
          "RTO Delivered": normalizedOrders.filter((o) => o.status === "RTO Delivered").length,
          Returned: normalizedOrders.filter((o) => o.status === "Returned").length,
          Cancelled: normalizedOrders.filter((o) => o.status === "Cancelled").length,
          Pending: normalizedOrders.filter((o) => o.status === "Pending").length,
          "NDR & Pending": normalizedOrders.filter(
            (o) => o.status === "NDR" || o.status === "Pending",
          ).length,
        });
      }
    } catch (err) {
      setError(err.message || "Unable to load orders");
      toast.error(err.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const couriers = useMemo(() => {
    return [
      ...new Set(
        orders
          .map((order) => order.courier)
          .filter((courier) => courier && courier !== "-"),
      ),
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.order_id || "").toLowerCase().includes(query) ||
        String(order.id || "").toLowerCase().includes(query) ||
        String(order.awb || "").toLowerCase().includes(query) ||
        String(order.customer || "").toLowerCase().includes(query) ||
        String(order.uid || "").toLowerCase().includes(query) ||
        String(order.pickup_request_id || "").toLowerCase().includes(query) ||
        String(order.pickupId || "").toLowerCase().includes(query);

      const matchesActiveStatus =
        activeStatus === "All" ||
        (activeStatus === "NDR & Pending"
          ? isNdrOrPending(order)
          : order.status === activeStatus);

      const matchesStatusFilter =
        statusFilter === "All" ||
        (statusFilter === "NDR & Pending"
          ? isNdrOrPending(order)
          : order.status === statusFilter);

      const matchesCourier =
        courierFilter === "All" || order.courier === courierFilter;

      const matchesPayment =
        paymentFilter === "All" || order.payment === paymentFilter;

      return (
        matchesSearch &&
        matchesActiveStatus &&
        matchesStatusFilter &&
        matchesCourier &&
        matchesPayment
      );
    });
  }, [
    orders,
    search,
    activeStatus,
    statusFilter,
    courierFilter,
    paymentFilter,
  ]);

  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedOrders.includes(order.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders((prev) =>
        prev.filter((id) => !filteredOrders.some((order) => order.id === id)),
      );
    } else {
      setSelectedOrders((prev) => [
        ...new Set([...prev, ...filteredOrders.map((order) => order.id)]),
      ]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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

  // Open ParcelDrop's existing in-app tracking popup for this AWB.
  const trackAwb = (awb) => {
    const trackingNumber = String(awb || "").trim();

    if (!trackingNumber || trackingNumber === "-") {
      toast.error("AWB not available");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("parceldrop:track-awb", {
        detail: { awb: trackingNumber },
      }),
    );
  };

  const resetFilters = () => {
    setSearch("");
    setActiveStatus("All");
    setStatusFilter("All");
    setCourierFilter("All");
    setPaymentFilter("All");
  };

  const statusTabs = [
    "All",
    "Processing",
    "Booked",
    "Manifested",
    "Not Picked",
    "In Transit",
    "Out For Delivery",
    "Delivered",
    "RTO In Transit",
    "RTO Delivered",
    "Returned",
    "Cancelled",
    "NDR & Pending",
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] p-3 sm:p-5 pb-20 lg:pb-8 overflow-x-hidden">
      {/* HEADER */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeStatus === "NDR & Pending" ? "NDR & Pending" : "All Orders"}
            </h1>
            <span className="rounded-full bg-sky-50 border border-sky-100 px-3 py-0.5 text-xs font-bold text-[#008dd2]">
              {activeStatus === "NDR & Pending" ? counts["NDR & Pending"] : counts.All}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {activeStatus === "NDR & Pending"
              ? "Manage NDR and pending customer orders"
              : "Manage and track all customer orders"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-[#008dd2]">
              {selectedOrders.length} selected
            </div>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60 active:scale-95"
          >
            <HiOutlineRefresh className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="mb-4 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, AWB, Customer, UID or Pickup ID..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs text-slate-800 font-medium outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <HiOutlineX className="text-sm" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* STATUS SELECT */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value);
                  setActiveStatus(value);
                }}
                className="h-10 w-full sm:min-w-[145px] appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
              >
                <option value="All">All Status</option>
                {statusTabs
                  .filter((status) => status !== "All")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            </div>

            {/* PAYMENT SELECT */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-10 w-full sm:min-w-[130px] appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
              >
                <option value="All">All Payment</option>
                <option value="Prepaid">Prepaid</option>
                <option value="COD">COD</option>
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            </div>
          </div>
        </div>

        {/* RESULTS & SELECT ALL (MOBILE) */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer sm:hidden">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded accent-[#008dd2]"
            />
            <span>Select All ({filteredOrders.length})</span>
          </label>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-auto">
            <HiOutlineFilter size={14} className="text-slate-400" />
            <span>{filteredOrders.length} results</span>
          </div>
        </div>
      </div>

      {/* STATUS PILL TABS */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {statusTabs.map((status) => {
          const active = activeStatus === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                setActiveStatus(status);
                setStatusFilter(status);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs transition active:scale-95 ${
                active
                  ? "border-[#008dd2] bg-[#008dd2] text-white font-semibold shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium"
              }`}
            >
              <span>{STATUS_CONFIG[status]?.label || status}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[status] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-3.5">
          <div>
            <p className="text-xs font-bold text-red-600">Unable to load orders</p>
            <p className="text-[11px] text-red-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================
          1. MOBILE VIEW: NATIVE APP CARD TILES
      ========================================================= */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#008dd2]" />
            <p className="mt-3 text-xs font-medium text-slate-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <p className="text-xs font-bold text-slate-700">No orders found</p>
            <p className="mt-1 text-[11px] text-slate-400">Try changing your search or filters.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-xs font-bold text-[#008dd2]"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const selected = selectedOrders.includes(order.id);

            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-4 shadow-xs transition space-y-3 ${
                  selected ? "border-[#008dd2] ring-2 ring-[#008dd2]/10" : "border-slate-200"
                }`}
              >
                {/* CARD HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelect(order.id)}
                      className="h-4 w-4 rounded accent-[#008dd2]"
                    />
                    <span className="font-mono text-[13px] font-bold text-slate-900">
                      #{order.order_id || order.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        order.payment === "COD"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-sky-200 bg-sky-50 text-[#008dd2]"
                      }`}
                    >
                      {order.payment}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {/* CUSTOMER & DETAILS */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px] text-slate-900 truncate">
                      {order.customer}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      UID: {order.uid}
                    </span>
                  </div>

                  {/* AWB ACTION BAR */}
                  <div className="flex items-center justify-between font-mono text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => trackAwb(order.awb)}
                      disabled={!order.awb || order.awb === "-"}
                      title="Track shipment"
                      className="min-w-0 truncate text-left font-bold text-[#008dd2] hover:underline disabled:cursor-default disabled:text-slate-700"
                    >
                      AWB: {order.awb}
                    </button>

                    {order.awb && order.awb !== "-" && (
                      <button
                        type="button"
                        onClick={() => copyText(order.awb, "AWB")}
                        className="text-[#008dd2] font-bold flex items-center gap-1 text-[11px] shrink-0 active:scale-95 ml-2"
                      >
                        <HiOutlineClipboardCopy size={14} />
                        Copy
                      </button>
                    )}
                  </div>

                  {/* PICKUP REQUEST ID & COURIER */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                    <div>
                      <span className="text-slate-400 font-medium">Pickup ID: </span>
                      <span className="font-mono font-bold text-slate-800">
                        {order.pickup_request_id || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <HiOutlineTruck className="text-slate-400" />
                      <span>{order.courier}</span>
                    </div>
                  </div>

                  {/* ROUTE VISUAL */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="truncate max-w-[130px] font-medium text-slate-800">
                      {order.pickup}
                    </span>
                    <span className="text-slate-300 font-bold px-1">→</span>
                    <span className="truncate max-w-[130px] text-right font-medium text-slate-800">
                      {order.destination}
                    </span>
                  </div>

                  {/* CHARGE & DATE */}
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
                    <span>
                      Charge:{" "}
                      <b className="font-bold text-slate-900 text-[13px]">
                        {order.charge !== null && Number.isFinite(Number(order.charge))
                          ? `₹${Number(order.charge).toFixed(2)}`
                          : "—"}
                      </b>
                    </span>
                    <span className="text-[11px]">{order.date}</span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewingOrder(order)}
                    className="flex h-8 items-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-semibold text-white shadow-2xs active:scale-95 transition hover:bg-[#007ec0]"
                  >
                    <HiOutlineEye size={15} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          2. TABLET & DESKTOP: STRUCTURED TABLE (100% RESPONSIVE, NO SIDE SCROLL)
      ========================================================= */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              <th className="w-[38px] px-2 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                />
              </th>
              <th className="w-[14%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Order
              </th>
              <th className="w-[18%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Customer
              </th>
              <th className="w-[22%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Shipment & Pickup
              </th>
              <th className="w-[20%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Route
              </th>
              <th className="w-[11%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Payment
              </th>
              <th className="w-[11%] px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                Dates
              </th>
              <th className="w-[4%] px-2 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Loading orders...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <HiOutlineSearch className="text-xl" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      No orders found
                    </p>
                    <p className="mt-1 text-xs text-slate-400 font-medium">
                      Try changing your search keywords or filter criteria.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 text-xs font-semibold text-[#008dd2] hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const selected = selectedOrders.includes(order.id);

                return (
                  <tr
                    key={order.id}
                    className={`group transition hover:bg-slate-50/70 ${
                      selected ? "bg-sky-50/40" : "bg-white"
                    }`}
                  >
                    {/* SELECT CHECKBOX */}
                    <td className="px-2 py-3.5 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(order.id)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                      />
                    </td>

                    {/* ORDER ID & STATUS BADGE */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      <div className="font-mono text-[13px] font-bold text-slate-900 group-hover:text-[#008dd2] transition truncate">
                        #{order.order_id || order.id}
                      </div>
                      <div className="mt-1.5">
                        <StatusBadge status={order.status} />
                      </div>
                    </td>

                    {/* CUSTOMER & UID */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      <div
                        className="text-[13px] font-bold text-slate-900 truncate"
                        title={order.customer}
                      >
                        {order.customer}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400 font-medium truncate">
                        UID: <span className="font-semibold text-slate-600">{order.uid}</span>
                      </div>
                      {(order.mobile || order.customer_phone) && (
                        <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                          {order.mobile || order.customer_phone}
                        </div>
                      )}
                    </td>

                    {/* SHIPMENT (AWB), PICKUP ID & COURIER */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      {/* AWB */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => trackAwb(order.awb)}
                          disabled={!order.awb || order.awb === "-"}
                          title="Track shipment"
                          className="truncate text-left font-mono text-[13px] font-bold text-[#008dd2] hover:underline disabled:cursor-default disabled:text-slate-700"
                        >
                          {order.awb || "—"}
                        </button>
                        {order.awb && order.awb !== "-" && (
                          <button
                            type="button"
                            onClick={() => copyText(order.awb, "AWB")}
                            className="text-slate-400 hover:text-[#008dd2] transition p-0.5 shrink-0"
                            title="Copy AWB"
                          >
                            <HiOutlineClipboardCopy className="text-sm" />
                          </button>
                        )}
                      </div>

                      {/* PICKUP REQUEST ID */}
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
                        <span className="font-medium text-slate-400 shrink-0">Pickup ID:</span>
                        <span className="font-mono font-bold text-slate-800 truncate">
                          {order.pickup_request_id || "—"}
                        </span>
                        {order.pickup_request_id && (
                          <button
                            type="button"
                            onClick={() => copyText(order.pickup_request_id, "Pickup ID")}
                            className="text-slate-300 hover:text-[#008dd2] transition p-0.5 shrink-0"
                            title="Copy Pickup ID"
                          >
                            <HiOutlineClipboardCopy className="text-xs" />
                          </button>
                        )}
                      </div>

                      {/* COURIER */}
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-medium min-w-0">
                        <HiOutlineTruck className="text-slate-400 text-xs shrink-0" />
                        <span className="truncate">{order.courier || "—"}</span>
                      </div>
                    </td>

                    {/* ROUTE VISUAL */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        {/* Pickup point */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <HiOutlineLocationMarker className="text-[#008dd2] text-sm shrink-0" />
                          <span
                            className="truncate text-xs font-semibold text-slate-800"
                            title={order.pickup}
                          >
                            {order.pickup || "—"}
                          </span>
                        </div>

                        {/* Connector */}
                        <div className="ml-1.5 flex h-2.5 flex-col justify-between">
                          <span className="h-0.5 border-l border-dashed border-slate-300" />
                          <span className="h-0.5 border-l border-dashed border-slate-300" />
                        </div>

                        {/* Destination point */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <HiOutlineLocationMarker className="text-emerald-500 text-sm shrink-0" />
                          <span
                            className="truncate text-xs font-semibold text-slate-800"
                            title={order.destination}
                          >
                            {order.destination || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CHARGE & PAYMENT TYPE */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      <div className="text-[13px] font-extrabold text-slate-900 tracking-tight truncate">
                        {order.charge !== null &&
                        order.charge !== undefined &&
                        Number.isFinite(Number(order.charge))
                          ? `₹${Number(order.charge).toFixed(2)}`
                          : "—"}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase truncate max-w-full ${
                            order.payment === "COD"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-sky-200 bg-sky-50 text-[#008dd2]"
                          }`}
                        >
                          {order.payment || "—"}
                        </span>
                      </div>
                    </td>

                    {/* DATES */}
                    <td className="px-3 py-3.5 align-top min-w-0">
                      <div className="text-xs min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {order.status}
                        </div>
                        <div
                          className="mt-0.5 text-[11px] text-slate-400 font-medium truncate"
                          title={order.date}
                        >
                          {order.date}
                        </div>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-2 py-3.5 align-top text-center">
                      <button
                        type="button"
                        onClick={() => setViewingOrder(order)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-[#008dd2] hover:bg-[#008dd2] hover:text-white active:scale-95"
                        title="View Order Details"
                      >
                        <HiOutlineEye className="text-base" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredOrders.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {orders.length}
            </span>{" "}
            orders
          </div>

          {selectedOrders.length > 0 && (
            <div className="text-xs font-semibold text-[#008dd2]">
              {selectedOrders.length} order
              {selectedOrders.length > 1 ? "s" : ""} selected
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      <OrderDetailsModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
};

export default AllOrders;