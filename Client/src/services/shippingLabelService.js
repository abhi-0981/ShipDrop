import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";

import api from "./api";
import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

/* =========================================================
   DEFAULT LABEL SETTINGS
========================================================= */

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
  customLogo: null,
};

/* =========================================================
   BASIC HELPERS
========================================================= */

const text = (value, fallback = "—") => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
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

/* =========================================================
   STORED USER
========================================================= */

const getStoredUser = () => {
  const keys = [
    "user",
    "currentUser",
    "authUser",
  ];

  for (const key of keys) {
    const raw = localStorage.getItem(key);

    if (!raw) continue;

    try {
      const user = JSON.parse(raw);

      if (
        user &&
        typeof user === "object"
      ) {
        return user;
      }
    } catch {
      // Ignore invalid localStorage value
    }
  }

  return null;
};

const getUserId = () => {
  const user = getStoredUser();

  if (!user) {
    return null;
  }

  return (
    user?.id ||
    user?.user_id ||
    user?.userId ||
    null
  );
};

/* =========================================================
   ACCOUNT / SELLER NAME
========================================================= */

const getAccountSellerName = () => {
  const user = getStoredUser();

  if (!user) {
    return "";
  }

  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.user_name ||
    user?.username ||
    user?.seller_name ||
    user?.sellerName ||
    user?.business_name ||
    user?.businessName ||
    user?.company_name ||
    user?.companyName ||
    ""
  );
};

/* =========================================================
   ORDER HELPERS
========================================================= */

const getAWB = (order) =>
  text(
    order?.awb ||
      order?.waybill ||
      order?.awb_number ||
      order?.awbNumber,
    "AWB unavailable",
  );

const getOrderId = (order) =>
  text(
    order?.display_order_id ||
      order?.displayOrderId ||
      order?.order_id ||
      order?.orderId ||
      order?.order_number ||
      order?.orderNumber ||
      order?.id,
  );

const getCustomerName = (order) =>
  text(
    order?.consignee_name ||
      order?.customer_name ||
      order?.customerName ||
      order?.customer ||
      order?.buyer_name ||
      order?.buyerName ||
      order?.name,
  );

const getMobile = (order) =>
  text(
    order?.mobile ||
      order?.phone ||
      order?.customer_mobile ||
      order?.customerMobile ||
      order?.consignee_phone ||
      order?.consigneePhone ||
      order?.buyer_mobile ||
      order?.buyerMobile,
    "",
  );

const getPaymentType = (order) =>
  String(
    order?.payment_type ||
      order?.paymentType ||
      order?.payment_method ||
      order?.paymentMethod ||
      "PREPAID",
  ).toUpperCase();

const getWeight = (order) => {
  const packageWeight =
    Array.isArray(order?.packages)
      ? order.packages.reduce(
          (total, pkg) =>
            total +
            (Number(pkg?.weight) || 0) *
              (Number(pkg?.package_count) || 1),
          0,
        )
      : 0;

  return (
    Number(
      order?.total_weight ??
        order?.totalWeight ??
        order?.weight ??
        order?.package_weight ??
        order?.packageWeight ??
        packageWeight,
    ) || 0
  );
};

const getCreatedAt = (order) =>
  order?.invoice_date ||
  order?.invoiceDate ||
  order?.manifest_created_at ||
  order?.manifestCreatedAt ||
  order?.created_at ||
  order?.createdAt ||
  null;

/* =========================================================
   SELLER
========================================================= */

const getSellerName = (order) => {
  const accountName =
    getAccountSellerName();

  return text(
    order?.seller_name ||
      order?.sellerName ||
      order?.seller_full_name ||
      order?.sellerFullName ||
      order?.seller_company_name ||
      order?.sellerCompanyName ||
      order?.seller_business_name ||
      order?.sellerBusinessName ||
      order?.account_name ||
      order?.accountName ||
      order?.user_name ||
      order?.userName ||
      order?.user_full_name ||
      order?.userFullName ||
      order?.business_name ||
      order?.businessName ||
      order?.company_name ||
      order?.companyName ||
      accountName,
    "—",
  );
};

const getSellerGstin = (order) =>
  text(
    order?.seller_gstin ||
      order?.sellerGstin ||
      order?.seller_gst ||
      order?.sellerGSTIN ||
      order?.gstin ||
      order?.GSTIN,
    "",
  );

const getInvoiceNumber = (order) =>
  text(
    order?.invoice_number ||
      order?.invoiceNumber ||
      order?.invoice_no ||
      order?.invoiceNo,
    "",
  );

/* =========================================================
   PICKUP / FROM
========================================================= */

