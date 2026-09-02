import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

// ======================================================
// COLORS
// ======================================================

const PRIMARY = "#008dd2";
const PURPLE = "#7052ff";

// ======================================================
// ICON
// ======================================================

const Icon = ({
  name,
  size = 17,
  strokeWidth = 1.8,
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "box":
      return (
        <svg {...common}>
          <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
          <path d="M3 8.5 12 13l9-4.5" />
          <path d="M12 13v7" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.9-4" />
          <path d="M4 4v4h4" />
          <path d="M4 13a8 8 0 0 0 14.9 4" />
          <path d="M20 20v-4h-4" />
        </svg>
      );

    case "printer":
      return (
        <svg {...common}>
          <path d="M6 9V3h12v6" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6z" />
          <path d="M17 12h1" />
        </svg>
      );

    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );

    default:
      return null;
  }
};

// ======================================================
// USER ID
// ======================================================

const getUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return (
      user?.id ||
      user?.user_id ||
      user?.userId ||
      null
    );
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return null;
  }
};

// ======================================================
// BASIC HELPERS
// ======================================================

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

// ======================================================
// CUSTOMER
// ======================================================

const getCustomerName = (order) => {
  return (
    order?.consignee_name ||
    order?.customer_name ||
    order?.customer ||
    order?.name ||
    "—"
  );
};

const getMobile = (order) => {
  return (
    order?.mobile ||
    order?.phone ||
    order?.phone_no ||
    order?.consignee_phone ||
    ""
  );
};

// ======================================================
// ORDER / AWB
// ======================================================

const getAWB = (order) => {
  return (
    order?.awb ||
    order?.waybill ||
    order?.awb_number ||
    "—"
  );
};

const getOrderId = (order) => {
  return (
    order?.order_id ||
    order?.id ||
    "—"
  );
};

// ======================================================
// SHIPMENT
// ======================================================

const getShipmentName = (order) => {
  return (
    order?.shipment ||
    order?.product_name ||
    order?.service_name ||
    order?.product ||
    "Shipment"
  );
};

const getServiceType = (order) => {
  return safeString(
    order?.service_type ||
      order?.service ||
      order?.mode ||
      "ROAD"
  )
    .trim()
    .toUpperCase();
};

// ======================================================
// PAYMENT
// ======================================================

const getPaymentType = (order) => {
  return safeString(
    order?.payment_type ||
      order?.payment ||
      order?.payment_mode ||
      "PREPAID"
  )
    .trim()
    .toUpperCase();
};

const getAmount = (order) => {
  const amount = Number(
    order?.total_amount ??
      order?.total ??
      order?.amount ??
      order?.shipping_charges ??
      0
  );

  return Number.isFinite(amount) ? amount : 0;
};

// ======================================================
// ROUTE
// ======================================================

const getPickupCity = (order) => {
  return (
    order?.pickup_city ||
    order?.warehouse_city ||
    order?.from_city ||
    order?.pickup_location ||
    "—"
  );
};

const getPickupPincode = (order) => {
  return (
    order?.pickup_pincode ||
    order?.warehouse_pincode ||
    order?.from_pincode ||
    ""
  );
};

const getDeliveryCity = (order) => {
  return (
    order?.city ||
    order?.delivery_city ||
    order?.to_city ||
    order?.destination_city ||
    "—"
  );
};

const getDeliveryPincode = (order) => {
  return (
    order?.pincode ||
    order?.delivery_pincode ||
    order?.to_pincode ||
    ""
  );
};

// ======================================================
// WEIGHT
// ======================================================

const getWeight = (order) => {
  const directWeight = Number(
    order?.total_weight ??
      order?.weight ??
      order?.shipment_weight
  );

  if (
    Number.isFinite(directWeight) &&
    directWeight >= 0
  ) {
    return directWeight;
  }

  if (Array.isArray(order?.packages)) {
    return order.packages.reduce(
      (total, pkg) => {
        const weight =
          Number(pkg?.weight) || 0;

        const count =
          Number(
            pkg?.package_count ??
              pkg?.count ??
              1
          ) || 1;

        return total + weight * count;
      },
      0
    );
  }

  return 0;
};

