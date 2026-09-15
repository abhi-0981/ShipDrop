import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import { toast } from "react-hot-toast";

import api from "./api";
import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

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

const getAWB = (order) => text(order?.awb || order?.waybill, "AWB unavailable");

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
    order?.product_name || order?.products?.[0]?.product_name || order?.shipment,
    "Shipment",
  );

const getPickupCity = (order) =>
  text(order?.pickup_city || order?.pickupCity || order?.origin_city, "Pickup");

const getPickupPincode = (order) =>
  text(order?.pickup_pincode || order?.pickupPincode || order?.origin_pincode, "");

const getDeliveryCity = (order) =>
  text(order?.city || order?.delivery_city || order?.destination_city, "Delivery");

const getDeliveryPincode = (order) =>
  text(
    order?.pincode || order?.delivery_pincode || order?.destination_pincode,
    "",
  );

const getServiceType = (order) =>
  String(order?.service_type || order?.serviceType || "ROAD").toUpperCase();

const getPaymentType = (order) =>
  String(order?.payment_type || order?.paymentType || "PREPAID").toUpperCase();

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

const getCreatedAt = (order) =>
  order?.manifest_created_at ||
  order?.created_at ||
  order?.manifestCreatedAt ||
  order?.createdAt ||
  null;

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
    warehouse.city || order?.warehouse_city || order?.shipper_city || order?.pickup_city,
    warehouse.state || order?.warehouse_state || order?.shipper_state || order?.pickup_state,
    warehouse.pincode || order?.warehouse_pincode || order?.shipper_pincode || order?.pickup_pincode,
    warehouse.country || order?.warehouse_country || order?.shipper_country || order?.pickup_country || "India",
  ]
    .filter(Boolean)
    .join(", ");
};

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

const getProductRows = (order) => {
  if (Array.isArray(order?.products) && order.products.length) {
    return order.products;
  }

  return [
    {
      product_name: getShipmentName(order),
      quantity: order?.quantity || order?.qty || 1,
      price: order?.product_value || order?.order_value || order?.total_amount || 0,
    },
  ];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const imageUrlToDataUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load label logo.");

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
    img.onload = () =>
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });

const createBarcodeSvg = (value) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  try {
    JsBarcode(svg, String(value || "AWB"), {
      format: "CODE128",
      displayValue: false,
      height: 54,
      width: 1.7,
      margin: 0,
    });
    return svg.outerHTML;
  } catch (error) {
    console.error("Barcode generation error:", error);
    return `<div style="font-size:11px;font-weight:700;text-align:center;padding:8px;border:1px solid #111;">${escapeHtml(value)}</div>`;
  }
};

