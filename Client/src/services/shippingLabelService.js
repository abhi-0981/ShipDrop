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

const first = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

const text = (value, fallback = "—") => {
  const result = first(value);
  return result === undefined ? fallback : String(result).trim();
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getStoredUser = () => {
  for (const key of ["user", "currentUser", "authUser"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const user = JSON.parse(raw);
      if (user && typeof user === "object") return user;
    } catch {
      // Ignore invalid cached data.
    }
  }

  return {};
};

const getUserId = () => {
  const user = getStoredUser();

  return first(
    user.id,
    user.user_id,
    user.userId,
    user.user?.id,
    user.user?.user_id
  );
};

const getAWB = (order) =>
  text(
    first(
      order.awb,
      order.waybill,
      order.awb_number,
      order.awbNumber,
      order.tracking_number,
      order.trackingNumber
    ),
    "AWB unavailable"
  );

const getOrderId = (order) =>
  text(
    first(
      order.display_order_id,
      order.displayOrderId,
      order.order_id,
      order.orderId,
      order.order_number,
      order.orderNumber,
      order.id
    )
  );

const getCustomerName = (order) =>
  text(
    first(
      order.consignee_name,
      order.customer_name,
      order.customerName,
      order.buyer_name,
      order.buyerName,
      order.delivery_name,
      order.deliveryName,
      order.name
    )
  );

const getBuyerMobile = (order) =>
  text(
    first(
      order.consignee_phone,
      order.consigneePhone,
      order.customer_mobile,
      order.customerMobile,
      order.buyer_mobile,
      order.buyerMobile,
      order.delivery_mobile,
      order.deliveryMobile,
      order.mobile,
      order.phone
    ),
    ""
  );

const getPaymentType = (order) => {
  const value = String(
    first(
      order.payment_type,
      order.paymentType,
      order.payment_method,
      order.paymentMethod,
      order.payment_mode,
      order.paymentMode,
      "PREPAID"
    )
  ).toUpperCase();

  return value.includes("COD") ? "COD" : "PREPAID";
};

const getServiceType = (order) => {
  const value = String(
    first(
      order.service_type,
      order.serviceType,
      order.shipment_type,
      order.shipmentType,
      order.mode,
      "ROAD"
    )
  ).toUpperCase();

  return value.includes("AIR") ? "BY AIR" : "BY ROAD";
};

const getWeight = (order) => {
  const packageWeight = Array.isArray(order.packages)
    ? order.packages.reduce(
        (total, item) =>
          total +
          (Number(item.weight) || 0) *
            (Number(item.package_count) || 1),
        0
      )
    : 0;

  return (
    Number(
      first(
        order.total_weight,
        order.totalWeight,
        order.package_weight,
        order.packageWeight,
        order.weight,
        packageWeight,
        0
      )
    ) || 0
  );
};

const getOrderValue = (order) =>
  Number(
    first(
      order.order_value,
      order.orderValue,
      order.product_value,
      order.productValue,
      order.total_amount,
      order.totalAmount,
      order.order_amount,
      order.orderAmount,
      order.amount,
      order.total_value,
      0
    )
  ) || 0;

const getCodAmount = (order) =>
  Number(
    first(
      order.cod_amount,
      order.codAmount,
      order.cod_value,
      order.codValue,
      order.collectable_amount,
      order.collectableAmount,
      order.amount_to_collect,
      order.amountToCollect,
      0
    )
  ) || 0;

const getDate = (order) =>
  first(
    order.invoice_date,
    order.invoiceDate,
    order.manifest_created_at,
    order.manifestCreatedAt,
    order.created_at,
    order.createdAt,
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

const getSellerName = (order) => {
  const user = getStoredUser();

  return text(
    first(
      order.seller_name,
      order.sellerName,
      order.seller_full_name,
      order.sellerFullName,
      order.seller_company_name,
      order.sellerCompanyName,
      order.company_name,
      order.companyName,
      order.business_name,
      order.businessName,
      order.account_name,
      order.accountName,
      order.user?.business_name,
      order.user?.company_name,
      order.user?.name,
      order.seller?.business_name,
      order.seller?.company_name,
      order.seller?.name,
      user.business_name,
      user.businessName,
      user.company_name,
      user.companyName,
      user.name
    )
  );
};

const getSellerGstin = (order) => {
  const user = getStoredUser();

  return text(
    first(
      order.seller_gstin,
      order.sellerGstin,
      order.seller_gst,
      order.sellerGSTIN,
      order.gstin,
      order.GSTIN,
      order.gst_number,
      order.gstNumber,
      order.user?.gstin,
      order.user?.gst_number,
      order.seller?.gstin,
      order.seller?.gst_number,
      user.gstin,
      user.GSTIN,
      user.gst_number,
      user.gstNumber
    ),
    ""
  );
};

const getFromName = (order) =>
  text(
    first(
      order.pickup_name,
      order.pickupName,
      order.pickup_contact_name,
      order.pickupContactName,
      order.warehouse?.contact_name,
      order.warehouse?.contactName,
      order.warehouse?.name,
      order.warehouse_contact_name,
      order.warehouseContactName,
      order.shipper_name,
      order.shipperName,
      order.seller_name,
      order.sellerName
    )
  );

const getFromMobile = (order) =>
  text(
    first(
      order.shipper_mobile,
      order.shipperMobile,
      order.pickup_mobile,
      order.pickupMobile,
      order.pickup_phone,
      order.pickupPhone,
      order.seller_mobile,
      order.sellerMobile,
      order.warehouse?.mobile,
      order.warehouse?.phone
    ),
    ""
  );

const getFromAddress = (order) => {
  const warehouse = order.warehouse || {};
  const pickup = order.pickup_address_details || {};

  return [
    first(
      warehouse.address_line1,
      warehouse.addressLine1,
      warehouse.address,
      order.warehouse_address_line1,
      order.warehouseAddressLine1,
      order.pickup_address,
      order.pickupAddress,
      order.shipper_address,
      order.shipperAddress,
      pickup.address_line1,
      pickup.address
    ),
    first(
      warehouse.address_line2,
      warehouse.addressLine2,
      order.warehouse_address_line2,
      order.pickup_address_line2,
      order.pickupAddressLine2,
      pickup.address_line2
    ),
    first(
      warehouse.landmark,
      order.warehouse_landmark,
      order.pickup_landmark,
      pickup.landmark
    ),
    first(
      warehouse.city,
      order.warehouse_city,
      order.warehouseCity,
      order.pickup_city,
      order.pickupCity,
      pickup.city
    ),
    first(
      warehouse.state,
      order.warehouse_state,
      order.warehouseState,
      order.pickup_state,
      order.pickupState,
      pickup.state
    ),
    first(
      warehouse.pincode,
      order.warehouse_pincode,
      order.warehousePincode,
      order.pickup_pincode,
      order.pickupPincode,
      pickup.pincode
    ),
    first(warehouse.country, order.pickup_country, "India"),
  ]
    .filter(Boolean)
    .join(", ");
};

const getBuyerAddress = (order) => {
  const buyer = order.buyer || order.customer || {};

  return [
    first(
      order.address_line1,
      order.addressLine1,
      order.delivery_address,
      order.deliveryAddress,
      order.address,
      order.buyer_address1,
      buyer.address_line1,
      buyer.address
    ),
    first(
      order.address_line2,
      order.addressLine2,
      order.buyer_address2,
      buyer.address_line2
    ),
    first(order.landmark, order.buyer_landmark, buyer.landmark),
    first(
      order.city,
      order.delivery_city,
      order.deliveryCity,
      order.buyer_city,
      buyer.city
    ),
    first(
      order.state,
      order.delivery_state,
      order.deliveryState,
      order.buyer_state,
      buyer.state
    ),
    first(
      order.pincode,
      order.delivery_pincode,
      order.deliveryPincode,
      order.buyer_pincode,
      buyer.pincode
    ),
    first(order.country, order.buyer_country, buyer.country, "India"),
  ]
    .filter(Boolean)
    .join(", ");
};

const getReturnAddress = (order) =>
  [
    first(
      order.return_address_line1,
      order.returnAddressLine1,
      order.return_address,
      order.returnAddress
    ),
    first(order.return_address_line2, order.returnAddressLine2),
    first(order.return_landmark, order.returnLandmark),
    first(order.return_city, order.returnCity),
    first(order.return_state, order.returnState),
    first(order.return_pincode, order.returnPincode),
    first(order.return_country, order.returnCountry, "India"),
  ]
    .filter(Boolean)
    .join(", ");

const getProducts = (order) => {
  const products =
    Array.isArray(order.products) && order.products.length
      ? order.products
      : Array.isArray(order.order_products) && order.order_products.length
        ? order.order_products
        : [
            {
              product_name: first(
                order.product_name,
                order.productName,
                order.product,
                "Product"
              ),
              quantity: first(order.quantity, order.qty, 1),
              price: first(
                order.product_value,
                order.productValue,
                order.order_value,
                order.orderValue,
                order.total_amount,
                0
              ),
            },
          ];

  return products.map((product) => {
    const qty =
      Number(
        first(
          product.quantity,
          product.qty,
          product.product_quantity,
          product.productQuantity,
          1
        )
      ) || 1;

    const total = Number(
      first(
        product.total,
        product.total_price,
        product.totalPrice,
        product.amount,
        product.line_total,
        product.lineTotal
      )
    );

    const rate =
      Number(
        first(
          product.rate,
          product.price,
          product.unit_price,
          product.unitPrice,
          product.product_price,
          product.productPrice,
          total ? total / qty : 0
        )
      ) || 0;

    return {
      name: text(
        first(
          product.product_name,
          product.productName,
          product.name,
          product.product
        ),
        "Product"
      ),
      qty,
      rate,
      total: Number.isFinite(total) ? total : rate * qty,
    };
  });
};

const getLabelSize = (value) => {
  const sizes = {
    "4x6": { key: "4x6", widthIn: 4, heightIn: 6, widthMm: 101.6, heightMm: 152.4 },
    A4: { key: "A4", widthIn: 8.27, heightIn: 11.69, widthMm: 210, heightMm: 297 },
    "4x2": { key: "4x2", widthIn: 4, heightIn: 2, widthMm: 101.6, heightMm: 50.8 },
    "4x2.5": { key: "4x2.5", widthIn: 4, heightIn: 2.5, widthMm: 101.6, heightMm: 63.5 },
    "3x2": { key: "3x2", widthIn: 3, heightIn: 2, widthMm: 76.2, heightMm: 50.8 },
  };

  return sizes[value] || sizes["4x6"];
};

const normalizeSettings = (data = {}) => {
  const bool = (snake, camel, fallback) =>
    data[snake] ?? data[camel] ?? fallback;

  return {
    ...DEFAULT_LABEL_SETTINGS,
    orderValue: Boolean(bool("order_value", "orderValue", true)),
    codAmount: Boolean(bool("cod_amount", "codAmount", true)),
    buyerMobile: Boolean(bool("buyer_mobile", "buyerMobile", true)),
    shipperMobiles: Boolean(bool("shipper_mobiles", "shipperMobiles", true)),
    shipperAddress: Boolean(bool("shipper_address", "shipperAddress", true)),
    fromName: Boolean(bool("from_name", "fromName", true)),
    fromAddress: Boolean(bool("from_address", "fromAddress", true)),
    fromMobile: Boolean(bool("from_mobile", "fromMobile", true)),
    productName: Boolean(bool("product_name", "productName", true)),
    productDetails: Boolean(bool("product_details", "productDetails", true)),
    servicesTnc: Boolean(bool("services_tnc", "servicesTnc", false)),
    orderId: Boolean(bool("order_id", "orderId", false)),
    orderWeight: Boolean(bool("order_weight", "orderWeight", false)),
    returnAddress: Boolean(bool("return_address", "returnAddress", true)),
    contactLine: Boolean(bool("contact_line", "contactLine", true)),
    rightLogoMode:
      data.right_logo_mode || data.rightLogoMode || "delhivery",
    labelSize: data.label_size || data.labelSize || "4x6",
    customLogo: data.custom_logo || data.customLogo || null,
  };
};

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
      const id = first(order.order_id, order.orderId, order.id);

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

        return full ? { ...order, ...full } : order;
      } catch (error) {
        // Some applications don't have a single-order endpoint.
        console.warn("Could not fetch full order details:", id, error);
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
    height: compact ? 18 : 35,
    width: compact ? 1 : 1.4,
    margin: 0,
    background: "#ffffff",
    lineColor: "#111827",
  });

  return svg.outerHTML;
};

