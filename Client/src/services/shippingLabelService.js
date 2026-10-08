
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

const getCodAmount = (o) =>
  Number(
    first(
      o.cod_amount,
      o.codAmount,
      o.cod_value,
      o.codValue,
      o.collectable_amount,
      o.collectableAmount,
      o.amount_to_collect,
      o.amountToCollect,
      0
    )
  ) || 0;

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
      widthIn: 4.2,
      heightIn: 6,
      widthMm: 106.6,
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

const buildLabelHtml = (
  order,
  settings,
  leftLogo,
  rightLogo,
  size
) => {
  const compact = size.heightIn <= 2.5;
  const isA4 = size.key === "A4";

  const awb = getAWB(order);
  const payment = getPaymentType(order);
  const fromAddress = getFromAddress(order);
  const buyerAddress = getBuyerAddress(order);

  const fromMobiles = [
    getFromMobile(order),
    getAlternateFromMobile(order),
  ]
    .filter(Boolean)
    .join(" / ");

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

  const showOrderValue =
    settings.orderValue !== false;

  const showCod =
    settings.codAmount !== false &&
    payment === "COD";

  const showProducts =
    settings.productDetails !== false &&
    settings.productName !== false;

  // Only enabled, non-empty fields count as From details.
  const fromName = showFromName
    ? getFromName(order)
    : "";

  const fromAddressValue = showFromAddress
    ? fromAddress
    : "";

  const fromMobileValue = showFromMobile
    ? fromMobiles
    : "";

  const hasFromDetails = Boolean(
    fromName.trim() ||
    fromAddressValue.trim() ||
    fromMobileValue.trim()
  );

  const products = getProducts(order);

  const productRows = showProducts
    ? products
        .slice(0, isA4 ? 12 : compact ? 1 : 4)
        .map(
          (product) => `
            <tr>
              <td class="product-name">${esc(product.name)}</td>
              <td>${product.rate.toFixed(2)}</td>
              <td>${product.qty}</td>
              <td>${product.total.toFixed(2)}</td>
            </tr>
          `
        )
        .join("")
    : "";

    const orderCells = [];

  const returnAddress =
    getReturnAddress(order) || fromAddress;

  const contactLine =
    "For complaints & queries please contact 8766066070, 0141-4797120";

  return `
    <article
      class="shipping-label ${compact ? "compact" : ""} ${isA4 ? "a4" : ""}"
      style="width:${size.widthIn}in;height:${size.heightIn}in"
    >
      <div class="label-border">

        <header class="logos">
          <div class="logo left">
            <img src="${esc(leftLogo)}" alt="ParcelDrop" />
          </div>

          <div class="logo right">
            <img src="${esc(rightLogo)}" alt="Carrier" />
          </div>
        </header>

        <!-- ADDRESS SECTION -->

        <section class="addresses ${hasFromDetails ? "has-from" : "to-only"}">

          ${
            hasFromDetails
              ? `
                <div class="address-block">
                  <div class="eyebrow">FROM</div>

                  ${
                    fromName
                      ? `<b class="person">${esc(fromName)}</b>`
                      : ""
                  }

                  ${
                    fromAddressValue
                      ? `<div class="address">${esc(fromAddressValue)}</div>`
                      : ""
                  }

                  ${
                    fromMobileValue
                      ? `<div class="phone">☎ ${esc(fromMobileValue)}</div>`
                      : ""
                  }
                </div>
              `
              : ""
          }

          <div class="address-block to-block">
            <div class="eyebrow">TO</div>

            <b class="person">${esc(getCustomerName(order))}</b>

            <div class="address">${esc(buyerAddress || "—")}</div>

            ${
              showBuyerMobile
                ? `<div class="phone">☎ ${esc(getMobile(order))}</div>`
                : ""
            }
          </div>

        </section>

        <!-- AWB AND BARCODE -->

        <section class="awb">
          <div class="eyebrow">AWB NUMBER - ${esc(awb)}</div>
          <div class="awb-number"> </div>
          <div class="barcode">${createBarcode(awb, compact)}</div>
        </section>

        <!-- PAYMENT / SERVICE / OPTIONAL WEIGHT -->

       <section class="summary ${showWeight ? "four-cols" : "three-cols"}">

  <div>
    <span>PAYMENT</span>
    <b>${payment}</b>
  </div>

  <div>
    <span>ORDER ID</span>
    <b>${esc(getOrderId(order))}</b>
  </div>

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

        ${
          showProducts
            ? `
             <section class="products">
  <table>
    <thead>
      <tr>
        <th>PRODUCT</th>
        <th>RATE (₹)</th>
        <th>QTY</th>
        <th>TOTAL (₹)</th>
      </tr>
    </thead>

    <tbody>${productRows}</tbody>
  </table>
</section>
            `
            : ""
        }

        <section class="seller">
          <div>
            <span>SELLER</span>
            <b>${esc(getSellerName(order))}</b>
          </div>

          <div>
            <span>GSTIN</span>
            <b>${esc(getSellerGstin(order) || " ")}</b>
          </div>

          <div>
            <span>INVOICE NO.</span>
            <b>&nbsp;</b>
          </div>

          <div>
            <span>DATE</span>
            <b>${esc(formatDate(getDate(order)))}</b>
          </div>
        </section>

        ${
          settings.returnAddress !== false
            ? `
              <section class="return">
                <b>RETURN ADDRESS</b>
                <div>${esc(returnAddress || "—")}</div>
              </section>
            `
            : ""
        }

        ${
          settings.contactLine !== false
            ? `<footer class="contact">${esc(contactLine)}</footer>`
            : ""
        }

      </div>
    </article>

    <style>
      * {
        box-sizing: border-box;
      }

      .shipping-label {
        margin: 0;
        padding: ${compact ? "1.2mm" : isA4 ? "6mm" : "3mm"};
        background: #fff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: ${compact ? "5.5pt" : isA4 ? "11pt" : "8pt"};
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
        border: 1px solid #111827;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        overflow: hidden;
        background: #fff;
      }

.logos {
  position: relative;
  flex: 0 0 ${compact ? "5mm" : isA4 ? "15mm" : "9mm"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5mm 2mm;
  border-bottom: 1px solid #111827;
}

.logos::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50.4%;
  width: 1px;
  background: #111827;
  transform: translateX(-50%);
}

.logo {
  width: 47%;
  height: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
}

.logo.left {
  justify-content: flex-start;
  border-right: none;
  padding-right: 0;
}

.logo.right {
  justify-content: flex-end;
  padding-left: 0;
}

      .logo img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .addresses {
        display: grid;
        grid-template-columns: 1fr 1fr;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      /* When From has no enabled data, To takes the full width. */
      .addresses.to-only {
        grid-template-columns: minmax(0, 1fr);
      }

      .address-block {
        min-width: 0;
        padding: ${compact ? "1mm" : isA4 ? "4mm" : "2mm"};
        overflow-wrap: anywhere;
      }

      .address-block + .address-block {
        border-left: 1px solid #111827;
      }

      .addresses.to-only .address-block {
        width: 100%;
        border-left: none;
      }

      .eyebrow {
        font-size: ${compact ? "4.5pt" : isA4 ? "9pt" : "9pt"};
        font-weight: 600;
        letter-spacing: .2px;
        color: #374151;
      }

     .person {
  display: block;
  font-size: ${compact ? "5.5pt" : isA4 ? "13pt" : "8.5pt"};
  line-height: 1.2;
  margin-top: 1mm;
  font-weight: 600;
  overflow-wrap: anywhere;
}

     .address {
  font-size: ${compact ? "4.8pt" : isA4 ? "10pt" : "8pt"};
  line-height: 1.35;
  margin-top: 1mm;
  overflow-wrap: anywhere;
  font-weight: 400;
}

      .phone {
        font-size: ${compact ? "4.8pt" : isA4 ? "9pt" : "6.5pt"};
        font-weight: 600;
        margin-top: 1mm;
        overflow-wrap: anywhere;
      }

    .awb {
  flex: 0 0 auto;
  text-align: center;
  padding: ${compact ? "1.5mm" : isA4 ? "5mm" : "3mm"};
  border-bottom: 1px solid #111827;
}

    .awb-number {
  font-size: ${compact ? "7pt" : isA4 ? "17pt" : "15pt"};
  font-weight: 700;
  letter-spacing: .4px;
  margin: 1mm 0 2mm;
  overflow-wrap: anywhere;
}

      .barcode svg {
        display: block;
        max-width: 100%;
       max-height: ${compact ? "4mm" : isA4 ? "14mm" : "12mm"};
        height: auto;
        margin: 0 auto;
      }

      .summary {
        display: grid;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .summary.two-cols {
        grid-template-columns: 1fr 1fr;
      }

      .summary.three-cols {
  grid-template-columns: 1fr 1fr 1fr;
}

      .summary.four-cols {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

      .summary > div {
        min-width: 0;
        padding: ${compact ? "1mm" : isA4 ? "3mm" : "2mm"};
        overflow-wrap: anywhere;
      }

      .summary > div + div {
        border-left: 1px solid #9ca3af;
      }

      .summary span,
      .info-cell span,
      .seller span {
        display: block;
        font-size: ${compact ? "4.5pt" : isA4 ? "9pt" : "6.5pt"};
        font-weight: 600;
        margin-bottom: .5mm;
      }

      .summary b {
        display: block;
        font-size: ${compact ? "5.5pt" : isA4 ? "13pt" : "8.5pt"};
        font-weight: 600;
      }

      .order-info {
        display: grid;
        flex: 0 0 auto;
        border-bottom: 1px solid #111827;
      }

      .info-cell {
        min-width: 0;
        padding: ${compact ? "1mm" : "2mm"};
        overflow-wrap: anywhere;
      }

      .info-cell + .info-cell {
        border-left: 1px solid #9ca3af;
      }

      .info-cell b {
        display: block;
        font-size: ${compact ? "5pt" : "7.5pt"};
      }

      .cod {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2mm;
        padding: ${compact ? "1mm" : "2mm"};
        border-bottom: 1px solid #111827;
      }

      .cod b {
        font-size: ${compact ? "5pt" : "7.5pt"};
      }

      .cod strong {
        font-size: ${compact ? "5.5pt" : "9pt"};
      }
.products {
  flex: 0 0 auto;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #111827;
}

      .section-title {
        font-size: ${compact ? "4pt" : "6pt"};
        font-weight: 600;
        margin-bottom: 1mm;
      }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 0;
  padding: 0;
  table-layout: fixed;
  font-size: ${compact ? "4.5pt" : isA4 ? "9pt" : "6.5pt"};
}

th,
td {
  width: 25%;
  border: 1px solid #9ca3af;
  padding: ${compact ? "1mm" : "1.5mm"};
  text-align: center;
  overflow-wrap: anywhere;
font-size: ${compact ? "5.5pt" : isA4 ? "13pt" : "8.5pt"};
  font-weight: 600;
}

      th {
        font-weight: 600;
        background: #f3f4f6;
      }

     th:first-child,
td:first-child {
  text-align: left;
  width: 25%;
}
      .seller {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: 1.25fr 1fr 1fr .8fr;
        border-bottom: 1px solid #111827;
      }

      .seller > div {
        min-width: 0;
        padding: ${compact ? "1mm" : "1.5mm"};
        overflow-wrap: anywhere;
      }

      .seller > div + div {
        border-left: 1px solid #9ca3af;
      }

      .seller b {
  display: block;
  font-size: ${compact ? "5pt" : isA4 ? "10pt" : "7.5pt"};
  font-weight: 600;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

      .return {
        flex: 0 0 auto;
        padding: ${compact ? "1mm" : "1.5mm 2mm"};
        border-bottom: 1px solid #9ca3af;
        font-size: ${compact ? "4pt" : "5.5pt"};
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .return b {
        display: block;
        font-size: ${compact ? "4pt" : "5.5pt"};
        margin-bottom: .5mm;
      }

      .contact {
        flex: 0 0 auto;
        padding: ${compact ? "1mm" : "1.5mm"};
        font-size: ${compact ? "3.5pt" : isA4 ? "7pt" : "4.8pt"};
        line-height: 1.2;
        text-align: center;
        font-weight: 600;
        overflow-wrap: anywhere;
      }
    </style>
  `;
};

