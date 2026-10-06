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
  orderId: false,
  orderWeight: false,
  returnAddress: true,
  contactLine: true,
  rightLogoMode: "delhivery",
  labelSize: "4x6",
  customLogo: null,
};

const text = (value, fallback = "—") => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }
  return String(value).trim();
};

const first = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
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
      // Ignore invalid cached user data.
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

const money = (value) =>
  `₹${(Number(value) || 0).toFixed(2)}`;

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
      order?.account_name,
      order?.accountName,
      order?.business_name,
      order?.businessName,
      order?.company_name,
      order?.companyName,
      user?.name,
      user?.business_name
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
    ""
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
  return [
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
      warehouse.floor_no,
      warehouse.floorNo,
      order?.warehouse_floor_no
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
    first(
      warehouse.country,
      order?.warehouse_country,
      order?.pickup_country,
      "India"
    ),
  ]
    .filter(Boolean)
    .join(", ");
};

const getBuyerAddress = (order) =>
  [
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
    first(order?.country, order?.buyer_country, "India"),
  ]
    .filter(Boolean)
    .join(", ");

const getReturnAddress = (order) =>
  [
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
    first(order?.return_country, order?.returnCountry, "India"),
  ]
    .filter(Boolean)
    .join(", ");

const getReturnName = (order) =>
  text(
    first(order?.return_name, order?.returnName, getSellerName(order))
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
    data.order_value ??
      data.orderValue ??
      DEFAULT_LABEL_SETTINGS.orderValue
  ),
  codAmount: Boolean(
    data.cod_amount ??
      data.codAmount ??
      DEFAULT_LABEL_SETTINGS.codAmount
  ),
  buyerMobile: Boolean(
    data.buyer_mobile ??
      data.buyerMobile ??
      DEFAULT_LABEL_SETTINGS.buyerMobile
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
    data.from_name ??
      data.fromName ??
      DEFAULT_LABEL_SETTINGS.fromName
  ),
  fromAddress: Boolean(
    data.from_address ??
      data.fromAddress ??
      DEFAULT_LABEL_SETTINGS.fromAddress
  ),
  fromMobile: Boolean(
    data.from_mobile ??
      data.fromMobile ??
      DEFAULT_LABEL_SETTINGS.fromMobile
  ),
  productName: Boolean(
    data.product_name ??
      data.productName ??
      DEFAULT_LABEL_SETTINGS.productName
  ),
  productDetails: Boolean(
    data.product_details ??
      data.productDetails ??
      DEFAULT_LABEL_SETTINGS.productDetails
  ),
  servicesTnc: Boolean(
    data.services_tnc ??
      data.servicesTnc ??
      DEFAULT_LABEL_SETTINGS.servicesTnc
  ),
  orderId: Boolean(
    data.order_id ??
      data.orderId ??
      DEFAULT_LABEL_SETTINGS.orderId
  ),
  orderWeight: Boolean(
    data.order_weight ??
      data.orderWeight ??
      DEFAULT_LABEL_SETTINGS.orderWeight
  ),
  returnAddress: Boolean(
    data.return_address ??
      data.returnAddress ??
      DEFAULT_LABEL_SETTINGS.returnAddress
  ),
  contactLine: Boolean(
    data.contact_line ??
      data.contactLine ??
      DEFAULT_LABEL_SETTINGS.contactLine
  ),
  rightLogoMode:
    data.right_logo_mode ||
    data.rightLogoMode ||
    DEFAULT_LABEL_SETTINGS.rightLogoMode,
  labelSize:
    data.label_size ||
    data.labelSize ||
    DEFAULT_LABEL_SETTINGS.labelSize,
  customLogo: data.custom_logo || data.customLogo || null,
});

const getLabelSettings = async () => {
  const userId = getUserId();

  if (!userId) {
    return { ...DEFAULT_LABEL_SETTINGS };
  }

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
        console.warn(
          "Could not fetch full order details:",
          id,
          error
        );
        return order;
      }
    })
  );
};

