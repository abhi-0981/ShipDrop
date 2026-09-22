import React, { useEffect, useMemo, useRef } from "react";
import JsBarcode from "jsbarcode";

import shipdropLogo from "../assets/images/shipdrop-logo.png";
import delhiveryLogo from "../assets/images/delhivery-logo.png";

/* =========================================================
   COMMON HELPERS
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

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

const isEnabled = (settings, camelKey, snakeKey) => {
  const value =
    settings?.[camelKey] ??
    settings?.[snakeKey];

  // Undefined means ON by default
  if (value === undefined || value === null) {
    return true;
  }

  return !(
    value === false ||
    value === 0 ||
    value === "0" ||
    String(value).toLowerCase() === "false"
  );
};

/* =========================================================
   ORDER DATA
========================================================= */

const getAWB = (order) =>
  text(
    firstValue(
      order?.awb,
      order?.waybill,
      order?.awb_number,
      order?.tracking_number
    ),
    "AWB"
  );

const getOrderId = (order) =>
  text(
    firstValue(
      order?.display_order_id,
      order?.order_id,
      order?.orderId,
      order?.order_number,
      order?.id
    ),
    "—"
  );

const getCustomerName = (order) =>
  text(
    firstValue(
      order?.consignee_name,
      order?.customer_name,
      order?.customer,
      order?.buyer_name,
      order?.name
    ),
    "Customer"
  );

const getCustomerMobile = (order) =>
  text(
    firstValue(
      order?.mobile,
      order?.phone,
      order?.customer_mobile,
      order?.consignee_phone,
      order?.buyer_mobile
    ),
    ""
  );

const getPayment = (order) => {
  const value = String(
    firstValue(
      order?.payment_type,
      order?.paymentType,
      order?.payment_method,
      "PREPAID"
    )
  )
    .trim()
    .toUpperCase();

  return value === "COD" ? "COD" : "PREPAID";
};

/* =========================================================
   WEIGHT
========================================================= */

const getWeight = (order) => {
  const packageWeight =
    Array.isArray(order?.packages) &&
    order.packages.length
      ? order.packages.reduce(
          (total, pkg) =>
            total +
            (Number(pkg?.weight) || 0) *
              (Number(pkg?.package_count) || 1),
          0
        )
      : 0;

  return (
    Number(
      firstValue(
        order?.total_weight,
        order?.weight,
        order?.package_weight,
        packageWeight
      )
    ) || 0
  );
};

/* =========================================================
   COD / ORDER VALUE
========================================================= */

const getProducts = (order) => {
  if (
    Array.isArray(order?.products) &&
    order.products.length
  ) {
    return order.products;
  }

  return [
    {
      product_name:
        firstValue(
          order?.product_name,
          order?.shipment,
          order?.item_name
        ) || "Product",

      quantity:
        Number(
          firstValue(
            order?.quantity,
            order?.qty,
            1
          )
        ) || 1,

      rate:
        Number(
          firstValue(
            order?.product_rate,
            order?.rate,
            order?.price,
            order?.product_value,
            order?.order_value,
            order?.total_amount,
            0
          )
        ) || 0,
    },
  ];
};

const getProductRow = (product) => {
  const name = text(
    firstValue(
      product?.product_name,
      product?.name,
      product?.product,
      product?.item_name
    ),
    "Product"
  );

  const quantity =
    Number(
      firstValue(
        product?.quantity,
        product?.qty,
        product?.product_quantity,
        1
      )
    ) || 1;

  const rate =
    Number(
      firstValue(
        product?.rate,
        product?.price,
        product?.unit_price,
        product?.product_rate,
        product?.selling_price,
        0
      )
    ) || 0;

  const total =
    Number(
      firstValue(
        product?.total,
        product?.product_total,
        product?.line_total,
        product?.total_price
      )
    ) || rate * quantity;

  return {
    name,
    quantity,
    rate,
    total,
  };
};

const getCodAmount = (order, products) => {
  const directAmount = Number(
    firstValue(
      order?.cod_amount,
      order?.codAmount
    )
  );

  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount;
  }

  const orderAmount = Number(
    firstValue(
      order?.total_amount,
      order?.order_value,
      order?.total_value,
      order?.amount
    )
  );

  if (Number.isFinite(orderAmount) && orderAmount > 0) {
    return orderAmount;
  }

  return products.reduce(
    (total, product) =>
      total +
      Number(product.total || 0),
    0
  );
};