const getPickupName = (order) =>
  text(
    order?.pickup_name ||
      order?.pickupName ||
      order?.pickup_contact_name ||
      order?.pickupContactName ||
      order?.warehouse?.contact_name ||
      order?.warehouse?.contactName ||
      order?.warehouse_contact_name ||
      order?.warehouseContactName ||
      order?.shipper_name ||
      order?.shipperName ||
      order?.pickup_person_name ||
      order?.pickupPersonName,
    "—",
  );

const getPickupAddress = (order) => {
  const warehouse =
    order?.warehouse || {};

  return (
    [
      warehouse?.address_line1 ||
        warehouse?.addressLine1 ||
        order?.warehouse_address_line1 ||
        order?.warehouseAddressLine1 ||
        order?.pickup_address ||
        order?.pickupAddress ||
        order?.shipper_address ||
        order?.shipperAddress,

      warehouse?.address_line2 ||
        warehouse?.addressLine2 ||
        order?.warehouse_address_line2 ||
        order?.warehouseAddressLine2 ||
        order?.pickup_address_line2 ||
        order?.pickupAddressLine2,

      warehouse?.floor_no ||
        warehouse?.floorNo ||
        order?.warehouse_floor_no,

      warehouse?.landmark ||
        order?.warehouse_landmark ||
        order?.pickup_landmark ||
        order?.pickupLandmark,

      warehouse?.city ||
        order?.warehouse_city ||
        order?.warehouseCity ||
        order?.pickup_city ||
        order?.pickupCity,

      warehouse?.state ||
        order?.warehouse_state ||
        order?.warehouseState ||
        order?.pickup_state ||
        order?.pickupState,

      warehouse?.pincode ||
        order?.warehouse_pincode ||
        order?.warehousePincode ||
        order?.pickup_pincode ||
        order?.pickupPincode,

      warehouse?.country ||
        order?.warehouse_country ||
        order?.warehouseCountry ||
        order?.pickup_country ||
        order?.pickupCountry ||
        "India",
    ]
      .filter(Boolean)
      .join(", ") || "—"
  );
};

/* =========================================================
   CUSTOMER / TO
========================================================= */

const getCustomerAddress = (order) =>
  [
    order?.address_line1 ||
      order?.addressLine1 ||
      order?.address ||
      order?.delivery_address ||
      order?.deliveryAddress ||
      order?.buyer_address1 ||
      order?.buyerAddress1,

    order?.address_line2 ||
      order?.addressLine2 ||
      order?.buyer_address2 ||
      order?.buyerAddress2,

    order?.landmark ||
      order?.buyer_landmark ||
      order?.buyerLandmark,

    order?.city ||
      order?.delivery_city ||
      order?.deliveryCity ||
      order?.buyer_city ||
      order?.buyerCity,

    order?.state ||
      order?.delivery_state ||
      order?.deliveryState ||
      order?.buyer_state ||
      order?.buyerState,

    order?.pincode ||
      order?.delivery_pincode ||
      order?.deliveryPincode ||
      order?.buyer_pincode ||
      order?.buyerPincode,

    order?.country ||
      order?.buyer_country ||
      order?.buyerCountry ||
      "India",
  ]
    .filter(Boolean)
    .join(", ") || "—";

/* =========================================================
   RETURN ADDRESS
========================================================= */

const getReturnName = (order) =>
  text(
    order?.return_name ||
      order?.returnName,
    "",
  );

const getReturnPhone = (order) =>
  text(
    order?.return_phone ||
      order?.returnPhone ||
      order?.return_mobile ||
      order?.returnMobile,
    "",
  );

const getReturnAddress = (order) =>
  [
    order?.return_address_line1 ||
      order?.returnAddressLine1,

    order?.return_address_line2 ||
      order?.returnAddressLine2,

    order?.return_landmark ||
      order?.returnLandmark,

    order?.return_city ||
      order?.returnCity,

    order?.return_state ||
      order?.returnState,

    order?.return_pincode ||
      order?.returnPincode,

    order?.return_country ||
      order?.returnCountry ||
      "India",
  ]
    .filter(Boolean)
    .join(", ") || "—";

/* =========================================================
   PRODUCTS
========================================================= */

const getProductRows = (order) => {
  if (
    Array.isArray(order?.products) &&
    order.products.length > 0
  ) {
    return order.products;
  }

  return [
    {
      product_name:
        order?.product_name ||
        order?.productName ||
        order?.shipment ||
        "Product",

      quantity:
        order?.quantity ||
        order?.qty ||
        1,

      price:
        order?.product_value ||
        order?.productValue ||
        order?.order_value ||
        order?.orderValue ||
        order?.total_amount ||
        order?.totalAmount ||
        0,
    },
  ];
};