const createBarcodeDataUrl = (value) => {
  const canvas = document.createElement("canvas");

  try {
    JsBarcode(canvas, String(value || "AWB"), {
      format: "CODE128",
      displayValue: false,
      height: 55,
      width: 2,
      margin: 0,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Barcode PDF error:", error);
    return null;
  }
};

const getLabelSize = (value) => {
  if (value === "4x4") {
    return { key: "4x4", widthIn: 4, heightIn: 4, widthMm: 101.6, heightMm: 101.6 };
  }

  if (value === "A4") {
    return { key: "A4", widthIn: 8.27, heightIn: 11.69, widthMm: 210, heightMm: 297 };
  }

  return { key: "4x6", widthIn: 4, heightIn: 6, widthMm: 101.6, heightMm: 152.4 };
};

const askLabelSize = (currentSize) => {
  if (currentSize !== "always-ask") return currentSize || "4x6";

  const answer = window.prompt(
    "Choose label size:\n\n1 = 4x6\n2 = 4x4\n3 = A4",
    "1",
  );

  if (answer === "2") return "4x4";
  if (answer === "3") return "A4";
  return "4x6";
};

const getDetailedOrders = async (list) => {
  const userId = getUserId();
  if (!userId) return list;

  return Promise.all(
    list.map(async (order) => {
      try {
        const orderDbId = order?.order_id || order?.id;
        if (!orderDbId) return order;

        const response = await api.get(`/orders/${orderDbId}`, {
          params: { user_id: userId },
        });

        const fullOrder =
          response.data?.order ||
          response.data?.result?.order ||
          response.data?.result ||
          null;

        if (!fullOrder) return order;

        return {
          ...order,
          ...fullOrder,
          awb: order?.awb || fullOrder?.awb || fullOrder?.waybill,
          order_id: order?.order_id || fullOrder?.order_id,
        };
      } catch (error) {
        console.warn(
          "Could not fetch full order:",
          order?.order_id,
          error,
        );
        return order;
      }
    }),
  );
};

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
      params: { user_id: userId },
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

const buildLabelHtml = (order, settings, rightLogo) => {
  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const service = getServiceType(order);
  const buyerAddress = getBuyerAddress(order);
  const shipperAddress = getShipperAddress(order);
  const productRows = getProductRows(order);
  const barcodeSvg = createBarcodeSvg(awb);
  const size = getLabelSize(settings.labelSize);
  const isA4 = size.key === "A4";

  const pad = isA4 ? 18 : 9;
  const labelFont = isA4 ? 10 : 7.5;
  const valueFont = isA4 ? 13 : 9;
  const smallFont = isA4 ? 8 : 6.2;

  const showOrderValue = Boolean(settings.orderValue);
  const showCod = Boolean(settings.codAmount) && payment === "COD";
  const showBuyerMobile =
    Boolean(settings.buyerMobile) && Boolean(getMobile(order));
  const showShipperMobiles =
    Boolean(settings.shipperMobiles) &&
    Boolean(getShipperMobile(order) || getAlternateShipperMobile(order));
  const showShipperAddress =
    Boolean(settings.shipperAddress) && Boolean(shipperAddress);
  const showProductName = Boolean(settings.productName);
  const showOrderId = Boolean(settings.orderId);
  const showWeight = Boolean(settings.orderWeight);

  const orderInfoItems = [];

  if (showOrderId) {
    orderInfoItems.push(
      `<div class="info-cell"><div class="label">ORDER ID</div><div class="value">#${escapeHtml(
        getOrderId(order),
      )}</div></div>`,
    );
  }

  if (showOrderValue) {
    orderInfoItems.push(
      `<div class="info-cell"><div class="label">ORDER VALUE</div><div class="value">₹${getOrderValue(
        order,
      ).toFixed(2)}</div></div>`,
    );
  }

  const productHtml = showProductName
    ? `<section class="section product-section"><div class="label">PRODUCT</div><div class="product-list">${productRows
        .slice(0, isA4 ? 6 : 3)
        .map(
          (product) =>
            `<div class="product-row"><span class="product-name">${escapeHtml(
              product?.product_name || product?.name || "Product",
            )}</span><span class="product-qty">x${escapeHtml(
              product?.quantity || product?.qty || 1,
            )}</span></div>`,
        )
        .join("")}</div></section>`
    : "";

  const codHtml = showCod
    ? `<section class="cod-row"><span>CASH ON DELIVERY</span><strong>₹${getCodAmount(
        order,
      ).toFixed(2)}</strong></section>`
    : "";

  const tncHtml = settings.servicesTnc
    ? `<section class="section tnc-section"><div class="label">SERVICES T&amp;C</div><div class="tnc-text">ShipDrop shipment is subject to applicable shipping terms and conditions.</div></section>`
    : "";

  return `
    <div class="shipdrop-label" style="--pad:${pad}px;--label-font:${labelFont}px;--value-font:${valueFont}px;--small-font:${smallFont}px;width:${size.widthIn}in;height:${size.heightIn}in;">
      <div class="label-inner">
        <header class="label-header">
          <div class="logo-box left-logo"><img src="${shipdropLogo}" alt="ShipDrop" /></div>
          <div class="logo-box right-logo"><img src="${rightLogo}" alt="Carrier" /></div>
        </header>

        <section class="awb-section">
          <div class="label awb-label">AWB</div>
          <div class="awb-number">${escapeHtml(awb)}</div>
          <div class="barcode">${barcodeSvg}</div>
        </section>

        <section class="from-to">
          <div class="address-cell">
            <div class="label">FROM</div>
            <div class="name">${escapeHtml(getShipperName(order))}</div>
            ${
              showShipperAddress
                ? `<div class="address">${escapeHtml(shipperAddress)}</div>`
                : ""
            }
            ${
              showShipperMobiles
                ? `<div class="phone">${escapeHtml(
                    [
                      getShipperMobile(order),
                      getAlternateShipperMobile(order),
                    ]
                      .filter(Boolean)
                      .join(" / "),
                  )}</div>`
                : ""
            }
          </div>

          <div class="address-cell">
            <div class="label">TO</div>
            <div class="name">${escapeHtml(getCustomerName(order))}</div>
            <div class="address">${escapeHtml(buyerAddress)}</div>
            ${
              showBuyerMobile
                ? `<div class="phone">${escapeHtml(getMobile(order))}</div>`
                : ""
            }
          </div>
        </section>

        <section class="three-col">
          <div class="info-cell">
            <div class="label">PAYMENT</div>
            <div class="value">${escapeHtml(payment)}</div>
          </div>

          <div class="info-cell">
            <div class="label">SERVICE</div>
            <div class="value">${
              service === "AIR" ? "BY AIR" : "BY ROAD"
            }</div>
          </div>

          <div class="info-cell">
            <div class="label">WEIGHT</div>
            <div class="value">${
              showWeight ? `${getWeight(order).toFixed(2)} KG` : "—"
            }</div>
          </div>
        </section>

        ${
          orderInfoItems.length
            ? `<section class="two-col">${orderInfoItems.join("")}</section>`
            : ""
        }

        ${codHtml}
        ${productHtml}
        ${tncHtml}

        <footer class="label-footer">
          <span>${escapeHtml(getShipperName(order))}</span>
          <span>${escapeHtml(formatDate(getCreatedAt(order)))}</span>
        </footer>
      </div>
    </div>

    <style>
      .shipdrop-label{
        box-sizing:border-box;
        margin:0 auto;
        padding:var(--pad);
        background:#fff;
        color:#111827;
        font-family:Arial,Helvetica,sans-serif;
        page-break-after:always;
        overflow:hidden
      }

      .shipdrop-label:last-child{
        page-break-after:auto
      }

      .label-inner{
        position:relative;
        width:100%;
        height:100%;
        box-sizing:border-box;
        border:1.1px solid #111827;
        background:#fff;
        overflow:hidden
      }

      .label-header{
        height:${isA4 ? 54 : 34}px;
        padding:${isA4 ? 7 : 4}px 7px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        border-bottom:1.1px solid #111827;
        box-sizing:border-box
      }

      .logo-box{
        width:43%;
        height:100%;
        display:flex;
        align-items:center
      }

      .left-logo{
        justify-content:flex-start
      }

      .right-logo{
        justify-content:flex-end
      }

      .logo-box img{
        display:block;
        max-width:100%;
        max-height:100%;
        object-fit:contain
      }

      .awb-section{
        text-align:center;
        padding:${isA4 ? 8 : 5}px 7px;
        border-bottom:1.1px solid #111827
      }

      .label{
        font-size:var(--label-font);
        font-weight:700;
        letter-spacing:.35px;
        color:#6b7280
      }

      .awb-number{
        margin-top:2px;
        font-size:var(--value-font);
        font-weight:800;
        letter-spacing:1px;
        color:#111827
      }

      .barcode{
        margin-top:${isA4 ? 5 : 3}px
      }

      .barcode svg{
        display:block;
        margin:0 auto;
        max-width:100%;
        height:auto
      }

      .from-to{
        display:grid;
        grid-template-columns:1fr 1fr;
        border-bottom:1.1px solid #111827
      }

      .address-cell{
        min-width:0;
        padding:${isA4 ? 8 : 5}px 7px
      }

      .address-cell+ .address-cell{
        border-left:1.1px solid #111827
      }

      .name{
        margin-top:2px;
        font-size:${isA4 ? 12 : 8.5}px;
        font-weight:800;
        line-height:1.15;
        color:#111827
      }

      .address{
        margin-top:3px;
        font-size:${isA4 ? 8.5 : 6.1}px;
        line-height:1.25;
        color:#374151
      }

      .phone{
        margin-top:3px;
        font-size:${isA4 ? 8 : 6}px;
        font-weight:700;
        color:#111827
      }

      .three-col{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        border-bottom:1.1px solid #111827
      }

      .three-col .info-cell{
        padding:${isA4 ? 7 : 5}px
      }

      .three-col .info-cell+.info-cell{
        border-left:1.1px solid #111827
      }

      .value{
        margin-top:2px;
        font-size:${isA4 ? 10.5 : 7.2}px;
        font-weight:800;
        color:#111827
      }

      .two-col{
        display:grid;
        grid-template-columns:1fr 1fr;
        border-bottom:1.1px solid #111827
      }

      .two-col .info-cell{
        padding:${isA4 ? 7 : 5}px
      }

      .two-col .info-cell+.info-cell{
        border-left:1.1px solid #111827
      }

      .cod-row{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:${isA4 ? 7 : 5}px;
        border-bottom:1.1px solid #111827;
        font-size:${isA4 ? 8 : 6}px;
        font-weight:800
      }

      .cod-row strong{
        font-size:${isA4 ? 11 : 8}px
      }

      .section{
        padding:${isA4 ? 7 : 5}px;
        border-bottom:1.1px solid #111827
      }

      .product-list{
        margin-top:3px
      }

      .product-row{
        display:flex;
        justify-content:space-between;
        gap:8px;
        font-size:${isA4 ? 8 : 6.2}px;
        line-height:1.3;
        font-weight:700
      }

      .product-name{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap
      }

      .product-qty{
        flex:0 0 auto
      }

      .tnc-text{
        margin-top:3px;
        font-size:${isA4 ? 6.5 : 5.2}px;
        line-height:1.25;
        color:#374151
      }

      .label-footer{
        position:absolute;
        left:7px;
        right:7px;
        bottom:5px;
        display:flex;
        justify-content:space-between;
        padding-top:3px;
        border-top:1px solid #d1d5db;
        font-size:${isA4 ? 7 : 5.2}px;
        color:#6b7280
      }
    </style>`;
};

const resolveSettings = async () => {
  const settings = await getLabelSettings();
  const actualSize = askLabelSize(settings.labelSize);

  return {
    ...settings,
    labelSize: actualSize,
  };
};



export const printShippingLabels = async (
  orders,
  title = "ShipDrop Shipping Labels",
) => {
  if (!Array.isArray(orders) || !orders.length) {
    toast.error("Please select at least one shipment");
    return;
  }

  try {
    const settings = await resolveSettings();
    const detailedOrders = await getDetailedOrders(orders);
    const rightLogo = settings.customLogo || delhiveryLogo;
    const html = detailedOrders
      .map((order) => buildLabelHtml(order, settings, rightLogo))
      .join("");
    const size = getLabelSize(settings.labelSize);

    const win = window.open("", "_blank", "width=900,height=700");

    if (!win) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
            }

            .print-wrapper {
              width: 100%;
            }

            @page {
              size: ${size.widthIn}in ${size.heightIn}in;
              margin: 0;
            }

            @media print {
              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
              }

              .shipdrop-label {
                margin: 0 !important;
                border: 1px solid #111827;
              }

              .shipdrop-label:last-child {
                page-break-after: auto;
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
        win.close();
      }, 1000);
    }, 700);

    toast.success(
      `${detailedOrders.length} ${
        detailedOrders.length === 1 ? "label" : "labels"
      } ready to print`,
    );
  } catch (error) {
    console.error("Print label error:", error);
    toast.error(error?.message || "Unable to print labels");
  }
};

