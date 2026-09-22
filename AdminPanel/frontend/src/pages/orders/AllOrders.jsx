import React, { useEffect, useMemo, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineFilter,
} from "react-icons/hi";
import toast from "react-hot-toast";

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
    color: "text-red-500",
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
    Processing:
      "bg-blue-50 text-blue-600 border-blue-100",

    Manifested:
      "bg-amber-50 text-amber-600 border-amber-200",

    "Not Picked":
      "bg-orange-50 text-orange-600 border-orange-100",

    "In Transit":
      "bg-indigo-50 text-indigo-600 border-indigo-100",

    "Out For Delivery":
      "bg-purple-50 text-purple-600 border-purple-100",

    Delivered:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    "RTO In Transit":
      "bg-red-50 text-red-500 border-red-100",

    "RTO Delivered":
      "bg-red-50 text-red-600 border-red-100",

    Returned:
      "bg-orange-50 text-orange-600 border-orange-100",

    Cancelled:
      "bg-red-50 text-red-600 border-red-100",

    Pending:
      "bg-slate-50 text-slate-500 border-slate-200",

    NDR:
      "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        styles[status] ||
        "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status || "Unknown"}
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

  if (value === "MANIFESTED") return "Manifested";

  if (
    value === "NOT PICKED" ||
    value === "NOT_PICKED"
  ) {
    return "Not Picked";
  }

  if (value === "IN TRANSIT") return "In Transit";

  if (
    value === "OUT FOR DELIVERY" ||
    value === "OUT_FOR_DELIVERY"
  ) {
    return "Out For Delivery";
  }

  if (value === "DELIVERED") return "Delivered";

  if (
    value === "RTO IN TRANSIT" ||
    value === "RTO_IN_TRANSIT"
  ) {
    return "RTO In Transit";
  }

  if (
    value === "RTO DELIVERED" ||
    value === "RTO_DELIVERED"
  ) {
    return "RTO Delivered";
  }

  if (value === "RETURNED") return "Returned";

  if (value === "CANCELLED" || value === "CANCELED") {
    return "Cancelled";
  }

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
  value !== undefined &&
  value !== null &&
  String(value).trim() !== ""
    ? String(value)
    : "-";

const buildAddress = (...parts) =>
  parts
    .filter(
      (part) =>
        part !== undefined &&
        part !== null &&
        String(part).trim() !== "",
    )
    .map((part) => String(part).trim())
    .join(", ") || "-";

const DetailRow = ({ label, value, strong = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
    <span className="shrink-0 text-[11px] font-medium text-slate-400">
      {label}
    </span>

    <span
      className={`min-w-0 text-right text-[11px] ${
        strong
          ? "font-semibold text-slate-700"
          : "font-medium text-slate-600"
      }`}
    >
      {valueOrDash(value)}
    </span>
  </div>
);

const DetailCard = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="mb-3 text-[12px] font-semibold text-slate-800">
      {title}
    </h3>
    {children}
  </div>
);