const normalizeProduct = (
  product,
) => {
  const name = text(
    product?.product_name ||
      product?.productName ||
      product?.name ||
      product?.product,
    "Product",
  );

  const quantity =
    Number(
      product?.quantity ||
        product?.qty ||
        product?.product_quantity ||
        product?.productQuantity ||
        1,
    ) || 1;

  const rate =
    Number(
      product?.rate ||
        product?.price ||
        product?.unit_price ||
        product?.unitPrice ||
        product?.product_rate ||
        product?.productRate ||
        0,
    ) || 0;

  const total =
    Number(
      product?.total ||
        product?.product_total ||
        product?.productTotal ||
        product?.line_total ||
        product?.lineTotal ||
        product?.total_price ||
        product?.totalPrice,
    ) || rate * quantity;

  return {
    name,
    quantity,
    rate,
    total,
  };
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (
  value,
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
};

/* =========================================================
   LABEL SIZE
========================================================= */

const getLabelSize = (
  value,
) => {
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

/* =========================================================
   FETCH DETAILED ORDERS
========================================================= */

const getDetailedOrders =
  async (orders) => {
    const userId =
      getUserId();

    if (!userId) {
      return orders;
    }

    return Promise.all(
      orders.map(
        async (order) => {
          try {
            const orderDbId =
              order?.order_id ||
              order?.orderId ||
              order?.id;

            if (!orderDbId) {
              return order;
            }

            const response =
              await api.get(
                `/orders/${orderDbId}`,
                {
                  params: {
                    user_id:
                      userId,
                  },
                },
              );

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

              awb:
                order?.awb ||
                order?.waybill ||
                fullOrder?.awb ||
                fullOrder?.waybill,

              order_id:
                order?.order_id ||
                fullOrder?.order_id,

              products:
                fullOrder?.products ||
                order?.products,
            };
          } catch (error) {
            console.warn(
              "Could not fetch full order:",
              order?.order_id,
              error,
            );

            return order;
          }
        },
      ),
    );
  };

/* =========================================================
   LABEL SETTINGS
========================================================= */

const getLabelSettings =
  async () => {
    const userId =
      getUserId();

    if (!userId) {
      return {
        ...DEFAULT_LABEL_SETTINGS,
      };
    }

    try {
      const response =
        await api.get(
          "/label-settings",
          {
            params: {
              user_id:
                userId,
            },
          },
        );

      const data =
        response.data?.settings;

      if (
        !response.data?.success ||
        !data
      ) {
        return {
          ...DEFAULT_LABEL_SETTINGS,
        };
      }

      return {
        orderValue:
          Boolean(
            data.order_value,
          ),

        codAmount:
          Boolean(
            data.cod_amount,
          ),

        buyerMobile:
          Boolean(
            data.buyer_mobile,
          ),

        shipperMobiles:
          Boolean(
            data.shipper_mobiles,
          ),

        shipperAddress:
          Boolean(
            data.shipper_address,
          ),

        productName:
          Boolean(
            data.product_name,
          ),

        servicesTnc:
          Boolean(
            data.services_tnc,
          ),

        orderId:
          Boolean(
            data.order_id,
          ),

        orderWeight:
          Boolean(
            data.order_weight,
          ),

        labelSize:
          data.label_size ||
          "4x6",

        customLogo:
          data.custom_logo ||
          null,
      };
    } catch (error) {
      console.error(
        "Label settings error:",
        error,
      );

      return {
        ...DEFAULT_LABEL_SETTINGS,
      };
    }
  };

/* =========================================================
   RESOLVE SETTINGS
========================================================= */

const resolveSettings =
  async (
    passedSettings = null,
    passedCustomLogo = null,
  ) => {
    const fetchedSettings =
      passedSettings &&
      typeof passedSettings ===
        "object"
        ? passedSettings
        : await getLabelSettings();

    return {
      ...DEFAULT_LABEL_SETTINGS,

      ...fetchedSettings,

      customLogo:
        passedCustomLogo ||
        fetchedSettings?.customLogo ||
        null,
    };
  };

/* =========================================================
   RIGHT LOGO
========================================================= */

const getRightLogo = (
  settings,
) =>
  settings?.customLogo ||
  delhiveryLogo;

/* =========================================================
   SCANNABLE CODE128 BARCODE
   IMPORTANT:
   Barcode is generated directly on CANVAS.
   Then converted to PNG data URL.
   No SVG stretching.
========================================================= */

const createBarcodeDataUrl = (
  value,
) => {
  const canvas =
    document.createElement(
      "canvas",
    );

  try {
    JsBarcode(
      canvas,
      String(
        value || "",
      ),
      {
        format: "CODE128",

        displayValue: false,

        /*
         * Proper module width.
         * Do not make this too small.
         */
        width: 2,

        /*
         * Barcode height.
         */
        height: 60,

        /*
         * Quiet zone.
         */
        margin: 12,

        marginTop: 8,
        marginBottom: 8,
        marginLeft: 14,
        marginRight: 14,

        background: "#ffffff",

        lineColor: "#000000",

        flat: false,
      },
    );

    return canvas.toDataURL(
      "image/png",
      1.0,
    );
  } catch (error) {
    console.error(
      "Barcode generation error:",
      error,
    );

    return "";
  }
};

/* =========================================================
   IMAGE -> DATA URL
========================================================= */

const imageUrlToDataUrl =
  async (url) => {
    if (!url) {
      return null;
    }

    if (
      String(url).startsWith(
        "data:",
      )
    ) {
      return url;
    }

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Image request failed",
        );
      }

      const blob =
        await response.blob();

      return await new Promise(
        (
          resolve,
          reject,
        ) => {
          const reader =
            new FileReader();

          reader.onloadend =
            () =>
              resolve(
                reader.result,
              );

          reader.onerror =
            reject;

          reader.readAsDataURL(
            blob,
          );
        },
      );
    } catch (error) {
      console.warn(
        "Could not convert logo:",
        error,
      );

      return null;
    }
  };