const prepareLabels = async (orders) => {
  const settings = await getLabelSettings();
  const detailedOrders = await getDetailedOrders(orders);
  const size = getLabelSize(settings.labelSize);

  const leftLogoData = await imageToDataUrl(shipdropLogo);

  const rightLogoSource =
    settings.rightLogoMode === "custom" &&
    settings.customLogo
      ? settings.customLogo
      : delhiveryLogo;

  let rightLogoData;

  try {
    rightLogoData = await imageToDataUrl(rightLogoSource);
  } catch (error) {
    console.error("Carrier logo loading error:", error);
    rightLogoData = await imageToDataUrl(delhiveryLogo);
  }

  return {
    settings,
    detailedOrders,
    size,
    leftLogoData,
    rightLogoData,
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

  try {
    const {
      settings,
      detailedOrders,
      size,
      leftLogoData,
      rightLogoData,
    } = await prepareLabels(orders);

    const html = detailedOrders
      .map((order) =>
        buildLabelHtml(
          order,
          settings,
          leftLogoData,
          rightLogoData,
          size
        )
      )
      .join("");

    const win = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!win) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    win.document.open();

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${esc(title)}</title>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
            }

            * {
              box-sizing: border-box;
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

    let printStarted = false;

    const printWhenReady = async () => {
      if (printStarted || win.closed) return;

      const images = Array.from(win.document.images);

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

      if (win.closed || printStarted) return;

      printStarted = true;
      win.focus();
      win.print();
    };

    win.addEventListener(
      "load",
      () => {
        printWhenReady().catch((error) =>
          console.error("Print readiness error:", error)
        );
      },
      { once: true }
    );

    window.setTimeout(() => {
      printWhenReady().catch((error) =>
        console.error("Print readiness error:", error)
      );
    }, 1000);

    toast.success(
      `${detailedOrders.length} label(s) ready to print`
    );
  } catch (error) {
    console.error("Print label error:", error);

    toast.error(
      error?.message || "Unable to print labels"
    );
  }
};