/* =========================================================
   ORDER DETAILS MODAL
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
          order?.tracking_status ||
            order?.status ||
            order?.order_status
        );

  const charge = getCharge(order);

  const serviceRaw = String(
    order.service_type ||
      order.serviceType ||
      order.service ||
      "",
  )
    .trim()
    .toUpperCase();

  const serviceLabel =
    serviceRaw.includes("AIR")
      ? "By Air"
      : serviceRaw.includes("ROAD")
        ? "By Road"
        : valueOrDash(
            order.service_type ||
              order.serviceType ||
              order.service,
          );

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
    order.warehouse_floor_no
      ? `Floor ${order.warehouse_floor_no}`
      : null,
    order.warehouse_landmark
      ? `Landmark: ${order.warehouse_landmark}`
      : null,
    order.warehouse_city,
    order.warehouse_state,
    order.warehouse_pincode,
    order.warehouse_country,
  );

  const rtoAddress = buildAddress(
    order.return_address_line1,
    order.return_address_line2,
    order.return_floor_no
      ? `Floor ${order.return_floor_no}`
      : null,
    order.return_landmark
      ? `Landmark: ${order.return_landmark}`
      : null,
    order.return_city,
    order.return_state,
    order.return_pincode,
    order.return_country,
  );

  const productName =
    order.product_name ||
    order.products?.[0]?.product_name ||
    "-";

  const sku =
    order.sku ||
    order.products?.[0]?.sku ||
    "-";

  const productPrice =
    order.price ??
    order.products?.[0]?.price;

  const productQty =
    order.qty ??
    order.products?.[0]?.qty;

  const productTax =
    order.tax ??
    order.products?.[0]?.tax;

  const packageLength =
    order.length ??
    order.packages?.[0]?.length;

  const packageWidth =
    order.width ??
    order.packages?.[0]?.width;

  const packageHeight =
    order.height ??
    order.packages?.[0]?.height;

  const packageWeight =
    order.weight ??
    order.packages?.[0]?.weight;

  const packageCount =
    order.package_count ??
    order.packages?.[0]?.package_count;

  const createdAt =
    order.created_at ||
    order.createdAt;

  const manifestAt =
    order.manifest_created_at ||
    order.manifestCreatedAt;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.20)]">

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-slate-600">
              #
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-slate-800">
                  {order.order_id || order.id}
                </h2>
                <StatusBadge status={status} />
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">
                AWB {valueOrDash(order.awb)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[18px] leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] p-3">

          {/* TOP SUMMARY */}
          <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_1fr]">

            <DetailCard title="Shipment">
              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow
                  label="AWB"
                  value={order.awb}
                  strong
                />
                <DetailRow
                  label="Pickup ID"
                  value={order.pickup_address_id}
                />
                <DetailRow
                  label="Manifest ID"
                  value={
                    order.manifest_id ||
                    order.manifestId
                  }
                />
                <DetailRow
                  label="Service"
                  value={serviceLabel}
                  strong
                />
              </div>
            </DetailCard>

            <DetailCard title="Customer & Payment">
              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow
                  label="Customer"
                  value={
                    order.customer ||
                    order.customer_name ||
                    order.customer_company
                  }
                  strong
                />
                <DetailRow
                  label="UID"
                  value={order.user_id}
                />
                <DetailRow
                  label="Payment"
                  value={
                    order.payment_type ||
                    order.payment
                  }
                />
                <DetailRow
                  label="Risk Type"
                  value={order.risk_type}
                />
                <DetailRow
                  label="Shipping Charge"
                  value={
                    charge !== null
                      ? `₹${charge.toFixed(2)}`
                      : "-"
                  }
                  strong
                />
                <DetailRow
                  label="Order Value"
                  value={
                    order.order_value ??
                    order.total_amount ??
                    order.total_value
                  }
                />
                <DetailRow
                  label="COD Amount"
                  value={
                    order.cod_amount ??
                    order.cod_value ??
                    order.codAmount
                  }
                />
              </div>
            </DetailCard>
          </div>

          {/* ADDRESSES — SIDE BY SIDE */}
          <div className="mb-3 grid gap-3 lg:grid-cols-2">

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[12px] font-semibold text-slate-800">
                    Buyer / Consignee
                  </h3>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    Delivery customer
                  </p>
                </div>
                <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">
                  DELIVERY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="Name"
                  value={order.consignee_name}
                  strong
                />
                <DetailRow
                  label="Phone"
                  value={order.mobile}
                />
                <DetailRow
                  label="Alt Phone"
                  value={order.alternate_mobile}
                />
                <DetailRow
                  label="Email"
                  value={order.email}
                />
                
              </div>

              <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-blue-500">
                  Address
                </div>
                <div className="text-[10px] font-medium leading-[1.6] text-slate-700">
                  {buyerAddress}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[12px] font-semibold text-slate-800">
                    Pickup Address
                  </h3>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    Shipment origin
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
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
                    order.pickup_phone ||
                    order.warehouse_phone ||
                    order.phone
                  }
                />
              </div>

              <div className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                  Address
                </div>
                <div className="text-[10px] font-medium leading-[1.6] text-slate-700">
                  {pickupAddress}
                </div>
              </div>
            </div>
          </div>

          {/* ROUTE + PACKAGE */}
          <div className="mb-3 grid gap-3 lg:grid-cols-2">
            <DetailCard title="Route">
              <div className="grid grid-cols-2 gap-x-5">
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
                  value={buildAddress(
                    order.city,
                    order.state,
                    order.pincode,
                  )}
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
                <DetailRow
                  label="Zone"
                  value={order.zone}
                />
              </div>
            </DetailCard>

            <DetailCard title="Package & Product">
              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow
                  label="Weight"
                  value={
                    packageWeight !== undefined &&
                    packageWeight !== null
                      ? `${packageWeight} kg`
                      : order.total_weight
                        ? `${order.total_weight} kg`
                        : "-"
                  }
                />
                <DetailRow
                  label="Boxes"
                  value={packageCount}
                />
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
                <DetailRow
                  label="Product"
                  value={productName}
                  strong
                />
                <DetailRow
                  label="SKU"
                  value={sku}
                />
                <DetailRow
                  label="Quantity"
                  value={productQty}
                />
                <DetailRow
                  label="Product Price"
                  value={
                    productPrice !== undefined &&
                    productPrice !== null
                      ? `₹${Number(productPrice).toFixed(2)}`
                      : "-"
                  }
                />
                
              </div>
            </DetailCard>
          </div>

          {/* WAREHOUSE + RTO */}
          <div className="mb-3 grid gap-3 lg:grid-cols-2">
            <DetailCard title="Warehouse">
              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow
                  label="Name"
                  value={
                    order.warehouse_name ||
                    order.warehouse?.warehouse_name
                  }
                  strong
                />
                <DetailRow
                  label="Contact"
                  value={
                    order.warehouse_contact_name ||
                    order.warehouse?.contact_name
                  }
                />
                <DetailRow
                  label="Phone"
                  value={
                    order.warehouse_phone ||
                    order.warehouse?.phone
                  }
                />
              </div>

              <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Address
                </div>
                <div className="text-[10px] font-medium leading-[1.6] text-slate-600">
                  {warehouseAddress}
                </div>
              </div>
            </DetailCard>

            <DetailCard title="RTO Address">
              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow
                  label="Name"
                  value={order.return_name}
                />
                <DetailRow
                  label="Phone"
                  value={order.return_phone}
                />
                <DetailRow
                  label="Email"
                  value={order.return_email}
                />
              </div>

              <div className="mt-2.5 rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2.5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-orange-500">
                  Return Address
                </div>
                <div className="text-[10px] font-medium leading-[1.6] text-slate-600">
                  {rtoAddress}
                </div>
              </div>
            </DetailCard>
          </div>

          {/* META */}
          <DetailCard title="Shipment Meta">
            <div className="grid grid-cols-2 gap-x-5 lg:grid-cols-4">
              <DetailRow
                label="Order ID"
                value={order.order_id || order.id}
                strong
              />
              <DetailRow
                label="Status"
                value={status}
              />
              <DetailRow
                label="Tracking Status"
                value={order.tracking_status}
              />
              <DetailRow
                label="Created"
                value={
                  createdAt
                    ? formatDate(createdAt)
                    : "-"
                }
              />
              <DetailRow
                label="Manifested"
                value={
                  manifestAt
                    ? formatDate(manifestAt)
                    : "-"
                }
              />
              <DetailRow
                label="Tracking Updated"
                value={
                  order.tracking_updated_at
                    ? formatDate(
                        order.tracking_updated_at,
                      )
                    : "-"
                }
              />
            </div>
          </DetailCard>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5">
          <div className="text-[9px] text-slate-400">
            Order details
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#ff5a2f] px-4 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#ed4d24]"
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
  const trackingStatus = String(
    order?.tracking_status || ""
  )
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

  const orderStatus = String(
    order?.status ||
      order?.order_status ||
      ""
  )
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

  const [activeStatus, setActiveStatus] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [courierFilter, setCourierFilter] =
    useState("All");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [selectedOrders, setSelectedOrders] =
    useState([]);

  const [viewingOrder, setViewingOrder] =
    useState(null);

  /* =======================================================
     FETCH ORDERS
  ======================================================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        "http://localhost:5001/api/admin/orders",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch orders"
        );
      }

      const apiOrders = Array.isArray(
        data?.orders
      )
        ? data.orders
        : [];

      /* ===================================================
         REMOVE DUPLICATE ORDER ROWS
         
         Products/packages can create multiple rows
         for the same order because of SQL JOINs.
      =================================================== */

      const uniqueOrders = Array.from(
        new Map(
          apiOrders.map((order) => [
            order.id,
            order,
          ])
        ).values()
      );

      const normalizedOrders =
        uniqueOrders.map((order) => {
          const trackingStatus = String(
            order?.tracking_status || ""
          )
            .trim()
            .toUpperCase()
            .replace(/_/g, " ");

          const status =
            trackingStatus === "NDR"
              ? "NDR"
              : normalizeStatus(
                  order?.tracking_status ||
                    order?.status ||
                    order?.order_status
                );

          const pickupParts = [
            order.pickup_city,
            order.pickup_pincode,
          ].filter(Boolean);

          const destinationParts = [
            order.city,
            order.state,
            order.pincode,
          ].filter(Boolean);

          return {
            ...order,

            id: order.id,

            order_id:
              order.order_id,

            user_id:
              order.user_id,

            customer:
              order.customer_name ||
              order.customer_company ||
              "Unknown Customer",

            uid:
              order.user_id || "-",

            awb:
              order.awb || "-",

            pickupId:
              order.pickup_address_id || "-",

            courier:
              order.courier ||
              order.courier_name ||
              order.service_name ||
              "-",

            charge: getCharge(order),

            pickup:
              pickupParts.length > 0
                ? pickupParts.join(", ")
                : "-",

            destination:
              destinationParts.length > 0
                ? destinationParts.join(", ")
                : "-",

            status,

            payment:
              order.payment_type ||
              "-",

            date:
              formatDate(
                order.created_at
              ),
          };
        });

      setOrders(normalizedOrders);

      /* ===================================================
         COUNTS
      =================================================== */

      if (data?.counts) {
        setCounts({
          All: Number(
            data.counts.All || 0
          ),

          Processing: Number(
            data.counts.Processing || 0
          ),

          Manifested: Number(
            data.counts.Manifested || 0
          ),

          "Not Picked": Number(
            data.counts["Not Picked"] || 0
          ),

          "In Transit": Number(
            data.counts["In Transit"] || 0
          ),

          "Out For Delivery": Number(
            data.counts[
              "Out For Delivery"
            ] || 0
          ),

          Delivered: Number(
            data.counts.Delivered || 0
          ),

          "RTO In Transit": Number(
            data.counts[
              "RTO In Transit"
            ] || 0
          ),

          "RTO Delivered": Number(
            data.counts[
              "RTO Delivered"
            ] || 0
          ),

          Returned: Number(
            data.counts.Returned || 0
          ),

          Cancelled: Number(
            data.counts.Cancelled || 0
          ),

          Pending: Number(
            data.counts.Pending || 0
          ),

          "NDR & Pending":
            normalizedOrders.filter(
              (o) =>
                o.status === "NDR" ||
                o.status === "Pending"
            ).length,
        });
      } else {
        /* FALLBACK COUNTS */

        setCounts({
          All: normalizedOrders.length,

          Processing:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Processing"
            ).length,

          Manifested:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Manifested"
            ).length,

          "Not Picked":
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Not Picked"
            ).length,

          "In Transit":
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "In Transit"
            ).length,

          "Out For Delivery":
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Out For Delivery"
            ).length,

          Delivered:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Delivered"
            ).length,

          "RTO In Transit":
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "RTO In Transit"
            ).length,

          "RTO Delivered":
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "RTO Delivered"
            ).length,

          Returned:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Returned"
            ).length,

          Cancelled:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Cancelled"
            ).length,

          Pending:
            normalizedOrders.filter(
              (o) =>
                o.status ===
                "Pending"
            ).length,

          "NDR & Pending":
            normalizedOrders.filter(
              (o) =>
                o.status === "NDR" ||
                o.status === "Pending"
            ).length,
        });
      }
    } catch (err) {
      console.error(
        "Fetch admin orders error:",
        err
      );

      setError(
        err.message ||
          "Unable to load orders"
      );

      toast.error(
        err.message ||
          "Unable to load orders"
      );
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

  /* =======================================================
     COURIERS
  ======================================================= */

  const couriers = useMemo(() => {
    return [
      ...new Set(
        orders
          .map(
            (order) =>
              order.courier
          )
          .filter(
            (courier) =>
              courier &&
              courier !== "-"
          )
      ),
    ];
  }, [orders]);

  /* =======================================================
     FILTER ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(
          order.order_id || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(order.id || "")
          .toLowerCase()
          .includes(query) ||
        String(order.awb || "")
          .toLowerCase()
          .includes(query) ||
        String(
          order.customer || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(order.uid || "")
          .toLowerCase()
          .includes(query) ||
        String(
          order.pickupId || ""
        )
          .toLowerCase()
          .includes(query);

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
        courierFilter === "All" ||
        order.courier ===
          courierFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.payment ===
          paymentFilter;

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

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedOrders.includes(
        order.id
      )
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders((prev) =>
        prev.filter(
          (id) =>
            !filteredOrders.some(
              (order) =>
                order.id === id
            )
        )
      );
    } else {
      setSelectedOrders((prev) => [
        ...new Set([
          ...prev,
          ...filteredOrders.map(
            (order) =>
              order.id
          ),
        ]),
      ]);
    }
  };

  /* =======================================================
     SELECT ONE
  ======================================================= */

  const toggleSelect = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) =>
              item !== id
          )
        : [...prev, id]
    );
  };

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (
    text,
    label
  ) => {
    if (!text || text === "-") {
      toast.error(
        `${label} not available`
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(text)
      );

      toast.success(
        `${label} copied`
      );
    } catch {
      toast.error(
        "Unable to copy"
      );
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setActiveStatus("All");
    setStatusFilter("All");
    setCourierFilter("All");
    setPaymentFilter("All");
  };

  /* =======================================================
     ALL STATUS TABS
  ======================================================= */

  const statusTabs = [
    "All",
    "Processing",
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-[#f8fafc] p-5">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-slate-800">
              {activeStatus === "NDR & Pending"
                ? "NDR & Pending"
                : "All Orders"}
            </h1>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {activeStatus === "NDR & Pending"
                ? counts["NDR & Pending"]
                : counts.All}
            </span>

          </div>

          <p className="mt-1 text-[12px] text-slate-500">
            {activeStatus === "NDR & Pending"
              ? "Manage NDR and pending customer orders"
              : "Manage and track all customer orders"}
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
            <HiOutlineRefresh
              className={`text-[15px] ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset
          </button>

        </div>
      </div>

      {/* ===================================================
          SEARCH + FILTERS
      =================================================== */}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

          {/* SEARCH */}

          <div className="relative min-w-0 flex-1">

            <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search Order ID, AWB, Customer, UID or Pickup ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
            />

          </div>

          {/* STATUS */}

          <div className="relative">

            <select
              value={statusFilter}
              onChange={(e) => {
                const value =
                  e.target.value;

                setStatusFilter(value);
                setActiveStatus(value);
              }}
              className="h-10 min-w-[145px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >

              <option value="All">
                All Status
              </option>

              {statusTabs
                .filter(
                  (status) =>
                    status !== "All"
                )
                .map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

            </select>

            <HiOutlineChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400" />

          </div>


          {/* PAYMENT */}

          <div className="relative">

            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[130px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >

              <option value="All">
                All Payment
              </option>

              <option value="Prepaid">
                Prepaid
              </option>

              <option value="COD">
                COD
              </option>

            </select>

            <HiOutlineChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400" />

          </div>

          <div className="hidden h-7 w-px bg-slate-200 xl:block" />

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">

            <HiOutlineFilter className="text-[14px]" />

            {filteredOrders.length} results

          </div>

        </div>
      </div>

      {/* ===================================================
          ALL 12 STATUS TABS
      =================================================== */}

      <div className="mb-4 overflow-x-auto pb-1">

        <div className="flex min-w-max items-center gap-2">

          {statusTabs.map(
            (status) => {

              const active =
                activeStatus ===
                status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setActiveStatus(
                      status
                    );

                    setStatusFilter(
                      status
                    );
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition ${
                    active
                      ? "border-blue-200 bg-blue-50 text-blue-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >

                  <span
                    className={
                      active
                        ? "font-semibold"
                        : STATUS_CONFIG[
                            status
                          ]?.color ||
                          ""
                    }
                  >
                    {
                      STATUS_CONFIG[
                        status
                      ]?.label
                    }
                  </span>

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {
                      counts[
                        status
                      ]
                    }
                  </span>

                </button>
              );
            }
          )}

        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">

          <div>

            <p className="text-[12px] font-semibold text-red-600">
              Unable to load orders
            </p>

            <p className="mt-0.5 text-[11px] text-red-500">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-red-600 shadow-sm"
          >
            Retry
          </button>

        </div>
      )}

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

        <div className="overflow-x-auto">

          <table className="min-w-[1180px] w-full border-collapse">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50/70">

                <th className="w-[52px] border-r border-slate-200 px-3 py-3 text-center">

                  <input
                    type="checkbox"
                    checked={
                      allSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-blue-600"
                  />

                </th>

                <th className="w-[125px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="w-[160px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="w-[225px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  AWB
                </th>

                <th className="w-[115px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Charge
                </th>

                <th className="w-[205px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Route
                </th>

                <th className="w-[145px] border-r border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Dates
                </th>

                <th className="w-[115px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                      <p className="mt-3 text-[12px] font-medium text-slate-500">
                        Loading orders...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredOrders.length ===
                0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center"
                  >

                    <div className="mx-auto flex max-w-sm flex-col items-center">

                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">

                        <HiOutlineSearch className="text-[20px] text-slate-400" />

                      </div>

                      <p className="text-[13px] font-semibold text-slate-700">
                        No orders found
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Try changing your search or filters.
                      </p>

                      <button
                        type="button"
                        onClick={
                          resetFilters
                        }
                        className="mt-4 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        Clear all filters
                      </button>

                    </div>

                  </td>

                </tr>

              ) : (

                /* DATA */

                filteredOrders.map(
                  (order) => {

                    const selected =
                      selectedOrders.includes(
                        order.id
                      );

                    return (
                      <tr
                        key={
                          order.id
                        }
                        className={`border-b border-slate-100 transition last:border-b-0 ${
                          selected
                            ? "bg-blue-50/40"
                            : "hover:bg-slate-50/50"
                        }`}
                      >

                        {/* CHECKBOX */}

                        <td className="border-r border-slate-100 px-3 py-3 text-center align-top">

                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleSelect(
                                order.id
                              )
                            }
                            className="mt-1 h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-blue-600"
                          />

                        </td>

                        {/* ORDER */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="text-[12px] font-semibold text-slate-800">
                            #
                            {order.order_id ||
                              order.id}
                          </div>

                          <div className="mt-1.5">
                            <StatusBadge
                              status={
                                order.status
                              }
                            />
                          </div>

                        </td>

                        {/* CUSTOMER */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="max-w-[145px] truncate text-[12px] font-medium text-slate-700">
                            {
                              order.customer
                            }
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            UID:{" "}
                            {
                              order.uid
                            }
                          </div>

                        </td>

                        {/* AWB */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="flex items-center gap-1.5">

                            <span className="text-[11px] font-medium text-slate-700">
                              {
                                order.awb
                              }
                            </span>

                            {order.awb !==
                              "-" && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(
                                    order.awb,
                                    "AWB"
                                  )
                                }
                                className="text-slate-400 transition hover:text-blue-600"
                                title="Copy AWB"
                              >
                                <HiOutlineClipboardCopy className="text-[14px]" />
                              </button>
                            )}

                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            Pickup ID:{" "}
                            {
                              order.pickupId
                            }
                          </div>

                          <div className="mt-0.5 max-w-[170px] truncate text-[10px] text-slate-400">
                            {
                              order.courier
                            }
                          </div>

                        </td>

                        {/* CHARGE */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="text-[12px] font-semibold text-slate-700">
                            {order.charge !== null &&
                            order.charge !== undefined &&
                            Number.isFinite(
                              Number(order.charge)
                            )
                              ? `₹${Number(order.charge).toFixed(2)}`
                              : "—"}
                          </div>

                        </td>

                        {/* ROUTE */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="max-w-[180px] text-[10px] leading-[1.45] text-slate-600">
                            {
                              order.pickup
                            }
                          </div>

                          <div className="my-1 text-[10px] text-slate-300">
                            to
                          </div>

                          <div className="max-w-[180px] text-[10px] leading-[1.45] text-slate-600">
                            {
                              order.destination
                            }
                          </div>

                        </td>

                        {/* DATE */}

                        <td className="border-r border-slate-100 px-3 py-3 align-top">

                          <div className="text-[10px] leading-[1.45] text-slate-500">

                            <span className="font-medium text-slate-600">
                              {
                                order.status
                              }
                              :
                            </span>{" "}

                            {
                              order.date
                            }

                          </div>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-3 py-3 align-top">

                          <button
                            type="button"
                            onClick={() =>
                              setViewingOrder(order)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-blue-600 text-white transition hover:bg-blue-700"
                            title="View Order"
                            aria-label="View Order"
                          >
                            <HiOutlineEye className="text-[15px]" />
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-[11px] text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-700">
              {
                filteredOrders.length
              }
            </span>{" "}

            of{" "}

            <span className="font-semibold text-slate-700">
              {orders.length}
            </span>{" "}

            orders

          </div>

          {selectedOrders.length >
            0 && (
            <div className="text-[11px] font-medium text-blue-600">

              {
                selectedOrders.length
              }{" "}
              order
              {selectedOrders.length >
              1
                ? "s"
                : ""}{" "}
              selected

            </div>
          )}

        </div>

      </div>

      {/* ===================================================
          ORDER DETAILS MODAL
      =================================================== */}

      <OrderDetailsModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
};

export default AllOrders;