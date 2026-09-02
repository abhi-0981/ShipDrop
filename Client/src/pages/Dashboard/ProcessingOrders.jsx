import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ======================================================
// ICON
// ======================================================

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

  // ====================================================
  // EDIT ICON
  // ====================================================

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

  return null;
};

// ======================================================
// PROCESSING ORDERS
// ======================================================

function ProcessingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedOrders, setSelectedOrders] = useState([]);

  // ====================================================
  // SEARCH
  // ====================================================

  const [search, setSearch] = useState("");

  // ====================================================
  // SHIP POPUP
  // ====================================================

  const [showShipPopup, setShowShipPopup] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [shipping, setShipping] = useState(false);

  const [previewRates, setPreviewRates] = useState({});

  const [previewTotal, setPreviewTotal] = useState(0);

  // ====================================================
  // RATE CACHE
  // ====================================================

  // Calculated rates are cached so popup can open instantly.
  const rateCacheRef = useRef(new Map());

  // Prevent older API responses from overwriting newer data.
  const previewRequestRef = useRef(0);

  // ROAD = DEFAULT
  const [shippingType, setShippingType] = useState("ROAD");

  // ====================================================
  // DELETE
  // ====================================================

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleteIds, setDeleteIds] = useState([]);

  const [deleting, setDeleting] = useState(false);

  // ====================================================
  // EDIT
  // ====================================================

  const [editingOrder, setEditingOrder] = useState(false);

  // ====================================================
  // TOAST
  // ====================================================

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ====================================================
  // FETCH PROCESSING ORDERS
  // ====================================================

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }



      const storedUser =
  localStorage.getItem("user");

let user = {};

try {
  user = storedUser
    ? JSON.parse(storedUser)
    : {};
} catch (error) {
  console.log(
    "User parse error:",
    error
  );
}

const userId =
  user.id ||
  user.user_id ||
  user.userId;