export const downloadShippingLabels = async (orders) => {
  if (!Array.isArray(orders) || !orders.length) {
    toast.error("Please select at least one shipment");
    return;
  }

  try {
    const settings = await resolveSettings();
    const detailedOrders = await getDetailedOrders(orders);
    const size = getLabelSize(settings.labelSize);
    const rightLogo = settings.customLogo || delhiveryLogo;

    const shipdropLogoData = await imageUrlToDataUrl(shipdropLogo);
    const rightLogoData = settings.customLogo?.startsWith("data:")
      ? settings.customLogo
      : await imageUrlToDataUrl(rightLogo);

    const pdf = new jsPDF({
      orientation:
        size.widthMm > size.heightMm ? "landscape" : "portrait",
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
      const margin = size.key === "A4" ? 8 : 4;
      const innerW = pageW - margin * 2;
      const payment = getPaymentType(order);
      const service = getServiceType(order);

      pdf.setDrawColor(17, 24, 39);
      pdf.setLineWidth(0.35);
      pdf.rect(margin, margin, innerW, pageH - margin * 2);

      const headerY = margin + 5;
      const logoMaxH = size.key === "A4" ? 16 : 10;

      const leftLogoH = logoMaxH;
      const leftLogoW =
        leftLogoH *
        (shipLogoDimensions.width / shipLogoDimensions.height);

      const rightLogoH = logoMaxH;
      const rightLogoW =
        rightLogoH *
        (rightLogoDimensions.width / rightLogoDimensions.height);

      pdf.addImage(
        shipdropLogoData,
        "PNG",
        margin + 4,
        headerY,
        Math.min(leftLogoW, innerW * 0.4),
        leftLogoH,
      );

      pdf.addImage(
        rightLogoData,
        "PNG",
        pageW -
          margin -
          4 -
          Math.min(rightLogoW, innerW * 0.4),
        headerY,
        Math.min(rightLogoW, innerW * 0.4),
        rightLogoH,
      );

      const headerBottom =
        headerY + Math.max(leftLogoH, rightLogoH) + 4;

      pdf.line(
        margin,
        headerBottom,
        pageW - margin,
        headerBottom,
      );

      let cursorY = headerBottom + 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(size.key === "A4" ? 8 : 6);
      pdf.setTextColor(75, 85, 99);

      pdf.text("AWB", pageW / 2, cursorY, {
        align: "center",
      });

      cursorY += size.key === "A4" ? 5 : 4;

      pdf.setFontSize(size.key === "A4" ? 13 : 9);
      pdf.setTextColor(17, 24, 39);

      pdf.text(getAWB(order), pageW / 2, cursorY, {
        align: "center",
      });

      cursorY += size.key === "A4" ? 4 : 3;

      const barcodeData = createBarcodeDataUrl(getAWB(order));

      if (barcodeData) {
        pdf.addImage(
          barcodeData,
          "PNG",
          pageW / 2 - innerW * 0.22,
          cursorY,
          innerW * 0.44,
          size.key === "A4" ? 15 : 10,
        );

        cursorY += size.key === "A4" ? 17 : 12;
      }

      pdf.line(
        margin,
        cursorY,
        pageW - margin,
        cursorY,
      );

      const fromToTop = cursorY;
      const fromToHeight = size.key === "A4" ? 34 : 24;
      const halfW = innerW / 2;

      pdf.line(
        pageW / 2,
        fromToTop,
        pageW / 2,
        fromToTop + fromToHeight,
      );

      pdf.setFontSize(size.key === "A4" ? 7 : 5.5);
      pdf.setTextColor(107, 114, 128);

      pdf.text("FROM", margin + 3, fromToTop + 5);
      pdf.text("TO", pageW / 2 + 3, fromToTop + 5);

      pdf.setFontSize(size.key === "A4" ? 10 : 7);
      pdf.setTextColor(17, 24, 39);

      pdf.text(
        getShipperName(order),
        margin + 3,
        fromToTop + 10,
        {
          maxWidth: halfW - 7,
        },
      );

      pdf.text(
        getCustomerName(order),
        pageW / 2 + 3,
        fromToTop + 10,
        {
          maxWidth: halfW - 7,
        },
      );

      if (settings.shipperAddress) {
        pdf.setFontSize(size.key === "A4" ? 6.5 : 5);

        pdf.text(
          getShipperAddress(order),
          margin + 3,
          fromToTop + 15,
          {
            maxWidth: halfW - 7,
          },
        );
      }

      pdf.setFontSize(size.key === "A4" ? 6.5 : 5);

      pdf.text(
        getBuyerAddress(order),
        pageW / 2 + 3,
        fromToTop + 15,
        {
          maxWidth: halfW - 7,
        },
      );

      if (settings.shipperMobiles) {
        pdf.setFontSize(size.key === "A4" ? 6 : 5);

        pdf.text(
          [
            getShipperMobile(order),
            getAlternateShipperMobile(order),
          ]
            .filter(Boolean)
            .join(" / "),
          margin + 3,
          fromToTop + fromToHeight - 4,
          {
            maxWidth: halfW - 7,
          },
        );
      }

      if (settings.buyerMobile) {
        pdf.setFontSize(size.key === "A4" ? 6 : 5);

        pdf.text(
          getMobile(order),
          pageW / 2 + 3,
          fromToTop + fromToHeight - 4,
        );
      }

      cursorY = fromToTop + fromToHeight;

      pdf.line(
        margin,
        cursorY,
        pageW - margin,
        cursorY,
      );

      const infoHeight = size.key === "A4" ? 17 : 12;
      const colW = innerW / 3;

      pdf.line(
        margin + colW,
        cursorY,
        margin + colW,
        cursorY + infoHeight,
      );

      pdf.line(
        margin + colW * 2,
        cursorY,
        margin + colW * 2,
        cursorY + infoHeight,
      );

      const drawInfo = (x, label, value) => {
        pdf.setFontSize(size.key === "A4" ? 6 : 4.8);
        pdf.setTextColor(107, 114, 128);
        pdf.setFont("helvetica", "bold");

        pdf.text(
          label,
          x + 3,
          cursorY + 5,
        );

        pdf.setFontSize(size.key === "A4" ? 9 : 6.5);
        pdf.setTextColor(17, 24, 39);

        pdf.text(
          value,
          x + 3,
          cursorY + 11,
        );
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
        `${getWeight(order).toFixed(2)} KG`,
      );

      cursorY += infoHeight;

      pdf.line(
        margin,
        cursorY,
        pageW - margin,
        cursorY,
      );

      const orderInfoHeight = size.key === "A4" ? 15 : 11;

      if (settings.orderId) {
        pdf.setFontSize(size.key === "A4" ? 6 : 4.8);
        pdf.setTextColor(107, 114, 128);

        pdf.text(
          "ORDER ID",
          margin + 3,
          cursorY + 5,
        );

        pdf.setFontSize(size.key === "A4" ? 9 : 6.5);
        pdf.setTextColor(17, 24, 39);

        pdf.text(
          `#${getOrderId(order)}`,
          margin + 3,
          cursorY + 11,
        );
      }

      if (settings.orderValue) {
        const x = margin + innerW / 2;

        pdf.line(
          x,
          cursorY,
          x,
          cursorY + orderInfoHeight,
        );

        pdf.setFontSize(size.key === "A4" ? 6 : 4.8);
        pdf.setTextColor(107, 114, 128);

        pdf.text(
          "ORDER VALUE",
          x + 3,
          cursorY + 5,
        );

        pdf.setFontSize(size.key === "A4" ? 9 : 6.5);
        pdf.setTextColor(17, 24, 39);

        pdf.text(
          `₹${getOrderValue(order).toFixed(2)}`,
          x + 3,
          cursorY + 11,
        );
      }

      cursorY += orderInfoHeight;

      pdf.line(
        margin,
        cursorY,
        pageW - margin,
        cursorY,
      );

      if (settings.codAmount && payment === "COD") {
        const codHeight = size.key === "A4" ? 16 : 12;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(size.key === "A4" ? 7 : 5.2);
        pdf.setTextColor(17, 24, 39);

        pdf.text(
          "CASH ON DELIVERY",
          margin + 3,
          cursorY + 5,
        );

        pdf.setFontSize(size.key === "A4" ? 11 : 8);

        pdf.text(
          `₹${getCodAmount(order).toFixed(2)}`,
          pageW - margin - 3,
          cursorY + 9,
          {
            align: "right",
          },
        );

        cursorY += codHeight;

        pdf.line(
          margin,
          cursorY,
          pageW - margin,
          cursorY,
        );
      }

      if (settings.productName) {
        const products = getProductRows(order);

        const productHeight =
          size.key === "A4"
            ? Math.min(35, 12 + products.length * 5)
            : Math.min(
                23,
                9 + Math.min(products.length, 2) * 5,
              );

        pdf.setFontSize(size.key === "A4" ? 6 : 4.8);
        pdf.setTextColor(107, 114, 128);

        pdf.text(
          "PRODUCT",
          margin + 3,
          cursorY + 5,
        );

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(size.key === "A4" ? 8 : 6);

        products
          .slice(0, size.key === "A4" ? 5 : 2)
          .forEach((product, productIndex) => {
            const name =
              product?.product_name ||
              product?.name ||
              "Product";

            const qty =
              product?.quantity ||
              product?.qty ||
              1;

            pdf.text(
              `${name}  x${qty}`,
              margin + 3,
              cursorY + 10 + productIndex * 5,
              {
                maxWidth: innerW - 6,
              },
            );
          });

        cursorY += productHeight;

        pdf.line(
          margin,
          cursorY,
          pageW - margin,
          cursorY,
        );
      }

      if (settings.servicesTnc) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(size.key === "A4" ? 6 : 4.8);
        pdf.setTextColor(107, 114, 128);

        pdf.text(
          "SERVICES T&C",
          margin + 3,
          cursorY + 5,
        );

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(55, 65, 81);

        pdf.text(
          "ShipDrop shipment is subject to applicable shipping terms and conditions.",
          margin + 3,
          cursorY + 10,
          {
            maxWidth: innerW - 6,
          },
        );

        cursorY += size.key === "A4" ? 17 : 13;

        pdf.line(
          margin,
          cursorY,
          pageW - margin,
          cursorY,
        );
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size.key === "A4" ? 5.5 : 4.3);
      pdf.setTextColor(107, 114, 128);

      pdf.text(
        getShipperName(order),
        margin + 3,
        pageH - margin - 4,
      );

      pdf.text(
        formatDate(getCreatedAt(order)),
        pageW - margin - 3,
        pageH - margin - 4,
        {
          align: "right",
        },
      );
    }

    const fileName =
      detailedOrders.length === 1
        ? `shipdrop-label-${getAWB(detailedOrders[0])}.pdf`
        : `shipdrop-labels-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`;

    pdf.save(fileName);

    toast.success(
      `${detailedOrders.length} ${
        detailedOrders.length === 1 ? "label" : "labels"
      } downloaded`,
    );
  } catch (error) {
    console.error("Download label error:", error);
    toast.error(
      error?.message || "Unable to download labels",
    );
  }
};

export { DEFAULT_LABEL_SETTINGS };