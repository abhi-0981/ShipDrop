import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineFilter,
} from "react-icons/hi";

import toast from "react-hot-toast";

import api from "../../services/api";

/* =========================================================
   USER ID
========================================================= */

const getUserId = () => {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return (
      user?.id ??
      user?.user_id ??
      user?.userId ??
      null
    );
  } catch (error) {
    console.error(
      "Unable to read user:",
      error
    );

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

  if (
    value === "CANCELLED" ||
    value === "CANCELED"
  ) {
    return "Cancelled";
  }

  return status
    ? String(status)
    : "Unknown";
};

/* =========================================================
   GET ACTUAL ORDER STATUS
========================================================= */

const getOrderStatus = (order) => {
  const trackingStatus = String(
    order?.tracking_status || ""
  )
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
    order?.status ??
    order?.order_status ??
    order?.tracking_status ??
    "";

  return normalizeStatus(status);
};

/* =========================================================
   NDR / PENDING CHECK
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
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
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
          part !== undefined &&
          part !== null &&
          String(part).trim() !== ""
      )
      .map((part) =>
        String(part).trim()
      )
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
      ""
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
    order?.payment_type ||
      order?.paymentType ||
      order?.payment ||
      "-"
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
  return (
    order?.awb ||
    order?.waybill ||
    order?.AWB ||
    "-"
  );
};

/* =========================================================
   ORDER ID
========================================================= */

