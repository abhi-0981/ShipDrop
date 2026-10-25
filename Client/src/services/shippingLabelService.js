import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";
import api from "./api";

import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

// YE NAYA CODE YAHAN PASTE KAR
const getParcelDropFilename = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `ParcelDrop-${day}-${month}-${year}`;
};

// ISKE NEECHE TERA PURANA CODE JAISE HAI WAISE HI RAHE
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
    (v) =>
      v !== undefined &&
      v !== null &&
      String(v).trim() !== ""
  );

const txt = (value, fallback = "—") =>
  value === undefined ||
  value === null ||
  String(value).trim() === ""
    ? fallback
    : String(value).trim();

const esc = (value) =>
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

      if (user && typeof user === "object") {
        return user;
      }
    } catch {
      // Ignore invalid stored values.
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

const getAWB = (o) =>
  txt(
    first(
      o.awb,
      o.waybill,
      o.awb_number,
      o.awbNumber,
      o.tracking_number,
      o.trackingNumber
    ),
    "AWB unavailable"
  );

const getOrderId = (o) =>
  txt(
    first(
      o.display_order_id,
      o.displayOrderId,
      o.order_id,
      o.orderId,
      o.order_number,
      o.orderNumber,
      o.id
    )
  );

const getCustomerName = (o) => {
  const customer = o.customer || o.buyer || {};

  return txt(
    first(
      o.consignee_name,
      o.customer_name,
      o.customerName,
      o.buyer_name,
      o.buyerName,
      o.delivery_name,
      o.deliveryName,
      customer.name,
      customer.full_name,
      customer.fullName,
      typeof o.customer === "string" ? o.customer : null,
      o.name
    )
  );
};

const getMobile = (o) => {
  const customer = o.customer || o.buyer || {};

  return txt(
    first(
      o.consignee_phone,
      o.consigneePhone,
      o.customer_mobile,
      o.customerMobile,
      o.buyer_mobile,
      o.buyerMobile,
      o.delivery_mobile,
      o.deliveryMobile,
      customer.mobile,
      customer.phone,
      o.mobile,
      o.phone
    ),
    ""
  );
};

const getPaymentType = (o) => {
  const value = String(
    first(
      o.payment_type,
      o.paymentType,
      o.payment_method,
      o.paymentMethod,
      o.payment_mode,
      o.paymentMode,
      "PREPAID"
    )
  ).toUpperCase();

  return value.includes("COD") ? "COD" : "PREPAID";
};

const getServiceType = (o) => {
  const value = String(
    first(
      o.service_type,
      o.serviceType,
      o.shipment_type,
      o.shipmentType,
      o.mode,
      "ROAD"
    )
  ).toUpperCase();

  return value.includes("AIR") ? "BY AIR" : "BY ROAD";
};

const getWeight = (o) => {
  const packages = Array.isArray(o.packages)
    ? o.packages.reduce(
        (sum, p) =>
          sum +
          (Number(p.weight) || 0) *
            (Number(p.package_count) || 1),
        0
      )
    : 0;

  return (
    Number(
      first(
        o.total_weight,
        o.totalWeight,
        o.package_weight,
        o.packageWeight,
        o.weight,
        packages,
        0
      )
    ) || 0
  );
};

const getOrderValue = (o) =>
  Number(
    first(
      o.order_value,
      o.orderValue,
      o.product_value,
      o.productValue,
      o.total_amount,
      o.totalAmount,
      o.order_amount,
      o.orderAmount,
      o.total_value,
      o.amount,
      0
    )
  ) || 0;

const getCodAmount = (o) => {
  const codAmount = Number(
    first(
      o.cod_amount,
      o.codAmount,
      o.cod_value,
      o.codValue,
      o.collectable_amount,
      o.collectableAmount,
      o.amount_to_collect,
      o.amountToCollect
    )
  );

  if (Number.isFinite(codAmount) && codAmount > 0) {
    return codAmount;
  }

  const products = getProducts(o);
  const productTotal = products.reduce(
    (sum, product) => sum + (Number(product.total) || 0),
    0
  );

  return productTotal > 0 ? productTotal : getOrderValue(o);
};

const money = (value) =>
  `₹${(Number(value) || 0).toFixed(2)}`;

const getDate = (o) =>
  first(
    o.invoice_date,
    o.invoiceDate,
    o.manifest_created_at,
    o.manifestCreatedAt,
    o.created_at,
    o.createdAt,
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

const getFromName = (o) => {
  const warehouse = o.warehouse || {};

  return txt(
    first(
      o.pickup_name,
      o.pickupName,
      o.pickup_contact_name,
      o.pickupContactName,
      warehouse.contact_name,
      warehouse.contactName,
      warehouse.name,
      o.warehouse_contact_name,
      o.warehouseContactName,
      o.shipper_name,
      o.shipperName,
      o.seller_name,
      o.sellerName
    ),
    ""
  );
};

const getFromMobile = (o) => {
  const warehouse = o.warehouse || {};

  return txt(
    first(
      o.shipper_mobile,
      o.shipperMobile,
      o.pickup_mobile,
      o.pickupMobile,
      o.pickup_phone,
      o.pickupPhone,
      o.seller_mobile,
      o.sellerMobile,
      warehouse.mobile,
      warehouse.phone
    ),
    ""
  );
};

const getAlternateFromMobile = (o) =>
  txt(
    first(
      o.shipper_alternate_mobile,
      o.alternate_mobile,
      o.pickup_alternate_mobile,
      o.seller_alternate_mobile
    ),
    ""
  );

const getFromAddress = (o) => {
  const warehouse = o.warehouse || {};
  const pickup = o.pickup_address_details || {};

  return [
    first(
      warehouse.address_line1,
      warehouse.addressLine1,
      warehouse.address,
      o.warehouse_address_line1,
      o.warehouseAddressLine1,
      o.pickup_address,
      o.pickupAddress,
      o.shipper_address,
      o.shipperAddress,
      pickup.address_line1,
      pickup.address
    ),
    first(
      warehouse.address_line2,
      warehouse.addressLine2,
      o.warehouse_address_line2,
      o.pickup_address_line2,
      pickup.address_line2
    ),
    first(
      warehouse.landmark,
      o.warehouse_landmark,
      o.pickup_landmark,
      pickup.landmark
    ),
    first(
      warehouse.city,
      o.warehouse_city,
      o.pickup_city,
      pickup.city
    ),
    first(
      warehouse.state,
      o.warehouse_state,
      o.pickup_state,
      pickup.state
    ),
    first(
      warehouse.pincode,
      o.warehouse_pincode,
      o.pickup_pincode,
      pickup.pincode
    ),
    first(
      warehouse.country,
      o.pickup_country,
      "India"
    ),
  ]
    .filter(Boolean)
    .join(", ");
};

const getBuyerAddress = (o) => {
  const customer = o.customer || o.buyer || {};

  return [
    first(
      o.address_line1,
      o.addressLine1,
      o.delivery_address,
      o.deliveryAddress,
      o.address,
      o.buyer_address1,
      customer.address_line1,
      customer.address
    ),
    first(
      o.address_line2,
      o.addressLine2,
      o.buyer_address2,
      customer.address_line2
    ),
    first(
      o.landmark,
      o.buyer_landmark,
      customer.landmark
    ),
    first(
      o.city,
      o.delivery_city,
      o.deliveryCity,
      o.buyer_city,
      customer.city
    ),
    first(
      o.state,
      o.delivery_state,
      o.deliveryState,
      o.buyer_state,
      customer.state
    ),
    first(
      o.pincode,
      o.delivery_pincode,
      o.deliveryPincode,
      o.buyer_pincode,
      customer.pincode
    ),
    first(
      o.country,
      o.buyer_country,
      customer.country,
      "India"
    ),
  ]
    .filter(Boolean)
    .join(", ");
};

const getSellerName = (o) => {
  const user = getStoredUser();
  const account = o.user || {};
  const seller = o.seller || {};
  const profile = o.seller_profile || o.sellerProfile || {};

  return txt(
    first(
      // Logged-in account user name — highest priority
      user.full_name,
      user.fullName,
      user.name,
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : null,

      // Order's user/account name
      account.full_name,
      account.fullName,
      account.name,

      // Seller personal name
      seller.full_name,
      seller.fullName,
      seller.name,

      // Profile personal name
      profile.full_name,
      profile.fullName,
      profile.name,

      // Last fallback
      o.seller_name,
      o.sellerName
    )
  );
};
    

const getSellerGstin = (o) => {
  const user = getStoredUser();
  const account = o.user || {};
  const seller = o.seller || {};
  const profile = o.seller_profile || o.sellerProfile || {};

  return txt(
    first(
      // Logged-in account user's GSTIN — highest priority
      user.gstin,
      user.GSTIN,
      user.gst_number,
      user.gstNumber,
      user.gst_no,
      user.gstNo,

      // Order's user/account GST
      account.gstin,
      account.GSTIN,
      account.gst_number,
      account.gstNumber,
      account.gst_no,
      account.gstNo,

      // Seller GST
      seller.gstin,
      seller.GSTIN,
      seller.gst_number,
      seller.gstNumber,
      seller.gst_no,
      seller.gstNo,

      // Profile GST
      profile.gstin,
      profile.GSTIN,
      profile.gst_number,
      profile.gstNumber,
      profile.gst_no,
      profile.gstNo,

      // Order-level fallback
      o.gstin,
      o.GSTIN,
      o.gst_number,
      o.gstNumber,
      o.seller_gstin,
      o.sellerGstin
    ),
    ""
  );
};

const getReturnAddress = (o) =>
  [
    first(
      o.return_address_line1,
      o.returnAddressLine1,
      o.return_address,
      o.returnAddress
    ),
    first(
      o.return_address_line2,
      o.returnAddressLine2
    ),
    first(
      o.return_landmark,
      o.returnLandmark
    ),
    first(
      o.return_city,
      o.returnCity
    ),
    first(
      o.return_state,
      o.returnState
    ),
    first(
      o.return_pincode,
      o.returnPincode
    ),
    first(
      o.return_country,
      o.returnCountry,
      "India"
    ),
  ]
    .filter(Boolean)
    .join(", ");

const getProducts = (o) => {
  const list =
    Array.isArray(o.products) && o.products.length
      ? o.products
      : Array.isArray(o.order_products) &&
          o.order_products.length
        ? o.order_products
        : [
            {
              product_name: first(
                o.product_name,
                o.productName,
                o.shipment,
                "Product"
              ),
              quantity: first(
                o.quantity,
                o.qty,
                1
              ),
              price: first(
                o.product_value,
                o.productValue,
                o.order_value,
                o.orderValue,
                o.total_amount,
                0
              ),
            },
          ];

  return list.map((product) => {
    const quantity =
      Number(
        first(
          product.quantity,
          product.qty,
          product.product_quantity,
          product.productQuantity,
          1
        )
      ) || 1;

    const totalValue = first(
      product.total,
      product.total_price,
      product.totalPrice,
      product.line_total,
      product.lineTotal,
      product.amount
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
          totalValue !== undefined
            ? Number(totalValue) / quantity
            : 0
        )
      ) || 0;

    return {
      name: txt(
        first(
          product.product_name,
          product.productName,
          product.name,
          product.product
        ),
        "Product"
      ),
      qty: quantity,
      rate,
      total: Number(totalValue) || rate * quantity,
    };
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
    data.order_value ?? data.orderValue ?? true
  ),
  codAmount: Boolean(
    data.cod_amount ?? data.codAmount ?? true
  ),
  buyerMobile: Boolean(
    data.buyer_mobile ?? data.buyerMobile ?? true
  ),
  shipperMobiles: Boolean(
    data.shipper_mobiles ?? data.shipperMobiles ?? true
  ),
  shipperAddress: Boolean(
    data.shipper_address ?? data.shipperAddress ?? true
  ),
  fromName: Boolean(
    data.from_name ?? data.fromName ?? true
  ),
  fromAddress: Boolean(
    data.from_address ?? data.fromAddress ?? true
  ),
  fromMobile: Boolean(
    data.from_mobile ?? data.fromMobile ?? true
  ),
  productName: Boolean(
    data.product_name ?? data.productName ?? true
  ),
  productDetails: Boolean(
    data.product_details ?? data.productDetails ?? true
  ),
  servicesTnc: Boolean(
    data.services_tnc ?? data.servicesTnc ?? false
  ),
  orderId: Boolean(
    data.order_id ?? data.orderId ?? false
  ),
  orderWeight: Boolean(
    data.order_weight ?? data.orderWeight ?? false
  ),
  returnAddress: Boolean(
    data.return_address ?? data.returnAddress ?? true
  ),
  contactLine: Boolean(
    data.contact_line ?? data.contactLine ?? true
  ),

  rightLogoMode:
    data.right_logo_mode ||
    data.rightLogoMode ||
    "delhivery",

  labelSize:
    data.label_size ||
    data.labelSize ||
    "4x6",

  customLogo:
    data.custom_logo ||
    data.customLogo ||
    null,
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
    console.error("Label settings error:", error);
    return { ...DEFAULT_LABEL_SETTINGS };
  }
};

const getDetailedOrders = async (orders) => {
  const userId = getUserId();

  if (!userId) return orders;

  return Promise.all(
    orders.map(async (order) => {
      const id = first(
        order?.order_id,
        order?.orderId,
        order?.id
      );

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

        if (!full) return order;

        return {
          ...order,
          ...full,
          awb: first(
            order.awb,
            full.awb,
            full.waybill
          ),
          order_id: first(
            order.order_id,
            full.order_id
          ),
        };
      } catch (error) {
        console.warn(
          "Could not fetch complete order:",
          id,
          error
        );

        return order;
      }
    })
  );
};