/* =========================================================
   BUILD LABEL HTML
========================================================= */

const buildLabelHtml = (
  order,
  settings,
  rightLogo,
  fixedLogo = shipdropLogo,
) => {
  const awb =
    getAWB(order);

  const payment =
    getPaymentType(order) ===
    "COD"
      ? "COD"
      : "Prepaid";

  const weight =
    getWeight(order);

  const orderId =
    getOrderId(order);

  const pickupName =
    getPickupName(order);

  const pickupAddress =
    getPickupAddress(order);

  const customerName =
    getCustomerName(order);

  const customerMobile =
    getMobile(order);

  const customerAddress =
    getCustomerAddress(
      order,
    );

  const sellerName =
    getSellerName(order);

  const sellerGstin =
    getSellerGstin(order);

  const invoiceNumber =
    getInvoiceNumber(order);

  const invoiceDate =
    formatDate(
      getCreatedAt(order),
    );

  const returnName =
    getReturnName(order);

  const returnPhone =
    getReturnPhone(order);

  const returnAddress =
    getReturnAddress(order);

  const products =
    getProductRows(
      order,
    ).map(
      normalizeProduct,
    );

  const formatMoney =
    (value) =>
      Number(value || 0)
        .toFixed(2)
        .replace(
          /\.00$/,
          "",
        );

  /*
   * IMPORTANT:
   * Generate barcode as PNG data URL.
   */
  const barcode =
    createBarcodeDataUrl(
      awb,
    );

  const size =
    getLabelSize(
      settings.labelSize,
    );

  return `
    <div
      class="shipdrop-label"
      style="
        width:${size.widthIn}in;
        min-height:${size.heightIn}in;
      "
    >

      <div class="label-inner">

        <!-- =========================================
             HEADER
        ========================================== -->

        <div class="label-header">

          <div class="logo-box left-logo">

            <img
              src="${fixedLogo}"
              alt="ShipDrop"
            />

          </div>

          <div class="logo-box right-logo">

            <img
              src="${
                rightLogo ||
                delhiveryLogo
              }"
              alt="Delhivery"
            />

          </div>

        </div>


        <!-- =========================================
             FROM / TO
        ========================================== -->

        <div class="from-to">

          <div class="address-cell">

            <div class="section-title">
              From
            </div>

            <div class="name">
              ${escapeHtml(
                pickupName,
              )}
            </div>

            <div class="address">
              ${escapeHtml(
                pickupAddress,
              )}
            </div>

          </div>


          <div class="address-cell">

            <div class="section-title">
              To
            </div>

            <div class="name">
              ${escapeHtml(
                customerName,
              )}
            </div>

            ${
              customerMobile
                ? `
                  <div class="phone">
                    Mobile No:
                    ${escapeHtml(
                      customerMobile,
                    )}
                  </div>
                `
                : ""
            }

            <div class="address">
              ${escapeHtml(
                customerAddress,
              )}
            </div>

          </div>

        </div>


        <!-- =========================================
             AWB
        ========================================== -->

        <div class="awb-section">

          <div class="awb-line">

            <span class="awb-label">
              AWB No:
            </span>

            <span class="awb-value">
              ${escapeHtml(
                awb,
              )}
            </span>

          </div>

          ${
            barcode
              ? `
                <div class="barcode">

                  <img
                    src="${barcode}"
                    alt="AWB Barcode"
                  />

                </div>
              `
              : ""
          }

        </div>


        <!-- =========================================
             PAYMENT / ORDER / WEIGHT
        ========================================== -->

        <div class="three-col">

          <div class="info-cell">

            <div class="value strong">
              ${escapeHtml(
                payment,
              )}
            </div>

          </div>


          <div class="info-cell">

            <div class="small-label">
              Order:
            </div>

            <div class="value">
              #${escapeHtml(
                orderId,
              )}
            </div>

          </div>


          <div class="info-cell">

            <div class="small-label">
              Billed Weight:
            </div>

            <div class="value">
              ${weight.toFixed(
                2,
              )}Kg
            </div>

          </div>

        </div>


        <!-- =========================================
             SELLER
        ========================================== -->

        <div class="seller-table">

          <div class="seller-head">

            <div>
              Seller
            </div>

            <div>
              GSTIN
            </div>

            <div>
              Invoice No
            </div>

            <div>
              Date
            </div>

          </div>


          <div class="seller-body">

            <div>
              ${escapeHtml(
                sellerName,
              )}
            </div>

            <div>
              ${escapeHtml(
                sellerGstin ||
                  "—",
              )}
            </div>

            <div>
              ${escapeHtml(
                invoiceNumber ||
                  "—",
              )}
            </div>

            <div>
              ${escapeHtml(
                invoiceDate,
              )}
            </div>

          </div>

        </div>


        <!-- =========================================
             PRODUCTS
        ========================================== -->

        <div class="product-table">

          <div class="product-head">

            <div>
              Product Name
            </div>

            <div>
              Rate
            </div>

            <div>
              Qty
            </div>

            <div>
              Total
            </div>

          </div>


          ${products
            .map(
              (
                product,
              ) => `
                <div class="product-body">

                  <div>
                    ${escapeHtml(
                      product.name,
                    )}
                  </div>

                  <div>
                    ${formatMoney(
                      product.rate,
                    )}
                  </div>

                  <div>
                    ${escapeHtml(
                      product.quantity,
                    )}
                  </div>

                  <div>
                    ${formatMoney(
                      product.total,
                    )}
                  </div>

                </div>
              `,
            )
            .join("")}

        </div>


        <!-- =========================================
             RETURN
        ========================================== -->

        <div class="return-box">

          <div>
            NOTE: If undelivered return to:
          </div>

          ${
            returnName
              ? `
                <div>
                  ${escapeHtml(
                    returnName,
                  )}
                </div>
              `
              : ""
          }

          <div>
            ${escapeHtml(
              returnAddress,
            )}

            ${
              returnPhone
                ? `
                  Mobile:
                  ${escapeHtml(
                    returnPhone,
                  )}
                `
                : ""
            }
          </div>

          <div>
            For complaints &amp; queries please contact
            <strong>
              8766066070, 0141-4797120
            </strong>
          </div>

        </div>

      </div>

    </div>
  `;
};

