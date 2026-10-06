import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";
import api from "./api";
import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

export const DEFAULT_LABEL_SETTINGS = {
  orderValue: true,
  codAmount: true,
  buyerMobile: true,
  shipperMobiles: true,
  shipperAddress: true,
  fromName: true,
  fromAddress: true,
  fromMobile: true,
  productName: true,
  productDetails: true,
  servicesTnc: false,
  orderId: true,
  orderWeight: true,
  returnAddress: true,
  contactLine: true,
  rightLogoMode: "delhivery",
  labelSize: "4x6",
  customLogo: null,
};

const text = (value, fallback = "—") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
};

const first = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
  );

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getStoredUser = () => {
  for (const key of ["user", "currentUser", "authUser"]) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const user = JSON.parse(raw);
      if (user && typeof user === "object") {
        return user;
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  return null;
};

const getUserId = () => {
  const user = getStoredUser();
  return user?.id || user?.user_id || user?.userId || null;
};

const getAWB = (order) =>
  text(
    first(
      order?.awb,
      order?.waybill,
      order?.awb_number,
      order?.awbNumber
    ),
    "AWB unavailable"
  );

const getOrderId = (order) =>
  text(
    first(
      order?.display_order_id,
      order?.displayOrderId,
      order?.order_id,
      order?.orderId,
      order?.order_number,
      order?.orderNumber,
      order?.id
    )
  );

const getCustomerName = (order) =>
  text(
    first(
      order?.consignee_name,
      order?.customer_name,
      order?.customerName,
      order?.customer,
      order?.buyer_name,
      order?.buyerName,
      order?.name
    )
  );

const getMobile = (order) =>
  text(
    first(
      order?.mobile,
      order?.phone,
      order?.customer_mobile,
      order?.customerMobile,
      order?.consignee_phone,
      order?.consigneePhone,
      order?.buyer_mobile,
      order?.buyerMobile
    ),
    ""
  );

const getPaymentType = (order) => {
  const payment = String(
    first(
      order?.payment_type,
      order?.paymentType,
      order?.payment_method,
      order?.paymentMethod,
      "PREPAID"
    )
  ).toUpperCase();
  return payment.includes("COD") ? "COD" : "PREPAID";
};

const getServiceType = (order) =>
  String(
    first(
      order?.service_type,
      order?.serviceType,
      order?.shipment_type,
      "ROAD"
    )
  ).toUpperCase();

const getWeight = (order) => {
  const packageWeight = Array.isArray(order?.packages)
    ? order.packages.reduce(
        (sum, item) =>
          sum +
          (Number(item?.weight) || 0) *
            (Number(item?.package_count) || 1),
        0
      )
    : 0;
  return (
    Number(
      first(
        order?.total_weight,
        order?.totalWeight,
        order?.billed_weight,
        order?.billedWeight,
        order?.weight,
        order?.package_weight,
        order?.packageWeight,
        packageWeight,
        0
      )
    ) || 0
  );
};

const getDate = (order) =>
  first(
    order?.invoice_date,
    order?.invoiceDate,
    order?.manifest_created_at,
    order?.manifestCreatedAt,
    order?.created_at,
    order?.createdAt,
    new Date()
  );

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const money = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

const getOrderValue = (order) =>
  Number(
    first(
      order?.order_value,
      order?.product_value,
      order?.total_amount,
      order?.order_amount,
      order?.amount,
      order?.total_value,
      0
    )
  ) || 0;

const getCodAmount = (order) =>
  Number(
    first(
      order?.cod_amount,
      order?.cod_value,
      order?.collectable_amount,
      order?.codAmount,
      0
    )
  ) || 0;

const getSellerName = (order) => {
  const user = getStoredUser();
  return text(
    first(
      order?.seller_name,
      order?.sellerName,
      order?.seller_full_name,
      order?.sellerFullName,
      order?.seller_company_name,
      order?.sellerCompanyName,
      order?.pickup_name,
      order?.pickupName,
      order?.business_name,
      order?.businessName,
      order?.company_name,
      order?.companyName,
      user?.business_name,
      user?.name
    )
  );
};

const getSellerGstin = (order) =>
  text(
    first(
      order?.seller_gstin,
      order?.sellerGstin,
      order?.seller_gst,
      order?.sellerGSTIN,
      order?.gstin,
      order?.GSTIN
    ),
    "—"
  );

const getInvoiceNo = (order) =>
  text(
    first(
      order?.invoice_number,
      order?.invoiceNumber,
      order?.invoice_no,
      order?.invoiceNo
    ),
    "—"
  );

const getFromName = (order) =>
  text(
    first(
      order?.pickup_name,
      order?.pickupName,
      order?.pickup_contact_name,
      order?.pickupContactName,
      order?.warehouse?.contact_name,
      order?.warehouse?.contactName,
      order?.warehouse_contact_name,
      order?.warehouseContactName,
      order?.shipper_name,
      order?.shipperName,
      order?.seller_name
    )
  );

const getFromMobile = (order) =>
  text(
    first(
      order?.shipper_mobile,
      order?.pickup_mobile,
      order?.seller_mobile,
      order?.pickup_phone,
      order?.warehouse?.mobile,
      order?.warehouse?.phone
    ),
    ""
  );

const getAlternateFromMobile = (order) =>
  text(
    first(
      order?.shipper_alternate_mobile,
      order?.alternate_mobile,
      order?.pickup_alternate_mobile,
      order?.seller_alternate_mobile
    ),
    ""
  );

const getFromAddress = (order) => {
  const warehouse = order?.warehouse || {};
  const addr = [
    first(
      warehouse.address_line1,
      warehouse.addressLine1,
      order?.warehouse_address_line1,
      order?.warehouseAddressLine1,
      order?.pickup_address,
      order?.pickupAddress,
      order?.shipper_address,
      order?.shipperAddress
    ),
    first(
      warehouse.address_line2,
      warehouse.addressLine2,
      order?.warehouse_address_line2,
      order?.pickup_address_line2,
      order?.pickupAddressLine2
    ),
    first(
      warehouse.landmark,
      order?.warehouse_landmark,
      order?.pickup_landmark
    ),
    first(
      warehouse.city,
      order?.warehouse_city,
      order?.warehouseCity,
      order?.pickup_city,
      order?.pickupCity
    ),
    first(
      warehouse.state,
      order?.warehouse_state,
      order?.warehouseState,
      order?.pickup_state,
      order?.pickupState
    ),
    first(
      warehouse.pincode,
      order?.warehouse_pincode,
      order?.warehousePincode,
      order?.pickup_pincode,
      order?.pickupPincode
    ),
    "India",
  ]
    .filter(Boolean)
    .join(", ");

  return addr || "—";
};

const getBuyerAddress = (order) => {
  const addr = [
    first(
      order?.address_line1,
      order?.addressLine1,
      order?.address,
      order?.delivery_address,
      order?.deliveryAddress,
      order?.buyer_address1
    ),
    first(
      order?.address_line2,
      order?.addressLine2,
      order?.buyer_address2
    ),
    first(order?.landmark, order?.buyer_landmark),
    first(
      order?.city,
      order?.delivery_city,
      order?.deliveryCity,
      order?.buyer_city
    ),
    first(
      order?.state,
      order?.delivery_state,
      order?.deliveryState,
      order?.buyer_state
    ),
    first(
      order?.pincode,
      order?.delivery_pincode,
      order?.deliveryPincode,
      order?.buyer_pincode
    ),
    "India",
  ]
    .filter(Boolean)
    .join(", ");

  return addr || "—";
};

const getReturnAddress = (order) => {
  const addr = [
    first(
      order?.return_address_line1,
      order?.returnAddressLine1,
      order?.return_address,
      order?.returnAddress
    ),
    first(
      order?.return_address_line2,
      order?.returnAddressLine2
    ),
    first(order?.return_landmark, order?.returnLandmark),
    first(order?.return_city, order?.returnCity),
    first(order?.return_state, order?.returnState),
    first(order?.return_pincode, order?.returnPincode),
    "India",
  ]
    .filter(Boolean)
    .join(", ");

  return addr || getFromAddress(order);
};

const getReturnName = (order) =>
  text(
    first(order?.return_name, order?.returnName, getFromName(order), getSellerName(order))
  );

const getProducts = (order) => {
  const products =
    Array.isArray(order?.products) && order.products.length
      ? order.products
      : [
          {
            product_name: first(
              order?.product_name,
              order?.productName,
              order?.shipment,
              "Product"
            ),
            quantity: first(order?.quantity, order?.qty, 1),
            price: first(
              order?.product_value,
              order?.productValue,
              order?.order_value,
              order?.orderValue,
              order?.total_amount,
              0
            ),
          },
        ];

  return products.map((product) => {
    const name = text(
      first(
        product?.product_name,
        product?.productName,
        product?.name,
        product?.product
      ),
      "Product"
    );

    const qty =
      Number(
        first(
          product?.quantity,
          product?.qty,
          product?.product_quantity,
          product?.productQuantity,
          1
        )
      ) || 1;

    const rate =
      Number(
        first(
          product?.rate,
          product?.price,
          product?.unit_price,
          product?.unitPrice,
          product?.product_price,
          product?.productPrice,
          0
        )
      ) || 0;

    const total =
      Number(
        first(
          product?.total,
          product?.total_price,
          product?.totalPrice,
          product?.amount,
          rate * qty
        )
      ) || rate * qty;

    return { name, qty, rate, total };
  });
};

const getLabelSize = (value) => {
  const sizes = {
    "4x6": {
      key: "4x6",
      widthIn: 4,
      heightIn: 6,
      widthMm: 101.6,
      heightMm: 152.4,
    },
    A4: {
      key: "A4",
      widthIn: 8.27,
      heightIn: 11.69,
      widthMm: 210,
      heightMm: 297,
    },
    "4x2": {
      key: "4x2",
      widthIn: 4,
      heightIn: 2,
      widthMm: 101.6,
      heightMm: 50.8,
    },
    "4x2.5": {
      key: "4x2.5",
      widthIn: 4,
      heightIn: 2.5,
      widthMm: 101.6,
      heightMm: 63.5,
    },
    "3x2": {
      key: "3x2",
      widthIn: 3,
      heightIn: 2,
      widthMm: 76.2,
      heightMm: 50.8,
    },
  };

  return sizes[value] || sizes["4x6"];
};

const normalizeSettings = (data = {}) => ({
  ...DEFAULT_LABEL_SETTINGS,
  orderValue: Boolean(
    data.order_value ?? data.orderValue ?? DEFAULT_LABEL_SETTINGS.orderValue
  ),
  codAmount: Boolean(
    data.cod_amount ?? data.codAmount ?? DEFAULT_LABEL_SETTINGS.codAmount
  ),
  buyerMobile: Boolean(
    data.buyer_mobile ?? data.buyerMobile ?? DEFAULT_LABEL_SETTINGS.buyerMobile
  ),
  shipperMobiles: Boolean(
    data.shipper_mobiles ??
      data.shipperMobiles ??
      DEFAULT_LABEL_SETTINGS.shipperMobiles
  ),
  shipperAddress: Boolean(
    data.shipper_address ??
      data.shipperAddress ??
      DEFAULT_LABEL_SETTINGS.shipperAddress
  ),
  fromName: Boolean(
    data.from_name ?? data.fromName ?? DEFAULT_LABEL_SETTINGS.fromName
  ),
  fromAddress: Boolean(
    data.from_address ?? data.fromAddress ?? DEFAULT_LABEL_SETTINGS.fromAddress
  ),
  fromMobile: Boolean(
    data.from_mobile ?? data.fromMobile ?? DEFAULT_LABEL_SETTINGS.fromMobile
  ),
  productName: Boolean(
    data.product_name ?? data.productName ?? DEFAULT_LABEL_SETTINGS.productName
  ),
  productDetails: Boolean(
    data.product_details ??
      data.productDetails ??
      DEFAULT_LABEL_SETTINGS.productDetails
  ),
  servicesTnc: Boolean(
    data.services_tnc ?? data.servicesTnc ?? DEFAULT_LABEL_SETTINGS.servicesTnc
  ),
  orderId: Boolean(
    data.order_id ?? data.orderId ?? DEFAULT_LABEL_SETTINGS.orderId
  ),
  orderWeight: Boolean(
    data.order_weight ?? data.orderWeight ?? DEFAULT_LABEL_SETTINGS.orderWeight
  ),
  returnAddress: Boolean(
    data.return_address ??
      data.returnAddress ??
      DEFAULT_LABEL_SETTINGS.returnAddress
  ),
  contactLine: Boolean(
    data.contact_line ?? data.contactLine ?? DEFAULT_LABEL_SETTINGS.contactLine
  ),
  rightLogoMode:
    data.right_logo_mode ||
    data.rightLogoMode ||
    DEFAULT_LABEL_SETTINGS.rightLogoMode,
  labelSize:
    data.label_size || data.labelSize || DEFAULT_LABEL_SETTINGS.labelSize,
  customLogo: data.custom_logo || data.customLogo || null,
});

const getLabelSettings = async () => {
  const userId = getUserId();
  if (!userId) return { ...DEFAULT_LABEL_SETTINGS };

  try {
    const response = await api.get("/label-settings", {
      params: { user_id: userId },
    });
    const data = response.data?.settings;
    if (!response.data?.success || !data) {
      return { ...DEFAULT_LABEL_SETTINGS };
    }
    return normalizeSettings(data);
  } catch (error) {
    console.error("Label settings fetch error:", error);
    return { ...DEFAULT_LABEL_SETTINGS };
  }
};

const getDetailedOrders = async (orders) => {
  const userId = getUserId();
  if (!userId) return orders;

  return Promise.all(
    orders.map(async (order) => {
      const id = order?.order_id || order?.id;
      if (!id) return order;

      try {
        const response = await api.get(`/orders/${id}`, {
          params: { user_id: userId },
        });
        const full =
          response.data?.order ||
          response.data?.result?.order ||
          response.data?.result ||
          null;

        return full
          ? {
              ...order,
              ...full,
              awb: first(order?.awb, full?.awb, full?.waybill),
              order_id: first(order?.order_id, full?.order_id),
            }
          : order;
      } catch (error) {
        console.warn("Could not fetch full order details:", id, error);
        return order;
      }
    })
  );
};

const barcodeSvg = (value, compact = false) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, String(value || "AWB"), {
    format: "CODE128",
    displayValue: false,
    height: compact ? 26 : 40,
    width: compact ? 1.2 : 1.7,
    margin: 0,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return svg.outerHTML;
};

const buildLabelHtml = (order, settings, rightLogo, size) => {
  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const isA4 = size.key === "A4";
  const compact = size.heightIn <= 2.5;

  const fromAddress = getFromAddress(order);
  const buyerAddress = getBuyerAddress(order);
  const fromName = getFromName(order);
  const fromMobiles = [
    getFromMobile(order),
    getAlternateFromMobile(order),
  ]
    .filter(Boolean)
    .join(" / ");

  const products = getProducts(order);
  const showFromName = settings.fromName !== false;
  const showFromAddress = settings.fromAddress !== false && settings.shipperAddress !== false;
  const showFromMobile = settings.fromMobile !== false && settings.shipperMobiles !== false;
  const showBuyerMobile = settings.buyerMobile !== false && Boolean(getMobile(order));
  const showWeight = settings.orderWeight !== false;
  const showOrderId = settings.orderId !== false;
  const showOrderValue = settings.orderValue !== false;
  const showCod = settings.codAmount !== false && payment === "COD";
  const showProducts = settings.productDetails !== false && settings.productName !== false;
  const returnAddress = getReturnAddress(order);

  const contactText =
    "For complaints & queries please contact 8766066070, 0141-4797120";

  const productRows = showProducts
    ? products
        .slice(0, isA4 ? 10 : compact ? 1 : 4)
        .map(
          (product) => `
            <tr>
              <td class="pname">${escapeHtml(product.name)}</td>
              <td class="num">${escapeHtml(product.rate.toFixed(2))}</td>
              <td class="num">${escapeHtml(product.qty)}</td>
              <td class="num">${escapeHtml(product.total.toFixed(2))}</td>
            </tr>
          `
        )
        .join("")
    : "";

  return `
    <article
      class="shipping-label ${compact ? "compact" : ""} ${isA4 ? "a4" : ""}"
      style="width:${size.widthIn}in; height:${size.heightIn}in;"
    >
      <div class="label-border">
        <!-- LOGO HEADER -->
        <header class="row logos">
          <div class="logo-box left">
            <img src="${escapeHtml(shipdropLogo)}" alt="ShipDrop" />
          </div>
          <div class="logo-box right">
            ${rightLogo ? `<img src="${escapeHtml(rightLogo)}" alt="Carrier" />` : ""}
          </div>
        </header>

        <!-- AWB BARCODE -->
        <section class="awb-box">
          <div class="barcode">${barcodeSvg(awb, compact)}</div>
          <div class="awb-label">AWB No: <b>${escapeHtml(awb)}</b></div>
        </section>

        <!-- ADDRESSES: FROM & TO -->
        <section class="row addresses">
          <div class="col-half from-box">
            <div class="field-title">FROM:</div>
            ${showFromName ? `<div class="name-bold">${escapeHtml(fromName)}</div>` : ""}
            ${showFromAddress ? `<div class="addr-text">${escapeHtml(fromAddress)}</div>` : ""}
            ${showFromMobile && fromMobiles ? `<div class="phone-text">Mobile: ${escapeHtml(fromMobiles)}</div>` : ""}
          </div>

          <div class="col-half to-box">
            <div class="field-title">TO / CONSIGNEE:</div>
            <div class="name-bold">
              ${escapeHtml(getCustomerName(order))}
              ${showBuyerMobile ? ` <span class="buyer-mobile">(${escapeHtml(getMobile(order))})</span>` : ""}
            </div>
            <div class="addr-text">${escapeHtml(buyerAddress)}</div>
          </div>
        </section>

        <!-- METRICS ROW: PAYMENT, ORDER, WEIGHT -->
        <section class="row info-row">
          <div class="info-cell">
            <div class="field-title">PAYMENT</div>
            <div class="cell-val bold ${payment === "COD" ? "cod-badge" : ""}">${payment}</div>
          </div>

          ${
            showOrderId
              ? `
              <div class="info-cell">
                <div class="field-title">ORDER ID</div>
                <div class="cell-val">#${escapeHtml(getOrderId(order))}</div>
              </div>
              `
              : ""
          }

          ${
            showWeight
              ? `
              <div class="info-cell">
                <div class="field-title">BILLED WEIGHT</div>
                <div class="cell-val">${getWeight(order).toFixed(2)} Kg</div>
              </div>
              `
              : ""
          }

          <div class="info-cell">
            <div class="field-title">SERVICE</div>
            <div class="cell-val">${getServiceType(order).includes("AIR") ? "AIR" : "ROAD"}</div>
          </div>
        </section>

        <!-- COD OR ORDER VALUE BAR -->
        ${
          showCod
            ? `
            <section class="row cod-row">
              <div class="cod-title">CASH ON DELIVERY (COLLECT)</div>
              <div class="cod-val">${money(getCodAmount(order))}</div>
            </section>
            `
            : showOrderValue
            ? `
            <section class="row cod-row prepaid-info">
              <div class="cod-title">TOTAL ORDER VALUE</div>
              <div class="cod-val">${money(getOrderValue(order))}</div>
            </section>
            `
            : ""
        }

        <!-- SELLER DETAILS -->
        <section class="row seller-row">
          <div class="seller-cell">
            <div class="field-title">SELLER</div>
            <div class="cell-val bold">${escapeHtml(getSellerName(order))}</div>
          </div>
          <div class="seller-cell">
            <div class="field-title">GSTIN</div>
            <div class="cell-val">${escapeHtml(getSellerGstin(order))}</div>
          </div>
          <div class="seller-cell">
            <div class="field-title">INVOICE NO</div>
            <div class="cell-val">${escapeHtml(getInvoiceNo(order))}</div>
          </div>
          <div class="seller-cell">
            <div class="field-title">DATE</div>
            <div class="cell-val">${escapeHtml(formatDate(getDate(order)))}</div>
          </div>
        </section>

        <!-- PRODUCT TABLE -->
        ${
          showProducts
            ? `
            <section class="product-section">
              <table class="product-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">Product Name</th>
                    <th style="width: 15%; text-align: right;">Rate</th>
                    <th style="width: 15%; text-align: center;">Qty</th>
                    <th style="width: 20%; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>${productRows}</tbody>
              </table>
            </section>
            `
            : ""
        }

        <!-- RETURN ADDRESS -->
        ${
          settings.returnAddress !== false
            ? `
            <section class="return-box">
              <span class="return-tag">NOTE: If undelivered, return to:</span>
              <span class="return-addr">${escapeHtml(getReturnName(order))},${escapeHtml(returnAddress)}</span>
            </section>
            `
            : ""
        }

        <!-- FOOTER CONTACT -->
        ${
          settings.contactLine !== false
            ? `<footer class="contact-footer">${escapeHtml(contactText)}</footer>`
            : ""
        }
      </div>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .shipping-label {
          background: #ffffff;
          color: #000000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 7.5pt;
          line-height: 1.2;
          padding: 3mm;
          page-break-after: always;
          break-after: page;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          display: flex;
        }

        .shipping-label:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .label-border {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000000;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .row {
          display: flex;
          width: 100%;
          border-bottom: 1px solid #000000;
        }

        /* Logos */
        .logos {
          height: 38px;
          min-height: 38px;
          align-items: center;
          justify-content: space-between;
          padding: 2px 8px;
        }

        .logo-box {
          height: 100%;
          display: flex;
          align-items: center;
        }

        .logo-box.left { justify-content: flex-start; }
        .logo-box.right { justify-content: flex-end; }

        .logo-box img {
          max-height: 32px;
          max-width: 120px;
          object-fit: contain;
        }

        /* AWB Section */
        .awb-box {
          text-align: center;
          padding: 4px 6px 2px;
          border-bottom: 1px solid #000000;
        }

        .awb-box .barcode {
          display: flex;
          justify-content: center;
        }

        .awb-box .barcode svg {
          height: 36px;
          max-width: 95%;
        }

        .awb-label {
          font-size: 8.5pt;
          margin-top: 1px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Addresses */
        .addresses {
          flex: 0 0 auto;
        }

        .col-half {
          width: 50%;
          padding: 4px 6px;
          min-height: 70px;
          overflow: hidden;
        }

        .col-half.from-box {
          border-right: 1px solid #000000;
        }

        .field-title {
          font-size: 6pt;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          margin-bottom: 1px;
        }

        .name-bold {
          font-size: 7.5pt;
          font-weight: 700;
          margin-bottom: 2px;
          word-break: break-word;
        }

        .buyer-mobile {
          font-weight: 600;
          font-size: 7pt;
        }

        .addr-text {
          font-size: 6.8pt;
          line-height: 1.18;
          color: #111827;
          word-break: break-word;
        }

        .phone-text {
          font-size: 6.8pt;
          font-weight: 600;
          margin-top: 2px;
        }

        /* Info Cells (Payment, Weight, etc.) */
        .info-row {
          background: #f9fafb;
        }

        .info-cell {
          flex: 1;
          padding: 3px 5px;
          border-right: 1px solid #000000;
          min-width: 0;
        }

        .info-cell:last-child {
          border-right: none;
        }

        .cell-val {
          font-size: 7.5pt;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cell-val.bold {
          font-weight: 800;
        }

        .cod-badge {
          color: #dc2626;
          font-weight: 900;
        }

        /* COD Row */
        .cod-row {
          padding: 4px 8px;
          background: #000000;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cod-row.prepaid-info {
          background: #f3f4f6;
          color: #000000;
        }

        .cod-title {
          font-size: 7pt;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .cod-val {
          font-size: 10pt;
          font-weight: 900;
        }

        /* Seller Row */
        .seller-row {
          background: #ffffff;
        }

        .seller-cell {
          flex: 1;
          padding: 3px 5px;
          border-right: 1px solid #d1d5db;
          overflow: hidden;
        }

        .seller-cell:last-child {
          border-right: none;
        }

        /* Product Table */
        .product-section {
          flex: 1 1 auto;
          overflow: hidden;
          border-bottom: 1px solid #000000;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 6.8pt;
        }

        .product-table th,
        .product-table td {
          padding: 2.5px 5px;
          border-bottom: 0.5px solid #e5e7eb;
        }

        .product-table th {
          background: #f3f4f6;
          font-weight: 700;
          font-size: 6.2pt;
          border-bottom: 1px solid #000000;
        }

        .product-table .num {
          text-align: right;
        }

        .product-table .pname {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Return & Footer */
        .return-box {
          padding: 3px 6px;
          font-size: 6.2pt;
          border-bottom: 1px solid #000000;
          line-height: 1.2;
          background: #ffffff;
        }

        .return-tag {
          font-weight: 800;
          display: inline;
        }

        .return-addr {
          display: inline;
          color: #374151;
        }

        .contact-footer {
          padding: 2.5px 6px;
          font-size: 5.8pt;
          font-weight: 700;
          text-align: center;
          background: #ffffff;
        }

        /* Compact overrides for 3x2, 4x2 */
        .compact .logos { height: 24px; min-height: 24px; }
        .compact .logo-box img { max-height: 20px; }
        .compact .awb-box .barcode svg { height: 24px; }
        .compact .col-half { min-height: 48px; padding: 2px 4px; }
        .compact .product-section { display: none; }
      </style>
    </article>
  `;
};

const prepareLabels = async (orders) => {
  const settings = await getLabelSettings();
  const detailedOrders = await getDetailedOrders(orders);
  const size = getLabelSize(settings.labelSize);

  const rightLogo =
    settings.rightLogoMode === "custom" && settings.customLogo
      ? settings.customLogo
      : delhiveryLogo;

  return {
    settings,
    detailedOrders,
    size,
    rightLogo,
  };
};

export const printShippingLabels = async (
  orders,
  title = "ShipDrop Shipping Labels"
) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    toast.error("Please select at least one shipment");
    return;
  }

  let win;

  try {
    const { settings, detailedOrders, size, rightLogo } =
      await prepareLabels(orders);

    const html = detailedOrders
      .map((order) => buildLabelHtml(order, settings, rightLogo, size))
      .join("");

    win = window.open("", "_blank", "width=900,height=700");

    if (!win) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    win.document.open();

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
            }

            .shipping-label {
              margin: 0 !important;
            }

            @page {
              size: ${size.widthIn}in ${size.heightIn}in;
              margin: 0;
            }

            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
              }

              .shipping-label {
                page-break-after: always;
              }

              .shipping-label:last-child {
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);

    win.document.close();

    const printOnce = () => {
      if (win.closed) return;
      win.focus();
      win.print();
    };

    const images = Array.from(win.document.images);

    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    win.setTimeout(printOnce, 300);

    toast.success(
      `${detailedOrders.length} ${
        detailedOrders.length === 1 ? "label" : "labels"
      } ready to print`
    );
  } catch (error) {
    console.error("Print label error:", error);
    toast.error(error?.message || "Unable to print labels");

    if (win && !win.closed) {
      win.close();
    }
  }
};

