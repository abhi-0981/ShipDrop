import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import { toast } from "react-hot-toast";

import api from "./api";
import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

/* ==========================================================
   DEFAULT SETTINGS
   ========================================================== */

const DEFAULT_LABEL_SETTINGS = {
  orderValue: true,
  codAmount: true,
  buyerMobile: true,
  shipperMobiles: true,
  shipperAddress: true,
  productName: true,
  servicesTnc: true,
  orderId: true,
  orderWeight: true,
  labelSize: "4x6",
};

/* ==========================================================
   BASIC HELPERS
   ========================================================== */

const text = (value, fallback = "—") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/* ==========================================================
   USER
   ========================================================== */

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

/* ==========================================================
   ORDER DATA
   ========================================================== */

const getAWB = (order) =>
  text(
    order?.awb || order?.waybill || order?.awb_number || order?.awbNumber,
    "AWB unavailable",
  );

const getOrderId = (order) =>
  text(
    order?.display_order_id ||
      order?.order_id ||
      order?.orderId ||
      order?.order_number ||
      order?.id,
  );

const getCustomerName = (order) =>
  text(
    order?.consignee_name ||
      order?.customer_name ||
      order?.customer ||
      order?.name,
  );

const getMobile = (order) =>
  text(
    order?.mobile ||
      order?.phone ||
      order?.customer_mobile ||
      order?.consignee_phone ||
      order?.buyer_mobile,
    "",
  );

const getShipmentName = (order) =>
  text(
    order?.product_name ||
      order?.products?.[0]?.product_name ||
      order?.shipment,
    "Shipment",
  );

const getPickupCity = (order) =>
  text(order?.pickup_city || order?.pickupCity || order?.origin_city, "Pickup");

const getPickupPincode = (order) =>
  text(
    order?.pickup_pincode || order?.pickupPincode || order?.origin_pincode,
    "",
  );

const getDeliveryCity = (order) =>
  text(
    order?.city || order?.delivery_city || order?.destination_city,
    "Delivery",
  );

const getDeliveryPincode = (order) =>
  text(
    order?.pincode || order?.delivery_pincode || order?.destination_pincode,
    "",
  );

const getServiceType = (order) =>
  String(order?.service_type || order?.serviceType || "ROAD").toUpperCase();

const getPaymentType = (order) =>
  String(order?.payment_type || order?.paymentType || "PREPAID").toUpperCase();

/* ==========================================================
   WEIGHT / VALUE
   ========================================================== */

const getWeight = (order) => {
  const packageWeight =
    order?.packages?.reduce(
      (total, pkg) =>
        total + (Number(pkg?.weight) || 0) * (Number(pkg?.package_count) || 1),
      0,
    ) || 0;

  return (
    Number(
      order?.total_weight ??
        order?.weight ??
        order?.package_weight ??
        packageWeight,
    ) || 0
  );
};

const getOrderValue = (order) =>
  Number(
    order?.order_value ??
      order?.product_value ??
      order?.total_amount ??
      order?.order_amount ??
      order?.amount ??
      order?.total_value ??
      0,
  ) || 0;

const getCodAmount = (order) =>
  Number(
    order?.cod_amount ??
      order?.cod_value ??
      order?.collectable_amount ??
      order?.codAmount ??
      0,
  ) || 0;

/* ==========================================================
   SHIPPER
   ========================================================== */

const getShipperName = (order) =>
  text(
    order?.warehouse?.contact_name ||
      order?.warehouse_contact_name ||
      order?.pickup_contact_name ||
      order?.shipper_name ||
      order?.pickup_name ||
      order?.company_name ||
      order?.vendor_name,
    "ShipDrop",
  );

const getShipperMobile = (order) =>
  text(
    order?.shipper_mobile ||
      order?.pickup_mobile ||
      order?.seller_mobile ||
      order?.pickup_phone,
    "",
  );

const getAlternateShipperMobile = (order) =>
  text(
    order?.shipper_alternate_mobile ||
      order?.alternate_mobile ||
      order?.pickup_alternate_mobile ||
      order?.seller_alternate_mobile,
    "",
  );

const getShipperAddress = (order) => {
  const warehouse = order?.warehouse || {};

  return [
    warehouse.address_line1 ||
      order?.warehouse_address_line1 ||
      order?.shipper_address ||
      order?.pickup_address ||
      order?.seller_address,

    warehouse.address_line2 ||
      order?.warehouse_address_line2 ||
      order?.shipper_address_line2 ||
      order?.pickup_address_line2,

    warehouse.floor_no || order?.warehouse_floor_no,

    warehouse.landmark || order?.warehouse_landmark,

    warehouse.city ||
      order?.warehouse_city ||
      order?.shipper_city ||
      order?.pickup_city,

    warehouse.state ||
      order?.warehouse_state ||
      order?.shipper_state ||
      order?.pickup_state,

    warehouse.pincode ||
      order?.warehouse_pincode ||
      order?.shipper_pincode ||
      order?.pickup_pincode,

    warehouse.country ||
      order?.warehouse_country ||
      order?.shipper_country ||
      order?.pickup_country ||
      "India",
  ]
    .filter(Boolean)
    .join(", ");
};

/* ==========================================================
   BUYER ADDRESS
   ========================================================== */