if (!userId) {
  throw new Error(
    "User session not found. Please login again."
  );
}



      const response = await api.get(
  `/orders/processing?user_id=${userId}`
);

      const data =
        response.data?.orders ??
        response.data ??
        [];

      // Order data may have changed.
      // Old rates are no longer guaranteed to be valid.
      rateCacheRef.current.clear();

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.log(
        "Processing orders error:",
        error
      );

      setOrders([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  // ====================================================
  // NEW ORDER EVENT
  // ====================================================

  useEffect(() => {
    const handleNewOrder = () => {
      fetchOrders(false);
    };

    window.addEventListener(
      "processingOrderCreated",
      handleNewOrder
    );

    return () => {
      window.removeEventListener(
        "processingOrderCreated",
        handleNewOrder
      );
    };
  }, []);

  // ====================================================
  // ORDER UPDATED EVENT
  // ====================================================

  useEffect(() => {
    const handleOrderUpdated = () => {
      fetchOrders(false);
    };

    window.addEventListener(
      "processingOrderUpdated",
      handleOrderUpdated
    );

    return () => {
      window.removeEventListener(
        "processingOrderUpdated",
        handleOrderUpdated
      );
    };
  }, []);

  // ====================================================
  // HELPERS
  // ====================================================

  const getId = (
    order,
    index = 0
  ) => {
    return (
      order.id ??
      order.order_id ??
      index
    );
  };

  const getCustomer = (
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
      order.consignee_mobile ||
      order.phone ||
      order.mobile_number ||
      "—"
    );
  };

  const getPickupCity = (
    order
  ) => {
    return (
      order.pickup_city ||
      order.pickupCity ||
      order.pickup?.city ||
      order.pickup_address_data?.city ||
      "—"
    );
  };

  const getPickupPincode = (
    order
  ) => {
    return (
      order.pickup_pincode ||
      order.pickupPincode ||
      order.pickup?.pincode ||
      order.pickup_address_data?.pincode ||
      "—"
    );
  };

  const getDeliveryCity = (
    order
  ) => {
    return (
      order.city ||
      order.delivery_city ||
      order.deliveryCity ||
      "—"
    );
  };

  const getDeliveryPincode = (
    order
  ) => {
    return (
      order.pincode ||
      order.delivery_pincode ||
      order.deliveryPincode ||
      "—"
    );
  };

  const getProduct = (
    order
  ) => {
    if (order.product_name) {
      return order.product_name;
    }

    if (order.product) {
      return order.product;
    }

    if (
      Array.isArray(order.products) &&
      order.products.length
    ) {
      return (
        order.products[0]?.product_name ||
        order.products[0]?.product_title ||
        order.products[0]?.product ||
        "—"
      );
    }

    return "—";
  };

  const getQty = (
    order
  ) => {
    if (order.qty != null) {
      return order.qty;
    }

    if (order.quantity != null) {
      return order.quantity;
    }

    if (
      Array.isArray(order.products) &&
      order.products.length
    ) {
      return (
        order.products[0]?.qty ??
        order.products[0]?.quantity ??
        1
      );
    }

    return 1;
  };

  const getWeightNumber = (
    order
  ) => {
    if (
      order.total_weight != null
    ) {
      return (
        Number(order.total_weight) ||
        0
      );
    }

    if (
      order.weight != null
    ) {
      return (
        Number(order.weight) ||
        0
      );
    }

    if (
      order.dead_weight != null
    ) {
      return (
        Number(order.dead_weight) ||
        0
      );
    }

    if (
      Array.isArray(order.packages) &&
      order.packages.length
    ) {
      return order.packages.reduce(
        (total, pkg) => {
          const weight =
            Number(pkg?.weight) ||
            0;

          const count =
            Number(
              pkg?.package_count
            ) || 1;

          return (
            total +
            weight * count
          );
        },
        0
      );
    }

    return 0;
  };

  const getTotalWeight = (
    order
  ) => {
    const weight =
      getWeightNumber(order);

    if (weight <= 0) {
      return "—";
    }

    return `${weight} kg`;
  };

  const getPackage = (
    order
  ) => {
    if (
      Array.isArray(order.packages) &&
      order.packages.length
    ) {
      return order.packages[0];
    }

    return null;
  };

  const getDimensions = (
    order
  ) => {
    const pkg =
      getPackage(order);

    if (!pkg) {
      return "—";
    }

    return `${pkg.length ?? "—"}×${
      pkg.width ?? "—"
    }×${
      pkg.height ?? "—"
    } cm`;
  };

  const getBoxCount = (
    order
  ) => {
    if (
      Array.isArray(order.packages) &&
      order.packages.length
    ) {
      const total =
        order.packages.reduce(
          (sum, pkg) => {
            return (
              sum +
              Number(
                pkg?.package_count ??
                pkg?.count ??
                1
              )
            );
          },
          0
        );

      return total || 1;
    }

    return (
      order.package_count ??
      order.count ??
      1
    );
  };

  const getPayment = (
    order
  ) => {
    const payment = (
      order.payment_type ||
      order.payment_method ||
      "PREPAID"
    )
      .toString()
      .toUpperCase();

    return payment === "COD"
      ? "COD"
      : "PREPAID";
  };

  // ====================================================
  // PRODUCT / ORDER VALUE
  // ====================================================

  const getProductValue = (
    order
  ) => {
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

      if (
        Number.isFinite(numericValue) &&
        numericValue >= 0
      ) {
        return numericValue;
      }
    }

    if (
      Array.isArray(order.products) &&
      order.products.length
    ) {
      const total = order.products.reduce(
        (sum, product) => {
          const qty =
            Number(
              product?.qty ??
              product?.quantity ??
              1
            ) || 1;

          const price =
            Number(
              product?.price ??
              product?.selling_price ??
              product?.sellingPrice ??
              product?.amount ??
              0
            ) || 0;

          return sum + price * qty;
        },
        0
      );

      if (total >= 0) {
        return total;
      }
    }

    return 0;
  };

  const getDate = (
    order
  ) => {
    const raw =
      order.created_at ||
      order.createdAt ||
      order.order_date;

    if (!raw) {
      return "—";
    }

    const date =
      new Date(raw);

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

  const getTime = (
    order
  ) => {
    const raw =
      order.created_at ||
      order.createdAt ||
      order.order_date;

    if (!raw) {
      return "";
    }

    const date =
      new Date(raw);

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
        hour12: true,
      }
    );
  };

  const getStatus = (
    order
  ) => {
    return (
      order.status ||
      "PROCESSING"
    );
  };

  // ====================================================
  // EDIT ORDER
  // ====================================================

  const handleEdit = async (
    order
  ) => {
    const orderId =
      getId(order);

    if (!orderId) {
      showToast(
        "Invalid order ID.",
        "error"
      );

      return;
    }

    try {
      setEditingOrder(true);

      // ==================================================
      // FETCH COMPLETE ORDER
      // ==================================================
      // Processing list can contain flattened product/package
      // data. Create Order needs the complete order object,
      // including ALL products and ALL packages.
      const storedUser =
        localStorage.getItem("user");

      let user = {};

      try {
        user = storedUser
          ? JSON.parse(storedUser)
          : {};
      } catch (error) {
        console.log(
          "User parse error:",
          error
        );
      }

      const userId =
        user.id ||
        user.user_id ||
        user.userId;

      if (!userId) {
        throw new Error(
          "User session not found. Please login again."
        );
      }

      const response = await api.get(
        `/orders/${orderId}?user_id=${userId}`
      );

      const result =
        response.data;

      if (
        !result?.success ||
        !result?.order
      ) {
        throw new Error(
          result?.message ||
            "Unable to load order details"
        );
      }

      // Store the COMPLETE order returned by backend.
      // This includes products[] and packages[].
      sessionStorage.setItem(
        "editingProcessingOrder",
        JSON.stringify(result.order)
      );

      navigate(
        "/create-order"
      );
    } catch (error) {
      console.log(
        "Edit order error:",
        error
      );

      showToast(
        error.response
          ?.data?.message ||
          error.message ||
          "Unable to open order for editing",
        "error"
      );

      setEditingOrder(false);
    }
  };

  // ====================================================
  // SEARCH / FILTERED ORDERS
  // ====================================================

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
      order.order_number,
      order.orderNumber,
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");

    return searchableText.includes(searchText);
  });

  // ====================================================
  // SELECT ALL
  // ====================================================

  const visibleIds = filteredOrders.map((order, index) =>
    getId(order, index)
  );

  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedOrders.includes(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedOrders((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
      return;
    }

    setSelectedOrders((previous) => [
      ...new Set([...previous, ...visibleIds]),
    ]);
  };

  // ====================================================
  // SELECT ORDER
  // ====================================================

  const toggleOrder = (
    id
  ) => {
    setSelectedOrders(
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
  // SELECTED OBJECTS
  // ====================================================

  const getSelectedOrderObjects =
    () => {
      return orders.filter(
        (order, index) =>
          selectedOrders.includes(
            getId(
              order,
              index
            )
          )
      );
    };

  // ====================================================
  // CALCULATE PREVIEW
  // ====================================================

  const calculatePreview = async (
    orderList,
    serviceType = shippingType
  ) => {
    const currentRequest =
      ++previewRequestRef.current;

    if (
      !Array.isArray(orderList) ||
      orderList.length === 0
    ) {
      setPreviewLoading(false);
      setPreviewRates({});
      setPreviewTotal(0);

      return;
    }

    const normalizedService =
      String(
        serviceType || "ROAD"
      )
        .trim()
        .toUpperCase();

    // ================================================
    // CACHE KEY
    // ================================================

    const getRateCacheKey = (
      order
    ) => {
      const id =
        getId(order);

      const pickup =
        getPickupPincode(
          order
        );

      const delivery =
        getDeliveryPincode(
          order
        );

      const weight =
        getWeightNumber(
          order
        );

      const paymentType =
        getPayment(order);

      const productValue =
        getProductValue(order);

      return `${id}|${normalizedService}|${pickup}|${delivery}|${weight}|${paymentType}|${productValue}`;
    };

    const rateMap = {};

    const missingOrders = [];

    // ================================================
    // USE CACHE FIRST
    // ================================================

    orderList.forEach(
      (order) => {
        const cacheKey =
          getRateCacheKey(
            order
          );

        const cachedRate =
          rateCacheRef.current.get(
            cacheKey
          );

        if (cachedRate) {
          rateMap[
            cachedRate.id
          ] = cachedRate;
        } else {
          missingOrders.push({
            order,
            cacheKey,
          });
        }
      }
    );

    // ================================================
    // ALL RATES ALREADY AVAILABLE
    // ================================================

    if (
      missingOrders.length ===
      0
    ) {
      let total = 0;

      orderList.forEach(
        (order) => {
          total +=
            Number(
              rateMap[
                getId(order)
              ]?.charge
            ) || 0;
        }
      );

      setPreviewRates(
        rateMap
      );

      setPreviewTotal(
        Number(
          total.toFixed(2)
        )
      );

      setPreviewLoading(
        false
      );

      return;
    }

    setPreviewLoading(true);

    try {
      // ==============================================
      // CALCULATE ONLY MISSING RATES IN PARALLEL
      // ==============================================

      const freshResults =
        await Promise.all(
          missingOrders.map(
            async ({
              order,
              cacheKey,
            }) => {
              const pickupPincode =
                getPickupPincode(
                  order
                );

              const deliveryPincode =
                getDeliveryPincode(
                  order
                );

              const weight =
                getWeightNumber(
                  order
                );

              if (
                !/^\d{6}$/.test(
                  String(
                    pickupPincode
                  )
                )
              ) {
                throw new Error(
                  `Pickup pincode missing for Order #${order.id}`
                );
              }

              if (
                !/^\d{6}$/.test(
                  String(
                    deliveryPincode
                  )
                )
              ) {
                throw new Error(
                  `Delivery pincode missing for Order #${order.id}`
                );
              }

              if (
                weight <= 0
              ) {
                throw new Error(
                  `Package weight missing for Order #${order.id}`
                );
              }

              const storedUser =
  localStorage.getItem("user");

let user = {};

try {
  user = storedUser
    ? JSON.parse(storedUser)
    : {};
} catch (error) {
  console.log(
    "User parse error:",
    error
  );
}

const userId =
  user.id ||
  user.user_id ||
  user.userId;

if (!userId) {
  throw new Error(
    "User session not found. Please login again."
  );
}

const paymentType =
  getPayment(order);

const productValue =
  getProductValue(order);

const response =
  await api.post(
    "/rate/calculate",
    {
      user_id:
        userId,

      pickup_pincode:
        pickupPincode,

      delivery_pincode:
        deliveryPincode,

      weight,

      service_type:
        normalizedService,

      payment_type:
        paymentType,

      product_value:
        productValue,
    }
  );

              const result =
                response.data;

              if (
                !result?.success
              ) {
                throw new Error(
                  result?.message ||
                    `Unable to calculate rate for Order #${order.id}`
                );
              }

              const item = {
                id: getId(
                  order
                ),

                charge:
                  Number(
                    result.shipping_charge
                  ) || 0,

                zone:
                  result.zone,

                distance_km:
                  result.distance_km,

                weight,
              };

              // Save calculated rate.
              rateCacheRef.current.set(
                cacheKey,
                item
              );

              return item;
            }
          )
        );

      // ==============================================
      // OLD REQUEST PROTECTION
      // ==============================================

      if (
        currentRequest !==
        previewRequestRef.current
      ) {
        return;
      }

      freshResults.forEach(
        (item) => {
          rateMap[
            item.id
          ] = item;
        }
      );

      let total = 0;

      orderList.forEach(
        (order) => {
          total +=
            Number(
              rateMap[
                getId(order)
              ]?.charge
            ) || 0;
        }
      );

      setPreviewRates(
        rateMap
      );

      setPreviewTotal(
        Number(
          total.toFixed(2)
        )
      );
    } catch (error) {
      if (
        currentRequest !==
        previewRequestRef.current
      ) {
        return;
      }

      console.log(
        "Preview rate error:",
        error
      );

      setPreviewRates(
        rateMap
      );

      setPreviewTotal(
        Number(
          Object.values(
            rateMap
          )
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                (
                  Number(
                    item?.charge
                  ) || 0
                ),
              0
            )
            .toFixed(2)
        )
      );

      showToast(
        error.response
          ?.data?.message ||
          error.message ||
          "Unable to calculate shipping charges",
        "error"
      );
    } finally {
      if (
        currentRequest ===
        previewRequestRef.current
      ) {
        setPreviewLoading(
          false
        );
      }
    }
  };

  // ====================================================
  // PREFETCH DEFAULT ROAD RATE
  // ====================================================

  // As soon as orders are selected,
  // calculate their Road rates in background.
  //
  // Therefore when user clicks Ship,
  // the Road rate is already cached.

  useEffect(() => {
    if (
      selectedOrders.length ===
      0
    ) {
      return;
    }

    const selected =
      getSelectedOrderObjects();

    if (
      selected.length ===
      0
    ) {
      return;
    }

    calculatePreview(
      selected,
      "ROAD"
    );
  }, [
    selectedOrders
  ]);

  // ====================================================
  // ROAD / AIR CHANGE
  // ====================================================

  const handleShippingTypeChange =
    async (event) => {
      const newType =
        event.target.value;

      setShippingType(
        newType
      );

      if (
        selectedOrders.length ===
        0
      ) {
        return;
      }

      const selected =
        getSelectedOrderObjects();

      await calculatePreview(
        selected,
        newType
      );
    };

  // ====================================================
  // OPEN SHIP POPUP
  // ====================================================

  const openShipPopup = (
    ids
  ) => {
    const selected =
      orders.filter(
        (order, index) =>
          ids.includes(
            getId(
              order,
              index
            )
          )
      );

    if (
      selected.length ===
      0
    ) {
      showToast(
        "Please select at least one order.",
        "error"
      );

      return;
    }

    setSelectedOrders(
      ids
    );

    setShippingType(
      "ROAD"
    );

    // IMPORTANT:
    // No API call here.
    //
    // Road rate has already been
    // calculated when order was selected.

    setShowShipPopup(
      true
    );
  };

  // ====================================================
  // SHIP BUTTON
  // ====================================================

  const handleShip = () => {
    if (
      selectedOrders.length ===
      0
    ) {
      showToast(
        "Please select at least one order.",
        "error"
      );

      return;
    }

    openShipPopup(
      selectedOrders
    );
  };

  // ====================================================
  // CONFIRM SHIPMENT
  // ====================================================

  const confirmShipNow =
    async () => {
      if (
        selectedOrders.length ===
        0
      ) {
        return;
      }

      if (
        previewLoading
      ) {
        showToast(
          "Please wait while shipping charges are calculated.",
          "error"
        );

        return;
      }

      if (
        previewTotal <= 0
      ) {
        showToast(
          "Shipping charge could not be calculated.",
          "error"
        );

        return;
      }

      try {
        setShipping(
          true
        );

        const storedUser =
          localStorage.getItem(
            "user"
          );

        let user = {};

        try {
          user =
            storedUser
              ? JSON.parse(
                  storedUser
                )
              : {};
        } catch (error) {
          console.log(
            "User parse error:",
            error
          );
        }

        const userId =
          user.id ||
          user.user_id ||
          user.userId;

        if (!userId) {
          showToast(
            "User session not found. Please login again.",
            "error"
          );

          return;
        }

        // ==========================================
        // BULK SHIP
        // ==========================================

        const response =
          await api.post(
            "/shipments/bulk-confirm",
            {
              user_id:
                userId,

              order_ids:
                selectedOrders,

              service_type:
                shippingType,

              total_shipping_charge:
                previewTotal,
            }
          );

        const result =
          response.data;

        if (
          !result ||
          result.success !==
            true
        ) {
          throw new Error(
            result?.message ||
              "Unable to ship selected orders"
          );
        }

        const shippedCount =
          result.total_orders ??
          result.shipped_orders
            ?.length ??
          selectedOrders.length;

        const chargedAmount =
          Number(
            result.total_charge ??
              previewTotal
          );

        // ==========================================
        // RESET
        // ==========================================

        setShowShipPopup(
          false
        );

        setPreviewRates(
          {}
        );

        setPreviewTotal(
          0
        );

        rateCacheRef.current.clear();

        setSelectedOrders(
          []
        );

        setShippingType(
          "ROAD"
        );

        // ==========================================
        // REFRESH
        // ==========================================

        await fetchOrders(
          false
        );

        // ==========================================
        // WALLET EVENTS
        // ==========================================

        window.dispatchEvent(
          new Event(
            "walletBalanceUpdated"
          )
        );

        window.dispatchEvent(
          new Event(
            "walletUpdated"
          )
        );

        // ==========================================
        // SUCCESS
        // ==========================================

        showToast(
          `${shippedCount} order${
            shippedCount > 1
              ? "s"
              : ""
          } shipped successfully! ₹${chargedAmount.toFixed(
            2
          )} deducted from wallet.`,
          "success"
        );
      } catch (error) {
        console.log(
          "Bulk ship error:",
          error
        );

        showToast(
          error.response
            ?.data?.message ||
            error.message ||
            "Unable to ship selected orders",
          "error"
        );
      } finally {
        setShipping(
          false
        );
      }
    };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = (
    ids
  ) => {
    if (
      !Array.isArray(ids)
    ) {
      ids =
        selectedOrders;
    }

    if (
      !ids ||
      ids.length === 0
    ) {
      showToast(
        "Please select at least one order.",
        "error"
      );

      return;
    }

    setDeleteIds(
      ids
    );

    setShowDeleteConfirm(
      true
    );
  };

  // ====================================================
  // CONFIRM DELETE
  // ====================================================

  const confirmDelete =
    async () => {
      if (
        !deleteIds.length
      ) {
        setShowDeleteConfirm(
          false
        );

        return;
      }

      try {
        setDeleting(
          true
        );

        const storedUser =
          localStorage.getItem(
            "user"
          );

        let user = {};

        try {
          user =
            storedUser
              ? JSON.parse(
                  storedUser
                )
              : {};
        } catch (error) {
          console.log(
            "User parse error:",
            error
          );
        }

        const userId =
          user.id ||
          user.user_id ||
          user.userId;

        if (!userId) {
          showToast(
            "User session not found. Please login again.",
            "error"
          );

          return;
        }

        const response =
          await api.post(
            "/orders/delete",
            {
              user_id:
                userId,

              order_ids:
                deleteIds,
            }
          );

        const result =
          response.data;

        if (
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              "Unable to delete orders"
          );
        }

        const deletedCount =
          result.deleted_count ??
          deleteIds.length;

        setShowDeleteConfirm(
          false
        );

        setDeleteIds([]);

        setSelectedOrders([]);

        rateCacheRef.current.clear();

        await fetchOrders(
          false
        );

        showToast(
          `${deletedCount} order${
            deletedCount > 1
              ? "s"
              : ""
          } deleted successfully.`,
          "success"
        );
      } catch (error) {
        console.log(
          "Delete orders error:",
          error
        );

        showToast(
          error.response
            ?.data?.message ||
            error.message ||
            "Unable to delete orders",
          "error"
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-4">
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#7451ff]" />

            <p className="text-sm text-slate-500">
              Loading processing orders...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedOrderObjects =
    getSelectedOrderObjects();

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7fb] p-4">

      {/* ==================================================
          TOAST
      ================================================== */}

      {toast && (
        <div className="fixed right-6 top-6 z-[11000]">
          <div
            className={`flex min-w-[320px] items-center gap-3 rounded-xl border bg-white px-5 py-4 shadow-2xl ${
              toast.type ===
              "success"
                ? "border-green-200"
                : "border-red-200"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                toast.type ===
                "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {toast.type ===
              "success"
                ? "✓"
                : "!"}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {toast.type ===
                "success"
                  ? "Success"
                  : "Something went wrong"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          PAGE
      ================================================== */}

      <div className="w-full">

        {/* HEADER */}

        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0ecff] text-[#7052ff]">
                <Icon name="truck" size={20} />
              </div>
              <div>
                <h1 className="text-[17px] font-medium tracking-[-0.2px] text-slate-900">
                  Processing Orders
                </h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Showing <span className="font-medium text-slate-700">{filteredOrders.length}</span> Out Of <span className="font-medium text-slate-700">{orders.length}</span> Orders
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="relative w-full sm:w-[290px]">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="search" size={16} />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders, customer, mobile..."
                  className="h-[38px] w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#a996ff] focus:ring-2 focus:ring-[#7451ff]/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[17px] leading-none text-slate-400 hover:text-slate-700"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleShip}
                disabled={selectedOrders.length === 0}
                className="flex h-[38px] items-center gap-1.5 rounded-lg bg-[#7451ff] px-3.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#6745ec] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="truck" size={15} />
                Ship
              </button>

              <button
                type="button"
                onClick={() => handleDelete()}
                disabled={selectedOrders.length === 0}
                className="flex h-[38px] items-center gap-1.5 rounded-lg bg-[#ff3340] px-3.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#e92d39] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="trash" size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

          <table className="w-full min-w-[1160px] table-fixed border-collapse">

            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[183px]" />
              <col className="w-[165px]" />
              <col className="w-[140px]" />
              <col className="w-[160px]" />
              <col className="w-[150px]" />
              <col />
            </colgroup>

            <thead>
              <tr>

                <th className="h-[58px] border-r border-b border-slate-200 px-4 text-left">

                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-[16px] w-[16px] cursor-pointer accent-[#7451ff]"
                  />

                </th>

                <th className="border-r border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Customer
                </th>

                <th className="border-r border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Route
                </th>

                <th className="border-r border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Payment
                </th>

                <th className="border-r border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Order
                </th>

                <th className="border-r border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Weight
                </th>

                <th className="border-b border-slate-200 px-4 text-left text-[14px] font-medium text-slate-800">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredOrders.length ===
              0 ? (
                <tr>

                  <td
                    colSpan="7"
                    className="h-[280px] text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Icon
                          name={searchText ? "search" : "file"}
                          size={21}
                        />
                      </div>

                      <div className="text-sm font-medium text-slate-700">
                        No Processing Orders
                      </div>

                    </div>

                  </td>

                </tr>
              ) : (
                filteredOrders.map(
                  (
                    order,
                    index
                  ) => {
                    const id =
                      getId(
                        order,
                        index
                      );

                    const selected =
                      selectedOrders.includes(
                        id
                      );

                    return (
                      <tr
                        key={id}
                        className="h-[88px] transition-colors hover:bg-slate-50"
                      >

                        <td className="border-r border-b border-slate-200 px-4">

                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleOrder(
                                id
                              )
                            }
                            className="h-[16px] w-[16px] cursor-pointer accent-[#7451ff]"
                          />

                        </td>

                        <td className="border-r border-b border-slate-200 px-4">

                          <div className="text-[14px] font-medium text-slate-900">
                            {getCustomer(
                              order
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {getMobile(
                              order
                            )}
                          </div>

                          <div className="mt-[7px] flex items-start gap-2">

                            <span className="inline-flex h-[23px] items-center rounded-full border border-[#bfaeff] bg-[#f2edff] px-[10px] text-[11px] font-medium text-[#6847ed]">
                              {getStatus(
                                order
                              )}
                            </span>

                            <div className="text-[10px] leading-[15px] text-slate-400">
                              <div>
                                {getDate(
                                  order
                                )}
                              </div>

                              <div>
                                {getTime(
                                  order
                                )}
                              </div>
                            </div>

                          </div>

                        </td>

                        <td className="border-r border-b border-slate-200 px-4">

                          <div>

                            <div className="flex items-start gap-[8px]">

                              <span className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full bg-[#7451ff]" />

                              <div>

                                <div className="text-[12px] font-medium text-slate-800">
                                  {getPickupCity(
                                    order
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-400">
                                  (
                                  {getPickupPincode(
                                    order
                                  )}
                                  )
                                </div>

                              </div>

                            </div>

                            <div className="ml-[3px] h-[11px] border-l border-dashed border-slate-300" />

                            <div className="flex items-start gap-[8px]">

                              <span className="mt-[5px] h-[8px] w-[8px] shrink-0 rounded-full bg-[#009ee5]" />

                              <div>

                                <div className="text-[12px] font-medium text-slate-800">
                                  {getDeliveryCity(
                                    order
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-400">
                                  (
                                  {getDeliveryPincode(
                                    order
                                  )}
                                  )
                                </div>

                              </div>

                            </div>

                          </div>

                        </td>

                        <td className="border-r border-b border-slate-200 px-4">

                          <div
                            className={`text-[13px] font-medium ${
                              getPayment(
                                order
                              ) ===
                              "COD"
                                ? "text-red-500"
                                : "text-[#00a66a]"
                            }`}
                          >
                            {getPayment(
                              order
                            )}
                          </div>

                        </td>

                        <td className="border-r border-b border-slate-200 px-4">

                          <div className="text-[13px] font-medium text-slate-800">
                            #{id}
                          </div>

                          <div className="text-[13px] text-slate-700">
                            {getProduct(
                              order
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Qty:{" "}
                            {getQty(
                              order
                            )}
                          </div>

                        </td>

                        <td className="border-r border-b border-slate-200 px-4">

                          <div className="text-[12px] text-slate-700">
                            {getBoxCount(
                              order
                            )}{" "}
                            Box ×{" "}
                            {getTotalWeight(
                              order
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400">
                            {getDimensions(
                              order
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Wt:{" "}
                            {getTotalWeight(
                              order
                            )}
                          </div>

                        </td>

                        {/* ==================================================
                              ACTIONS
                          ================================================== */}

                        <td className="border-b border-slate-200 px-4">

                          <div className="flex items-center gap-[7px]">

                            {/* SHIP */}

                            <button
                              type="button"
                              onClick={() =>
                                openShipPopup(
                                  [id]
                                )
                              }
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-[5px] border border-[#7451ff] bg-white text-[#7451ff] hover:bg-[#7451ff] hover:text-white"
                              title="Ship Order"
                            >
                              <Icon
                                name="truck"
                                size={16}
                              />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  order
                                )
                              }
                              disabled={
                                editingOrder
                              }
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-[5px] border border-[#0ea5e9] bg-white text-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              title="Edit Order"
                            >
                              {editingOrder ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0ea5e9]/30 border-t-[#0ea5e9]" />
                              ) : (
                                <Icon
                                  name="edit"
                                  size={16}
                                />
                              )}
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  [id]
                                )
                              }
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-[5px] border border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white"
                              title="Delete Order"
                            >
                              <Icon
                                name="trash"
                                size={16}
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
      </div>

      {/* ====================================================
          SHIP POPUP
      ==================================================== */}

      {showShipPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm">

          <div className="flex w-full max-w-[650px] max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2edff] text-[#7451ff]">
                  <Icon
                    name="truck"
                    size={20}
                  />
                </div>

                <div>

                  <h2 className="text-[18px] font-semibold text-slate-900">
                    Confirm Shipment
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Review selected orders before shipping
                  </p>

                </div>

              </div>

              <button
                type="button"
                disabled={shipping}
                onClick={() =>
                  setShowShipPopup(
                    false
                  )
                }
                className="text-xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">

              {/* SHIPPING METHOD */}

              <div className="mb-4 rounded-xl border border-[#e5ddff] bg-[#faf8ff] px-4 py-3">

                <div className="flex items-center justify-between gap-4">

                  <div className="min-w-0">

                    <div className="text-[12px] font-semibold text-slate-800">
                      Shipping Method
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400">
                      Select courier type for all selected orders
                    </div>

                  </div>

                  <select
                    value={
                      shippingType
                    }
                    onChange={
                      handleShippingTypeChange
                    }
                    disabled={
                      previewLoading ||
                      shipping
                    }
                    className="h-[38px] min-w-[180px] cursor-pointer rounded-lg border border-[#a996ff] bg-white px-3 text-[12px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#7451ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="ROAD">
                      Delivery By Road
                    </option>

                    <option value="AIR">
                      Delivery By Air
                    </option>

                  </select>

                </div>

              </div>

              {/* SELECTED ORDERS HEADER */}

              <div className="mb-3 flex items-center justify-between">

                <p className="text-[13px] font-semibold text-slate-800">
                  Selected Orders
                </p>

                <span className="rounded-full bg-[#f2edff] px-3 py-1 text-[11px] font-medium text-[#6847ed]">
                  {
                    selectedOrderObjects.length
                  }{" "}
                  Selected
                </span>

              </div>

              {/* RATE LOADING */}

              {previewLoading ? (
                <div className="flex min-h-[180px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#7451ff]" />

                    <p className="text-xs font-medium text-slate-500">

                      Calculating{" "}

                      {shippingType ===
                      "AIR"
                        ? "Air"
                        : "Delivery By Road"}{" "}

                      shipping charges...

                    </p>

                  </div>

                </div>
              ) : (
                <div className="space-y-2">

                  {
                    selectedOrderObjects.map(
                      (
                        order,
                        index
                      ) => {
                        const id =
                          getId(
                            order,
                            index
                          );

                        const rate =
                          previewRates[
                            id
                          ];

                        return (
                          <div
                            key={id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >

                            <div className="flex items-center justify-between gap-3">

                              <div className="flex min-w-0 items-center gap-2">

                                <span className="shrink-0 text-[11px] font-bold text-slate-900">
                                  #{id}
                                </span>

                                <span className="max-w-[115px] truncate text-[11px] font-medium text-slate-700">
                                  {getCustomer(
                                    order
                                  )}
                                </span>

                                <span className="text-[9px] text-slate-400">
                                  {getMobile(
                                    order
                                  )}
                                </span>

                                <span className="text-[9px] text-slate-400">
                                  •
                                </span>

                                <span className="max-w-[210px] truncate text-[9px] text-slate-500">

                                  {getPickupCity(
                                    order
                                  )}

                                  {" ("}

                                  {getPickupPincode(
                                    order
                                  )}

                                  {") → "}

                                  {getDeliveryCity(
                                    order
                                  )}

                                  {" ("}

                                  {getDeliveryPincode(
                                    order
                                  )}

                                  {")"}

                                </span>

                              </div>

                              <span
                                className={`shrink-0 text-[10px] font-bold ${
                                  getPayment(
                                    order
                                  ) ===
                                  "COD"
                                    ? "text-red-500"
                                    : "text-[#00a66a]"
                                }`}
                              >
                                {getPayment(
                                  order
                                )}
                              </span>

                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 pt-1">

                              <div className="min-w-0 truncate text-[9px] text-slate-500">

                                {getProduct(
                                  order
                                )}

                                {" · Qty: "}

                                {getQty(
                                  order
                                )}

                                {" · "}

                                {getTotalWeight(
                                  order
                                )}

                              </div>

                              <div className="shrink-0 text-[12px] font-bold text-[#7451ff]">

                                ₹
                                {rate
                                  ? Number(
                                      rate.charge
                                    ).toFixed(
                                      2
                                    )
                                  : "—"}

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )
                  }

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="shrink-0 border-t border-slate-200 bg-[#fafbff] px-5 py-4">

              <div className="mb-3 rounded-xl border border-[#e5ddff] bg-[#f7f4ff] px-4 py-3">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <div className="text-[12px] font-semibold text-slate-800">
                      Total Shipping Charge
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500">

                      {shippingType ===
                      "AIR"
                        ? "Delivery By Air"
                        : "Delivery By Road"}

                      {" · "}

                      {
                        selectedOrderObjects.length
                      }

                      {" order"}

                      {selectedOrderObjects.length !==
                      1
                        ? "s"
                        : ""}

                    </div>

                    <div className="mt-1 text-[10px] text-slate-400">
                      This amount will be deducted from your wallet.
                    </div>

                  </div>

                  <div className="shrink-0 text-[21px] font-bold text-[#7451ff]">
                    ₹
                    {previewLoading
                      ? "..."
                      : previewTotal.toFixed(
                          2
                        )}
                  </div>

                </div>

              </div>

              <div className="flex justify-end gap-2.5">

                <button
                  type="button"
                  disabled={shipping}
                  onClick={() =>
                    setShowShipPopup(
                      false
                    )
                  }
                  className="h-[40px] rounded-[5px] border border-slate-300 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    shipping ||
                    previewLoading ||
                    previewTotal <= 0
                  }
                  onClick={
                    confirmShipNow
                  }
                  className="flex h-[40px] items-center gap-2 rounded-[5px] bg-[#7451ff] px-6 text-[13px] font-medium text-white hover:bg-[#6745ec] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {shipping ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                      Shipping...
                    </>
                  ) : (
                    <>
                      <Icon
                        name="truck"
                        size={15}
                      />

                      Ship Now
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ====================================================
          DELETE CONFIRM MODAL
      ==================================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-[410px] overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Icon
                  name="trash"
                  size={20}
                />
              </div>

              <div>

                <h2 className="text-[17px] font-semibold text-slate-900">
                  Delete Orders
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Permanently remove selected orders
                </p>

              </div>

            </div>

            <div className="px-6 py-5">

              <p className="text-[14px] leading-6 text-slate-600">

                Are you sure you want to delete{" "}

                <span className="font-semibold text-slate-900">

                  {deleteIds.length} order

                  {deleteIds.length >
                  1
                    ? "s"
                    : ""}

                </span>

                ?

              </p>

              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">

                <p className="text-[11px] leading-5 text-red-600">
                  This action cannot be undone. The selected processing orders
                  and their related data will be removed from the database.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteConfirm(
                    false
                  );

                  setDeleteIds(
                    []
                  );
                }}
                className="h-[39px] rounded-lg border border-slate-300 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  confirmDelete
                }
                className="flex h-[39px] items-center gap-2 rounded-lg bg-red-500 px-5 text-[13px] font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Icon
                      name="trash"
                      size={15}
                    />

                    Delete
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

export default ProcessingOrders;