const barcodeSvg = (value, compact = false) => {
  const svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  JsBarcode(svg, String(value || "AWB"), {
    format: "CODE128",
    displayValue: false,
    height: compact ? 28 : 42,
    width: compact ? 1.1 : 1.5,
    margin: 0,
    background: "#ffffff",
    lineColor: "#111827",
  });

  return svg.outerHTML;
};
const buildLabelHtml = (order, settings, rightLogo, size) => {
  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const isA4 = size.key === "A4";
  const compact = size.heightIn <= 2.5;

  // Keep small thermal labels compact; give 4x6/A4 labels readable type.
  const pad = isA4 ? 12 : compact ? 2.5 : 5;
  const font = isA4 ? 11 : compact ? 5.2 : 8.2;
  const small = isA4 ? 8.5 : compact ? 4.2 : 6.5;
  const big = isA4 ? 15 : compact ? 7 : 11;
  const sectionPad = isA4 ? 8 : compact ? 2 : 5;

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
  const showFromAddress =
    settings.fromAddress !== false &&
    settings.shipperAddress !== false;

  const showFromMobile =
    settings.fromMobile !== false &&
    settings.shipperMobiles !== false;

  const showBuyerMobile =
    settings.buyerMobile !== false &&
    Boolean(getMobile(order));

  const showWeight = settings.orderWeight === true;
  const showOrderId = settings.orderId === true;
  const showOrderValue = settings.orderValue !== false;

  const showCod =
    settings.codAmount !== false &&
    payment === "COD";

  const showProducts =
    settings.productDetails !== false &&
    settings.productName !== false;

  const returnAddress =
    getReturnAddress(order) || getFromAddress(order);

  const contactText =
    "For complaints & queries please contact 8766066070, 0141-4797120";

  const productRows = showProducts
    ? products
        .slice(0, isA4 ? 10 : compact ? 1 : 5)
        .map(
          (product) => `
            <tr>
              <td class="pname">${escapeHtml(product.name)}</td>
              <td>${escapeHtml(product.rate.toFixed(2))}</td>
              <td>${escapeHtml(product.qty)}</td>
              <td>${escapeHtml(product.total.toFixed(2))}</td>
            </tr>
          `
        )
        .join("")
    : "";

  const productSection = showProducts
    ? `
      <section class="products">
        <div class="section-title">PRODUCT DETAILS</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Rate (₹)</th>
              <th>Qty</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>
      </section>
    `
    : "";

  const logoHtml = rightLogo
    ? `<img src="${escapeHtml(rightLogo)}" alt="Carrier logo" />`
    : "";

  const orderInfo = `
    ${
      showOrderId
        ? `
          <div class="mini-cell">
            <span>ORDER ID</span>
            <b>${escapeHtml(getOrderId(order))}</b>
          </div>
        `
        : ""
    }

    ${
      showOrderValue
        ? `
          <div class="mini-cell">
            <span>ORDER VALUE</span>
            <b>${money(getOrderValue(order))}</b>
          </div>
        `
        : ""
    }
  `;

  return `
    <article
      class="shipping-label ${compact ? "compact" : ""} ${isA4 ? "a4" : ""}"
      style="
        width:${size.widthIn}in;
        height:${size.heightIn}in;
        --pad:${pad}px;
        --font:${font}px;
        --small:${small}px;
        --big:${big}px;
        --section-pad:${sectionPad}px;
      "
    >
      <div class="label-border">
        <header class="logos">
          <div class="logo left">
            <img src="${escapeHtml(shipdropLogo)}" alt="ParcelDrop" />
          </div>
          <div class="logo right">${logoHtml}</div>
        </header>

        <section class="awb">
          <div class="eyebrow">AWB NUMBER</div>
          <div class="awb-number">${escapeHtml(awb)}</div>
          <div class="barcode">${barcodeSvg(awb, compact)}</div>
        </section>

        <section class="addresses">
          <div class="address-block">
            <div class="eyebrow">FROM / SHIPPER</div>

            ${
              showFromName
                ? `<b class="person">${escapeHtml(fromName)}</b>`
                : ""
            }

            ${
              showFromAddress && fromAddress
                ? `<div class="address">${escapeHtml(fromAddress)}</div>`
                : ""
            }

            ${
              showFromMobile && fromMobiles
                ? `<div class="phone">☎ ${escapeHtml(fromMobiles)}</div>`
                : ""
            }
          </div>

          <div class="address-block">
            <div class="eyebrow">SHIP TO / CONSIGNEE</div>

            <b class="person">${escapeHtml(getCustomerName(order))}</b>

            <div class="address">
              ${escapeHtml(buyerAddress || "—")}
            </div>

            ${
              showBuyerMobile
                ? `<div class="phone">☎ ${escapeHtml(getMobile(order))}</div>`
                : ""
            }
          </div>
        </section>

        <section class="summary">
          <div>
            <span>PAYMENT</span>
            <b class="summary-value">${payment}</b>
          </div>

          <div>
            <span>SERVICE</span>
            <b class="summary-value">
              ${getServiceType(order).includes("AIR") ? "BY AIR" : "BY ROAD"}
            </b>
          </div>

          ${
            showWeight
              ? `
                <div>
                  <span>WEIGHT</span>
                  <b class="summary-value">${getWeight(order).toFixed(2)} KG</b>
                </div>
              `
              : ""
          }
        </section>

        ${
          orderInfo.trim()
            ? `<section class="order-info">${orderInfo}</section>`
            : ""
        }

        ${
          showCod
            ? `
              <section class="cod">
                <b>CASH ON DELIVERY</b>
                <strong>${money(getCodAmount(order))}</strong>
              </section>
            `
            : ""
        }

        ${productSection}

        <section class="seller">
          <div>
            <span>SELLER</span>
            <b>${escapeHtml(getSellerName(order))}</b>
          </div>

          <div>
            <span>GSTIN</span>
            <b>${escapeHtml(getSellerGstin(order) || " ")}</b>
          </div>

          <div>
            <span>INVOICE NO.</span>
            <b>&nbsp;</b>
          </div>

          <div>
            <span>DATE</span>
            <b>${escapeHtml(formatDate(getDate(order)))}</b>
          </div>
        </section>

        ${
          settings.returnAddress !== false
            ? `
              <section class="return">
                <b>RETURN ADDRESS</b>
                <div>
                  ${escapeHtml(getReturnName(order))}
                  ${returnAddress ? `, ${escapeHtml(returnAddress)}` : ""}
                </div>
              </section>
            `
            : ""
        }

        ${
          settings.contactLine !== false
            ? `<footer class="contact">${escapeHtml(contactText)}</footer>`
            : ""
        }
      </div>

      <style>
        * {
          box-sizing: border-box;
        }

        .shipping-label {
          margin: 0;
          padding: var(--pad);
          background: #fff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: var(--font);
          line-height: 1.25;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .shipping-label:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .label-border {
          width: 100%;
          height: 100%;
          border: 1.4px solid #111827;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #fff;
        }

        .logos {
          min-height: ${compact ? 16 : isA4 ? 48 : 34}px;
          height: ${compact ? 16 : isA4 ? 48 : 34}px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 7px;
          border-bottom: 1.4px solid #111827;
          gap: 8px;
        }

        .logo {
          width: 47%;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .logo.left {
          justify-content: flex-start;
        }

        .logo.right {
          justify-content: flex-end;
        }

        .logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .awb {
          flex: 0 0 auto;
          text-align: center;
          padding: ${compact ? 2 : isA4 ? 8 : 6}px 6px;
          border-bottom: 1.4px solid #111827;
        }

        .eyebrow {
          font-size: var(--small);
          font-weight: 800;
          letter-spacing: 0.35px;
          color: #374151;
        }

        .awb-number {
          font-size: var(--big);
          font-weight: 900;
          letter-spacing: 0.7px;
          margin: 2px 0 3px;
          overflow-wrap: anywhere;
        }

        .barcode {
          line-height: 0;
        }

        .barcode svg {
          display: block;
          margin: 0 auto;
          max-width: 100%;
          height: auto;
          max-height: ${compact ? 15 : isA4 ? 44 : 32}px;
        }

        .addresses {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1.4px solid #111827;
        }

        .address-block {
          min-width: 0;
          padding: ${compact ? 3 : isA4 ? 9 : 7}px 7px;
          overflow: hidden;
        }

        .address-block + .address-block {
          border-left: 1.4px solid #111827;
        }

        .person {
          display: block;
          font-size: ${isA4 ? 13 : compact ? 5.5 : 9}px;
          line-height: 1.2;
          margin-top: 3px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .address {
          font-size: ${isA4 ? 9.5 : compact ? 4.3 : 7.5}px;
          line-height: 1.28;
          margin-top: 3px;
          overflow-wrap: anywhere;
        }

        .phone {
          font-size: ${isA4 ? 9 : compact ? 4.2 : 7.2}px;
          font-weight: 800;
          margin-top: 3px;
          overflow-wrap: anywhere;
        }

        .summary {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: repeat(${showWeight ? 3 : 2}, minmax(0, 1fr));
          border-bottom: 1.4px solid #111827;
        }

        .summary > div {
          padding: ${compact ? 3 : isA4 ? 7 : 6}px 7px;
          min-width: 0;
        }

        .summary > div + div {
          border-left: 1px solid #9ca3af;
        }

        .summary span,
        .mini-cell span,
        .seller span {
          display: block;
          font-size: var(--small);
          font-weight: 800;
          color: #374151;
          margin-bottom: 2px;
        }

        .summary-value {
          display: block;
          font-size: ${isA4 ? 12 : compact ? 5.2 : 9}px;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .order-info {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: repeat(
            ${(showOrderId && showOrderValue) ? 2 : 1},
            minmax(0, 1fr)
          );
          border-bottom: 1.4px solid #111827;
        }

        .mini-cell {
          padding: ${compact ? 2 : 5}px 7px;
          min-width: 0;
        }

        .mini-cell + .mini-cell {
          border-left: 1px solid #9ca3af;
        }

        .mini-cell b {
          display: block;
          font-size: var(--font);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .cod {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: ${compact ? 3 : 6}px 7px;
          border-bottom: 1.4px solid #111827;
          font-size: var(--font);
        }

        .cod strong {
          font-size: var(--big);
          font-weight: 900;
        }

        .products {
          flex: 0 0 auto;
          padding: ${compact ? 2 : isA4 ? 7 : 5}px 7px;
          border-bottom: 1.4px solid #111827;
          min-height: 0;
        }

        .section-title {
          font-size: var(--small);
          font-weight: 900;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
          font-size: ${compact ? 4.2 : isA4 ? 8.5 : 7}px;
        }

        th,
        td {
          border: 1px solid #9ca3af;
          padding: ${compact ? 1 : 3}px 4px;
          text-align: right;
          overflow-wrap: anywhere;
        }

        th {
          font-weight: 800;
          background: #f3f4f6;
        }

        th:first-child,
        td:first-child {
          text-align: left;
          width: 46%;
        }

        .pname {
          text-align: left;
        }

        .seller {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr 0.85fr;
          border-bottom: 1.4px solid #111827;
        }

        .seller > div {
          padding: ${compact ? 2 : isA4 ? 6 : 5}px 5px;
          min-width: 0;
          overflow: hidden;
        }

        .seller > div + div {
          border-left: 1px solid #9ca3af;
        }

        .seller b {
          display: block;
          font-size: ${compact ? 4.1 : isA4 ? 8.5 : 6.8}px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .return {
          flex: 0 0 auto;
          padding: ${compact ? 2 : isA4 ? 6 : 5}px 7px;
          border-bottom: 1px solid #9ca3af;
          font-size: ${compact ? 4.2 : isA4 ? 8.5 : 6.8}px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .return b {
          display: block;
          font-size: var(--small);
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }

        .contact {
          flex: 0 0 auto;
          padding: ${compact ? 2 : isA4 ? 6 : 5}px 7px;
          font-size: ${compact ? 3.8 : isA4 ? 8 : 6.3}px;
          line-height: 1.2;
          text-align: center;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .compact .label-border {
          justify-content: flex-start;
        }

        .compact .logos,
        .compact .awb,
        .compact .addresses,
        .compact .summary,
        .compact .order-info,
        .compact .products,
        .compact .seller,
        .compact .return,
        .compact .contact {
          flex-shrink: 0;
        }
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
  title = "ParcelDrop Shipping Labels"
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

    // Wait for the document and its images before printing.
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
      /[^a-zA-Z0-9\_-]/g,
      "-"
    );

    const filename =
      detailedOrders.length === 1
        ? `parceldrop-label-${firstAwb}.pdf`
        : `parceldrop-labels-${new Date()
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