const getBuyerAddress = (order) =>
  [
    order?.address_line1 || order?.address || order?.delivery_address,

    order?.address_line2,

    getDeliveryCity(order),

    order?.state || order?.delivery_state,

    getDeliveryPincode(order),
  ]
    .filter(Boolean)
    .join(", ");

/* ==========================================================
   PRODUCTS
   ========================================================== */

const getProductRows = (order) => {
  if (Array.isArray(order?.products) && order.products.length) {
    return order.products;
  }

  return [
    {
      product_name: getShipmentName(order),
      quantity: order?.quantity || order?.qty || 1,
      price:
        order?.product_value || order?.order_value || order?.total_amount || 0,
    },
  ];
};

/* ==========================================================
   DATE
   ========================================================== */

const getCreatedAt = (order) =>
  order?.manifest_created_at ||
  order?.created_at ||
  order?.manifestCreatedAt ||
  order?.createdAt ||
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

/* ==========================================================
   IMAGE HELPERS
   ========================================================== */

const imageUrlToDataUrl = async (url) => {
  if (!url) return null;

  if (String(url).startsWith("data:")) {
    return url;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to load label logo.");
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
};

const getImageDimensions = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth || 1,
        height: img.naturalHeight || 1,
      });
    };

    img.onerror = () => {
      resolve({
        width: 1,
        height: 1,
      });
    };

    img.src = dataUrl;
  });

/* ==========================================================
   BARCODE
   ========================================================== */

const createBarcodeSvg = (value) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  try {
    JsBarcode(svg, String(value || "AWB"), {
      format: "CODE128",
      displayValue: false,
      height: 70,
      width: 2,
      margin: 0,
    });

    return svg.outerHTML;
  } catch (error) {
    console.error("Barcode generation error:", error);

    return `
      <div
        style="
          font-size:16px;
          font-weight:800;
          text-align:center;
          padding:10px;
          border:1px solid #111827;
        "
      >
        ${escapeHtml(value)}
      </div>
    `;
  }
};