const getOrderId = (order) => {
  return (
    order?.order_id ||
    order?.id ||
    "-"
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
}) => {
  const styles = {
    NDR:
      "bg-rose-50 text-rose-600 border-rose-100",

    Pending:
      "bg-amber-50 text-amber-600 border-amber-100",

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
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        styles[status] ||
        "bg-slate-50 text-slate-600 border-slate-200"
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

const DetailRow = ({
  label,
  value,
  strong = false,
}) => {
  return (
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
};

/* =========================================================
   DETAIL CARD
========================================================= */

const DetailCard = ({
  title,
  children,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-[12px] font-semibold text-slate-800">
        {title}
      </h3>

      {children}
    </div>
  );
};

/* =========================================================
   ORDER DETAILS MODAL
========================================================= */

const OrderDetailsModal = ({
  order,
  onClose,
}) => {
  if (!order) {
    return null;
  }

  const status =
    getOrderStatus(order);

  const charge =
    getCharge(order);

  const service =
    getServiceType(order);

  const buyerAddress =
    buildAddress(
      order?.address_line1,
      order?.address_line2,
      order?.floor_no
        ? `Floor ${order.floor_no}`
        : null,
      order?.landmark
        ? `Landmark: ${order.landmark}`
        : null,
      order?.city,
      order?.state,
      order?.pincode,
      order?.country
    );

  const pickupAddress =
    buildAddress(
      order?.pickup_address,
      order?.pickup_address_line1,
      order?.pickup_address_line2,
      order?.pickup_city,
      order?.pickup_state,
      order?.pickup_pincode
    );

  const warehouseAddress =
    buildAddress(
      order?.warehouse_address_line1,
      order?.warehouse_address_line2,
      order?.warehouse_city,
      order?.warehouse_state,
      order?.warehouse_pincode,
      order?.warehouse_country
    );

  const rtoAddress =
    buildAddress(
      order?.return_address_line1,
      order?.return_address_line2,
      order?.return_floor_no
        ? `Floor ${order.return_floor_no}`
        : null,
      order?.return_landmark
        ? `Landmark: ${order.return_landmark}`
        : null,
      order?.return_city,
      order?.return_state,
      order?.return_pincode,
      order?.return_country
    );

  const product =
    order?.product_name ||
    order?.products?.[0]?.product_name ||
    "-";

  const sku =
    order?.sku ||
    order?.products?.[0]?.sku ||
    "-";

  const quantity =
    order?.qty ??
    order?.quantity ??
    order?.products?.[0]?.qty ??
    order?.products?.[0]?.quantity;

  const weight =
    order?.weight ??
    order?.total_weight ??
    order?.packages?.[0]?.weight;

  const packageCount =
    order?.package_count ??
    order?.packages?.[0]?.package_count ??
    order?.packages?.[0]?.count;

  const length =
    order?.length ??
    order?.packages?.[0]?.length;

  const width =
    order?.width ??
    order?.packages?.[0]?.width;

  const height =
    order?.height ??
    order?.packages?.[0]?.height;

  const productPrice =
    order?.price ??
    order?.products?.[0]?.price;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
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

                <h2 className="truncate text-[15px] font-semibold text-slate-800">
                  {getOrderId(order)}
                </h2>

                <StatusBadge
                  status={status}
                />

              </div>

              <p className="mt-0.5 text-[10px] text-slate-400">
                AWB {valueOrDash(getAWB(order))}
              </p>

            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[18px] leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>

        </div>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] p-3">

          {/* SHIPMENT + CUSTOMER */}

          <div className="mb-3 grid gap-3 lg:grid-cols-2">

            <DetailCard title="Shipment">

              <div className="grid grid-cols-2 gap-x-5">

                <DetailRow
                  label="Order ID"
                  value={getOrderId(order)}
                  strong
                />

                <DetailRow
                  label="AWB"
                  value={getAWB(order)}
                  strong
                />

                <DetailRow
                  label="Pickup ID"
                  value={
                    order?.pickup_address_id
                  }
                />

                <DetailRow
                  label="Manifest ID"
                  value={
                    order?.manifest_id
                  }
                />

                <DetailRow
                  label="Service"
                  value={service}
                  strong
                />

                <DetailRow
                  label="Status"
                  value={status}
                  strong
                />

              </div>

            </DetailCard>

            <DetailCard title="Customer & Payment">

              <div className="grid grid-cols-2 gap-x-5">

                <DetailRow
                  label="Customer"
                  value={getCustomerName(order)}
                  strong
                />

                <DetailRow
                  label="UID"
                  value={order?.user_id}
                />

                <DetailRow
                  label="Mobile"
                  value={
                    order?.mobile ||
                    order?.phone
                  }
                />

                <DetailRow
                  label="Email"
                  value={order?.email}
                />

                <DetailRow
                  label="Payment"
                  value={
                    order?.payment_type ||
                    order?.payment
                  }
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
                    order?.order_value ??
                    order?.total_amount ??
                    order?.total_value
                  }
                />

                <DetailRow
                  label="COD Amount"
                  value={
                    order?.cod_amount ??
                    order?.cod_value ??
                    order?.codAmount
                  }
                />

              </div>

            </DetailCard>

          </div>

          {/* ADDRESSES */}

          <div className="mb-3 grid gap-3 lg:grid-cols-2">

            {/* BUYER */}

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
                  value={
                    order?.consignee_name ||
                    order?.customer_name
                  }
                  strong
                />

                <DetailRow
                  label="Phone"
                  value={
                    order?.mobile ||
                    order?.phone
                  }
                />

                <DetailRow
                  label="Alt Phone"
                  value={
                    order?.alternate_mobile
                  }
                />

                <DetailRow
                  label="Email"
                  value={order?.email}
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

            {/* PICKUP */}

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
                    order?.pickup_contact_name ||
                    order?.warehouse_contact_name ||
                    order?.contact_name
                  }
                  strong
                />

                <DetailRow
                  label="Phone"
                  value={
                    order?.pickup_phone ||
                    order?.warehouse_phone ||
                    order?.phone
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
                  value={buildAddress(
                    order?.pickup_city,
                    order?.pickup_state,
                    order?.pickup_pincode
                  )}
                />

                <DetailRow
                  label="Delivery"
                  value={buildAddress(
                    order?.city,
                    order?.state,
                    order?.pincode
                  )}
                />

                <DetailRow
                  label="Distance"
                  value={
                    order?.distance_km !==
                      undefined &&
                    order?.distance_km !==
                      null
                      ? `${order.distance_km} km`
                      : order?.distance
                        ? `${order.distance} km`
                        : "-"
                  }
                />

                <DetailRow
                  label="Zone"
                  value={order?.zone}
                />

              </div>

            </DetailCard>

            <DetailCard title="Package & Product">

              <div className="grid grid-cols-2 gap-x-5">

                <DetailRow
                  label="Weight"
                  value={
                    weight !==
                      undefined &&
                    weight !== null
                      ? `${weight} kg`
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
                    length !== undefined &&
                    width !== undefined &&
                    height !== undefined
                      ? `${length} × ${width} × ${height}`
                      : "-"
                  }
                />

                <DetailRow
                  label="Product"
                  value={product}
                  strong
                />

                <DetailRow
                  label="SKU"
                  value={sku}
                />

                <DetailRow
                  label="Quantity"
                  value={quantity}
                />

                <DetailRow
                  label="Product Price"
                  value={
                    productPrice !==
                      undefined &&
                    productPrice !==
                      null
                      ? `₹${Number(
                          productPrice
                        ).toFixed(2)}`
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
                    order?.warehouse_name ||
                    order?.warehouse?.warehouse_name
                  }
                  strong
                />

                <DetailRow
                  label="Contact"
                  value={
                    order?.warehouse_contact_name ||
                    order?.warehouse?.contact_name
                  }
                />

                <DetailRow
                  label="Phone"
                  value={
                    order?.warehouse_phone ||
                    order?.warehouse?.phone
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
                  value={order?.return_name}
                />

                <DetailRow
                  label="Phone"
                  value={order?.return_phone}
                />

                <DetailRow
                  label="Email"
                  value={order?.return_email}
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
                value={getOrderId(order)}
                strong
              />

              <DetailRow
                label="Status"
                value={status}
              />

              <DetailRow
                label="Tracking Status"
                value={
                  order?.tracking_status
                }
              />

              <DetailRow
                label="Created"
                value={
                  order?.created_at
                    ? formatDate(
                        order.created_at
                      )
                    : "-"
                }
              />

              <DetailRow
                label="Manifested"
                value={
                  order?.manifest_created_at
                    ? formatDate(
                        order.manifest_created_at
                      )
                    : "-"
                }
              />

              <DetailRow
                label="Tracking Updated"
                value={
                  order?.tracking_updated_at
                    ? formatDate(
                        order.tracking_updated_at
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
   MAIN COMPONENT
========================================================= */

function Pending() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [serviceFilter, setServiceFilter] =
    useState("ALL");

  const [paymentFilter, setPaymentFilter] =
    useState("ALL");

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [viewingOrder, setViewingOrder] =
    useState(null);

  /* =======================================================
     FETCH USER ORDERS
  ======================================================= */

  const fetchOrders = async () => {
    const userId =
      getUserId();

    if (!userId) {
      setOrders([]);
      setLoading(false);
      setError("User ID is required");

      toast.error(
        "User ID is required"
      );

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

      const response =
        await api.get(
          "/orders/all",
          {
            params: {
              user_id: userId,
            },
          }
        );

      const data =
        response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch orders"
        );
      }

      const list =
        Array.isArray(
          data?.orders
        )
          ? data.orders
          : [];

      /*
        Keep only NDR/PENDING here.
        This means even if /orders/all
        returns every order, this page
        will only show NDR + Pending.
      */

      const filteredList =
        list.filter(
          isNdrOrPending
        );

      /*
        Remove duplicate rows
        caused by joins.
      */

      const uniqueOrders =
        Array.from(
          new Map(
            filteredList.map(
              (order) => [
                String(
                  order?.id ??
                    order?.order_id
                ),
                order,
              ]
            )
          ).values()
        );

      setOrders(
        uniqueOrders
      );

      setSelectedIds([]);

    } catch (err) {
      console.error(
        "Get NDR/Pending orders error:",
        err
      );

      setOrders([]);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load orders";

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

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const status =
            getOrderStatus(
              order
            );

          const service =
            getServiceType(
              order
            );

          const payment =
            getPaymentType(
              order
            );

          const searchable = [
            getOrderId(
              order
            ),
            order?.id,
            getAWB(
              order
            ),
            getCustomerName(
              order
            ),
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
            .filter(
              (value) =>
                value !==
                  undefined &&
                value !== null
            )
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            status ===
              statusFilter;

          const matchesService =
            serviceFilter ===
              "ALL" ||
            service ===
              serviceFilter;

          const matchesPayment =
            paymentFilter ===
              "ALL" ||
            payment ===
              paymentFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesService &&
            matchesPayment
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
      serviceFilter,
      paymentFilter,
    ]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const ndrCount =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            getOrderStatus(
              order
            ) === "NDR"
        ).length,
      [orders]
    );

  const pendingCount =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            getOrderStatus(
              order
            ) === "Pending"
        ).length,
      [orders]
    );

  /* =======================================================
     SERVICES
  ======================================================= */

  const services =
    useMemo(() => {
      return [
        ...new Set(
          orders
            .map(
              getServiceType
            )
            .filter(
              (value) =>
                value &&
                value !== "-"
            )
        ),
      ];
    }, [orders]);

  /* =======================================================
     PAYMENT TYPES
  ======================================================= */

 const payments =
  useMemo(() => {
    const dynamicPayments = orders
      .map(getPaymentType)
      .filter(
        (value) =>
          value &&
          value !== "-"
      );

    return [
      "PREPAID",
      "COD",
      ...dynamicPayments.filter(
        (value) =>
          value !== "PREPAID" &&
          value !== "COD"
      ),
    ];
  }, [orders]);

  /* =======================================================
     SELECTED
  ======================================================= */

  const getOrderKey =
    (order) =>
      String(
        order?.id ??
          order?.order_id
      );

  const allVisibleSelected =
    filteredOrders.length >
      0 &&
    filteredOrders.every(
      (order) =>
        selectedIds.includes(
          getOrderKey(order)
        )
    );

  const selectedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            selectedIds.includes(
              getOrderKey(order)
            )
        ),
      [
        orders,
        selectedIds,
      ]
    );

  /* =======================================================
     SELECT ALL
  ======================================================= */

  const handleSelectAll =
    () => {
      if (
        allVisibleSelected
      ) {
        const visibleIds =
          filteredOrders.map(
            getOrderKey
          );

        setSelectedIds(
          (previous) =>
            previous.filter(
              (id) =>
                !visibleIds.includes(
                  id
                )
            )
        );

        return;
      }

      const visibleIds =
        filteredOrders.map(
          getOrderKey
        );

      setSelectedIds(
        (previous) => [
          ...new Set([
            ...previous,
            ...visibleIds,
          ]),
        ]
      );
    };

  /* =======================================================
     SELECT ONE
  ======================================================= */

  const handleSelect =
    (order) => {
      const id =
        getOrderKey(order);

      setSelectedIds(
        (previous) =>
          previous.includes(id)
            ? previous.filter(
                (item) =>
                  item !== id
              )
            : [
                ...previous,
                id,
              ]
      );
    };

  /* =======================================================
     COPY
  ======================================================= */

  const copyText = async (
    text,
    label
  ) => {
    if (
      !text ||
      text === "-"
    ) {
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

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter(
        "ALL"
      );
      setServiceFilter(
        "ALL"
      );
      setPaymentFilter(
        "ALL"
      );
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
              NDR & Pending
            </h1>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {orders.length}
            </span>

          </div>

          <p className="mt-1 text-[12px] text-slate-500">
            Manage NDR and Pending orders
          </p>

        </div>

        <div className="flex items-center gap-2">

          {selectedOrders.length >
            0 && (
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
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset
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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search Order ID, AWB, Customer, UID or Pickup ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />

          </div>

          {/* STATUS */}

          <div className="relative">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-10 min-w-[145px] appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-medium text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="NDR">
                NDR
              </option>

              <option value="Pending">
                Pending
              </option>
            </select>

            <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400" />

          </div>


       

          {/* PAYMENT */}

          <div className="relative">

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
              className="h-10 min-w-[135px] appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-medium text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Payment
              </option>

              {payments.map(
                (payment) => (
                  <option
                    key={payment}
                    value={payment}
                  >
                    {payment}
                  </option>
                )
              )}
            </select>

            <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400" />

          </div>

          <div className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-medium text-slate-400">

            <HiOutlineFilter />

            {filteredOrders.length}
            {" "}
            results

          </div>

        </div>

      </div>

      {/* =================================================
          STATUS SUMMARY
      ================================================= */}

      <div className="mb-4 flex items-center gap-2">

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "ALL"
            )
          }
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
            statusFilter ===
            "ALL"
              ? "border-blue-200 bg-blue-50 text-[#008dd2]"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          All Orders

          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
            {orders.length}
          </span>

        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "NDR"
            )
          }
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
            statusFilter ===
            "NDR"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          NDR

          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
            {ndrCount}
          </span>

        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "Pending"
            )
          }
          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
            statusFilter ===
            "Pending"
              ? "border-amber-200 bg-amber-50 text-amber-600"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          Pending

          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
            {pendingCount}
          </span>

        </button>

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

            <div className="mt-0.5 text-[11px] text-red-500">
              {error}
            </div>

          </div>

          <button
            type="button"
            onClick={
              fetchOrders
            }
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

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] border-collapse">

            <thead>

              <tr className="border-b border-slate-200 bg-[#fbfcfe]">

                <th className="w-[48px] px-3 py-3 text-left">

                  <input
                    type="checkbox"
                    checked={
                      allVisibleSelected
                    }
                    onChange={
                      handleSelectAll
                    }
                    disabled={
                      filteredOrders.length ===
                      0
                    }
                    className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                  />

                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  AWB
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Charge
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Route
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="w-[60px] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                    <div className="mt-3 text-[12px] font-medium text-slate-500">
                      Loading orders...
                    </div>

                  </td>

                </tr>
              ) : filteredOrders.length ===
                0 ? (
                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                      <HiOutlineSearch className="text-[21px]" />
                    </div>

                    <div className="mt-3 text-[13px] font-semibold text-slate-700">
                      No orders found
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      Try changing your search or filters.
                    </div>

                    {(search ||
                      statusFilter !==
                        "ALL" ||
                      serviceFilter !==
                        "ALL" ||
                      paymentFilter !==
                        "ALL") && (
                      <button
                        type="button"
                        onClick={
                          resetFilters
                        }
                        className="mt-3 text-[11px] font-semibold text-[#008dd2] hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}

                  </td>

                </tr>
              ) : (
                filteredOrders.map(
                  (order) => {
                    const orderKey =
                      getOrderKey(
                        order
                      );

                    const status =
                      getOrderStatus(
                        order
                      );

                    const charge =
                      getCharge(
                        order
                      );

                    const service =
                      getServiceType(
                        order
                      );

                    const payment =
                      getPaymentType(
                        order
                      );

                    const pickup =
                      buildAddress(
                        order?.pickup_city,
                        order?.pickup_state,
                        order?.pickup_pincode
                      );

                    const delivery =
                      buildAddress(
                        order?.city,
                        order?.state,
                        order?.pincode
                      );

                    return (
                      <tr
                        key={
                          orderKey
                        }
                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/60"
                      >

                        {/* CHECKBOX */}

                        <td className="px-3 py-3">

                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              orderKey
                            )}
                            onChange={() =>
                              handleSelect(
                                order
                              )
                            }
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#008dd2]"
                          />

                        </td>

                        {/* ORDER */}

                        <td className="px-3 py-3">

                          <div className="flex flex-col">

                            <span className="text-[11px] font-semibold text-slate-700">
                              {getOrderId(
                                order
                              )}
                            </span>

                            <span className="mt-0.5 text-[9px] text-slate-400">
                              UID:{" "}
                              {valueOrDash(
                                order?.user_id
                              )}
                            </span>

                          </div>

                        </td>

                        {/* CUSTOMER */}

                        <td className="px-3 py-3">

                          <div className="max-w-[155px]">

                            <div className="truncate text-[11px] font-medium text-slate-700">
                              {getCustomerName(
                                order
                              )}
                            </div>

                            <div className="mt-0.5 truncate text-[9px] text-slate-400">
                              {valueOrDash(
                                order?.mobile ||
                                  order?.phone
                              )}
                            </div>

                          </div>

                        </td>

                        {/* AWB */}

                        <td className="px-3 py-3">

                          <div className="flex items-center gap-1">

                            <span className="text-[10px] font-medium text-slate-600">
                              {valueOrDash(
                                getAWB(
                                  order
                                )
                              )}
                            </span>

                            {getAWB(
                              order
                            ) !== "-" && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(
                                    getAWB(
                                      order
                                    ),
                                    "AWB"
                                  )
                                }
                                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#008dd2]"
                                title="Copy AWB"
                              >
                                <HiOutlineClipboardCopy className="text-[12px]" />
                              </button>
                            )}

                          </div>

                        </td>

                        {/* CHARGE */}

                        <td className="px-3 py-3">

                          <div className="text-[11px] font-semibold text-slate-700">
                            {charge !==
                            null
                              ? `₹${charge.toFixed(
                                  2
                                )}`
                              : "-"}
                          </div>

                          <div className="mt-0.5 text-[9px] text-slate-400">
                            {service}
                          </div>

                        </td>

                        {/* ROUTE */}

                        <td className="px-3 py-3">

                          <div className="max-w-[185px]">

                            <div className="truncate text-[10px] font-medium text-slate-600">
                              {pickup}
                            </div>

                            <div className="my-0.5 text-[8px] text-slate-300">
                              ↓
                            </div>

                            <div className="truncate text-[10px] font-medium text-slate-600">
                              {delivery}
                            </div>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-3 py-3">

                          <div className="flex flex-col items-start gap-1">

                            <StatusBadge
                              status={
                                status
                              }
                            />

                            <span className="text-[8px] text-slate-400">
                              {payment}
                            </span>

                          </div>

                        </td>

                        {/* DATE */}

                        <td className="px-3 py-3">

                          <span className="text-[10px] font-medium text-slate-500">
                            {formatDate(
                              order?.created_at
                            )}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-3 py-3 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              setViewingOrder(
                                order
                              )
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[#008dd2]/30 hover:bg-blue-50 hover:text-[#008dd2]"
                            title="View order details"
                          >
                            <HiOutlineEye className="text-[14px]" />
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

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {viewingOrder && (
        <OrderDetailsModal
          order={
            viewingOrder
          }
          onClose={() =>
            setViewingOrder(
              null
            )
          }
        />
      )}

    </div>
  );
}

export default Pending;