export const downloadShippingLabels = async (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    toast.error("Please select at least one shipment");
    return;
  }

  let staging;

  try {
    const { settings, detailedOrders, size, rightLogo } =
      await prepareLabels(orders);

    staging = document.createElement("div");

    staging.style.cssText = `
      position: fixed;
      left: -10000px;
      top: 0;
      width: ${size.widthIn}in;
      background: #fff;
      z-index: -1;
    `;

    document.body.appendChild(staging);

    const labels = [];

    for (const order of detailedOrders) {
      const holder = document.createElement("div");

      holder.innerHTML = buildLabelHtml(
        order,
        settings,
        rightLogo,
        size
      );

      const label = holder.querySelector(".shipping-label");

      if (label) {
        staging.appendChild(label);
        labels.push(label);
      }
    }

    if (!labels.length) {
      throw new Error("No labels could be generated");
    }

    const images = Array.from(staging.querySelectorAll("img"));

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    const pdf = new jsPDF({
      orientation:
        size.widthMm > size.heightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [size.widthMm, size.heightMm],
      compress: true,
    });

    for (let index = 0; index < labels.length; index += 1) {
      const canvas = await html2canvas(labels[index], {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const image = canvas.toDataURL("image/jpeg", 0.96);

      if (index > 0) {
        pdf.addPage(
          [size.widthMm, size.heightMm],
          size.widthMm > size.heightMm ? "landscape" : "portrait"
        );
      }

      pdf.addImage(
        image,
        "JPEG",
        0,
        0,
        size.widthMm,
        size.heightMm,
        undefined,
        "FAST"
      );
    }

    const firstAwb = getAWB(detailedOrders[0]).replace(
      /[^a-zA-Z0-9_-]/g,
      "-"
    );

    const filename =
      detailedOrders.length === 1
        ? `shipdrop-label-${firstAwb}.pdf`
        : `shipdrop-labels-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`;

    pdf.save(filename);

    toast.success(
      `${detailedOrders.length} ${
        detailedOrders.length === 1 ? "label" : "labels"
      } downloaded`
    );
  } catch (error) {
    console.error("Download label error:", error);
    toast.error(error?.message || "Unable to download labels");
  } finally {
    staging?.remove();
  }
};