const formatAmount = (value) => {
  const number = Number(value) || 0;

  return number
    .toFixed(2)
    .replace(/\.00$/, "");
};

/* =========================================================
   FROM / TO
========================================================= */

const getFromName = (order, sellerProfile) =>
  text(
    firstValue(
      order?.pickup_name,
      order?.pickup_contact_name,
      order?.warehouse?.contact_name,
      order?.warehouse_contact_name,
      order?.warehouse_name,
      order?.shipper_name,
      sellerProfile?.pickup_name,
      sellerProfile?.contact_name,
      sellerProfile?.name
    ),
    "Pickup"
  );

const getFromAddress = (order) => {
  const warehouse = order?.warehouse || {};

  const parts = [
    warehouse?.address_line1,
    warehouse?.address_line2,
    warehouse?.floor_no,
    warehouse?.landmark,
    warehouse?.city,
    warehouse?.state,
    warehouse?.pincode,
    warehouse?.country || "India",

    order?.pickup_address,
    order?.pickup_address_line1,
    order?.pickup_address_line2,
    order?.pickup_landmark,
    order?.pickup_city,
    order?.pickup_state,
    order?.pickup_pincode,
    order?.pickup_country,
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "—";
};

const getToAddress = (order) => {
  const parts = [
    firstValue(
      order?.address_line1,
      order?.buyer_address1,
      order?.consignee_address1,
      order?.address,
      order?.delivery_address
    ),

    firstValue(
      order?.address_line2,
      order?.buyer_address2,
      order?.consignee_address2
    ),

    firstValue(
      order?.landmark,
      order?.buyer_landmark,
      order?.consignee_landmark
    ),

    firstValue(
      order?.city,
      order?.delivery_city,
      order?.buyer_city
    ),

    firstValue(
      order?.state,
      order?.delivery_state,
      order?.buyer_state
    ),

    firstValue(
      order?.pincode,
      order?.delivery_pincode,
      order?.buyer_pincode
    ),

    firstValue(
      order?.country,
      order?.buyer_country,
      "India"
    ),
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "—";
};

/* =========================================================
   SELLER
========================================================= */

const getSellerName = (
  order,
  sellerProfile
) =>
  text(
    firstValue(
      sellerProfile?.name,
      sellerProfile?.full_name,
      sellerProfile?.seller_name,
      sellerProfile?.company_name,
      sellerProfile?.business_name,
      order?.seller_name,
      order?.seller_full_name,
      order?.seller_company_name
    ),
    "Seller"
  );

const getSellerGstin = (
  order,
  sellerProfile
) =>
  text(
    firstValue(
      sellerProfile?.gstin,
      sellerProfile?.gst_no,
      sellerProfile?.gst_number,
      sellerProfile?.GSTIN,
      order?.seller_gstin,
      order?.seller_gst,
      order?.gstin
    ),
    ""
  );

const getInvoiceNumber = (order) =>
  text(
    firstValue(
      order?.invoice_number,
      order?.invoice_no,
      order?.invoiceNumber
    ),
    ""
  );

const getLabelDate = (order) => {
  const value = firstValue(
    order?.invoice_date,
    order?.invoiceDate,
    order?.created_at,
    order?.createdAt,
    order?.manifest_created_at,
    order?.manifestCreatedAt
  );

  if (!value) {
    return new Date().toLocaleDateString(
      "en-GB"
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

/* =========================================================
   RETURN ADDRESS
========================================================= */

const getReturnName = (
  order,
  sellerProfile
) =>
  text(
    firstValue(
      order?.return_name,
      order?.return_address_name,
      sellerProfile?.name,
      sellerProfile?.full_name,
      sellerProfile?.seller_name,
      sellerProfile?.company_name
    ),
    ""
  );

const getReturnPhone = (
  order,
  sellerProfile
) =>
  text(
    firstValue(
      order?.return_phone,
      order?.return_mobile,
      sellerProfile?.mobile,
      sellerProfile?.phone
    ),
    ""
  );

const getReturnAddress = (order) => {
  const parts = [
    order?.return_address_line1,
    order?.return_address_line2,
    order?.return_landmark,
    order?.return_city,
    order?.return_state,
    order?.return_pincode,
    order?.return_country || "India",
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "—";
};

/* =========================================================
   LOGO
========================================================= */

const getRightLogo = (
  settings,
  customLogo
) => {
  const value =
    customLogo?.dataUrl ||
    customLogo?.preview ||
    customLogo ||
    settings?.customLogo ||
    settings?.custom_logo;

  return value || delhiveryLogo;
};

/* =========================================================
   COMPONENT
========================================================= */

function ShippingLabel({
  order = {},
  sellerProfile = {},
  settings = {},
  customLogo = null,
}) {
  const barcodeRef = useRef(null);

  const awb = getAWB(order);
  const payment = getPayment(order);
  const weight = getWeight(order);

  const shipperName = getFromName(
    order,
    sellerProfile
  );

  const shipperAddress =
    getFromAddress(order);

  const customerName =
    getCustomerName(order);

  const customerMobile =
    getCustomerMobile(order);

  const customerAddress =
    getToAddress(order);

  const sellerName = getSellerName(
    order,
    sellerProfile
  );

  const sellerGstin = getSellerGstin(
    order,
    sellerProfile
  );

  const invoiceNumber =
    getInvoiceNumber(order);

  const labelDate =
    getLabelDate(order);

  const returnName = getReturnName(
    order,
    sellerProfile
  );

  const returnPhone = getReturnPhone(
    order,
    sellerProfile
  );

  const returnAddress =
    getReturnAddress(order);

  const products = useMemo(
    () =>
      getProducts(order).map(
        getProductRow
      ),
    [order]
  );

  const rightLogo = getRightLogo(
    settings,
    customLogo
  );

  /* =======================================================
     SETTINGS
  ======================================================= */

  const showOrderValue = isEnabled(
    settings,
    "orderValue",
    "order_value"
  );

  const showCodAmount = isEnabled(
    settings,
    "codAmount",
    "cod_amount"
  );

  const showBuyerMobile = isEnabled(
    settings,
    "buyerMobile",
    "buyer_mobile"
  );

  const showShipperAddress = isEnabled(
    settings,
    "shipperAddress",
    "shipper_address"
  );

  const showProductName = isEnabled(
    settings,
    "productName",
    "product_name"
  );

  const showServicesTnc = isEnabled(
    settings,
    "servicesTnc",
    "services_tnc"
  );

  const showOrderId = isEnabled(
    settings,
    "orderId",
    "order_id"
  );

  const showOrderWeight = isEnabled(
    settings,
    "orderWeight",
    "order_weight"
  );

  const codAmount = getCodAmount(
    order,
    products
  );

  /* =======================================================
     BARCODE
  ======================================================= */

  useEffect(() => {
    if (!barcodeRef.current) {
      return;
    }

    barcodeRef.current.innerHTML = "";

    const barcodeValue =
      awb &&
      awb !== "AWB" &&
      awb !== "AWB unavailable"
        ? awb
        : "000000000000";

    try {
      JsBarcode(
        barcodeRef.current,
        String(barcodeValue),
        {
          format: "CODE128",
          width: 2,
          height: 54,
          displayValue: false,
          margin: 8,
          marginTop: 4,
          marginBottom: 4,
          marginLeft: 10,
          marginRight: 10,
        }
      );
    } catch (error) {
      console.error(
        "Barcode generation error:",
        error
      );
    }
  }, [awb]);

  /* =======================================================
     PAYMENT BOX CONTENT

     Priority:
     COD amount ON + COD order
       => COD - 1390

     Otherwise:
     Order value ON
       => COD / PREPAID

     Both OFF
       => blank
  ======================================================= */

  const paymentDisplay =
    payment === "COD" &&
    showCodAmount
      ? `COD - ${formatAmount(
          codAmount
        )}`
      : showOrderValue
      ? payment === "COD"
        ? "COD"
        : "Prepaid"
      : "";

  return (
    <div
      className="
        shipping-label
        box-border
        mx-auto
        w-[400px]
        min-h-[600px]
        overflow-hidden
        border-2
        border-black
        bg-white
        font-sans
        text-black
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          flex
          h-[58px]
          items-center
          justify-between
          border-b-2
          border-black
          px-3
        "
      >
        {/* FIXED SHIPDROP LOGO */}

        <div
          className="
            flex
            h-[40px]
            w-[48%]
            items-center
            justify-start
          "
        >
          <img
            src={shipdropLogo}
            alt="ShipDrop"
            className="
              max-h-[38px]
              max-w-[155px]
              object-contain
            "
          />
        </div>

        {/* CHANGEABLE DELHIVERY LOGO */}

        <div
          className="
            flex
            h-[40px]
            w-[48%]
            items-center
            justify-end
          "
        >
          <img
            src={rightLogo}
            alt="Delhivery"
            className="
              max-h-[38px]
              max-w-[145px]
              object-contain
            "
          />
        </div>
      </div>

      {/* =================================================
          FROM / TO
      ================================================= */}

      <div
        className={
          showShipperAddress
            ? "grid grid-cols-2 border-b-2 border-black"
            : "border-b-2 border-black"
        }
      >
        {/* FROM */}

        {showShipperAddress && (
          <div
            className="
              min-h-[128px]
              border-r-2
              border-black
              px-3
              py-2.5
            "
          >
            <div
              className="
                text-[12px]
                font-bold
                uppercase
                leading-4
              "
            >
              From
            </div>

            <div
              className="
                mt-1
                text-[16px]
                font-bold
                leading-5
              "
            >
              {shipperName}
            </div>

            <div
              className="
                mt-1
                break-words
                text-[12px]
                font-medium
                leading-[16px]
              "
            >
              {shipperAddress}
            </div>
          </div>
        )}

        {/* TO */}

        <div
          className={`
            min-h-[128px]
            px-3
            py-2.5
            ${
              showShipperAddress
                ? ""
                : "w-full"
            }
          `}
        >
          <div
            className="
              text-[12px]
              font-bold
              uppercase
              leading-4
            "
          >
            To
          </div>

          <div
            className="
              mt-1
              text-[16px]
              font-bold
              leading-5
            "
          >
            {customerName}
          </div>

          {/* BUYER MOBILE */}

          {showBuyerMobile &&
            customerMobile && (
              <div
                className="
                  mt-1
                  text-[12px]
                  font-bold
                  leading-4
                "
              >
                Mobile No:{" "}
                {customerMobile}
              </div>
            )}

          <div
            className="
              mt-1
              break-words
              text-[12px]
              font-medium
              leading-[16px]
            "
          >
            {customerAddress}
          </div>
        </div>
      </div>

      {/* =================================================
          AWB
      ================================================= */}

      <div
        className="
          border-b-2
          border-black
          px-3
          py-2
          text-center
        "
      >
        <div
          className="
            flex
            min-h-[28px]
            items-center
            justify-center
            gap-[7px]
            whitespace-nowrap
          "
        >
          <span
            className="
              text-[12px]
              font-bold
              leading-5
            "
          >
            AWB No:
          </span>

          <span
            className="
              text-[20px]
              font-extrabold
              leading-6
              tracking-[0.6px]
            "
          >
            {awb}
          </span>
        </div>

        <div
          className="
            mt-1
            flex
            w-full
            items-center
            justify-center
            overflow-hidden
          "
        >
          <svg
            ref={barcodeRef}
            className="
              block
              h-[58px]
              max-w-full
            "
          />
        </div>
      </div>

      {/* =================================================
          PAYMENT / ORDER / WEIGHT

          Boxes always remain.

          Content disappears according to settings.
      ================================================= */}

      <div
        className="
          grid
          grid-cols-3
          border-b-2
          border-black
        "
      >
        {/* PAYMENT */}

        <div
          className="
            flex
            min-h-[46px]
            items-center
            border-r-2
            border-black
            px-2.5
            py-1.5
          "
        >
          {paymentDisplay && (
            <div
              className="
                text-[12px]
                font-bold
                leading-4
              "
            >
              {paymentDisplay}
            </div>
          )}
        </div>

        {/* ORDER ID */}

        <div
          className="
            min-h-[46px]
            border-r-2
            border-black
            px-2.5
            py-1.5
          "
        >
          {showOrderId && (
            <>
              <div
                className="
                  text-[11px]
                  font-bold
                  leading-4
                "
              >
                Order:
              </div>

              <div
                className="
                  text-[14px]
                  font-bold
                  leading-4
                "
              >
                #{getOrderId(order)}
              </div>
            </>
          )}
        </div>

        {/* WEIGHT */}

        <div
          className="
            min-h-[46px]
            px-2.5
            py-1.5
          "
        >
          {showOrderWeight && (
            <>
              <div
                className="
                  text-[11px]
                  font-bold
                  leading-4
                "
              >
                Billed Weight:
              </div>

              <div
                className="
                  text-[14px]
                  font-bold
                  leading-4
                "
              >
                {weight.toFixed(2)}Kg
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================
          SELLER / GSTIN / INVOICE
      ================================================= */}

      <div
        className="
          border-b-2
          border-black
        "
      >
        <div
          className="
            grid
            grid-cols-4
            border-b
            border-black
          "
        >
          <div
            className="
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-bold
            "
          >
            Seller
          </div>

          <div
            className="
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-bold
            "
          >
            GSTIN
          </div>

          <div
            className="
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-bold
            "
          >
            Invoice No
          </div>

          <div
            className="
              px-2
              py-1
              text-[11px]
              font-bold
            "
          >
            Date
          </div>
        </div>

        <div
          className="
            grid
            min-h-[42px]
            grid-cols-4
          "
        >
          <div
            className="
              break-words
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-semibold
              leading-[14px]
            "
          >
            {sellerName}
          </div>

          <div
            className="
              break-words
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-semibold
              leading-[14px]
            "
          >
            {sellerGstin || "—"}
          </div>

          <div
            className="
              break-words
              border-r
              border-black
              px-2
              py-1
              text-[11px]
              font-semibold
              leading-[14px]
            "
          >
            {invoiceNumber || "—"}
          </div>

          <div
            className="
              px-2
              py-1
              text-[11px]
              font-semibold
              leading-[14px]
            "
          >
            {labelDate}
          </div>
        </div>
      </div>

      {/* =================================================
          PRODUCT TABLE

          OFF => COMPLETE SECTION DISAPPEARS
      ================================================= */}

      {showProductName && (
        <div
          className="
            border-b-2
            border-black
          "
        >
          <div
            className="
              grid
              grid-cols-[1.7fr_0.8fr_0.55fr_0.9fr]
              border-b
              border-black
            "
          >
            <div
              className="
                border-r
                border-black
                px-2
                py-1
                text-[11px]
                font-bold
              "
            >
              Product Name
            </div>

            <div
              className="
                border-r
                border-black
                px-2
                py-1
                text-right
                text-[11px]
                font-bold
              "
            >
              Rate
            </div>

            <div
              className="
                border-r
                border-black
                px-2
                py-1
                text-center
                text-[11px]
                font-bold
              "
            >
              Qty
            </div>

            <div
              className="
                px-2
                py-1
                text-right
                text-[11px]
                font-bold
              "
            >
              Total
            </div>
          </div>

          {products.map(
            (product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="
                  grid
                  grid-cols-[1.7fr_0.8fr_0.55fr_0.9fr]
                "
              >
                <div
                  className="
                    break-words
                    border-r
                    border-black
                    px-2
                    py-1
                    text-[11px]
                    font-semibold
                    leading-[14px]
                  "
                >
                  {product.name}
                </div>

                <div
                  className="
                    border-r
                    border-black
                    px-2
                    py-1
                    text-right
                    text-[11px]
                    font-semibold
                  "
                >
                  {formatAmount(
                    product.rate
                  )}
                </div>

                <div
                  className="
                    border-r
                    border-black
                    px-2
                    py-1
                    text-center
                    text-[11px]
                    font-semibold
                  "
                >
                  {product.quantity}
                </div>

                <div
                  className="
                    px-2
                    py-1
                    text-right
                    text-[11px]
                    font-semibold
                  "
                >
                  {formatAmount(
                    product.total
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* =================================================
          SERVICES T&C

          OFF => COMPLETE SECTION DISAPPEARS
      ================================================= */}

      {showServicesTnc && (
        <div
          className="
            border-b-2
            border-black
            px-2.5
            py-2
          "
        >
          <div
            className="
              text-[10.5px]
              font-bold
              leading-[13px]
            "
          >
            NOTE: If undelivered
            return to:
          </div>

          {returnName && (
            <div
              className="
                text-[10.5px]
                font-semibold
                leading-[13px]
              "
            >
              {returnName}
            </div>
          )}

          <div
            className="
              break-words
              text-[10.5px]
              font-semibold
              leading-[13px]
            "
          >
            {returnAddress}

            {returnPhone
              ? ` Mobile: ${returnPhone}`
              : ""}
          </div>

          <div
            className="
              mt-0.5
              text-[10.5px]
              font-semibold
              leading-[13px]
            "
          >
            For complaints &amp;
            queries please contact{" "}
            <span className="font-bold">
              8766066070,
              0141-4797120
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShippingLabel;