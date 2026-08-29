import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";


// ======================================================
// ICONS
// ======================================================

const CheckIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);


const PackageIcon = ({ size = 19 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21 8-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v9l9 5 9-5V8" />
    <path d="M12 13v9" />
  </svg>
);


const PrinterIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 14h12v7H6z" />
    <path d="M18 12h.01" />
  </svg>
);


const DownloadIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);


const XIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);


const LocationIcon = ({
  size = 14,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);


// ======================================================
// HELPERS
// ======================================================

const getUserId = () => {

  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {

    const user =
      JSON.parse(storedUser);

    return (
      user?.id ||
      user?.user_id ||
      user?.userId ||
      null
    );

  } catch (error) {

    console.log(
      "User parse error:",
      error
    );

    return null;

  }

};


const formatDate = (
  value
) => {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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


const formatTime = (
  value
) => {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
// DATA NORMALIZATION
// ======================================================

const getCustomerName = (
  order
) => {

  return (
    order.consignee_name ||
    order.customer_name ||
    order.name ||
    "—"
  );

};


const getMobile = (
  order
) => {

  return (
    order.mobile ||
    order.phone ||
    order.customer_mobile ||
    ""
  );

};


const getOrderId = (
  order
) => {

  return (
    order.order_id ||
    order.orderId ||
    order.order_number ||
    order.id ||
    "—"
  );

};


const getShipmentName = (
  order
) => {

  return (
    order.shipment ||
    order.product_name ||
    order.productName ||
    order.item_name ||
    "Shipment"
  );

};


const getPickupCity = (
  order
) => {

  return (
    order.pickup_city ||
    order.pickupCity ||
    order.origin_city ||
    order.originCity ||
    order.from_city ||
    order.fromCity ||
    order.pickup_address_city ||
    order.pickupAddressCity ||
    ""
  );

};


const getPickupPincode = (
  order
) => {

  return (
    order.pickup_pincode ||
    order.pickupPincode ||
    order.origin_pincode ||
    order.originPincode ||
    order.from_pincode ||
    order.fromPincode ||
    ""
  );

};


const getDeliveryCity = (
  order
) => {

  return (
    order.city ||
    order.delivery_city ||
    order.deliveryCity ||
    order.destination_city ||
    order.destinationCity ||
    order.to_city ||
    order.toCity ||
    ""
  );

};


const getDeliveryPincode = (
  order
) => {

  return (
    order.pincode ||
    order.delivery_pincode ||
    order.deliveryPincode ||
    order.destination_pincode ||
    order.destinationPincode ||
    order.to_pincode ||
    order.toPincode ||
    ""
  );

};


const getWeight = (
  order
) => {

  const value =
    order.total_weight ??
    order.totalWeight ??
    order.weight ??
    order.package_weight ??
    order.packageWeight ??
    0;

  return Number(value) || 0;

};


const getDistance = (
  order
) => {

  const value =
    order.distance_km ??
    order.distanceKm ??
    order.distance ??
    0;

  return Number(value) || 0;

};


const getServiceType = (
  order
) => {

  return String(
    order.service_type ||
    order.serviceType ||
    order.shipping_type ||
    order.shippingType ||
    "ROAD"
  ).toUpperCase();

};


const getPaymentType = (
  order
) => {

  return String(
    order.payment_type ||
    order.paymentType ||
    order.payment_method ||
    order.paymentMethod ||
    "PREPAID"
  ).toUpperCase();

};


const getCreatedAt = (
  order
) => {

  return (
    order.created_at ||
    order.createdAt ||
    order.manifest_created_at ||
    order.manifestCreatedAt ||
    null
  );

};


// ======================================================
// MAIN COMPONENT
// ======================================================

function Manifested() {

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [actionLoading, setActionLoading] =
    useState(false);


  // ====================================================
  // FETCH
  // ====================================================

  const fetchManifestedOrders =
    async () => {

      const userId =
        getUserId();

      if (!userId) {

        toast.error(
          "User session not found. Please login again."
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        const response =
          await api.get(
            "/manifests",
            {
              params: {
                user_id:
                  userId,
              },
            }
          );

        const data =
          response.data;

        console.log(
          "MANIFESTED API DATA:",
          data
        );

        if (
          !data?.success
        ) {

          throw new Error(
            data?.message ||
            "Unable to fetch manifested orders"
          );

        }

        const list =
          Array.isArray(
            data.manifests
          )
            ? data.manifests
            : [];

        setOrders(
          list
        );

        setSelectedIds([]);

      } catch (error) {

        console.log(
          "Manifest fetch error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Unable to load manifested orders"
        );

        setOrders([]);

      } finally {

        setLoading(false);

      }

    };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    fetchManifestedOrders();

  }, []);


  // ====================================================
  // SELECT ALL
  // ====================================================

  const allSelected =
    orders.length > 0 &&
    selectedIds.length ===
      orders.length;


  const handleSelectAll = () => {

    if (allSelected) {

      setSelectedIds([]);

      return;

    }

    setSelectedIds(
      orders.map(
        (order) =>
          order.manifest_id ||
          order.id
      )
    );

  };


  // ====================================================
  // SELECT ONE
  // ====================================================

  const handleSelect = (
    order
  ) => {

    const id =
      order.manifest_id ||
      order.id;

    setSelectedIds(
      (previous) => {

        if (
          previous.includes(id)
        ) {

          return previous.filter(
            (item) =>
              item !== id
          );

        }

        return [
          ...previous,
          id,
        ];

      }
    );

  };


  // ====================================================
  // SELECTED ORDERS
  // ====================================================

  const selectedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            selectedIds.includes(
              order.manifest_id ||
              order.id
            )
        ),
      [
        orders,
        selectedIds,
      ]
    );


  // ====================================================
  // PRINT LABEL
  // ====================================================

  const buildLabel =
    (order) => {

      const serviceType =
        getServiceType(
          order
        );

      const serviceLabel =
        serviceType === "AIR"
          ? "By Air"
          : "By Road";

      const weight =
        getWeight(
          order
        );

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
              border-bottom:1px solid #e8edf4;
              padding-bottom:14px;
              margin-bottom:16px;
            "
          >

            <div>

              <div
                style="
                  font-size:18px;
                  font-weight:700;
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
              #${getOrderId(order)}
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
              font-size:15px;
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

              ${order.address_line1 || ""}

              ${
                order.address_line2
                  ? ", " +
                    order.address_line2
                  : ""
              }

              <br />

              ${getDeliveryCity(order)}

              ${
                order.state
                  ? ", " +
                    order.state
                  : ""
              }

              -

              ${getDeliveryPincode(order)}

            </div>

          </div>


          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:10px;
              margin-top:14px;
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
                ${serviceLabel}
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
                ${weight.toFixed(2)} Kg
              </div>

            </div>

          </div>

        </div>
      `;

    };


  const printOrders = (
    list
  ) => {

    if (
      !list ||
      list.length === 0
    ) {

      toast.error(
        "Please select at least one order"
      );

      return;

    }


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


    const html =
      list
        .map(
          buildLabel
        )
        .join("");


    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Shipping Labels
          </title>

        </head>

        <body
          style="
            margin:30px;
            background:white;
          "
        >

          ${html}

        </body>

      </html>
    `);


    printWindow.document.close();

    printWindow.focus();


    setTimeout(
      () => {

        printWindow.print();

      },
      300
    );

  };


  const handlePrintLabels =
    () => {

      printOrders(
        selectedOrders
      );

    };


  const handlePrintSingle =
    (order) => {

      printOrders([
        order
      ]);

    };


  // ====================================================
  // CANCEL
  // ====================================================

  const handleCancel =
    async () => {

      if (
        selectedOrders.length === 0
      ) {

        toast.error(
          "Please select at least one order"
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Cancel ${selectedOrders.length} selected ${
            selectedOrders.length === 1
              ? "shipment"
              : "shipments"
          }?`
        );


      if (!confirmed) {
        return;
      }


      const userId =
        getUserId();


      if (!userId) {

        toast.error(
          "User session not found"
        );

        return;

      }


      try {

        setActionLoading(
          true
        );


        const orderIds =
          selectedOrders.map(
            (order) =>
              Number(
                order.order_id
              )
          );


        const response =
          await api.post(
            "/manifests/cancel",
            {
              user_id:
                userId,

              order_ids:
                orderIds,
            }
          );


        const data =
          response.data;


        if (
          !data?.success
        ) {

          throw new Error(
            data?.message ||
            "Unable to cancel shipments"
          );

        }


        toast.success(
          data.message ||
          "Selected shipments cancelled"
        );


        await fetchManifestedOrders();


      } catch (error) {

        console.log(
          "Cancel error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Unable to cancel shipments"
        );


      } finally {

        setActionLoading(
          false
        );

      }

    };


  // ====================================================
  // EXPORT
  // ====================================================

  const handleExport =
    () => {

      if (
        orders.length === 0
      ) {

        toast.error(
          "No manifested orders to export"
        );

        return;

      }


      const exportOrders =
        selectedOrders.length > 0
          ? selectedOrders
          : orders;


      const headers = [
        "Manifest ID",
        "Order ID",
        "Customer",
        "Mobile",
        "Shipment",
        "Service Type",
        "From",
        "To",
        "Payment",
        "Weight (Kg)",
        "Shipping Charge",
        "Zone",
        "Distance (Km)",
        "Created",
        "Status",
      ];


      const rows =
        exportOrders.map(
          (order) => [

            order.manifest_id ||
              order.id ||
              "",

            getOrderId(
              order
            ),

            getCustomerName(
              order
            ),

            getMobile(
              order
            ),

            getShipmentName(
              order
            ),

            getServiceType(
              order
            ),

            getPickupCity(
              order
            ),

            getDeliveryCity(
              order
            ),

            getPaymentType(
              order
            ),

            getWeight(
              order
            ).toFixed(2),

            Number(
              order.shipping_charge ||
              0
            ).toFixed(2),

            order.zone ||
              "",

            getDistance(
              order
            ).toFixed(2),

            getCreatedAt(
              order
            ) || "",

            order.status ||
            order.manifest_status ||
            "",

          ]
        );


      const escapeCsv =
        (value) => {

          const text =
            String(
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
        headers
          .map(
            escapeCsv
          )
          .join(","),

        ...rows.map(
          (row) =>
            row
              .map(
                escapeCsv
              )
              .join(",")
        ),

      ].join("\n");


      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `manifested-orders-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );


      toast.success(
        `${exportOrders.length} ${
          exportOrders.length === 1
            ? "order"
            : "orders"
        } exported`
      );

    };


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (

      <div className="min-h-[500px] bg-[#f7f8fb] px-4 py-4">

        <div className="mx-auto max-w-[1450px]">

          <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />

              <div>

                <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />

                <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-100" />

              </div>

            </div>

          </div>


          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

            <div className="h-12 animate-pulse bg-slate-50" />

            {[1, 2, 3, 4].map(
              (item) => (

                <div
                  key={item}
                  className="h-24 animate-pulse border-t border-slate-100"
                />

              )
            )}

          </div>

        </div>

      </div>

    );

  }


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="min-h-screen bg-[#f7f8fb] px-4 py-4">

      <div className="mx-auto max-w-[1450px]">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5">

          <div className="flex flex-wrap items-center justify-between gap-4">


            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0ecff] text-[#7052ff]">

                <PackageIcon
                  size={20}
                />

              </div>


              <div>

                <h1 className="text-[17px] font-medium tracking-[-0.2px] text-slate-900">

                  Manifested, Not Picked Orders

                </h1>


                <p className="mt-0.5 text-[12px] text-slate-400">

                  {orders.length}{" "}

                  {orders.length === 1
                    ? "order"
                    : "orders"}{" "}

                  ready for pickup

                </p>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="flex items-center gap-2">


              <button
                type="button"
                onClick={
                  handlePrintLabels
                }
                disabled={
                  actionLoading ||
                  selectedOrders.length === 0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#7052ff] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#6044ef] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <PrinterIcon />

                Print Shipping Label

              </button>


              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={
                  actionLoading ||
                  selectedOrders.length === 0
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#ef4444] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <XIcon />

                Cancel

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

                <DownloadIcon />

                Export

              </button>

            </div>

          </div>

        </div>


        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] border-collapse">


              {/* HEADER */}

              <thead>

                <tr className="border-b border-slate-200 bg-white">


                  <th className="w-[55px] px-4 py-3.5 text-left">

                    <button
                      type="button"
                      onClick={
                        handleSelectAll
                      }
                      className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border ${
                        allSelected
                          ? "border-[#7052ff] bg-[#7052ff] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >

                      <CheckIcon
                        size={12}
                      />

                    </button>

                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Customer
                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Shipment
                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Route
                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Payment
                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Weight
                  </th>


                  <th className="px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Created
                  </th>


                  <th className="w-[85px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">
                    Actions
                  </th>

                </tr>

              </thead>


              {/* BODY */}

              <tbody>

                {orders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto flex max-w-sm flex-col items-center">

                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                          <PackageIcon />

                        </div>


                        <h3 className="text-[14px] font-semibold text-slate-800">

                          No manifested orders

                        </h3>


                        <p className="mt-1 text-[12px] text-slate-400">

                          Orders will appear here after successful shipment confirmation.

                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  orders.map(
                    (
                      order
                    ) => {

                      const manifestId =
                        order.manifest_id ||
                        order.id;


                      const selected =
                        selectedIds.includes(
                          manifestId
                        );


                      const pickupCity =
                        getPickupCity(
                          order
                        );


                      const pickupPincode =
                        getPickupPincode(
                          order
                        );


                      const deliveryCity =
                        getDeliveryCity(
                          order
                        );


                      const deliveryPincode =
                        getDeliveryPincode(
                          order
                        );


                      const weight =
                        getWeight(
                          order
                        );


                      const distance =
                        getDistance(
                          order
                        );


                      const serviceType =
                        getServiceType(
                          order
                        );


                      return (

                        <tr
                          key={
                            manifestId
                          }
                          className={`border-b border-slate-100 last:border-b-0 ${
                            selected
                              ? "bg-[#faf8ff]"
                              : "bg-white hover:bg-[#fcfcff]"
                          }`}
                        >


                          {/* CHECKBOX */}

                          <td className="px-4 py-3.5 align-middle">

                            <button
                              type="button"
                              onClick={() =>
                                handleSelect(
                                  order
                                )
                              }
                              className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border ${
                                selected
                                  ? "border-[#7052ff] bg-[#7052ff] text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >

                              <CheckIcon
                                size={12}
                              />

                            </button>

                          </td>


                          {/* CUSTOMER */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="min-w-[160px]">

                              <div className="text-[14px] font-medium leading-5 text-slate-800">

                                {
                                  getCustomerName(
                                    order
                                  )
                                }

                              </div>


                              <div className="mt-0.5 text-[11px] leading-4 text-slate-400">

                                {
                                  getMobile(
                                    order
                                  )
                                }

                              </div>


                              <span className="mt-1.5 inline-flex rounded-full bg-[#f0ebff] px-2.5 py-1 text-[10px] font-medium leading-none text-[#7052ff]">

                                Manifested

                              </span>

                            </div>

                          </td>


                          {/* SHIPMENT */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="min-w-[125px]">

                              <div className="text-[14px] font-medium leading-5 text-slate-800">

                                #
                                {
                                  getOrderId(
                                    order
                                  )
                                }

                              </div>


                              <div className="mt-0.5 text-[11px] leading-4 text-slate-500">

                                {
                                  getShipmentName(
                                    order
                                  )
                                }

                              </div>


                              <span
                                className={`mt-1.5 inline-flex rounded-md px-2.5 py-1 text-[10px] font-medium leading-none ${
                                  serviceType === "AIR"
                                    ? "bg-[#f0ebff] text-[#7052ff]"
                                    : "bg-[#edf8ff] text-[#0788ca]"
                                }`}
                              >

                                {
                                  serviceType === "AIR"
                                    ? "By Air"
                                    : "By Road"
                                }

                              </span>

                            </div>

                          </td>


                          {/* ROUTE */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="min-w-[155px]">


                              {/* PICKUP */}

                              <div className="flex items-start gap-2">

                                <div className="mt-[2px] text-[#7052ff]">

                                  <LocationIcon />

                                </div>


                                <div>

                                  <div className="text-[12px] font-medium leading-4 text-slate-700">

                                    {
                                      pickupCity ||
                                      "Pickup"
                                    }

                                  </div>


                                  <div className="text-[10px] leading-4 text-slate-400">

                                    {
                                      pickupPincode
                                    }

                                  </div>

                                </div>

                              </div>


                              <div className="ml-[6px] h-2.5 border-l border-dashed border-slate-300" />


                              {/* DELIVERY */}

                              <div className="flex items-start gap-2">

                                <div className="mt-[2px] text-[#0ea5e9]">

                                  <LocationIcon />

                                </div>


                                <div>

                                  <div className="text-[12px] font-medium leading-4 text-slate-700">

                                    {
                                      deliveryCity ||
                                      "Delivery"
                                    }

                                  </div>


                                  <div className="text-[10px] leading-4 text-slate-400">

                                    {
                                      deliveryPincode
                                    }

                                  </div>

                                </div>

                              </div>


                            </div>

                          </td>


                          {/* PAYMENT */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="flex items-center gap-2">

                              <span className="h-1.5 w-1.5 rounded-full bg-[#00a86b]" />

                              <span className="text-[12px] font-semibold text-[#00a86b]">

                                {
                                  getPaymentType(
                                    order
                                  )
                                }

                              </span>

                            </div>

                          </td>


                          {/* WEIGHT */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="min-w-[105px]">

                              <div className="text-[13px] font-medium leading-5 text-slate-700">

                                {
                                  weight.toFixed(
                                    2
                                  )
                                }{" "}
                                Kg

                              </div>


                              <div className="text-[10px] leading-4 text-slate-400">

                                {distance.toFixed(
                                  0
                                )}{" "}
                                Km route

                              </div>

                            </div>

                          </td>


                          {/* CREATED */}

                          <td className="px-3 py-3.5 align-middle">

                            <div className="min-w-[105px]">

                              <div className="text-[11px] font-medium leading-4 text-slate-700">

                                {
                                  formatDate(
                                    getCreatedAt(
                                      order
                                    )
                                  )
                                }

                              </div>


                              <div className="text-[10px] leading-4 text-slate-400">

                                {
                                  formatTime(
                                    getCreatedAt(
                                      order
                                    )
                                  )
                                }

                              </div>

                            </div>

                          </td>


                          {/* ACTION */}

                          <td className="px-3 py-3.5 align-middle">

                            <button
                              type="button"
                              onClick={() =>
                                handlePrintSingle(
                                  order
                                )
                              }
                              title="Print Shipping Label"
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#7052ff] bg-white text-[#7052ff] transition hover:bg-[#f4f1ff] active:scale-95"
                            >

                              <PrinterIcon />

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


          {/* FOOTER */}

          {orders.length > 0 && (

            <div className="flex min-h-[43px] items-center justify-between border-t border-slate-100 bg-[#fcfdff] px-5">

              <div className="text-[11px] text-slate-400">

                Showing{" "}

                <span className="font-medium text-slate-600">

                  {orders.length}

                </span>{" "}

                manifested{" "}

                {
                  orders.length === 1
                    ? "order"
                    : "orders"
                }

              </div>


              {selectedIds.length >
                0 && (

                <div className="text-[11px] text-slate-400">

                  <span className="font-semibold text-[#7052ff]">

                    {
                      selectedIds.length
                    }

                  </span>{" "}

                  selected

                </div>

              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}


export default Manifested;