export const downloadShippingLabels = async (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    toast.error("Please select at least one shipment");
    return;
  }

  let staging;

  try {
    const {
      settings,
      detailedOrders,
      size,
      leftLogoData,
      rightLogoData,
    } = await prepareLabels(orders);

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
        leftLogoData,
        rightLogoData,
        size
      );

      const label = holder.querySelector(".shipping-label");

      if (!label) continue;

      staging.appendChild(label);
      labels.push(label);
    }

    if (!labels.length) {
      throw new Error(
        "No shipping labels could be generated"
      );
    }

    await Promise.all(
      Array.from(staging.querySelectorAll("img")).map(
        (img) => {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      )
    );

    const pdf = new jsPDF({
      orientation:
        size.widthMm > size.heightMm
          ? "landscape"
          : "portrait",
      unit: "mm",
      format: [size.widthMm, size.heightMm],
      compress: true,
    });

    for (let index = 0; index < labels.length; index += 1) {
     const canvas = await html2canvas(labels[index], {
  scale: 4,
  backgroundColor: "#ffffff",
  useCORS: true,
  logging: false,
});

     const image = canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage(
          [size.widthMm, size.heightMm],
          size.widthMm > size.heightMm
            ? "landscape"
            : "portrait"
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

    toast.success(
      `${detailedOrders.length} label(s) downloaded`
    );
  } catch (error) {
    console.error("Download label error:", error);

    toast.error(
      error?.message || "Unable to download labels"
    );
  } finally {
    staging?.remove();
  }
};