const imageToDataUrl = async (source) => {
  if (!source) return "";

  if (String(source).startsWith("data:")) {
    return source;
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load logo: ${source}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
};

const createBarcode = (awb, compact = false) => {
  const svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  JsBarcode(svg, String(awb || ""), {
    format: "CODE128",
    displayValue: false,

    // Barcode ko bada rakhenge
   height: compact ? 40 : 75,
width: compact ? 2.5 : 3.5,

    margin: 0,
    background: "#ffffff",
    lineColor: "#111827",

    // Scanner ke liye clear CODE128 barcode
  });

  return svg.outerHTML;
};

const build3x2LabelHtml = (
  order,
  settings,
  leftLogo,
  rightLogo,
  size
) => {
  const awb = getAWB(order);
  const payment = getPaymentType(order);

  const buyerAddress = getBuyerAddress(order);
  const customerName = getCustomerName(order);

  const showOrderId = settings.orderId === true;
  const showWeight = settings.orderWeight === true;

  const showBuyerMobile =
    settings.buyerMobile !== false && Boolean(getMobile(order));

  const showFromName = settings.fromName !== false;
  const showFromAddress =
    settings.fromAddress !== false &&
    settings.shipperAddress !== false;
  const showFromMobile =
    settings.fromMobile !== false &&
    settings.shipperMobiles !== false;

  /*
   * 3x2 me FROM intentionally nahi rakhenge.
   * Space TO + AWB + Barcode + Summary + Seller ke liye use hoga.
   */

  const summaryColumns =
    2 +
    (showOrderId ? 1 : 0) +
    (showWeight ? 1 : 0);

  const summaryClass =
    summaryColumns === 4
      ? "four-cols"
      : summaryColumns === 3
        ? "three-cols"
        : "two-cols";

  const returnAddress =
    getReturnAddress(order) || getFromAddress(order);

  return `
    <article
      class="shipping-label label-3x2"
      style="width:${size.widthIn}in;height:${size.heightIn}in"
    >
      <div class="label-border">

        <!-- LOGOS -->
        <header class="logos">
          <div class="logo left">
            <img src="${esc(leftLogo)}" alt="ParcelDrop" />
          </div>

          <div class="logo right">
            <img src="${esc(rightLogo)}" alt="Carrier" />
          </div>
        </header>

        <!-- TO -->
        <section class="mini-to">
          <div class="eyebrow">TO</div>

          <b class="person">
            ${esc(customerName)}
          </b>

          <div class="address">
            ${esc(buyerAddress || "—")}
          </div>

          ${
            showBuyerMobile
              ? `
                <div class="phone">
                  ☎ ${esc(getMobile(order))}
                </div>
              `
              : ""
          }
        </section>

        <!-- AWB + BARCODE -->
        <section class="mini-awb">
          <div class="awb-text">
            AWB No: ${esc(awb)}
          </div>

          <div class="barcode">
            ${createBarcode(awb, true)}
          </div>
        </section>

        <!-- PAYMENT / ORDER ID / SERVICE / WEIGHT -->
        <section class="mini-summary ${summaryClass}">

          <div>
            <span>PAYMENT</span>
            <b>${payment}</b>
          </div>

          ${
            showOrderId
              ? `
                <div>
                  <span>ORDER ID</span>
                  <b>${esc(getOrderId(order))}</b>
                </div>
              `
              : ""
          }

          <div>
            <span>SERVICE</span>
            <b>${getServiceType(order)}</b>
          </div>

          ${
            showWeight
              ? `
                <div>
                  <span>WEIGHT</span>
                  <b>${getWeight(order).toFixed(2)} KG</b>
                </div>
              `
              : ""
          }

        </section>

        <!-- SELLER INFO -->
        <section class="mini-seller">

          <div>
            <span>SELLER</span>
            <b>${esc(getSellerName(order))}</b>
          </div>

          <div>
            <span>GSTIN</span>
            <b>${esc(getSellerGstin(order) || "")}</b>
          </div>

          <div>
            <span>INVOICE NO.</span>
            <b></b>
          </div>

          <div>
            <span>DATE</span>
            <b>${esc(formatDate(getDate(order)))}</b>
          </div>

        </section>

      </div>
    </article>

    <style>
      .label-3x2 {
        margin: 0;
        padding: 1.2mm;
        background: #fff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 6.5pt;
        line-height: 1.15;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        box-sizing: border-box;
      }

      .label-3x2 *,
      .label-3x2 *::before,
      .label-3x2 *::after {
        box-sizing: border-box;
      }

      .label-3x2 .label-border {
        width: 100%;
        height: 100%;
        border: 1px solid #111827;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #fff;
      }

      /* LOGOS */
      .label-3x2 .logos {
      height: 8.5mm;
  flex: 0 0 8.5mm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #111827;
      }

    .label-3x2 .logo {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4mm 1mm;
}

.label-3x2 .logo.left {
  justify-content: center;
}

.label-3x2 .logo.right {
  justify-content: center;

  border-left: 1px solid #111827;
}

.label-3x2 .logo img {
  display: block;
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

      /* TO */
      .label-3x2 .mini-to {
        flex: 0 0 auto;
  padding: 0.8mm 1.5mm;
        border-bottom: 1px solid #111827;
        overflow: hidden;
      }

      .label-3x2 .eyebrow {
        font-size: 5.5pt;
        font-weight: 700;
        text-decoration: underline;
        margin-bottom: 0.7mm;
      }

      .label-3x2 .person {
        display: block;
        font-size: 7pt;
        font-weight: 700;
        margin-bottom: 0.6mm;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .label-3x2 .address {
        font-size: 5.7pt;
  line-height: 1.15;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .label-3x2 .phone {
         font-size: 5.2pt;
  margin-top: 0.3mm;
        font-weight: 600;
      }

      /* AWB */
      .label-3x2 .mini-awb {
        flex: 0 0 auto;
        text-align: center;
         padding: 0.6mm 1mm;

        border-bottom: 1px solid #111827;
      }

      .label-3x2 .awb-text {
        font-size: 6.5pt;
        font-weight: 600;
        margin-bottom: 0.7mm;
      }

      .label-3x2 .barcode svg {
        display: block;
          width: 75%;
  max-width: 75%;
  height: 6.5mm;
        margin: 0 auto;
      }

      /* SUMMARY */
      .label-3x2 .mini-summary {
        display: grid;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .label-3x2 .mini-summary.two-cols {
        grid-template-columns: repeat(2, 1fr);
      }

      .label-3x2 .mini-summary.three-cols {
        grid-template-columns: repeat(3, 1fr);
      }

      .label-3x2 .mini-summary.four-cols {
        grid-template-columns: repeat(4, 1fr);
      }

      .label-3x2 .mini-summary > div {
        min-width: 0;
          padding: 0.7mm;

        overflow: hidden;
      }

      .label-3x2 .mini-summary > div + div {
        border-left: 1px solid #9ca3af;
      }

      .label-3x2 .mini-summary span,
      .label-3x2 .mini-seller span {
        display: block;
        font-size: 4.5pt;
        font-weight: 700;
        margin-bottom: 0.4mm;
      }

      .label-3x2 .mini-summary b {
        display: block;
        font-size: 6.2pt;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* SELLER */
      .label-3x2 .mini-seller {
        display: grid;
        grid-template-columns: 1.2fr 1.2fr 1fr 0.9fr;
        flex: 0 0 auto;
      }

      .label-3x2 .mini-seller > div {
        min-width: 0;
  padding: 0.6mm 0.7mm;
        overflow: hidden;
      }

      .label-3x2 .mini-seller > div + div {
        border-left: 1px solid #9ca3af;
      }

      .label-3x2 .mini-seller b {
        display: block;
        font-size: 5pt;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    </style>
  `;
};

const formatSlashDate = (value) => {
  if (!value) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const getPieces = (o) => {
  return (
    first(
      o.pieces,
      o.pcs,
      o.package_count,
      o.packageCount,
      o.total_packages,
      o.totalPackages,
      Array.isArray(o.packages) && o.packages.length > 0 ? o.packages.length : 1
    ) || 1
  );
};

const getInvoiceNo = (o) =>
  txt(
    first(
      o.invoice_no,
      o.invoiceNo,
      o.invoice_number,
      o.invoiceNumber,
      o.invoice_id,
      o.invoiceId
    ),
    ""
  );

const buildLabelHtml = (
  order,
  settings,
  carrierLogo,
  companyLogo,
  size
) => {
  const is3x2 = size.key === "3x2";

  if (is3x2) {
    return build3x2LabelHtml(
      order,
      settings,
      companyLogo,
      carrierLogo,
      size
    );
  }

  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const buyerAddress = getBuyerAddress(order);
  const customerName = getCustomerName(order);
  const customerMobile = getMobile(order);
  const sellerName = getSellerName(order);
  const sellerGstin = getSellerGstin(order);
  const invoiceNo = getInvoiceNo(order);
  const slashDate = formatSlashDate(getDate(order));
  const pieces = getPieces(order);
  const codAmount = getCodAmount(order);

  const showBuyerMobile =
    settings.buyerMobile !== false && Boolean(customerMobile);

  const isCod = payment === "COD";
  const paymentText = isCod
    ? `COD : ${money(codAmount)}`
    : "Prepaid";

  return `
    <article
      class="shipping-label"
      style="width:${size.widthIn}in;height:${size.heightIn}in;"
    >
      <div class="label-border">
        <!-- 1. TOP HEADER: 50% Delhivery Courier Logo | 50% ShipDrop / Company Logo -->
        <header class="logos-header">
          <div class="logo-col left-logo">
            <img src="${esc(carrierLogo)}" alt="Courier" />
          </div>
          <div class="logo-col right-logo">
            <img src="${esc(companyLogo)}" alt="Company" />
          </div>
        </header>

        <!-- 2. TO ADDRESS BLOCK (FULL WIDTH) -->
        <section class="to-block">
          <div class="to-caption">To</div>
          <div class="consignee-name">${esc(customerName)}</div>
          <div class="consignee-address">${esc(buyerAddress || "—")}</div>
          ${
            showBuyerMobile
              ? `<div class="consignee-phone">☎ ${esc(customerMobile)}</div>`
              : ""
          }
        </section>

        <!-- 3. AWB & BARCODE BLOCK -->
        <section class="awb-barcode-block">
          <div class="awb-text">AWB No: ${esc(awb)}</div>
          <div class="pcs-text">PCS #: ${esc(pieces)}</div>
          <div class="barcode-wrapper">
            ${createBarcode(awb, false)}
          </div>
        </section>

        <!-- 4. PAYMENT ROW -->
        <section class="payment-row">
          <div class="payment-cell">
            ${esc(paymentText)}
          </div>
          <div class="payment-right-cell"></div>
        </section>

        <!-- 5. SELLER TABLE (4 COLUMNS) -->
        <section class="seller-grid">
          <div class="seller-headers">
            <div class="col-cell">Seller</div>
            <div class="col-cell">GSTIN</div>
            <div class="col-cell">Invoice No</div>
            <div class="col-cell">Date</div>
          </div>
          <div class="seller-values">
            <div class="col-cell seller-name">${esc(sellerName ? sellerName.toUpperCase() : "—")}</div>
            <div class="col-cell seller-gstin">${esc(sellerGstin || "—")}</div>
            <div class="col-cell seller-invoice">${esc(invoiceNo || "")}</div>
            <div class="col-cell seller-date">${esc(slashDate)}</div>
          </div>
        </section>

        <!-- 6. BOTTOM INVOICE SUMMARY BOX -->
        <footer class="invoice-summary-box">
          <div class="inv-line">Invoice No: ${esc(invoiceNo)} | Invoice Date : ${esc(slashDate)}</div>
          <div class="gst-line">GSTIN No: ${esc(sellerGstin || "—")}</div>
        </footer>
      </div>
    </article>

    <style>
      * {
        box-sizing: border-box;
      }

      .shipping-label {
        margin: 0;
        padding: 2.5mm;
        background: #ffffff;
        color: #000000;
        font-family: Arial, Helvetica, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .label-border {
        width: 100%;
        border: 1.5px solid #000000;
        background: #ffffff;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      /* 1. TOP HEADER */
      .logos-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 18mm;
        border-bottom: 1.5px solid #000000;
        align-items: center;
      }

      .logo-col {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5mm 3mm;
      }

      .logo-col.left-logo {
        border-right: 1.5px solid #000000;
      }

      .logo-col img {
        max-width: 90%;
        max-height: 14mm;
        object-fit: contain;
        display: block;
      }

      /* 2. TO BLOCK */
      .to-block {
        padding: 2mm 3mm 2.5mm 3mm;
        border-bottom: 1.5px solid #000000;
      }

      .to-caption {
        font-size: 8.5pt;
        font-weight: 500;
        color: #000000;
        margin-bottom: 1mm;
      }

      .consignee-name {
        font-size: 9.5pt;
        font-weight: 700;
        color: #000000;
        margin-bottom: 1mm;
        word-break: break-word;
      }

      .consignee-address {
        font-size: 8pt;
        line-height: 1.35;
        color: #000000;
        word-break: break-word;
      }

      .consignee-phone {
        font-size: 7.5pt;
        font-weight: 600;
        color: #000000;
        margin-top: 1mm;
      }

      /* 3. AWB & BARCODE */
      .awb-barcode-block {
        padding: 2.5mm 3mm 2mm 3mm;
        border-bottom: 1.5px solid #000000;
        text-align: center;
      }

      .awb-text {
        font-size: 9pt;
        font-weight: 600;
        color: #000000;
        margin-bottom: 0.5mm;
        letter-spacing: 0.4px;
      }

      .pcs-text {
        font-size: 8.5pt;
        font-weight: 600;
        color: #000000;
        margin-bottom: 1.5mm;
      }

      .barcode-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
      }

      .barcode-wrapper svg {
        display: block;
        max-width: 92%;
        height: 16mm;
        margin: 0 auto;
      }

      /* 4. PAYMENT ROW */
      .payment-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1.5px solid #000000;
        min-height: 7mm;
      }

      .payment-cell {
        padding: 1.5mm 3mm;
        font-size: 8.5pt;
        font-weight: 700;
        color: #000000;
        border-right: 1.5px solid #000000;
        display: flex;
        align-items: center;
      }

      .payment-right-cell {
        padding: 1.5mm 3mm;
      }

      /* 5. SELLER GRID */
      .seller-grid {
        display: flex;
        flex-direction: column;
        border-bottom: 1.5px solid #000000;
      }

      .seller-headers {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        border-bottom: 1px solid #000000;
      }

      .seller-headers .col-cell {
        padding: 1.2mm 2mm;
        font-size: 7.5pt;
        font-weight: 600;
        color: #000000;
      }

      .seller-headers .col-cell:not(:last-child) {
        border-right: 1px solid #000000;
      }

      .seller-values {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        min-height: 8.5mm;
      }

      .seller-values .col-cell {
        padding: 1.5mm 2mm;
        font-size: 7pt;
        color: #000000;
        word-break: break-word;
      }

      .seller-values .col-cell:not(:last-child) {
        border-right: 1px solid #000000;
      }

      .seller-name {
        font-weight: 600;
        line-height: 1.2;
      }

      .seller-gstin {
        font-weight: 500;
      }

      /* 6. INVOICE SUMMARY BOX */
      .invoice-summary-box {
        padding: 1.8mm 3mm;
        font-size: 7.5pt;
        font-weight: 500;
        line-height: 1.45;
        color: #000000;
      }

      .inv-line {
        margin-bottom: 0.5mm;
      }
    </style>
  `;
};

const prepareLabels = async (orders, settingsOverride = null, customLogoOverride = null) => {
  let settings = settingsOverride || (await getLabelSettings());
  if (customLogoOverride && !settings.customLogo) {
    settings = {
      ...settings,
      customLogo: customLogoOverride,
      rightLogoMode: "custom",
    };
  }

  const detailedOrders = await getDetailedOrders(orders);
  const size = getLabelSize(settings.labelSize);

  // Left: Delhivery courier logo (matches reference)
  let carrierLogoData = "";
  try {
    carrierLogoData = await imageToDataUrl(delhiveryLogo);
  } catch (error) {
    console.warn("Carrier logo loading error:", error);
    carrierLogoData = "";
  }

  // Right: Merchant/Company logo (ShipDrop or custom uploaded logo)
  const companyLogoSource =
    settings.rightLogoMode === "custom" && settings.customLogo
      ? settings.customLogo
      : shipdropLogo;

  let companyLogoData = "";
  try {
    companyLogoData = await imageToDataUrl(companyLogoSource);
  } catch (error) {
    console.warn("Company logo loading error:", error);
    try {
      companyLogoData = await imageToDataUrl(shipdropLogo);
    } catch {
      companyLogoData = "";
    }
  }

  return {
    settings,
    detailedOrders,
    size,
    carrierLogoData,
    companyLogoData,
  };
};

export const generateShippingLabelsPdf = async (
  orders,
  settingsOverride = null,
  customLogoOverride = null
) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error("Please select at least one shipment");
  }

  let iframe = null;

  try {
    const {
      settings,
      detailedOrders,
      size,
      carrierLogoData,
      companyLogoData,
    } = await prepareLabels(orders, settingsOverride, customLogoOverride);

    iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = `${size.widthIn}in`;
    iframe.style.height = `${size.heightIn}in`;
    iframe.style.border = "0";
    iframe.style.visibility = "visible";
    iframe.style.opacity = "1";
    iframe.style.pointerEvents = "none";

    document.body.appendChild(iframe);

    const iframeDoc =
      iframe.contentDocument || iframe.contentWindow.document;

    iframeDoc.open();
    iframeDoc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Label</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              width: 100%;
              min-height: 100%;
            }
            body {
              overflow: hidden;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body></body>
      </html>
    `);
    iframeDoc.close();

    const labels = [];

    for (const order of detailedOrders) {
      const holder = iframeDoc.createElement("div");
      holder.innerHTML = buildLabelHtml(
        order,
        settings,
        carrierLogoData,
        companyLogoData,
        size
      );

      const styles = Array.from(holder.querySelectorAll("style"));
      styles.forEach((style) => {
        const styleClone = iframeDoc.createElement("style");
        styleClone.textContent = style.textContent || "";
        iframeDoc.head.appendChild(styleClone);
      });

      const label = holder.querySelector(".shipping-label");
      if (!label) continue;

      iframeDoc.body.appendChild(label);
      labels.push(label);
    }

    if (!labels.length) {
      throw new Error("No shipping labels could be generated");
    }

    // Wait for images to load
    const images = Array.from(iframeDoc.images);
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

    // Wait for layout frame
    await new Promise((resolve) => {
      iframe.contentWindow.requestAnimationFrame(() => {
        iframe.contentWindow.requestAnimationFrame(resolve);
      });
    });

    const pdf = new jsPDF({
      orientation:
        size.widthMm > size.heightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [size.widthMm, size.heightMm],
      compress: true,
    });

    pdf.setProperties({
      title: "Label",
      subject: "Shipping Labels",
      author: "ParcelDrop",
      creator: "ParcelDrop",
    });

    for (let index = 0; index < labels.length; index += 1) {
      const label = labels[index];
      const pageWidth = label.offsetWidth;
      const pageHeight = label.offsetHeight;

      const canvas = await html2canvas(label, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: pageWidth,
        height: pageHeight,
        windowWidth: pageWidth,
        windowHeight: pageHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const image = canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage(
          [size.widthMm, size.heightMm],
          size.widthMm > size.heightMm ? "landscape" : "portrait"
        );
      }

      pdf.addImage(
        image,
        "PNG",
        0,
        0,
        size.widthMm,
        size.heightMm,
        undefined,
        "FAST"
      );
    }

    const filename = `${getParcelDropFilename()}.pdf`;

    return {
      pdf,
      count: detailedOrders.length,
      filename,
    };
  } finally {
    if (iframe) {
      iframe.remove();
    }
  }
};

export const printShippingLabels = async (
  orders,
  settingsOrTitle,
  customLogoArg
) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    toast.error("Please select at least one shipment");
    return;
  }

  let settingsOverride = null;
  let customLogoOverride = null;

  if (settingsOrTitle && typeof settingsOrTitle === "object") {
    settingsOverride = settingsOrTitle;
  }
  if (customLogoArg && typeof customLogoArg === "string") {
    customLogoOverride = customLogoArg;
  }

  // Pre-open tab synchronously so browser popup blocker never blocks it
  let printTab = null;
  try {
    printTab = window.open("", "_blank");
    if (printTab) {
      printTab.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Label</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #111827;
                color: #ffffff;
              }
              .loader-card {
                text-align: center;
                padding: 28px 36px;
                background: #1f2937;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
                max-width: 320px;
                border: 1px solid rgba(255, 255, 255, 0.08);
              }
              .spinner {
                width: 44px;
                height: 44px;
                border: 3.5px solid rgba(255, 255, 255, 0.15);
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              .title { font-size: 16px; font-weight: 600; letter-spacing: 0.2px; }
              .sub { font-size: 13px; color: #9ca3af; margin-top: 6px; }
            </style>
          </head>
          <body>
            <div class="loader-card">
              <div class="spinner"></div>
              <div class="title">Generating Shipping Labels...</div>
              <div class="sub">Preparing ${orders.length} label${orders.length > 1 ? "s" : ""}</div>
            </div>
          </body>
        </html>
      `);
      printTab.document.close();
    }
  } catch (err) {
    console.warn("Could not pre-open window:", err);
  }

  try {
    const { pdf, count } = await generateShippingLabelsPdf(
      orders,
      settingsOverride,
      customLogoOverride
    );

    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (printTab && !printTab.closed) {
      printTab.location.href = blobUrl;
      printTab.focus();
    } else {
      const opened = window.open(blobUrl, "_blank");
      if (!opened) {
        pdf.save(`${getParcelDropFilename()}.pdf`);
        toast.success(`${count} label(s) generated & downloaded!`);
        return;
      }
    }

    toast.success(`${count} ${count === 1 ? "label" : "labels"} ready`);
  } catch (error) {
    if (printTab && !printTab.closed) {
      printTab.close();
    }
    console.error("Print shipping labels error:", error);
    toast.error(error?.message || "Unable to print labels");
  }
};

export const downloadShippingLabels = async (
  orders,
  settingsOrTitle,
  customLogoArg
) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    toast.error("Please select at least one shipment");
    return;
  }

  let settingsOverride = null;
  let customLogoOverride = null;

  if (settingsOrTitle && typeof settingsOrTitle === "object") {
    settingsOverride = settingsOrTitle;
  }
  if (customLogoArg && typeof customLogoArg === "string") {
    customLogoOverride = customLogoArg;
  }

  try {
    const { pdf, count, filename } = await generateShippingLabelsPdf(
      orders,
      settingsOverride,
      customLogoOverride
    );

    pdf.save(filename);

    toast.success(
      `${count} ${count === 1 ? "label" : "labels"} downloaded`
    );
  } catch (error) {
    console.error("Download shipping labels error:", error);
    toast.error(error?.message || "Unable to download labels");
  }
};