const buildLabelHtml = (order, settings, rightLogo, size) => {
  const compact = size.heightIn <= 2.5;
  const a4 = size.key === "A4";

  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const products = getProducts(order);

  const fromName = getFromName(order);
  const fromAddress = getFromAddress(order);
  const fromMobile = getFromMobile(order);
  const buyerAddress = getBuyerAddress(order);
  const buyerMobile = getBuyerMobile(order);

  const showFromName = settings.fromName !== false;
  const showFromAddress =
    settings.fromAddress !== false && settings.shipperAddress !== false;
  const showFromMobile =
    settings.fromMobile !== false && settings.shipperMobiles !== false;
  const showBuyerMobile =
    settings.buyerMobile !== false && Boolean(buyerMobile);
  const showWeight = settings.orderWeight === true;
  const showOrderId = settings.orderId === true;
  const showOrderValue = settings.orderValue !== false;
  const showCod = settings.codAmount !== false && payment === "COD";
  const showProducts =
    settings.productDetails !== false && settings.productName !== false;

  const logo =
    settings.rightLogoMode === "custom" && settings.customLogo
      ? settings.customLogo
      : rightLogo;

  const contactLine =
    "For complaints & queries please contact 8766066070, 0141-4797120";

  const productRows = showProducts
    ? products
        .slice(0, a4 ? 15 : compact ? 1 : 5)
        .map(
          (p) => `
            <tr>
              <td class="product-name">${escapeHtml(p.name)}</td>
              <td>${p.rate.toFixed(2)}</td>
              <td>${p.qty}</td>
              <td>${p.total.toFixed(2)}</td>
            </tr>
          `
        )
        .join("")
    : "";

  const orderInfo = [
    showOrderId
      ? `<div class="info-cell"><span>ORDER ID</span><b>${escapeHtml(getOrderId(order))}</b></div>`
      : "",
    showOrderValue
      ? `<div class="info-cell"><span>ORDER VALUE</span><b>${money(getOrderValue(order))}</b></div>`
      : "",
  ].filter(Boolean);

  return `
    <article class="shipping-label ${compact ? "compact" : ""} ${a4 ? "a4" : ""}"
      style="width:${size.widthIn}in;height:${size.heightIn}in">

      <div class="label-border">

        <header class="logos">
          <div class="logo left">
            <img src="${escapeHtml(shipdropLogo)}" alt="ParcelDrop" />
          </div>
          <div class="logo right">
            <img src="${escapeHtml(logo || delhiveryLogo)}" alt="Carrier" />
          </div>
        </header>

        <section class="awb">
          <div class="eyebrow">AWB NUMBER</div>
          <div class="awb-number">${escapeHtml(awb)}</div>
          <div class="barcode">${barcodeSvg(awb, compact)}</div>
        </section>

        <section class="addresses">
          <div class="address-block">
            <div class="eyebrow">FROM / SHIPPER</div>
            ${showFromName ? `<b class="person">${escapeHtml(fromName)}</b>` : ""}
            ${showFromAddress && fromAddress ? `<div class="address">${escapeHtml(fromAddress)}</div>` : ""}
            ${showFromMobile && fromMobile ? `<div class="phone">☎ ${escapeHtml(fromMobile)}</div>` : ""}
          </div>

          <div class="address-block">
            <div class="eyebrow">SHIP TO / CONSIGNEE</div>
            <b class="person">${escapeHtml(getCustomerName(order))}</b>
            <div class="address">${escapeHtml(buyerAddress || "—")}</div>
            ${showBuyerMobile ? `<div class="phone">☎ ${escapeHtml(buyerMobile)}</div>` : ""}
          </div>
        </section>

        <section class="summary ${showWeight ? "three-cols" : "two-cols"}">
          <div>
            <span>PAYMENT</span>
            <b>${payment}</b>
          </div>
          <div>
            <span>SERVICE</span>
            <b>${getServiceType(order)}</b>
          </div>
          ${showWeight ? `<div><span>WEIGHT</span><b>${getWeight(order).toFixed(2)} KG</b></div>` : ""}
        </section>

        ${
          orderInfo.length
            ? `<section class="order-info" style="grid-template-columns:repeat(${orderInfo.length},minmax(0,1fr))">${orderInfo.join("")}</section>`
            : ""
        }

        ${
          showCod
            ? `<section class="cod"><b>CASH ON DELIVERY</b><strong>${money(getCodAmount(order))}</strong></section>`
            : ""
        }

        ${
          showProducts
            ? `
              <section class="products">
                <div class="section-title">PRODUCT DETAILS</div>
                <table>
                  <thead>
                    <tr><th>Product</th><th>Rate (₹)</th><th>Qty</th><th>Total (₹)</th></tr>
                  </thead>
                  <tbody>${productRows}</tbody>
                </table>
              </section>
            `
            : ""
        }

        <section class="seller">
          <div><span>SELLER</span><b>${escapeHtml(getSellerName(order))}</b></div>
          <div><span>GSTIN</span><b>${escapeHtml(getSellerGstin(order))}</b></div>
          <div><span>INVOICE NO.</span><b>&nbsp;</b></div>
          <div><span>DATE</span><b>${escapeHtml(formatDate(getDate(order)))}</b></div>
        </section>

        ${
          settings.returnAddress !== false
            ? `<section class="return"><b>RETURN ADDRESS</b><div>${escapeHtml(getReturnAddress(order) || fromAddress || "—")}</div></section>`
            : ""
        }

        ${
          settings.contactLine !== false
            ? `<footer class="contact">${escapeHtml(contactLine)}</footer>`
            : ""
        }

      </div>
    </article>

    <style>
      * { box-sizing: border-box; }

      .shipping-label {
        margin: 0;
        padding: 3.5mm;
        background: #fff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8pt;
        line-height: 1.25;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .label-border {
        width: 100%;
        height: 100%;
        border: 1.2px solid #111827;
        overflow: hidden;

        /* IMPORTANT: Do not distribute spare height between sections. */
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        background: #fff;
      }

      .logos {
        flex: 0 0 9mm;
        height: 9mm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.2mm 2mm;
        border-bottom: 1px solid #111827;
        gap: 3mm;
      }

      .logo {
        width: 48%;
        height: 100%;
        display: flex;
        align-items: center;
      }

      .logo.left { justify-content: flex-start; }
      .logo.right { justify-content: flex-end; }

      .logo img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
      }

      .awb {
        flex: 0 0 auto;
        text-align: center;
        padding: 2mm 2mm;
        border-bottom: 1px solid #111827;
      }

      .eyebrow {
        font-size: 6pt;
        font-weight: 800;
        letter-spacing: .25px;
        color: #374151;
      }

      .awb-number {
        font-size: 11pt;
        font-weight: 900;
        letter-spacing: .5px;
        margin: 1mm 0;
        overflow-wrap: anywhere;
      }

      .barcode svg {
        display: block;
        max-width: 100%;
        max-height: 10mm;
        height: auto;
        margin: 0 auto;
      }

      .addresses {
        display: grid;
        grid-template-columns: 1fr 1fr;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .address-block {
        min-width: 0;
        padding: 2mm;
        overflow-wrap: anywhere;
      }

      .address-block + .address-block {
        border-left: 1px solid #111827;
      }

      .person {
        display: block;
        font-size: 8pt;
        line-height: 1.2;
        margin-top: 1mm;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .address {
        font-size: 7pt;
        line-height: 1.3;
        margin-top: 1mm;
        overflow-wrap: anywhere;
      }

      .phone {
        font-size: 7pt;
        font-weight: 800;
        margin-top: 1mm;
        overflow-wrap: anywhere;
      }

      .summary {
        display: grid;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .summary.two-cols { grid-template-columns: 1fr 1fr; }
      .summary.three-cols { grid-template-columns: 1fr 1fr 1fr; }

      .summary > div {
        min-width: 0;
        padding: 2mm;
        overflow-wrap: anywhere;
      }

      .summary > div + div {
        border-left: 1px solid #9ca3af;
      }

      .summary span,
      .info-cell span,
      .seller span {
        display: block;
        font-size: 6pt;
        font-weight: 800;
        color: #374151;
        margin-bottom: .7mm;
      }

      .summary b {
        display: block;
        font-size: 8pt;
        font-weight: 900;
      }

      .order-info {
        display: grid;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .info-cell {
        min-width: 0;
        padding: 1.8mm 2mm;
        overflow-wrap: anywhere;
      }

      .info-cell + .info-cell {
        border-left: 1px solid #9ca3af;
      }

      .info-cell b {
        display: block;
        font-size: 8pt;
        font-weight: 800;
      }

      .cod {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2mm;
        padding: 2mm;
        border-bottom: 1px solid #111827;
      }

      .cod b { font-size: 8pt; }
      .cod strong { font-size: 10pt; }

      .products {
        flex: 0 0 auto;
        padding: 1.8mm 2mm;
        border-bottom: 1px solid #111827;
      }

      .section-title {
        font-size: 6.5pt;
        font-weight: 900;
        letter-spacing: .25px;
        margin-bottom: 1mm;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        table-layout: fixed;
        font-size: 7pt;
      }

      th, td {
        border: 1px solid #9ca3af;
        padding: 1mm 1.2mm;
        text-align: right;
        overflow-wrap: anywhere;
      }

      th {
        font-weight: 800;
        background: #f3f4f6;
      }

      th:first-child, td:first-child {
        text-align: left;
        width: 46%;
      }

      .seller {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: 1.25fr 1fr 1fr .8fr;
        border-bottom: 1px solid #111827;
      }

      .seller > div {
        min-width: 0;
        padding: 1.8mm 1.5mm;
        overflow-wrap: anywhere;
      }

      .seller > div + div {
        border-left: 1px solid #9ca3af;
      }

      .seller b {
        display: block;
        font-size: 6.5pt;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .return {
        flex: 0 0 auto;
        padding: 1.8mm 2mm;
        border-bottom: 1px solid #9ca3af;
        font-size: 6.5pt;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .return b {
        display: block;
        font-size: 6pt;
        margin-bottom: .8mm;
      }

      .contact {
        flex: 0 0 auto;
        padding: 1.5mm 2mm;
        font-size: 6pt;
        line-height: 1.2;
        text-align: center;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .compact {
        padding: 1.2mm;
        font-size: 5pt;
      }

      .compact .label-border { justify-content: flex-start; }
      .compact .logos { flex-basis: 5mm; height: 5mm; }
      .compact .awb { padding: 1mm; }
      .compact .awb-number { font-size: 7pt; margin: .5mm 0; }
      .compact .barcode svg { max-height: 4mm; }
      .compact .addresses .address-block { padding: 1mm; }
      .compact .eyebrow,
      .compact .summary span,
      .compact .seller span { font-size: 4pt; }
      .compact .person,
      .compact .summary b { font-size: 5pt; }
      .compact .address,
      .compact .phone,
      .compact .seller b,
      .compact .return,
      .compact .contact { font-size: 4pt; }
      .compact .summary > div,
      .compact .info-cell,
      .compact .seller > div,
      .compact .return,
      .compact .contact { padding: 1mm; }
      .compact .cod { padding: 1mm; }
      .compact .cod b,
      .compact .cod strong { font-size: 5pt; }
      .compact .products { padding: 1mm; }
      .compact .section-title,
      .compact table { font-size: 4pt; }
      .compact th, .compact td { padding: .5mm; }

      .a4 { padding: 6mm; }
      .a4 .logos { flex-basis: 15mm; height: 15mm; }
      .a4 .awb { padding: 4mm; }
      .a4 .awb-number { font-size: 17pt; }
      .a4 .barcode svg { max-height: 16mm; }
      .a4 .person { font-size: 12pt; }
      .a4 .address, .a4 .phone { font-size: 10pt; }
      .a4 .summary b { font-size: 12pt; }
      .a4 .summary > div, .a4 .address-block { padding: 4mm; }
      .a4 .seller b, .a4 .return { font-size: 9pt; }
      .a4 .contact { font-size: 8pt; }
      .a4 table { font-size: 10pt; }
      .a4 th, .a4 td { padding: 2mm; }
    </style>
  `;
};

const prepareLabels = async (orders) => {
  const settings = await getLabelSettings();
  const detailedOrders = await getDetailedOrders(orders);
  const size = getLabelSize(settings.labelSize);

  return {
    settings,
    detailedOrders,
    size,
    rightLogo:
      settings.rightLogoMode === "custom" && settings.customLogo
        ? settings.customLogo
        : delhiveryLogo,
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
            html, body { margin: 0; padding: 0; background: #fff; }
            @page {
              size: ${size.widthIn}in ${size.heightIn}in;
              margin: 0;
            }
            @media print {
              html, body { margin: 0 !important; padding: 0 !important; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    win.document.close();

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

    win.setTimeout(() => {
      if (!win.closed) {
        win.focus();
        win.print();
      }
    }, 400);

    toast.success(`${detailedOrders.length} label(s) ready to print`);
  } catch (error) {
    console.error("Print label error:", error);
    toast.error(error?.message || "Unable to print labels");

    if (win && !win.closed) win.close();
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
        ? `parceldrop-label-${firstAwb}.pdf`
        : `parceldrop-labels-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`;

    pdf.save(filename);
    toast.success(`${detailedOrders.length} label(s) downloaded`);
  } catch (error) {
    console.error("Download label error:", error);
    toast.error(error?.message || "Unable to download labels");
  } finally {
    staging?.remove();
  }
};