const createBarcodeDataUrl = (value) => {
  const canvas = document.createElement("canvas");

  try {
    JsBarcode(canvas, String(value || "AWB"), {
      format: "CODE128",
      displayValue: false,
      height: 70,
      width: 2,
      margin: 0,
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Barcode PDF error:", error);

    return null;
  }
};

/* ==========================================================
   LABEL SIZE
   ========================================================== */

const getLabelSize = (value) => {
  if (value === "4x4") {
    return {
      key: "4x4",
      widthIn: 4,
      heightIn: 4,
      widthMm: 101.6,
      heightMm: 101.6,
    };
  }

  if (value === "A4") {
    return {
      key: "A4",
      widthIn: 8.27,
      heightIn: 11.69,
      widthMm: 210,
      heightMm: 297,
    };
  }

  return {
    key: "4x6",
    widthIn: 4,
    heightIn: 6,
    widthMm: 101.6,
    heightMm: 152.4,
  };
};

const askLabelSize = (currentSize) => {
  if (currentSize !== "always-ask") {
    return currentSize || "4x6";
  }

  const answer = window.prompt(
    "Choose label size:\n\n1 = 4x6\n2 = 4x4\n3 = A4",
    "1",
  );

  if (answer === "2") return "4x4";

  if (answer === "3") return "A4";

  return "4x6";
};

/* ==========================================================
   FETCH FULL ORDER
   ========================================================== */

const getDetailedOrders = async (list) => {
  const userId = getUserId();

  if (!userId) {
    return list;
  }

  return Promise.all(
    list.map(async (order) => {
      try {
        const orderDbId = order?.order_id || order?.id;

        if (!orderDbId) {
          return order;
        }

        const response = await api.get(`/orders/${orderDbId}`, {
          params: {
            user_id: userId,
          },
        });

        const fullOrder =
          response.data?.order ||
          response.data?.result?.order ||
          response.data?.result ||
          null;

        if (!fullOrder) {
          return order;
        }

        return {
          ...order,
          ...fullOrder,
          awb: order?.awb || fullOrder?.awb || fullOrder?.waybill,

          order_id: order?.order_id || fullOrder?.order_id,
        };
      } catch (error) {
        console.warn("Could not fetch full order:", order?.order_id, error);

        return order;
      }
    }),
  );
};

/* ==========================================================
   LABEL SETTINGS
   ========================================================== */

const getLabelSettings = async () => {
  const userId = getUserId();

  if (!userId) {
    return {
      ...DEFAULT_LABEL_SETTINGS,
      customLogo: null,
    };
  }

  try {
    const response = await api.get("/label-settings", {
      params: {
        user_id: userId,
      },
    });

    const data = response.data?.settings;

    if (!response.data?.success || !data) {
      return {
        ...DEFAULT_LABEL_SETTINGS,
        customLogo: null,
      };
    }

    return {
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

      customLogo: data.custom_logo || null,
    };
  } catch (error) {
    console.error("Label settings fetch error:", error);

    return {
      ...DEFAULT_LABEL_SETTINGS,
      customLogo: null,
    };
  }
};

/* ==========================================================
   HTML LABEL
   ========================================================== */

const buildLabelHtml = (order, settings, rightLogo) => {
  const awb = getAWB(order);

  const pcs =
    getProductRows(order).reduce(
      (sum, product) =>
        sum + (Number(product?.quantity ?? product?.qty ?? 1) || 1),
      0,
    ) || 1;

  const payment =
    getPaymentType(order) === "COD"
      ? "COD"
      : "Prepaid";

  const service = getServiceType(order);

  const customerName = getCustomerName(order);
  const buyerAddress = getBuyerAddress(order);

  const sellerName = getShipperName(order);
  const sellerAddress = getShipperAddress(order);
  const sellerGstin = getSellerGstin(order);

  const invoiceNo = getInvoiceNo(order);
  const invoiceDate = getInvoiceDate(order);

  const shipperMobile = getShipperMobile(order);
  const alternateShipperMobile = getAlternateShipperMobile(order);
  const buyerMobile = getMobile(order);

  const barcodeSvg = createBarcodeSvg(awb);

  const size = getLabelSize(settings.labelSize);

  const isA4 = size.key === "A4";
  const is4x4 = size.key === "4x4";

  /*
   * 4x6 is the main shipping-label layout.
   * Everything is scaled around this size.
   */
  const scale = isA4 ? 1.55 : is4x4 ? 0.82 : 1;

  const fs = (value) =>
    `${(value * scale).toFixed(2)}px`;

  const products = getProductRows(order);

  return `
    <div
      class="shipdrop-label"
      style="
        width:${size.widthIn}in;
        height:${size.heightIn}in;
      "
    >
      <div class="label-paper">

        <!-- =========================
             HEADER
        ========================== -->
        <div class="label-header">

          <div class="header-logo header-logo-left">
            <img
              src="${shipdropLogo}"
              alt="ShipDrop"
            />
          </div>

          <div class="header-logo header-logo-right">
            <img
              src="${rightLogo}"
              alt="Delhivery"
            />
          </div>

        </div>


        <!-- =========================
             FROM / TO
        ========================== -->
        <section class="from-to-section">

          <div class="from-box">

            <div class="field-title">
              FROM
            </div>

            <div class="person-name">
              ${escapeHtml(sellerName)}
            </div>

            ${
              settings.shipperAddress && sellerAddress
                ? `
                  <div class="address-text">
                    ${escapeHtml(sellerAddress)}
                  </div>
                `
                : ""
            }

            ${
              settings.shipperMobiles &&
              (shipperMobile || alternateShipperMobile)
                ? `
                  <div class="mobile-text">
                    ${escapeHtml(
                      [shipperMobile, alternateShipperMobile]
                        .filter(Boolean)
                        .join(" / "),
                    )}
                  </div>
                `
                : ""
            }

          </div>


          <div class="to-box">

            <div class="field-title">
              TO
            </div>

            <div class="person-name">
              ${escapeHtml(customerName)}
            </div>

            <div class="address-text">
              ${escapeHtml(buyerAddress)}
            </div>

            ${
              settings.buyerMobile && buyerMobile
                ? `
                  <div class="mobile-text">
                    ${escapeHtml(buyerMobile)}
                  </div>
                `
                : ""
            }

          </div>

        </section>


        <!-- =========================
             AWB + BARCODE
             BARCODE IS BELOW FROM/TO
        ========================== -->
        <section class="awb-section">

          <div class="awb-title">
            AWB No:
          </div>

          <div class="awb-number">
            ${escapeHtml(awb)}
          </div>

          <div class="pcs-number">
            PCS #: ${pcs}
          </div>

          <div class="barcode-wrap">
            ${barcodeSvg}
          </div>

        </section>


        <!-- =========================
             PAYMENT / ORDER / WEIGHT
        ========================== -->
        <section class="summary-row">

          <div class="summary-cell payment-cell">

            <div class="summary-title">
              PAYMENT
            </div>

            <div class="summary-value">
              ${escapeHtml(payment)}
            </div>

          </div>


          <div class="summary-cell order-cell">

            <div class="summary-title">
              ORDER
            </div>

            <div class="summary-value">
              #${escapeHtml(getOrderId(order))}
            </div>

          </div>


          <div class="summary-cell weight-cell">

            <div class="summary-title">
              BILLED WEIGHT
            </div>

            <div class="summary-value">
              ${getWeight(order).toFixed(2)} KG
            </div>

          </div>

        </section>


        <!-- =========================
             SELLER INFORMATION
        ========================== -->
        <section class="seller-table">

          <div class="seller-row seller-heading">

            <div>
              SELLER
            </div>

            <div>
              GSTIN
            </div>

            <div>
              INVOICE NO
            </div>

            <div>
              DATE
            </div>

          </div>


          <div class="seller-row seller-data">

            <div>
              ${escapeHtml(sellerName)}
            </div>

            <div>
              ${escapeHtml(sellerGstin || "—")}
            </div>

            <div>
              ${escapeHtml(invoiceNo || "—")}
            </div>

            <div>
              ${escapeHtml(invoiceDate)}
            </div>

          </div>

        </section>


        <!-- =========================
             INVOICE DETAILS
        ========================== -->
        <section class="invoice-section">

          <div>
            <strong>
              Invoice No:
            </strong>

            ${escapeHtml(invoiceNo || "—")}

            <span class="invoice-divider">
              |
            </span>

            <strong>
              Invoice Date:
            </strong>

            ${escapeHtml(invoiceDate)}
          </div>


          <div>
            <strong>
              GSTIN No:
            </strong>

            ${escapeHtml(sellerGstin || "—")}
          </div>

        </section>


        <!-- =========================
             PRODUCT TABLE
        ========================== -->
        ${
          settings.productName
            ? `
              <section class="product-section">

                <div class="product-heading">

                  <div>
                    PRODUCT NAME
                  </div>

                  <div>
                    RATE
                  </div>

                  <div>
                    QTY
                  </div>

                  <div>
                    TOTAL
                  </div>

                </div>


                ${products
                  .slice(0, isA4 ? 6 : 4)
                  .map((product) => {
                    const productName =
                      product?.product_name ||
                      product?.name ||
                      getShipmentName(order);

                    const quantity =
                      Number(
                        product?.quantity ??
                          product?.qty ??
                          1,
                      ) || 1;

                    const rate =
                      Number(
                        product?.price ??
                          product?.rate ??
                          product?.unit_price ??
                          0,
                      ) || 0;

                    const total =
                      rate * quantity;

                    return `
                      <div class="product-data">

                        <div class="product-name">
                          ${escapeHtml(productName)}
                        </div>

                        <div>
                          ₹${rate.toFixed(2)}
                        </div>

                        <div>
                          ${quantity}
                        </div>

                        <div>
                          ₹${total.toFixed(2)}
                        </div>

                      </div>
                    `;
                  })
                  .join("")}

              </section>
            `
            : ""
        }


        <!-- =========================
             COD
        ========================== -->
        ${
          payment === "COD" &&
          settings.codAmount
            ? `
              <section class="cod-section">

                <div>
                  CASH ON DELIVERY
                </div>

                <strong>
                  ₹${getCodAmount(order).toFixed(2)}
                </strong>

              </section>
            `
            : ""
        }


        <!-- =========================
             NOTE / T&C
        ========================== -->
        ${
          settings.servicesTnc
            ? `
              <section class="note-section">

                <div class="note-title">
                  NOTE
                </div>

                <div class="note-text">
                  If undelivered return to:
                  ${escapeHtml(sellerAddress || sellerName)}
                </div>

                <div class="note-text">
                  ShipDrop shipment is subject to applicable
                  shipping terms and conditions.
                </div>

              </section>
            `
            : ""
        }


        <!-- =========================
             FOOTER
        ========================== -->
        <div class="label-footer">

          <span>
            ${escapeHtml(sellerName)}
          </span>

          <span>
            ${escapeHtml(formatDate(getCreatedAt(order)))}
          </span>

        </div>

      </div>
    </div>


    <style>

      /* =====================================
         MAIN LABEL
      ====================================== */

      .shipdrop-label {
        box-sizing: border-box;

        margin: 0 auto;

        padding: 0;

        background: #ffffff;

        color: #111111;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        page-break-after: always;

        overflow: hidden;
      }


      .shipdrop-label:last-child {
        page-break-after: auto;
      }


      /* =====================================
         PAPER
      ====================================== */

      .label-paper {
        width: 100%;
        height: 100%;

        box-sizing: border-box;

        border: 1.4px solid #222222;

        background: #ffffff;

        overflow: hidden;
      }


      /* =====================================
         HEADER
      ====================================== */

      .label-header {
        height: ${isA4 ? 66 : is4x4 ? 38 : 50}px;

        display: grid;

        grid-template-columns: 1fr 1fr;

        border-bottom: 1.2px solid #222222;
      }


      .header-logo {
        display: flex;

        align-items: center;

        padding: ${isA4 ? 7 : 5}px 8px;

        box-sizing: border-box;
      }


      .header-logo-left {
        justify-content: flex-start;

        border-right: 1.2px solid #222222;
      }


      .header-logo-right {
        justify-content: flex-end;
      }


      .header-logo img {
        display: block;

        max-width: 88%;

        max-height: ${isA4 ? 52 : is4x4 ? 27 : 38}px;

        width: auto;

        height: auto;

        object-fit: contain;
      }


      /* =====================================
         FROM / TO
      ====================================== */

      .from-to-section {
        display: grid;

        grid-template-columns: 1fr 1fr;

        border-bottom: 1.2px solid #222222;

        min-height: ${isA4 ? 48 : is4x4 ? 50 : 68}px;
      }


      .from-box,
      .to-box {
        box-sizing: border-box;

        padding: ${isA4 ? 9 : is4x4 ? 6 : 8}px;

        min-width: 0;
      }


      .from-box {
        border-right: 1.2px solid #222222;
      }


      .field-title {
        font-size: ${fs(8.5)};

        line-height: 1;

        font-weight: 700;

        text-decoration: underline;

        margin-bottom: ${isA4 ? 8 : 6}px;

        color: #111111;
      }


      .person-name {
        font-size: ${fs(9.5)};

        line-height: 1.2;

        font-weight: 700;

        margin-bottom: 4px;

        word-break: break-word;
      }


      .address-text {
        font-size: ${fs(7.6)};

        line-height: 1.28;

        font-weight: 500;

        word-break: break-word;

        overflow-wrap: anywhere;
      }


      .mobile-text {
        margin-top: 4px;

        font-size: ${fs(7)};

        line-height: 1.15;

        font-weight: 700;
      }


      /* =====================================
         AWB + BARCODE
      ====================================== */

      .awb-section {
        text-align: center;

        border-bottom: 1.2px solid #222222;

        padding:
          ${isA4 ? 8 : is4x4 ? 5 : 7}px
          5px
          ${isA4 ? 7 : is4x4 ? 5 : 6}px;
      }


      .awb-title {
        font-size: ${fs(8)};

        line-height: 1.1;

        font-weight: 700;
      }


      .awb-number {
        font-size: ${fs(11)};

        line-height: 1.15;

        font-weight: 800;

        margin-top: 2px;
      }


      .pcs-number {
        font-size: ${fs(7.5)};

        line-height: 1.1;

        font-weight: 600;

        margin-top: 2px;
      }


      .barcode-wrap {
        height: ${isA4 ? 72 : is4x4 ? 38 : 56}px;

        margin-top: 5px;

        display: flex;

        align-items: center;

        justify-content: center;

        overflow: hidden;
      }


      .barcode-wrap svg {
        display: block;

        width: ${isA4 ? 72 : is4x4 ? 72 : 74}%;

        height: ${isA4 ? 58 : is4x4 ? 32 : 48}px;

        max-width: 92%;
      }


      /* =====================================
         PAYMENT / ORDER / WEIGHT
      ====================================== */

      .summary-row {
        display: grid;

        grid-template-columns:
          0.9fr
          1.45fr
          1fr;

        border-bottom: 1.2px solid #222222;
      }


      .summary-cell {
        min-width: 0;

        padding:
          ${isA4 ? 6 : is4x4 ? 4 : 5}px
          6px;

        box-sizing: border-box;

        border-right: 1.2px solid #222222;
      }


      .summary-cell:last-child {
        border-right: 0;
      }


      .summary-title {
        font-size: ${fs(7)};

        line-height: 1.1;

        font-weight: 700;

        color: #333333;

        margin-bottom: 5px;
      }


      .summary-value {
        font-size: ${fs(9)};

        line-height: 1.1;

        font-weight: 800;

        white-space: nowrap;

        overflow: hidden;

        text-overflow: ellipsis;
      }


      /* =====================================
         SELLER TABLE
      ====================================== */

      .seller-table {
        width: 100%;

        border-bottom: 1.2px solid #222222;
      }


      .seller-row {
        display: grid;

        grid-template-columns:
          1.2fr
          1.15fr
          1.15fr
          0.9fr;
      }


      .seller-row > div {
        min-width: 0;

        padding:
          ${isA4 ? 5 : is4x4 ? 3 : 4}px
          5px;

        border-right: 1.2px solid #222222;

        box-sizing: border-box;

        word-break: break-word;

        overflow-wrap: anywhere;
      }


      .seller-row > div:last-child {
        border-right: 0;
      }


      .seller-heading {
        border-bottom: 1.2px solid #222222;

        font-size: ${fs(7)};

        line-height: 1.1;

        font-weight: 700;
      }


      .seller-data {
        font-size: ${fs(7.5)};

        line-height: 1.2;

        font-weight: 600;
      }


      /* =====================================
         INVOICE
      ====================================== */

      .invoice-section {
        padding:
          ${isA4 ? 6 : is4x4 ? 4 : 5}px;

        border-bottom: 1.2px solid #222222;

        font-size: ${fs(7.2)};

        line-height: 1.35;

        word-break: break-word;
      }


      .invoice-section > div + div {
        margin-top: 2px;
      }


      .invoice-divider {
        margin: 0 5px;
      }


      /* =====================================
         PRODUCT
      ====================================== */

      .product-section {
        border-bottom: 1.2px solid #222222;
      }


      .product-heading,
      .product-data {
        display: grid;

        grid-template-columns:
          2fr
          1fr
          0.65fr
          1fr;
      }


      .product-heading {
        border-bottom: 1.2px solid #222222;

        font-size: ${fs(7)};

        line-height: 1.1;

        font-weight: 700;
      }


      .product-data {
        font-size: ${fs(7.5)};

        line-height: 1.15;

        font-weight: 600;
      }


      .product-heading > div,
      .product-data > div {
        min-width: 0;

        padding:
          ${isA4 ? 4 : is4x4 ? 3 : 4}px;

        border-right: 1.2px solid #222222;

        box-sizing: border-box;

        overflow: hidden;

        word-break: break-word;
      }


      .product-heading > div:last-child,
      .product-data > div:last-child {
        border-right: 0;
      }


      .product-name {
        overflow-wrap: anywhere;
      }


      /* =====================================
         COD
      ====================================== */

      .cod-section {
        display: flex;

        align-items: center;

        justify-content: space-between;

        padding:
          ${isA4 ? 7 : is4x4 ? 4 : 6}px;

        border-bottom: 1.2px solid #222222;

        font-size: ${fs(8)};

        font-weight: 800;
      }


      .cod-section strong {
        font-size: ${fs(10)};

        font-weight: 900;
      }


      /* =====================================
         NOTE
      ====================================== */

      .note-section {
        padding:
          ${isA4 ? 7 : is4x4 ? 4 : 6}px;

        border-bottom: 1.2px solid #222222;
      }


      .note-title {
        font-size: ${fs(7)};

        font-weight: 800;

        margin-bottom: 4px;
      }


      .note-text {
        font-size: ${fs(6.8)};

        line-height: 1.3;

        font-weight: 500;

        word-break: break-word;
      }


      .note-text + .note-text {
        margin-top: 3px;
      }


      /* =====================================
         FOOTER
      ====================================== */

      .label-footer {
        display: flex;

        align-items: center;

        justify-content: space-between;

        padding:
          ${isA4 ? 6 : is4x4 ? 4 : 5}px 6px;

        font-size: ${fs(6.5)};

        line-height: 1;

        color: #444444;
      }


      /* =====================================
         PRINT
      ====================================== */

      @media print {

        .shipdrop-label {
          margin: 0 !important;

          padding: 0 !important;

          box-shadow: none !important;
        }

        .label-paper {
          border: 1.4px solid #222222 !important;
        }

      }

    </style>
  `;
};

/* ==========================================================
   SETTINGS RESOLVER
   ========================================================== */

const resolveSettings = async (passedSettings = null) => {
  let settings;

  if (passedSettings && typeof passedSettings === "object") {
    settings = {
      ...DEFAULT_LABEL_SETTINGS,
      ...passedSettings,
    };
  } else {
    settings = await getLabelSettings();
  }

  return {
    ...DEFAULT_LABEL_SETTINGS,
    ...settings,
    labelSize: askLabelSize(settings.labelSize),
  };
};

/* ==========================================================
   PRINT SHIPPING LABELS
   Compatible with:
   printShippingLabels(
     orders,
     settings,
     customLogo,
     title
   )

   AND:
   printShippingLabels(
     orders,
     title
   )
   ========================================================== */

export const printShippingLabels = async (
  orders,
  settingsOrTitle = null,
  customLogo = null,
  title = "ShipDrop Shipping Labels",
) => {
  if (!Array.isArray(orders) || !orders.length) {
    throw new Error("Please select at least one shipment");
  }

  let passedSettings = null;
  let finalTitle = title;
  let finalLogo = customLogo;

  if (typeof settingsOrTitle === "string") {
    finalTitle = settingsOrTitle;
  } else if (settingsOrTitle && typeof settingsOrTitle === "object") {
    passedSettings = settingsOrTitle;
  }

  try {
    const settings = await resolveSettings(passedSettings);

    const detailedOrders = await getDetailedOrders(orders);

    finalLogo = finalLogo || settings.customLogo || delhiveryLogo;

    const html = detailedOrders
      .map((order) => buildLabelHtml(order, settings, finalLogo))
      .join("");

    const size = getLabelSize(settings.labelSize);

    const win = window.open("", "_blank", "width=900,height=800");

    if (!win) {
      throw new Error("Please allow pop-ups to print");
    }

    win.document.write(`
      <!doctype html>

      <html>

        <head>

          <meta
            charset="UTF-8"
          />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            ${escapeHtml(finalTitle)}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .print-wrapper {
              width: 100%;
            }

            @page {
              size:
                ${size.widthIn}in
                ${size.heightIn}in;

              margin: 0;
            }

            @media print {

              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }

              .shipdrop-label {
                margin: 0 !important;
              }

            }

          </style>

        </head>

        <body>

          <div class="print-wrapper">
            ${html}
          </div>

        </body>

      </html>
    `);

    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();

      setTimeout(() => {
        try {
          win.close();
        } catch {
          // Ignore
        }
      }, 1200);
    }, 800);

    return detailedOrders;
  } catch (error) {
    console.error("Print label error:", error);

    throw error;
  }
};