const getVolumetricWeight = (order) => {
  const value = Number(
    order?.volumetric_weight ??
      order?.vol_weight ??
      order?.volumetricWeight ??
      0
  );

  return Number.isFinite(value) ? value : 0;
};

const getPackageCount = (order) => {
  if (Array.isArray(order?.packages)) {
    return order.packages.reduce(
      (total, pkg) => {
        return (
          total +
          (
            Number(
              pkg?.package_count ??
                pkg?.count ??
                1
            ) || 1
          )
        );
      },
      0
    );
  }

  return (
    Number(
      order?.package_count ??
        order?.packages_count ??
        order?.boxes ??
        1
    ) || 1
  );
};

// ======================================================
// DATE
// ======================================================

const getCreatedAt = (order) => {
  return (
    order?.created_at ||
    order?.order_created_at ||
    order?.createdAt ||
    order?.manifested_at ||
    null
  );
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// ======================================================
// STATUS
// ======================================================

const getStatus = (order) => {
  return safeString(
    order?.status ||
      order?.order_status ||
      "PROCESSING"
  )
    .trim()
    .toUpperCase();
};

const getStatusLabel = (status) => {
  switch (status) {
    case "PROCESSING":
      return "Processing";

    case "MANIFESTED":
      return "Manifested";

    case "IN TRANSIT":
    case "IN_TRANSIT":
      return "In Transit";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";

    case "PENDING":
      return "Pending";

    default:
      return (
        status
          ?.toLowerCase()
          ?.replace(/\b\w/g, (char) =>
            char.toUpperCase()
          ) || "Processing"
      );
  }
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  let className =
    "bg-[#edf8ff] text-[#008dd2]";

  if (
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    className =
      "bg-red-50 text-red-600";
  } else if (
    status === "DELIVERED"
  ) {
    className =
      "bg-emerald-50 text-emerald-600";
  } else if (
    status === "IN TRANSIT" ||
    status === "IN_TRANSIT"
  ) {
    className =
      "bg-violet-50 text-violet-600";
  } else if (
    status === "PENDING"
  ) {
    className =
      "bg-amber-50 text-amber-600";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function AllOrders() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

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

  // ====================================================
  // FETCH ALL ORDERS
  // ====================================================

  const fetchAllOrders = async () => {
    const userId = getUserId();

    if (!userId) {
      setLoading(false);

      toast.error(
        "User ID is required"
      );

      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        "/orders/all",
        {
          params: {
            user_id: userId,
          },
        }
      );

      const data = response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch all orders"
        );
      }

      const list = Array.isArray(
        data?.orders
      )
        ? data.orders
        : [];

      setOrders(list);
      setSelectedIds([]);
    } catch (error) {
      console.error(
        "Get all orders error:",
        error
      );

      setOrders([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load all orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // ====================================================
  // FILTERED ORDERS
  // ====================================================

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const status =
        getStatus(order);

      const service =
        getServiceType(order);

      const payment =
        getPaymentType(order);

      const searchable = [
        getCustomerName(order),
        getMobile(order),
        getAWB(order),
        getOrderId(order),
        getShipmentName(order),
        getPickupCity(order),
        getDeliveryCity(order),
        status,
        service,
        payment,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch =
        !query ||
        searchable.includes(query);

      const statusMatch =
        statusFilter === "ALL" ||
        status === statusFilter;

      const serviceMatch =
        serviceFilter === "ALL" ||
        service === serviceFilter;

      const paymentMatch =
        paymentFilter === "ALL" ||
        payment === paymentFilter;

      return (
        searchMatch &&
        statusMatch &&
        serviceMatch &&
        paymentMatch
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    serviceFilter,
    paymentFilter,
  ]);

  // ====================================================
  // ORDER KEY
  // ====================================================

  const getOrderKey = (order) =>
    String(
      order?.id ??
        order?.order_id
    );

  // ====================================================
  // SELECTED ORDERS
  // ====================================================

  const selectedOrders = useMemo(
    () =>
      orders.filter((order) =>
        selectedIds.includes(
          getOrderKey(order)
        )
      ),
    [
      orders,
      selectedIds,
    ]
  );

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedIds.includes(
        getOrderKey(order)
      )
    );

  // ====================================================
  // SELECT ALL
  // ====================================================

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds =
        filteredOrders.map(
          getOrderKey
        );

      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !visibleIds.includes(id)
        )
      );

      return;
    }

    setSelectedIds((previous) => [
      ...new Set([
        ...previous,
        ...filteredOrders.map(
          getOrderKey
        ),
      ]),
    ]);
  };

  // ====================================================
  // SELECT SINGLE
  // ====================================================

  const handleSelect = (order) => {
    const id = getOrderKey(order);

    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [
        ...previous,
        id,
      ];
    });
  };

  // ====================================================
  // VIEW
  // ====================================================

  const handleView = (order) => {
    setViewingOrder(order);
  };

  // ====================================================
  // LABEL HTML
  // ====================================================

  const buildLabel = (order) => {
    const service =
      getServiceType(order);

    const address = [
      order?.address_line1,
      order?.address_line2,
      order?.city,
      order?.state,
    ]
      .filter(Boolean)
      .join(", ");

    return `
      <div
        style="
          width:420px;
          margin:0 auto 24px;
          padding:24px;
          border:1px solid #dbe3ef;
          border-radius:12px;
          font-family:Arial,sans-serif;
          color:#172033;
          page-break-after:always;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            border-bottom:1px solid #e8edf4;
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
                font-size:11px;
                color:#718096;
                margin-top:4px;
              "
            >
              Shipping Label
            </div>
          </div>

          <div
            style="
              font-size:12px;
              font-weight:700;
            "
          >
            AWB ${getAWB(order)}
          </div>
        </div>

        <div
          style="
            font-size:10px;
            color:#718096;
            margin-bottom:5px;
          "
        >
          CONSIGNEE
        </div>

        <div
          style="
            font-size:16px;
            font-weight:700;
          "
        >
          ${getCustomerName(order)}
        </div>

        <div
          style="
            font-size:12px;
            margin-top:5px;
            margin-bottom:16px;
          "
        >
          ${getMobile(order)}
        </div>

        <div
          style="
            background:#f7f9fc;
            border-radius:8px;
            padding:12px;
            margin-bottom:16px;
          "
        >
          <div
            style="
              font-size:10px;
              color:#718096;
              margin-bottom:5px;
            "
          >
            DELIVERY ADDRESS
          </div>

          <div
            style="
              font-size:12px;
              line-height:1.5;
            "
          >
            ${address || "—"}
            <br />
            ${getDeliveryPincode(order)}
          </div>
        </div>

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
          "
        >

          <div
            style="
              border:1px solid #e4eaf2;
              border-radius:8px;
              padding:10px;
            "
          >
            <div
              style="
                font-size:10px;
                color:#718096;
              "
            >
              SERVICE
            </div>

            <div
              style="
                font-size:12px;
                font-weight:700;
                margin-top:4px;
              "
            >
              ${service === "AIR"
                ? "By Air"
                : "By Road"}
            </div>
          </div>

          <div
            style="
              border:1px solid #e4eaf2;
              border-radius:8px;
              padding:10px;
            "
          >
            <div
              style="
                font-size:10px;
                color:#718096;
              "
            >
              WEIGHT
            </div>

            <div
              style="
                font-size:12px;
                font-weight:700;
                margin-top:4px;
              "
            >
              ${getWeight(order).toFixed(2)} Kg
            </div>
          </div>

        </div>

        <div
          style="
            margin-top:18px;
            padding-top:12px;
            border-top:1px dashed #cbd5e1;
            font-size:10px;
            color:#718096;
            text-align:center;
          "
        >
          ShipDrop • Handle with care
        </div>

      </div>
    `;
  };

  // ====================================================
  // PRINT LABELS
  // ====================================================

  const handlePrintLabels = () => {
    if (selectedOrders.length === 0) {
      toast.error(
        "Please select at least one order"
      );
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      toast.error(
        "Please allow pop-ups to print labels"
      );
      return;
    }

    const html = selectedOrders
      .map(buildLabel)
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            ShipDrop Shipping Labels
          </title>
        </head>

        <body
          style="
            margin:30px;
            background:#fff;
          "
        >
          ${html}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ====================================================
  // EXPORT CSV
  // ====================================================

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error(
        "No orders to export"
      );
      return;
    }

    const exportOrders =
      selectedOrders.length > 0
        ? selectedOrders
        : orders;

    const headers = [
      "AWB",
      "Order ID",
      "Customer",
      "Mobile",
      "Shipment",
      "Service Type",
      "From",
      "To",
      "Payment",
      "Weight (Kg)",
      "Status",
      "Created",
    ];

    const rows = exportOrders.map(
      (order) => [
        getAWB(order),
        getOrderId(order),
        getCustomerName(order),
        getMobile(order),
        getShipmentName(order),
        getServiceType(order),
        getPickupCity(order),
        getDeliveryCity(order),
        getPaymentType(order),
        getWeight(order).toFixed(2),
        getStatus(order),
        getCreatedAt(order) || "",
      ]
    );

    const escapeCsv = (value) => {
      const text = String(
        value ?? ""
      );

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      }

      return text;
    };

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `shipdrop-all-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success(
      `${exportOrders.length} ${
        exportOrders.length === 1
          ? "order"
          : "orders"
      } exported`
    );
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const totalOrders =
    orders.length;

  const processingCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "PROCESSING"
    ).length;

  const manifestedCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "MANIFESTED"
    ).length;

  const pendingCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "PENDING"
    ).length;

  const deliveredCount =
    orders.filter(
      (order) =>
        getStatus(order) ===
        "DELIVERED"
    ).length;

  const cancelledCount =
    orders.filter((order) => {
      const status =
        getStatus(order);

      return (
        status === "CANCELLED" ||
        status === "CANCELED"
      );
    }).length;

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] px-4 py-5">
        <div className="mx-auto max-w-[1450px]">

          <div className="mb-3 h-[92px] animate-pulse rounded-xl border border-slate-200 bg-white" />

          <div className="mb-3 h-[62px] animate-pulse rounded-xl border border-slate-200 bg-white" />

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="h-12 animate-pulse bg-slate-50" />

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-[86px] animate-pulse border-t border-slate-100"
                />
              )
            )}
          </div>

        </div>
      </div>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-[#f5f8fc] px-4 py-5">

      <div className="mx-auto max-w-[1450px]">

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background:
                    "#edf8ff",
                  color:
                    PRIMARY,
                }}
              >
                <Icon
                  name="box"
                  size={20}
                />
              </div>

              <div>

                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900">
                  All Orders
                </h1>

                <p className="mt-0.5 text-[12px] text-slate-400">
                  {totalOrders}{" "}
                  {totalOrders === 1
                    ? "shipment"
                    : "shipments"}{" "}
                  across all statuses
                </p>

              </div>

            </div>

            {/* TOP BUTTONS */}

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={
                  handlePrintLabels
                }
                disabled={
                  selectedOrders.length ===
                  0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#8fcce8] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#7fc2e1] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Icon
                  name="printer"
                  size={15}
                />

                Print Shipping Label
              </button>

              <button
                type="button"
                onClick={
                  handleExport
                }
                disabled={
                  orders.length === 0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#10b981] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  name="download"
                  size={15}
                />

                Export
              </button>

            </div>

          </div>

        </div>

        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">

          <div className="flex flex-wrap items-center gap-2">

            {/* SEARCH */}

            <div className="relative min-w-[280px] flex-1">

              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon
                  name="search"
                  size={15}
                />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search customer, AWB, Order ID or mobile..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/5"
              />

            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="PROCESSING">
                Processing
              </option>

              <option value="MANIFESTED">
                Manifested
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN TRANSIT">
                In Transit
              </option>

              <option value="DELIVERED">
                Delivered
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            {/* SERVICE */}

            <select
              value={serviceFilter}
              onChange={(e) =>
                setServiceFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Services
              </option>

              <option value="ROAD">
                Road
              </option>

              <option value="AIR">
                Air
              </option>
            </select>

            {/* PAYMENT */}

            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value
                )
              }
              className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">
                All Payment
              </option>

              <option value="PREPAID">
                Prepaid
              </option>

              <option value="COD">
                COD
              </option>
            </select>

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                fetchAllOrders
              }
              title="Refresh"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Icon
                name="refresh"
                size={15}
              />
            </button>

          </div>

        </div>

        {/* ==================================================
            SMALL SUMMARY
        ================================================== */}

        
        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1120px] border-collapse">

              {/* TABLE HEADER */}

              <thead>

                <tr className="border-b border-slate-200 bg-white">

                  <th className="w-[52px] px-4 py-3.5 text-left">

                    <button
                      type="button"
                      onClick={
                        handleSelectAll
                      }
                      className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                        allVisibleSelected
                          ? "border-[#008dd2] bg-[#008dd2] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Icon
                        name="check"
                        size={11}
                      />
                    </button>

                  </th>

                  <th className="w-[190px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Customer
                  </th>

                  <th className="w-[175px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Shipment
                  </th>

                  <th className="w-[165px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Route
                  </th>

                  <th className="w-[145px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Payment
                  </th>

                  <th className="w-[125px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Weight
                  </th>

                  <th className="w-[155px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Created
                  </th>

                  <th className="w-[105px] px-3 py-3.5 text-left text-[12px] font-medium text-slate-700">
                    Actions
                  </th>

                </tr>

              </thead>

              {/* TABLE BODY */}

              <tbody>

                {filteredOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="h-[300px] px-6 text-center"
                    >

                      <div className="flex flex-col items-center justify-center">

                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                          <Icon
                            name="box"
                            size={21}
                          />
                        </div>

                        <div className="text-sm font-medium text-slate-700">
                          {orders.length > 0
                            ? "No matching orders"
                            : "No orders found"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {orders.length > 0
                            ? "Try changing your search or filters."
                            : "Orders will appear here after they are created."}
                        </div>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredOrders.map(
                    (order) => {

                      const id =
                        getOrderKey(order);

                      const selected =
                        selectedIds.includes(
                          id
                        );

                      const service =
                        getServiceType(order);

                      const payment =
                        getPaymentType(order);

                      const weight =
                        getWeight(order);

                      const status =
                        getStatus(order);

                      const awb =
                        getAWB(order);

                      return (

                        <tr
                          key={id}
                          className={`border-b border-slate-100 transition last:border-b-0 ${
                            selected
                              ? "bg-[#f8fcff]"
                              : "bg-white"
                          } hover:bg-slate-50`}
                        >

                          {/* CHECKBOX */}

                          <td className="px-4 py-3">

                            <button
                              type="button"
                              onClick={() =>
                                handleSelect(
                                  order
                                )
                              }
                              className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                                selected
                                  ? "border-[#008dd2] bg-[#008dd2] text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Icon
                                name="check"
                                size={11}
                              />
                            </button>

                          </td>

                          {/* ==================================
                              CUSTOMER
                          ================================== */}

                          <td className="px-3 py-3">

                            <div className="min-w-0">

                              <p className="truncate text-[13px] font-semibold text-slate-800">
                                {getCustomerName(
                                  order
                                )}
                              </p>

                              {getMobile(
                                order
                              ) && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {getMobile(
                                    order
                                  )}
                                </p>
                              )}

                              <div className="mt-1.5">

                                <StatusBadge
                                  status={status}
                                />

                              </div>

                            </div>

                          </td>

                          {/* ==================================
                              SHIPMENT
                          ================================== */}

                          <td className="px-3 py-3">

                            <div className="min-w-0">

                             {status !== "PROCESSING" && (
  <>
    <p className="truncate text-[13px] font-semibold text-slate-800">
      {awb}
    </p>

    <p className="mt-0.5 text-[10px] text-slate-400">
      Pickup ID:{" "}
      {order?.pickup_id ||
        order?.pickupId ||
        ""}
    </p>
  </>
)}

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {getShipmentName(
                                  order
                                )}{" "}
                                -{" "}
                                {service ===
                                "AIR"
                                  ? "Air"
                                  : "Road"}
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              ROUTE
                          ================================== */}

                          <td className="px-3 py-3">

                            <div>

                              <p className="text-[12px] font-medium text-slate-700">

                                {getPickupCity(
                                  order
                                )}

                                {getPickupPincode(
                                  order
                                ) && (
                                  <span className="text-[10px] text-slate-400">
                                    {" "}
                                    (
                                    {getPickupPincode(
                                      order
                                    )}
                                    )
                                  </span>
                                )}

                              </p>

                              <p className="my-0.5 text-[10px] text-slate-300">
                                ↓
                              </p>

                              <p className="text-[12px] font-medium text-slate-700">

                                {getDeliveryCity(
                                  order
                                )}

                                {getDeliveryPincode(
                                  order
                                ) && (
                                  <span className="text-[10px] text-slate-400">
                                    {" "}
                                    (
                                    {getDeliveryPincode(
                                      order
                                    )}
                                    )
                                  </span>
                                )}

                              </p>

                              <p className="mt-1 text-[9px] text-slate-400">

                                {getPickupPincode(
                                  order
                                ) ||
                                "—"}{" "}
                                →{" "}
                                {getDeliveryPincode(
                                  order
                                ) ||
                                  "—"}

                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              PAYMENT
                          ================================== */}

                          <td className="px-3 py-3">

                            <div>

                              <p
                                className={`text-[12px] font-semibold ${
                                  payment ===
                                  "COD"
                                    ? "text-amber-600"
                                    : "text-[#008dd2]"
                                }`}
                              >
                                {payment}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {payment ===
                                "COD"
                                  ? "Cash on Delivery"
                                  : "Prepaid"}
                              </p>

                              <p className="text-[10px] text-slate-400">
                                Total: ₹
                                {getAmount(
                                  order
                                ).toFixed(2)}
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              WEIGHT
                          ================================== */}

                          <td className="px-3 py-3">

                            <div>

                              <p className="text-[12px] font-semibold text-slate-700">
                                Box:{" "}
                                {getPackageCount(
                                  order
                                )}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Wt:{" "}
                                {weight.toFixed(
                                  2
                                )}{" "}
                                kg
                              </p>

                              <p className="text-[10px] text-slate-400">
                                Vol:{" "}
                                {getVolumetricWeight(
                                  order
                                ).toFixed(
                                  2
                                )}{" "}
                                kg
                              </p>

                            </div>

                          </td>

                          {/* ==================================
                              CREATED
                          ================================== */}

                          <td className="px-3 py-3">

                            <p className="text-[12px] font-medium text-slate-700">
                              #
                              {getOrderId(
                                order
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">

                              {status ===
                              "MANIFESTED"
                                ? "Manifested: "
                                : "Created: "}

                              {formatDate(
                                getCreatedAt(
                                  order
                                )
                              )}

                            </p>

                            <p className="text-[10px] text-slate-400">
                              {formatTime(
                                getCreatedAt(
                                  order
                                )
                              )}
                            </p>

                          </td>

                          {/* ==================================
                              ACTIONS
                          ================================== */}

                          <td className="px-3 py-3">

                            <div className="flex items-center gap-1.5">

                              {/* PRINT */}

                              <button
                                type="button"
                                onClick={() => {

                                  const printWindow =
                                    window.open(
                                      "",
                                      "_blank",
                                      "width=900,height=700"
                                    );

                                  if (
                                    !printWindow
                                  ) {
                                    toast.error(
                                      "Please allow pop-ups to print labels"
                                    );
                                    return;
                                  }

                                  printWindow.document.write(`
                                    <!DOCTYPE html>
                                    <html>
                                      <head>
                                        <title>
                                          ShipDrop Shipping Label
                                        </title>
                                      </head>

                                      <body
                                        style="
                                          margin:30px;
                                          background:#fff;
                                        "
                                      >
                                        ${buildLabel(
                                          order
                                        )}
                                      </body>
                                    </html>
                                  `);

                                  printWindow.document.close();
                                  printWindow.focus();

                                  setTimeout(
                                    () =>
                                      printWindow.print(),
                                    300
                                  );

                                }}
                                title="Print Shipping Label"
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#b9dff0] bg-white text-[#008dd2] transition hover:bg-[#edf8ff]"
                              >
                                <Icon
                                  name="printer"
                                  size={15}
                                />
                              </button>

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    order
                                  )
                                }
                                title="View Order"
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[#008dd2] hover:bg-[#edf8ff] hover:text-[#008dd2]"
                              >
                                <Icon
                                  name="eye"
                                  size={15}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          {orders.length > 0 && (

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#fafbfc] px-5 py-3">

              <p className="text-[11px] text-slate-400">

                Showing{" "}

                <span className="font-semibold text-slate-600">
                  {filteredOrders.length}
                </span>{" "}

                of{" "}

                <span className="font-semibold text-slate-600">
                  {orders.length}
                </span>{" "}

                orders

              </p>

              <p className="text-[11px] text-slate-400">

                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : "Select orders to perform actions"}

              </p>

            </div>

          )}

        </div>

      </div>

      {/* ====================================================
          VIEW ORDER MODAL
      ==================================================== */}

      {viewingOrder && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]"
          onClick={() =>
            setViewingOrder(null)
          }
        >

          <div
            className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="text-[16px] font-semibold text-slate-900">
                  Order Details
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Order #
                  {getOrderId(
                    viewingOrder
                  )}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingOrder(
                    null
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon
                  name="x"
                  size={17}
                />
              </button>

            </div>

            {/* BODY */}

            <div className="max-h-[70vh] overflow-y-auto p-5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getCustomerName(
                      viewingOrder
                    )}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {getMobile(
                      viewingOrder
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    AWB
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getAWB(
                      viewingOrder
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Shipment
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getShipmentName(
                      viewingOrder
                    )}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {getServiceType(
                      viewingOrder
                    ) === "AIR"
                      ? "By Air"
                      : "By Road"}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Payment
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-slate-800">
                    {getPaymentType(
                      viewingOrder
                    )}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    ₹
                    {getAmount(
                      viewingOrder
                    ).toFixed(2)}
                  </p>

                </div>

              </div>

              {/* ADDRESS */}

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">

                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Delivery Address
                </p>

                <p className="mt-1 text-[13px] font-medium leading-6 text-slate-700">

                  {[
                    viewingOrder?.address_line1,
                    viewingOrder?.address_line2,
                    viewingOrder?.city,
                    viewingOrder?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "—"}

                  {viewingOrder?.pincode
                    ? ` - ${viewingOrder.pincode}`
                    : ""}

                </p>

              </div>

              {/* ROUTE */}

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">

                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Route
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <div className="rounded-lg bg-[#edf8ff] px-3 py-2 text-[12px] font-semibold text-[#008dd2]">
                    {getPickupCity(
                      viewingOrder
                    )}
                  </div>

                  <span className="text-slate-300">
                    →
                  </span>

                  <div className="rounded-lg bg-[#f0ecff] px-3 py-2 text-[12px] font-semibold text-[#7052ff]">
                    {getDeliveryCity(
                      viewingOrder
                    )}
                  </div>

                </div>

              </div>

              {/* WEIGHT / STATUS */}

              <div className="mt-3 grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-slate-200 p-3">

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Weight
                  </p>

                  <p className="mt-1 text-[15px] font-semibold text-slate-800">
                    {getWeight(
                      viewingOrder
                    ).toFixed(2)}{" "}
                    Kg
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 p-3">

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={getStatus(
                        viewingOrder
                      )}
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-[#fafbfc] px-5 py-3">

              <button
                type="button"
                onClick={() =>
                  setViewingOrder(
                    null
                  )
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {

                  const order =
                    viewingOrder;

                  setViewingOrder(
                    null
                  );

                  const printWindow =
                    window.open(
                      "",
                      "_blank",
                      "width=900,height=700"
                    );

                  if (!printWindow) {
                    toast.error(
                      "Please allow pop-ups to print labels"
                    );
                    return;
                  }

                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>
                          ShipDrop Shipping Label
                        </title>
                      </head>

                      <body
                        style="
                          margin:30px;
                          background:#fff;
                        "
                      >
                        ${buildLabel(
                          order
                        )}
                      </body>
                    </html>
                  `);

                  printWindow.document.close();
                  printWindow.focus();

                  setTimeout(
                    () =>
                      printWindow.print(),
                    300
                  );

                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#008dd2] px-4 text-[12px] font-medium text-white hover:bg-[#007dbb]"
              >
                <Icon
                  name="printer"
                  size={14}
                />

                Print Label
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AllOrders;