/* =========================================================
   LABEL CSS
========================================================= */

const getLabelStyles =
  (size) => `
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
    font-family:
      Arial,
      Helvetica,
      sans-serif;
  }

  .print-wrapper {
    width: 100%;
  }

  .shipdrop-label {
    box-sizing: border-box;

    margin: 0 auto;

    padding: 7px;

    background: #fff;

    color: #111827;

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    overflow: hidden;
  }

  .label-inner {
    width: 100%;

    border:
      1.5px solid #111;

    background: #fff;

    overflow: hidden;
  }


  /* ==============================================
     HEADER
  ============================================== */

  .label-header {
    height: 58px;

    padding: 5px 7px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    border-bottom:
      1.5px solid #111;
  }

  .logo-box {
    width: 48%;

    height: 44px;

    display: flex;

    align-items: center;
  }

  .left-logo {
    justify-content: flex-start;
  }

  .right-logo {
    justify-content: flex-end;
  }

  .logo-box img {
    display: block;

    max-width: 155px;

    max-height: 38px;

    object-fit: contain;
  }


  /* ==============================================
     FROM / TO
  ============================================== */

  .from-to {
    display: grid;

    grid-template-columns:
      1fr 1fr;

    border-bottom:
      1.5px solid #111;
  }

  .address-cell {
    min-height: 128px;

    padding: 9px 10px;

    min-width: 0;
  }

  .address-cell
    + .address-cell {
    border-left:
      1.5px solid #111;
  }

  .section-title {
    font-size: 12px;

    line-height: 16px;

    font-weight: 700;
  }

  .name {
    margin-top: 5px;

    font-size: 16px;

    line-height: 20px;

    font-weight: 700;

    overflow-wrap:
      anywhere;
  }

  .address {
    margin-top: 5px;

    font-size: 12px;

    line-height: 16px;

    font-weight: 600;

    overflow-wrap:
      anywhere;
  }

  .phone {
    margin-top: 5px;

    font-size: 12px;

    line-height: 16px;

    font-weight: 700;

    overflow-wrap:
      anywhere;
  }


  /* ==============================================
     AWB
  ============================================== */

  .awb-section {
    text-align: center;

    padding:
      7px 9px 8px;

    border-bottom:
      1.5px solid #111;
  }

  .awb-line {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    white-space: nowrap;

    min-height: 28px;
  }

  .awb-label {
    font-size: 12px;

    line-height: 20px;

    font-weight: 700;
  }

  .awb-value {
    font-size: 20px;

    line-height: 24px;

    font-weight: 800;

    letter-spacing: 0.6px;
  }

  .barcode {
    width: 100%;

    margin-top: 5px;

    display: flex;

    justify-content: center;

    align-items: center;

    overflow: hidden;
  }

  /*
   * IMPORTANT:
   * Do not stretch the barcode.
   *
   * The barcode PNG is already generated
   * at its correct dimensions by JsBarcode.
   */

  .barcode img {
    display: block;

    width: auto;

    height: auto;

    max-width: 285px;

    max-height: 76px;

    margin: 0 auto;

    object-fit: contain;
  }


  /* ==============================================
     PAYMENT / ORDER / WEIGHT
  ============================================== */

  .three-col {
    display: grid;

    grid-template-columns:
      1fr 1fr 1.05fr;

    border-bottom:
      1.5px solid #111;
  }

  .info-cell {
    min-height: 48px;

    padding: 7px 8px;

    display: flex;

    flex-direction: column;

    justify-content: center;
  }

  .info-cell
    + .info-cell {
    border-left:
      1.5px solid #111;
  }

  .small-label {
    font-size: 11px;

    line-height: 15px;

    font-weight: 700;
  }

  .value {
    font-size: 14px;

    line-height: 17px;

    font-weight: 700;
  }

  .strong {
    font-size: 12px;
  }


  /* ==============================================
     SELLER TABLE
  ============================================== */

  .seller-table {
    border-bottom:
      1.5px solid #111;
  }

  .seller-head,
  .seller-body {
    display: grid;

    grid-template-columns:
      1.15fr
      1.35fr
      1fr
      .9fr;

    align-items: stretch;
  }

  .seller-head > div,
  .seller-body > div {
    padding:
      6px 7px;

    font-size: 11px;

    line-height: 16px;

    overflow-wrap:
      anywhere;

    display: flex;

    align-items: center;
  }

  .seller-head {
    min-height: 30px;

    border-bottom:
      1px solid #111;

    font-weight: 700;
  }

  .seller-body {
    min-height: 50px;

    font-weight: 600;
  }

  .seller-head > div
    + div,
  .seller-body > div
    + div {
    border-left:
      1px solid #111;
  }


  /* ==============================================
     PRODUCT TABLE
  ============================================== */

  .product-table {
    border-bottom:
      1.5px solid #111;
  }

  .product-head,
  .product-body {
    display: grid;

    grid-template-columns:
      1.7fr
      .8fr
      .55fr
      .9fr;

    align-items: stretch;
  }

  .product-head {
    min-height: 30px;

    border-bottom:
      1px solid #111;
  }

  .product-body {
    min-height: 32px;
  }

  .product-head > div,
  .product-body > div {
    padding:
      6px 7px;

    font-size: 11px;

    line-height: 16px;

    overflow-wrap:
      anywhere;

    display: flex;

    align-items: center;
  }

  .product-head > div {
    font-weight: 700;
  }

  .product-body > div {
    font-weight: 600;
  }

  .product-head > div
    + div,
  .product-body > div
    + div {
    border-left:
      1px solid #111;
  }

  .product-head > div:nth-child(2),
  .product-head > div:nth-child(4),
  .product-body > div:nth-child(2),
  .product-body > div:nth-child(4) {
    justify-content: flex-end;

    text-align: right;
  }

  .product-head > div:nth-child(3),
  .product-body > div:nth-child(3) {
    justify-content: center;

    text-align: center;
  }


  /* ==============================================
     RETURN
  ============================================== */

  .return-box {
    padding:
      8px 9px;

    font-size: 10.5px;

    line-height: 14px;

    font-weight: 600;

    overflow-wrap:
      anywhere;
  }

  .return-box > div {
    margin-bottom: 2px;
  }

  .return-box > div:last-child {
    margin-bottom: 0;
  }

  .return-box > div:first-child {
    font-weight: 700;
  }


  /* ==============================================
     PRINT
  ============================================== */

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

      background:
        #fff !important;
    }

    .shipdrop-label {
      margin: 0 !important;
    }
  }
`;