/* ==========================================================
   DOWNLOAD SHIPPING LABELS
   Compatible with current Manifested.jsx
   ========================================================== */

export const downloadShippingLabels = async (
  orders,
  settingsOrLogo = null,
  customLogo = null,
) => {
  if (!Array.isArray(orders) || !orders.length) {
    throw new Error("Please select at least one shipment");
  }

  try {
    let passedSettings = null;
    let finalLogo = customLogo;

    if (settingsOrLogo && typeof settingsOrLogo === "object") {
      passedSettings = settingsOrLogo;
    }

    if (typeof settingsOrLogo === "string") {
      finalLogo = settingsOrLogo;
    }

    const settings = await resolveSettings(passedSettings);

    const detailedOrders = await getDetailedOrders(orders);

    const size = getLabelSize(settings.labelSize);

    finalLogo = finalLogo || settings.customLogo || delhiveryLogo;

    const shipdropLogoData = await imageUrlToDataUrl(shipdropLogo);

    const rightLogoData = await imageUrlToDataUrl(finalLogo);

    const pdf = new jsPDF({
      orientation: size.widthMm > size.heightMm ? "landscape" : "portrait",

      unit: "mm",

      format: [size.widthMm, size.heightMm],

      compress: true,
    });

    const shipLogoDimensions = await getImageDimensions(shipdropLogoData);

    const rightLogoDimensions = await getImageDimensions(rightLogoData);

    for (let index = 0; index < detailedOrders.length; index += 1) {
      const order = detailedOrders[index];

      if (index > 0) {
        pdf.addPage(
          [size.widthMm, size.heightMm],
          size.widthMm > size.heightMm ? "landscape" : "portrait",
        );
      }

      const pageW = size.widthMm;

      const pageH = size.heightMm;

      const isA4 = size.key === "A4";

      const is4x4 = size.key === "4x4";

      const margin = isA4 ? 8 : is4x4 ? 3 : 4;

      const innerW = pageW - margin * 2;

      const payment = getPaymentType(order);

      const service = getServiceType(order);

      /* ----------------------------------------------------
           OUTER BORDER
           ---------------------------------------------------- */

      pdf.setDrawColor(17, 24, 39);

      pdf.setLineWidth(0.4);

      pdf.rect(margin, margin, innerW, pageH - margin * 2);

      /* ----------------------------------------------------
           HEADER
           ---------------------------------------------------- */

      const headerTop = margin + 4;

      const logoHeight = isA4 ? 18 : is4x4 ? 9 : 12;

      const leftLogoWidth = Math.min(
        logoHeight * (shipLogoDimensions.width / shipLogoDimensions.height),
        innerW * 0.4,
      );

      const rightLogoWidth = Math.min(
        logoHeight * (rightLogoDimensions.width / rightLogoDimensions.height),
        innerW * 0.38,
      );

      pdf.addImage(
        shipdropLogoData,
        "PNG",
        margin + 4,
        headerTop,
        leftLogoWidth,
        logoHeight,
      );

      pdf.addImage(
        rightLogoData,
        "PNG",
        pageW - margin - 4 - rightLogoWidth,
        headerTop,
        rightLogoWidth,
        logoHeight,
      );

      const headerBottom = headerTop + logoHeight + 5;

      pdf.line(margin, headerBottom, pageW - margin, headerBottom);

      /* ----------------------------------------------------
           AWB
           ---------------------------------------------------- */

      let cursorY = headerBottom + 5;

      pdf.setFont("helvetica", "bold");

      pdf.setFontSize(isA4 ? 9 : is4x4 ? 6 : 7);

      pdf.setTextColor(100, 116, 139);

      pdf.text("AWB", pageW / 2, cursorY, {
        align: "center",
      });

      cursorY += isA4 ? 5 : is4x4 ? 3 : 4;

      pdf.setFontSize(isA4 ? 16 : is4x4 ? 9 : 11);

      pdf.setTextColor(17, 24, 39);

      pdf.text(getAWB(order), pageW / 2, cursorY, {
        align: "center",
      });

      cursorY += isA4 ? 5 : is4x4 ? 3 : 4;

      const barcodeData = createBarcodeDataUrl(getAWB(order));

      if (barcodeData) {
        const barcodeWidth = innerW * (isA4 ? 0.52 : is4x4 ? 0.58 : 0.55);

        const barcodeHeight = isA4 ? 18 : is4x4 ? 10 : 14;

        pdf.addImage(
          barcodeData,
          "PNG",
          pageW / 2 - barcodeWidth / 2,
          cursorY,
          barcodeWidth,
          barcodeHeight,
        );

        cursorY += barcodeHeight + (isA4 ? 4 : 3);
      }

      pdf.line(margin, cursorY, pageW - margin, cursorY);

      /* ----------------------------------------------------
           FROM / TO
           ---------------------------------------------------- */

      const fromToTop = cursorY;

      const fromToHeight = isA4 ? 39 : is4x4 ? 24 : 29;

      const halfW = innerW / 2;

      pdf.line(pageW / 2, fromToTop, pageW / 2, fromToTop + fromToHeight);

      pdf.setFontSize(isA4 ? 8 : is4x4 ? 5.5 : 6);

      pdf.setTextColor(100, 116, 139);

      pdf.text("FROM", margin + 3, fromToTop + 6);

      pdf.text("TO", pageW / 2 + 3, fromToTop + 6);

      pdf.setFontSize(isA4 ? 12 : is4x4 ? 7.5 : 9);

      pdf.setTextColor(17, 24, 39);

      pdf.text(getShipperName(order), margin + 3, fromToTop + 12, {
        maxWidth: halfW - 7,
      });

      pdf.text(getCustomerName(order), pageW / 2 + 3, fromToTop + 12, {
        maxWidth: halfW - 7,
      });

      pdf.setFontSize(isA4 ? 8 : is4x4 ? 5.5 : 6.5);

      pdf.setTextColor(55, 65, 81);

      const fromAddress = getShipperAddress(order);

      const toAddress = getBuyerAddress(order);

      if (settings.shipperAddress) {
        pdf.text(fromAddress, margin + 3, fromToTop + 18, {
          maxWidth: halfW - 7,
        });
      }

      pdf.text(toAddress, pageW / 2 + 3, fromToTop + 18, {
        maxWidth: halfW - 7,
      });

      if (settings.shipperMobiles) {
        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 5.5);

        pdf.text(
          [getShipperMobile(order), getAlternateShipperMobile(order)]
            .filter(Boolean)
            .join(" / "),
          margin + 3,
          fromToTop + fromToHeight - 5,
          {
            maxWidth: halfW - 7,
          },
        );
      }

      if (settings.buyerMobile) {
        pdf.text(getMobile(order), pageW / 2 + 3, fromToTop + fromToHeight - 5);
      }

      cursorY = fromToTop + fromToHeight;

      pdf.line(margin, cursorY, pageW - margin, cursorY);

      /* ----------------------------------------------------
           PAYMENT / SERVICE / WEIGHT
           ---------------------------------------------------- */

      const infoHeight = isA4 ? 20 : is4x4 ? 13 : 16;

      const colW = innerW / 3;

      pdf.line(margin + colW, cursorY, margin + colW, cursorY + infoHeight);

      pdf.line(
        margin + colW * 2,
        cursorY,
        margin + colW * 2,
        cursorY + infoHeight,
      );

      const drawInfo = (x, label, value) => {
        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(100, 116, 139);

        pdf.text(label, x + 3, cursorY + 6);

        pdf.setFontSize(isA4 ? 11 : is4x4 ? 7 : 9);

        pdf.setTextColor(17, 24, 39);

        pdf.text(value, x + 3, cursorY + 13);
      };

      drawInfo(margin, "PAYMENT", payment);

      drawInfo(
        margin + colW,
        "SERVICE",
        service === "AIR" ? "BY AIR" : "BY ROAD",
      );

      drawInfo(
        margin + colW * 2,
        "WEIGHT",
        settings.orderWeight ? `${getWeight(order).toFixed(2)} KG` : "—",
      );

      cursorY += infoHeight;

      pdf.line(margin, cursorY, pageW - margin, cursorY);

      /* ----------------------------------------------------
           ORDER ID / ORDER VALUE
           ---------------------------------------------------- */

      const orderRowHeight = isA4 ? 18 : is4x4 ? 12 : 15;

      if (settings.orderId) {
        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(100, 116, 139);

        pdf.text("ORDER ID", margin + 3, cursorY + 6);

        pdf.setFontSize(isA4 ? 11 : is4x4 ? 7 : 9);

        pdf.setTextColor(17, 24, 39);

        pdf.text(`#${getOrderId(order)}`, margin + 3, cursorY + 13);
      }

      if (settings.orderValue) {
        const middle = margin + innerW / 2;

        pdf.line(middle, cursorY, middle, cursorY + orderRowHeight);

        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(100, 116, 139);

        pdf.text("ORDER VALUE", middle + 3, cursorY + 6);

        pdf.setFontSize(isA4 ? 11 : is4x4 ? 7 : 9);

        pdf.setTextColor(17, 24, 39);

        pdf.text(
          `₹${getOrderValue(order).toFixed(2)}`,
          middle + 3,
          cursorY + 13,
        );
      }

      cursorY += orderRowHeight;

      pdf.line(margin, cursorY, pageW - margin, cursorY);

      /* ----------------------------------------------------
           COD
           ---------------------------------------------------- */

      if (settings.codAmount && payment === "COD") {
        const codHeight = isA4 ? 19 : is4x4 ? 12 : 15;

        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(isA4 ? 8 : is4x4 ? 5.5 : 6.5);

        pdf.setTextColor(17, 24, 39);

        pdf.text("CASH ON DELIVERY", margin + 3, cursorY + 7);

        pdf.setFontSize(isA4 ? 12 : is4x4 ? 8 : 10);

        pdf.text(
          `₹${getCodAmount(order).toFixed(2)}`,
          pageW - margin - 3,
          cursorY + 11,
          {
            align: "right",
          },
        );

        cursorY += codHeight;

        pdf.line(margin, cursorY, pageW - margin, cursorY);
      }

      /* ----------------------------------------------------
           PRODUCT
           ---------------------------------------------------- */

      if (settings.productName) {
        const products = getProductRows(order);

        const productHeight = isA4 ? 28 : is4x4 ? 18 : 23;

        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(100, 116, 139);

        pdf.text("PRODUCT", margin + 3, cursorY + 6);

        pdf.setFontSize(isA4 ? 10 : is4x4 ? 6.5 : 8);

        pdf.setTextColor(17, 24, 39);

        products.slice(0, isA4 ? 4 : 2).forEach((product, productIndex) => {
          const name = product?.product_name || product?.name || "Product";

          const qty = product?.quantity || product?.qty || 1;

          pdf.text(
            `${name}  x${qty}`,
            margin + 3,
            cursorY + 12 + productIndex * 5,
            {
              maxWidth: innerW - 6,
            },
          );
        });

        cursorY += productHeight;

        pdf.line(margin, cursorY, pageW - margin, cursorY);
      }

      /* ----------------------------------------------------
           T&C
           ---------------------------------------------------- */

      if (settings.servicesTnc) {
        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(100, 116, 139);

        pdf.text("SERVICES T&C", margin + 3, cursorY + 6);

        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(isA4 ? 7 : is4x4 ? 5 : 6);

        pdf.setTextColor(71, 85, 105);

        pdf.text(
          "ShipDrop shipment is subject to applicable shipping terms and conditions.",
          margin + 3,
          cursorY + 12,
          {
            maxWidth: innerW - 6,
          },
        );

        cursorY += isA4 ? 19 : is4x4 ? 13 : 16;

        pdf.line(margin, cursorY, pageW - margin, cursorY);
      }

      /* ----------------------------------------------------
           FOOTER
           ---------------------------------------------------- */

      pdf.setFont("helvetica", "normal");

      pdf.setFontSize(isA4 ? 6 : is4x4 ? 4.5 : 5.5);

      pdf.setTextColor(100, 116, 139);

      pdf.text(getShipperName(order), margin + 3, pageH - margin - 4);

      pdf.text(
        formatDate(getCreatedAt(order)),
        pageW - margin - 3,
        pageH - margin - 4,
        {
          align: "right",
        },
      );
    }

    /* ------------------------------------------------------
         SAVE
         ------------------------------------------------------ */

    const fileName =
      detailedOrders.length === 1
        ? `shipdrop-label-${getAWB(detailedOrders[0])}.pdf`
        : `shipdrop-labels-${new Date().toISOString().slice(0, 10)}.pdf`;

    pdf.save(fileName);

    return detailedOrders;
  } catch (error) {
    console.error("Download label error:", error);

    throw error;
  }
};

/* ==========================================================
   EXPORTS
   ========================================================== */

export { DEFAULT_LABEL_SETTINGS };