/* =========================================================
   PRINT SHIPPING LABELS
========================================================= */

export const printShippingLabels =
  async (
    orders,
    passedSettings = null,
    passedCustomLogo = null,
    title =
      "ShipDrop Shipping Labels",
  ) => {
    if (
      !Array.isArray(orders) ||
      !orders.length
    ) {
      toast.error(
        "Please select at least one shipment",
      );

      return;
    }

    try {
      const settings =
        await resolveSettings(
          passedSettings,
          passedCustomLogo,
        );

      const detailedOrders =
        await getDetailedOrders(
          orders,
        );

      const rightLogo =
        getRightLogo(
          settings,
        );

      const size =
        getLabelSize(
          settings.labelSize,
        );

      const html =
        detailedOrders
          .map(
            (order) =>
              buildLabelHtml(
                order,
                settings,
                rightLogo,
                shipdropLogo,
              ),
          )
          .join("");

      const win =
        window.open(
          "",
          "_blank",
          "width=900,height=700",
        );

      if (!win) {
        toast.error(
          "Please allow pop-ups to print",
        );

        return;
      }

      win.document.write(`
        <!doctype html>

        <html>

          <head>

            <title>
              ${escapeHtml(
                title,
              )}
            </title>

            <style>
              ${getLabelStyles(
                size,
              )}
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

      setTimeout(
        () => {
          win.print();

          setTimeout(
            () => {
              win.close();
            },
            1000,
          );
        },
        700,
      );
    } catch (error) {
      console.error(
        "Print label error:",
        error,
      );

      toast.error(
        error?.message ||
          "Unable to print labels",
      );

      throw error;
    }
  };

/* =========================================================
   DOWNLOAD SHIPPING LABELS
========================================================= */

export const downloadShippingLabels =
  async (
    orders,
    passedSettings = null,
    passedCustomLogo = null,
  ) => {
    if (
      !Array.isArray(orders) ||
      !orders.length
    ) {
      toast.error(
        "Please select at least one shipment",
      );

      return;
    }

    let renderContainer =
      null;

    try {
      /* ---------------------------------------------
         SETTINGS
      --------------------------------------------- */

      const settings =
        await resolveSettings(
          passedSettings,
          passedCustomLogo,
        );

      const detailedOrders =
        await getDetailedOrders(
          orders,
        );

      const size =
        getLabelSize(
          settings.labelSize,
        );

      /* ---------------------------------------------
         LOGOS
      --------------------------------------------- */

      const shipLogoData =
        await imageUrlToDataUrl(
          shipdropLogo,
        );

      const configuredLogo =
        getRightLogo(
          settings,
        );

      const rightLogoData =
        await imageUrlToDataUrl(
          configuredLogo,
        );

      let finalRightLogo =
        rightLogoData;

      if (!finalRightLogo) {
        finalRightLogo =
          await imageUrlToDataUrl(
            delhiveryLogo,
          );
      }

      const finalShipLogo =
        shipLogoData ||
        shipdropLogo;

      /* ---------------------------------------------
         HIDDEN RENDER CONTAINER
      --------------------------------------------- */

      renderContainer =
        document.createElement(
          "div",
        );

      renderContainer.style.position =
        "fixed";

      renderContainer.style.left =
        "-100000px";

      renderContainer.style.top =
        "0";

      renderContainer.style.width =
        `${
          size.widthIn * 96
        }px`;

      renderContainer.style.background =
        "#ffffff";

      renderContainer.style.zIndex =
        "-999999";

      renderContainer.style.visibility =
        "visible";

      document.body.appendChild(
        renderContainer,
      );

      /* ---------------------------------------------
         CSS
      --------------------------------------------- */

      const style =
        document.createElement(
          "style",
        );

      style.textContent = `
        ${getLabelStyles(
          size,
        )}

        html,
        body {
          margin: 0 !important;

          padding: 0 !important;

          background:
            #ffffff !important;
        }

        .download-wrapper {
          width:
            ${
              size.widthIn *
              96
            }px !important;

          margin: 0 !important;

          padding: 0 !important;

          background:
            #ffffff !important;
        }

        .download-wrapper
        .shipdrop-label {
          width:
            ${size.widthIn}in !important;

          min-height:
            ${size.heightIn}in !important;

          margin: 0 !important;

          padding: 7px !important;

          background:
            #ffffff !important;
        }

        /*
         * Barcode PNG should NOT be
         * stretched or squeezed.
         */

        .download-wrapper
        .barcode img {
          width: auto !important;

          height: auto !important;

          max-width: 285px !important;

          max-height: 76px !important;
        }
      `;

      renderContainer.appendChild(
        style,
      );

      const wrapper =
        document.createElement(
          "div",
        );

      wrapper.className =
        "download-wrapper";

      renderContainer.appendChild(
        wrapper,
      );

      /* ---------------------------------------------
         CREATE PDF
      --------------------------------------------- */

      const pdf =
        new jsPDF({
          orientation:
            size.widthMm >
            size.heightMm
              ? "landscape"
              : "portrait",

          unit: "mm",

          format: [
            size.widthMm,
            size.heightMm,
          ],

          compress: true,
        });

      /* ---------------------------------------------
         RENDER EVERY LABEL
      --------------------------------------------- */

      for (
        let index = 0;
        index <
        detailedOrders.length;
        index += 1
      ) {
        const order =
          detailedOrders[
            index
          ];

        wrapper.innerHTML =
          buildLabelHtml(
            order,
            settings,
            finalRightLogo,
            finalShipLogo,
          );

        const label =
          wrapper.querySelector(
            ".shipdrop-label",
          );

        if (!label) {
          throw new Error(
            "Shipping label could not be rendered.",
          );
        }

        /* -----------------------------------------
           WAIT FOR IMAGES
        ----------------------------------------- */

        const images =
          Array.from(
            label.querySelectorAll(
              "img",
            ),
          );

        await Promise.all(
          images.map(
            (img) =>
              new Promise(
                (resolve) => {
                  if (
                    img.complete &&
                    img.naturalWidth >
                      0
                  ) {
                    resolve();

                    return;
                  }

                  img.onload =
                    resolve;

                  img.onerror =
                    resolve;
                },
              ),
          ),
        );

        /* -----------------------------------------
           WAIT FOR FONTS
        ----------------------------------------- */

        if (
          document.fonts &&
          document.fonts.ready
        ) {
          await document.fonts.ready;
        }

        /* -----------------------------------------
           WAIT FOR LAYOUT
        ----------------------------------------- */

        await new Promise(
          (resolve) =>
            requestAnimationFrame(
              () =>
                requestAnimationFrame(
                  resolve,
                ),
            ),
        );

        /* -----------------------------------------
           HTML -> CANVAS
        ----------------------------------------- */

        const rect =
          label.getBoundingClientRect();

        const canvas =
          await html2canvas(
            label,
            {
              backgroundColor:
                "#ffffff",

              /*
               * High resolution.
               */
              scale: 4,

              useCORS: false,

              allowTaint: false,

              logging: false,

              imageTimeout:
                15000,

              removeContainer:
                true,

              foreignObjectRendering:
                false,

              width:
                Math.ceil(
                  rect.width,
                ),

              height:
                Math.ceil(
                  rect.height,
                ),
            },
          );

        /* -----------------------------------------
           CANVAS -> PNG
        ----------------------------------------- */

        const imageData =
          canvas.toDataURL(
            "image/png",
            1.0,
          );

        /* -----------------------------------------
           ADD PDF PAGE
        ----------------------------------------- */

        if (index > 0) {
          pdf.addPage(
            [
              size.widthMm,
              size.heightMm,
            ],
            size.widthMm >
              size.heightMm
              ? "landscape"
              : "portrait",
          );
        }

        /* -----------------------------------------
           ADD LABEL TO PAGE
        ----------------------------------------- */

        pdf.addImage(
          imageData,
          "PNG",
          0,
          0,
          size.widthMm,
          size.heightMm,
          undefined,
          "FAST",
        );
      }

      /* ---------------------------------------------
         FILE NAME
      --------------------------------------------- */

      const fileName =
        detailedOrders.length ===
        1
          ? `shipdrop-label-${getAWB(
              detailedOrders[0],
            )}.pdf`
          : `shipdrop-labels-${new Date()
              .toISOString()
              .slice(
                0,
                10,
              )}.pdf`;

      /* ---------------------------------------------
         SAVE PDF
      --------------------------------------------- */

      pdf.save(
        fileName,
      );

      toast.success(
        `${detailedOrders.length} ${
          detailedOrders.length ===
          1
            ? "label"
            : "labels"
        } downloaded`,
      );
    } catch (error) {
      console.error(
        "Download label error:",
        error,
      );

      toast.error(
        error?.message ||
          "Unable to download labels",
      );

      throw error;
    } finally {
      if (
        renderContainer &&
        renderContainer.parentNode
      ) {
        renderContainer.remove();
      }
    }
  };

/* =========================================================
   EXPORT
========================================================= */

export {
  DEFAULT_LABEL_SETTINGS,
};