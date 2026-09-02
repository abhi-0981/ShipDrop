const db = require("../config/db");
const axios = require("axios");

const {
  calculateShippingRate,
} = require("./rateService");

const query = (
  sql,
  params = []
) => {
  return new Promise(
    (resolve, reject) => {
      db.query(
        sql,
        params,
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    }
  );
};

const getConnection = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

const beginTransaction = async () => {
  const connection = await getConnection();

  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return connection;
  } catch (error) {
    connection.release();
    throw error;
  }
};

const txQuery = (connection, sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const commitTransaction = (connection) => {
  return new Promise((resolve, reject) => {
    connection.commit((err) => {
      if (err) {
        reject(err);
        return;
      }

      connection.release();
      resolve();
    });
  });
};

const rollbackTransaction = (connection) => {
  return new Promise((resolve) => {
    if (!connection) {
      resolve();
      return;
    }

    connection.rollback(() => {
      connection.release();
      resolve();
    });
  });
};

const SUPPORTED_SERVICES = [
  "ROAD",
  "AIR",
];

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";

const createDelhiveryShipment = async (
  shipments
) => {

  if (
    !DELHIVERY_API_TOKEN
  ) {
    throw new Error(
      "Delhivery API token is not configured"
    );
  }

  if (
    !Array.isArray(shipments) ||
    shipments.length === 0
  ) {
    throw new Error(
      "No shipment data supplied to Delhivery"
    );
  }

  const url =
    `${DELHIVERY_API_BASE_URL}` +
    `/api/cmu/create.json`;

  const payload = {
    format:
      "json",

    data:
      JSON.stringify({
        shipments:
          shipments,
      }),
  };

  console.log(
    "========== DELHIVERY SHIPMENT REQUEST =========="
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "Payload:",
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  console.log(
    "================================================"
  );

  try {

    const response =
      await axios.post(
        url,

        new URLSearchParams(
          payload
        ).toString(),

        {
          headers: {
            Authorization:
              `Token ${DELHIVERY_API_TOKEN}`,

            "Content-Type":
              "application/x-www-form-urlencoded",

            Accept:
              "application/json",
          },

          timeout:
            30000,
        }
      );

    const data =
      response.data;

    console.log(
      "========== DELHIVERY SHIPMENT RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    console.log(
      "=================================================="
    );

    if (
      !data
    ) {
      throw new Error(
        "Empty response received from Delhivery"
      );
    }

    const packageError =
      Array.isArray(
        data.packages
      )
        ? data.packages
            .filter(
              (pkg) =>
                String(
                  pkg.status ||
                  ""
                )
                  .toLowerCase() !==
                "success"
            )
            .map(
              (pkg) =>
                Array.isArray(
                  pkg.remarks
                )
                  ? pkg.remarks.join(
                      ", "
                    )
                  : pkg.remarks ||
                    "Shipment creation failed"
            )
            .join(
              "; "
            )
        : "";

    if (
      data.success === false ||
      (
        Array.isArray(
          data.packages
        ) &&
        data.packages.length > 0 &&
        data.packages.every(
          (pkg) =>
            String(
              pkg.status ||
              ""
            ).toLowerCase() !==
            "success"
        )
      )
    ) {

      const duplicatePackage =
        Array.isArray(data.packages)
          ? data.packages.find((pkg) => {

              const remarks =
                Array.isArray(pkg.remarks)
                  ? pkg.remarks.join(", ")
                  : String(
                      pkg.remarks ||
                      ""
                    );

              return (
                remarks
                  .toLowerCase()
                  .includes(
                    "duplicate order id"
                  ) &&
                String(
                  pkg.waybill ||
                  ""
                ).trim()
              );

            })
          : null;

      if (
        duplicatePackage
      ) {

        console.log(
          "⚠️ Delhivery duplicate order recovered with existing AWB:",
          duplicatePackage.waybill
        );

        return {

          ...data,

          success:
            true,

          packages:
            data.packages.map(
              (pkg) =>
                pkg ===
                duplicatePackage
                  ? {
                      ...pkg,
                      status:
                        "Success",
                    }
                  : pkg
            ),

          recovered_duplicate:
            true,
        };
      }

      throw new Error(

        packageError ||

        data.rmk ||

        data.message ||

        "Delhivery shipment creation failed"

      );
    }

    return data;

  } catch (error) {

    console.log(
      "================================================"
    );

    console.log(
      "DELHIVERY API ERROR"
    );

    console.log(
      "Status:",
      error.response?.status
    );

    console.log(
      "Response:",
      error.response?.data
    );

    console.log(
      "Message:",
      error.message
    );

    console.log(
      "================================================"
    );

    if (
      error.response?.data
    ) {

      const apiData =
        error.response.data;

      const packageError =
        Array.isArray(
          apiData.packages
        )
          ? apiData.packages
              .filter(
                (pkg) =>
                  String(
                    pkg.status ||
                    ""
                  )
                    .toLowerCase() !==
                  "success"
              )
              .map(
                (pkg) =>
                  Array.isArray(
                    pkg.remarks
                  )
                    ? pkg.remarks.join(
                        ", "
                      )
                    : pkg.remarks ||
                      "Shipment creation failed"
              )
              .join(
                "; "
              )
          : "";

      throw new Error(

        packageError ||

        apiData.rmk ||

        apiData.message ||

        apiData.error ||

        "Delhivery shipment creation failed"

      );
    }

    throw new Error(
      error.message ||
      "Unable to connect to Delhivery"
    );
  }
};

const getWarehouseForOrder = async (
  warehouseId,
  userId
) => {

  if (!warehouseId) {
    throw new Error(
      "Pickup warehouse is not selected for this order"
    );
  }

  const rows =
    await query(
      `
        SELECT
          id,
          user_id,
          warehouse_name,
          contact_name,
          phone,
          email,
          gstin,
          address_line1,
          address_line2,
          floor_no,
          landmark,
          pincode,
          city,
          state,
          country,
          delhivery_registered,
          status
        FROM warehouses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [
        warehouseId,
        userId,
      ]
    );

  if (
    rows.length === 0
  ) {
    throw new Error(
      "Selected pickup warehouse not found"
    );
  }

  const warehouse =
    rows[0];

  if (
    String(
      warehouse.status ||
      ""
    ).toUpperCase() !==
    "ACTIVE"
  ) {
    throw new Error(
      "Selected pickup warehouse is inactive"
    );
  }

  if (
    Number(
      warehouse.delhivery_registered
    ) !== 1
  ) {
    throw new Error(
      "Selected pickup warehouse is not registered with Delhivery"
    );
  }

  if (
    !warehouse.warehouse_name ||
    !String(
      warehouse.warehouse_name
    ).trim()
  ) {
    throw new Error(
      "Warehouse name is missing"
    );
  }

  return warehouse;
};

const buildDelhiveryShipment = ({
  order,
  products,
  packages,
  warehouse,
  delhiveryOrderId,
  service_type,
}) => {

  const totalQuantity =
    products.reduce(
      (
        total,
        product
      ) => {

        return (
          total +
          (
            Number(
              product.qty
            ) || 1
          )
        );

      },
      0
    );

  const totalAmount =
    products.reduce(
      (
        total,
        product
      ) => {

        const price =
          Number(
            product.price
          ) || 0;

        const qty =
          Number(
            product.qty
          ) || 1;

        return (
          total +
          price * qty
        );

      },
      0
    );

  const totalWeight =
    packages.reduce(
      (
        total,
        packageData
      ) => {

        const weight =
          Number(
            packageData.weight
          ) || 0;

        const count =
          Number(
            packageData.package_count
          ) || 1;

        return (
          total +
          weight * count
        );

      },
      0
    );

  if (
    totalWeight <= 0
  ) {
    throw new Error(
      `Invalid package weight for Order #${order.id}`
    );
  }

  const paymentMode =
    String(
      order.payment_type ||
      "Prepaid"
    )
      .trim()
      .toLowerCase() ===
    "cod"
      ? "COD"
      : "Prepaid";

  const codAmount =
    paymentMode === "COD"
      ? totalAmount
      : 0;

  const shipment = {

  name:
    order.consignee_name,

  order:
    String(
      delhiveryOrderId ||
      `SD-${order.id}-${order.order_id}`
    ),

  shipping_mode:
    String(service_type || "ROAD")
      .trim()
      .toUpperCase() === "AIR"
      ? "Express"
      : "Surface",

  phone:
    order.mobile,

    add:
      [
        order.address_line1,

        order.address_line2,

        order.floor_no
          ? `Floor ${order.floor_no}`
          : null,

        order.landmark
          ? `Landmark: ${order.landmark}`
          : null,

      ]
        .filter(Boolean)
        .join(", "),

    pin:
      Number(
        order.pincode
      ),

    city:
      order.city,

    state:
      order.state,

    country:
      order.country ||
      "India",

    products_desc:
      products
        .map(
          (product) =>
            product.product_name
        )
        .filter(Boolean)
        .join(", ") ||
      "Shipment",

    quantity:
      String(
        totalQuantity
      ),

    payment_mode:
      paymentMode,

    total_amount:
      Number(
        totalAmount.toFixed(2)
      ),

    weight:
      Number(
        totalWeight
      ),

    pickup_location: {

      name:
        warehouse.warehouse_name,

    },

  };

  if (
    paymentMode === "COD"
  ) {

    shipment.cod_amount =
      Number(
        codAmount.toFixed(2)
      );

  }

  return shipment;
};

const getOrderProducts = async (
  orderId
) => {

  return await query(
    `
      SELECT
        product_name,
        sku,
        price,
        qty,
        tax
      FROM order_products
      WHERE order_id = ?
    `,
    [
      orderId,
    ]
  );
};

const getOrderPackages = async (
  orderId
) => {

  return await query(
    `
      SELECT
        length,
        width,
        height,
        weight,
        package_count
      FROM order_packages
      WHERE order_id = ?
    `,
    [
      orderId,
    ]
  );
};

const getAwbFromDelhiveryResponse = (
  response,
  referenceOrderId
) => {

  if (
    !response ||
    !Array.isArray(
      response.packages
    )
  ) {

    throw new Error(
      "Invalid response received from Delhivery"
    );

  }

  const successfulPackage =
    response.packages.find(
      (pkg) =>
        String(
          pkg.status ||
          ""
        ).toLowerCase() ===
        "success" &&

        (
          !referenceOrderId ||

          String(
            pkg.refnum ||
            ""
          ) ===

          String(
            referenceOrderId
          )
        )
    );

  if (
    !successfulPackage
  ) {

    const failedPackage =
      response.packages.find(
        (pkg) =>
          String(
            pkg.status ||
            ""
          ).toLowerCase() !==
          "success"
      );

    const remarks =
      Array.isArray(
        failedPackage?.remarks
      )
        ? failedPackage.remarks.join(
            ", "
          )
        : failedPackage?.remarks;

    throw new Error(
      remarks ||
      "Delhivery did not generate an AWB"
    );
  }

  const awb =
    String(
      successfulPackage.waybill ||
      ""
    ).trim();

  if (
    !awb
  ) {

    throw new Error(
      "Delhivery shipment created but AWB was not returned"
    );

  }

  return awb;
};

const confirmShipment = async ({
  user_id,
  pickup_address,
  pickup_pincode,
  orderData,
  products,
  packages,
  shipping_charge,
  zone,
  distance_km,
  service_type = "ROAD",
  warehouse_id,
}) => {

  const charge =
    Number(
      shipping_charge
    );

  const normalizedServiceType =
    String(
      service_type ||
      "ROAD"
    )
      .trim()
      .toUpperCase();

  if (
    !SUPPORTED_SERVICES.includes(
      normalizedServiceType
    )
  ) {

    throw new Error(
      "Invalid service type"
    );

  }

  if (
    !Number.isFinite(
      charge
    ) ||
    charge <= 0
  ) {

    throw new Error(
      "Invalid shipping charge"
    );

  }

  if (
    !user_id
  ) {

    throw new Error(
      "User ID is required"
    );

  }

  if (
    !orderData ||
    (
      !orderData.id &&
      !orderData.order_id &&
      !orderData.orderId
    )
  ) {

    throw new Error(
      "Order data is required"
    );

  }

  if (
    !Array.isArray(
      products
    ) ||
    products.length === 0
  ) {

    throw new Error(
      "At least one product is required"
    );

  }

  if (
    !Array.isArray(
      packages
    ) ||
    packages.length === 0
  ) {

    throw new Error(
      "At least one package is required"
    );

  }

  if (
    !warehouse_id
  ) {

    throw new Error(
      "Pickup warehouse is required"
    );

  }

  const requestedOrderId =
    orderData.id ||
    orderData.order_id ||
    orderData.orderId;

  const requestedOrderNumber =
    orderData.order_id ||
    orderData.orderId ||
    orderData.id;

  console.log(
    "=============================================="
  );

  console.log(
    "CONFIRM SHIPMENT"
  );

  console.log(
    "User ID:",
    user_id
  );

  console.log(
    "Requested Order ID:",
    requestedOrderId
  );

  console.log(
    "Requested Order Number:",
    requestedOrderNumber
  );

  console.log(
    "Warehouse ID:",
    warehouse_id
  );

  console.log(
    "Service:",
    normalizedServiceType
  );

  console.log(
    "Charge:",
    charge
  );

  console.log(
    "=============================================="
  );

  const connection =
    await beginTransaction();

  try {

    const orderRows =
      await txQuery(
        connection,

        `
          SELECT
            id,
            order_id,
            user_id,
            warehouse_id,
            status,
            awb
          FROM orders
          WHERE
            user_id = ?
            AND (
              id = ?
              OR order_id = ?
            )
          LIMIT 1
          FOR UPDATE
        `,

        [
          user_id,

          requestedOrderId,

          String(
            requestedOrderNumber
          ),
        ]
      );

    if (
      orderRows.length === 0
    ) {

      console.log(
        "❌ ORDER NOT FOUND"
      );

      console.log(
        "User:",
        user_id
      );

      console.log(
        "Requested ID:",
        requestedOrderId
      );

      console.log(
        "Requested Order Number:",
        requestedOrderNumber
      );

      throw new Error(
        "Order not found"
      );
    }

    const lockedOrder =
      orderRows[0];

    console.log(
      "========== LOCKED ORDER =========="
    );

    console.log(
      lockedOrder
    );

    console.log(
      "=================================="
    );

    if (
      lockedOrder.awb &&
      String(
        lockedOrder.awb
      ).trim()
    ) {

      const existingAwb =
        String(
          lockedOrder.awb
        ).trim();

      console.log(
        "⚠️ ORDER ALREADY HAS AWB:",
        existingAwb
      );

      await rollbackTransaction(
        connection
      );

      return {

        success:
          true,

        message:
          "Shipment already manifested",

        order_id:
          lockedOrder.order_id,

        awb:
          existingAwb,

        shipping_charge:
          charge,

        zone,

        distance_km:
          Number(
            distance_km
          ) || 0,

        service_type:
          normalizedServiceType,

        already_manifest:
          true,

      };
    }

    const currentStatus =
      String(
        lockedOrder.status ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      currentStatus !==
      "PROCESSING"
    ) {

      throw new Error(
        `Order #${lockedOrder.order_id} is already ${
          lockedOrder.status ||
          "not processable"
        }`
      );

    }

    if (
      Number(
        lockedOrder.warehouse_id
      ) !==
      Number(
        warehouse_id
      )
    ) {

      throw new Error(
        "Selected warehouse does not belong to this order"
      );

    }

    const warehouse =
      await getWarehouseForOrder(
        warehouse_id,
        user_id
      );

    if (
      !warehouse
    ) {

      throw new Error(
        "Pickup warehouse not found"
      );

    }

    await txQuery(
      connection,

      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES
        (
          ?,
          0.00
        )
        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,

      [
        user_id
      ]
    );

    const walletRows =
      await txQuery(
        connection,

        `
          SELECT
            id,
            user_id,
            balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,

        [
          user_id
        ]
      );

    if (
      walletRows.length === 0
    ) {

      throw new Error(
        "Wallet not found"
      );

    }

    const currentBalance =
      Number(
        walletRows[0].balance
      );

    console.log(
      "Wallet balance:",
      currentBalance
    );

    console.log(
      "Shipping charge:",
      charge
    );

    if (
      currentBalance <
      charge
    ) {

      throw new Error(
        `Insufficient wallet balance. Available ₹${currentBalance.toFixed(
          2
        )}, required ₹${charge.toFixed(
          2
        )}`
      );

    }

    const delhiveryOrderId =
      `SD-${lockedOrder.id}-${lockedOrder.order_id}`;

    console.log(
      "Delhivery Order ID:",
      delhiveryOrderId
    );

    const shipment =
      buildDelhiveryShipment({

        order: {

          ...lockedOrder,

          ...orderData,

          order_id:
            lockedOrder.order_id,

        },

        products,

        packages,

        warehouse,

        delhiveryOrderId,

        service_type:
          normalizedServiceType,

      });

    console.log(
      "========== FINAL DELHIVERY SHIPMENT =========="
    );

    console.log(
      JSON.stringify(
        shipment,
        null,
        2
      )
    );

    console.log(
      "=============================================="
    );

    const delhiveryResponse =
      await createDelhiveryShipment(
        [
          shipment
        ]
      );

    console.log(
      "========== DELHIVERY RESPONSE =========="
    );

    console.log(
      JSON.stringify(
        delhiveryResponse,
        null,
        2
      )
    );

    console.log(
      "========================================="
    );

    const awb =
      getAwbFromDelhiveryResponse(
        delhiveryResponse,
        shipment.order
      );

    if (
      !awb ||
      !String(
        awb
      ).trim()
    ) {

      throw new Error(
        "Delhivery did not return an AWB"
      );

    }

    console.log(
      "✅ DELHIVERY AWB:",
      awb
    );

    const awbUpdate =
      await txQuery(
        connection,

        `
          UPDATE orders
          SET
            awb = ?
          WHERE
            id = ?
            AND user_id = ?
            AND UPPER(status) = 'PROCESSING'
        `,

        [
          String(
            awb
          ).trim(),

          lockedOrder.id,

          user_id
        ]
      );

    if (
      awbUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to save Delhivery AWB"
      );

    }

    const walletUpdate =
      await txQuery(
        connection,

        `
          UPDATE wallets
          SET
            balance =
              balance - ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            user_id = ?

            AND balance >= ?
        `,

        [
          charge,

          user_id,

          charge
        ]
      );

    if (
      walletUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to deduct shipping charge"
      );

    }

    await txQuery(
      connection,

      `
        INSERT INTO wallet_transactions
        (
          user_id,
          type,
          amount,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status
        )
        VALUES
        (
          ?,
          'DEBIT',
          ?,
          NULL,
          NULL,
          NULL,
          'SUCCESS'
        )
      `,

      [
        user_id,

        charge
      ]
    );

    const orderUpdate =
      await txQuery(
        connection,

        `
          UPDATE orders
          SET
            status = 'Manifested'
          WHERE
            id = ?
            AND user_id = ?
            AND UPPER(status) = 'PROCESSING'
        `,

        [
          lockedOrder.id,

          user_id
        ]
      );

    if (
      orderUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to update order status"
      );

    }

    const manifestResult =
      await txQuery(
        connection,

        `
          INSERT INTO manifests
          (
            order_id,
            user_id,
            shipping_charge,
            zone,
            distance_km,
            service_type,
            status
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,

        [
          lockedOrder.id,

          user_id,

          charge,

          zone,

          Number(
            distance_km
          ) || 0,

          normalizedServiceType,

          "Confirmed"
        ]
      );

    const manifest_id =
      manifestResult.insertId;

    const updatedWallet =
      await txQuery(
        connection,

        `
          SELECT
            balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
        `,

        [
          user_id
        ]
      );

    const remainingBalance =
      Number(
        updatedWallet[0]?.balance ||
        0
      );

    await commitTransaction(
      connection
    );

    console.log(
      "=============================================="
    );

    console.log(
      "✅ SHIPMENT MANIFESTED SUCCESSFULLY"
    );

    console.log(
      "DB ID:",
      lockedOrder.id
    );

    console.log(
      "Order ID:",
      lockedOrder.order_id
    );

    console.log(
      "AWB:",
      awb
    );

    console.log(
      "Manifest ID:",
      manifest_id
    );

    console.log(
      "Remaining Wallet:",
      remainingBalance
    );

    console.log(
      "=============================================="
    );

    return {

      success:
        true,

      message:
        "Shipment manifested successfully",

      id:
        lockedOrder.id,

      order_id:
        lockedOrder.order_id,

      awb:
        String(
          awb
        ).trim(),

      manifest_id,

      shipping_charge:
        charge,

      zone,

      distance_km:
        Number(
          distance_km
        ) || 0,

      service_type:
        normalizedServiceType,

      warehouse_id:
        warehouse.id,

      warehouse_name:
        warehouse.warehouse_name,

      wallet_balance:
        remainingBalance,

      delhivery_response:
        delhiveryResponse,

    };

  } catch (error) {

    try {

      await rollbackTransaction(
        connection
      );

    } catch (rollbackError) {

      console.log(
        "Rollback error:",
        rollbackError
      );

    }

    console.log(
      "=============================================="
    );

    console.log(
      "❌ CONFIRM SHIPMENT FAILED"
    );

    console.log(
      "Error:",
      error
    );

    console.log(
      "Message:",
      error.message
    );

    console.log(
      "=============================================="
    );

    throw error;
  }
};

const bulkConfirmShipments = async ({
  user_id,
  order_ids,
  service_type = "ROAD",
}) => {

  const normalizedServiceType =
    String(
      service_type ||
      "ROAD"
    )
      .trim()
      .toUpperCase();

  if (
    !SUPPORTED_SERVICES.includes(
      normalizedServiceType
    )
  ) {

    throw new Error(
      "Invalid service type"
    );

  }

  if (
    !user_id
  ) {

    throw new Error(
      "User ID is required"
    );

  }

  if (
    !Array.isArray(
      order_ids
    ) ||
    order_ids.length === 0
  ) {

    throw new Error(
      "At least one order must be selected"
    );

  }

  const uniqueOrderIds = [
    ...new Set(
      order_ids
        .map(
          (id) =>
            Number(id)
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];

  if (
    uniqueOrderIds.length === 0
  ) {

    throw new Error(
      "Invalid order selection"
    );

  }

  const shipmentOrders = [];

  let totalCharge = 0;

  for (
    const orderId
    of uniqueOrderIds
  ) {

    const orders =
      await query(
        `
          SELECT
            o.*,

            w.id AS warehouse_db_id,

            w.warehouse_name,

            w.contact_name AS warehouse_contact_name,

            w.phone AS warehouse_phone,

            w.email AS warehouse_email,

            w.gstin AS warehouse_gstin,

            w.address_line1 AS warehouse_address_line1,

            w.address_line2 AS warehouse_address_line2,

            w.floor_no AS warehouse_floor_no,

            w.landmark AS warehouse_landmark,

            w.pincode AS warehouse_pincode,

            w.city AS warehouse_city,

            w.state AS warehouse_state,

            w.country AS warehouse_country,

            w.delhivery_registered,

            w.status AS warehouse_status

          FROM orders o

          LEFT JOIN warehouses w

            ON w.id =
              o.warehouse_id

            AND w.user_id =
              o.user_id

          WHERE
            o.id = ?

            AND o.user_id = ?

            AND UPPER(o.status) =
              'PROCESSING'

          LIMIT 1

          FOR UPDATE
        `,

        [
          orderId,

          user_id,
        ]
      );

    if (
      orders.length === 0
    ) {

      throw new Error(
        `Order #${orderId} not found or already shipped`
      );

    }

    const order =
      orders[0];

    if (
      !order.warehouse_db_id
    ) {

      throw new Error(
        `Pickup warehouse is missing for Order #${order.id}`
      );

    }

    if (
      String(
        order.warehouse_status ||
        ""
      ).toUpperCase() !==
      "ACTIVE"
    ) {

      throw new Error(
        `Pickup warehouse is inactive for Order #${order.id}`
      );

    }

    if (
      Number(
        order.delhivery_registered
      ) !== 1
    ) {

      throw new Error(
        `Pickup warehouse is not registered with Delhivery for Order #${order.id}`
      );

    }

    if (
      !order.warehouse_pincode ||
      !/^\d{6}$/.test(
        String(
          order.warehouse_pincode
        ).trim()
      )
    ) {

      throw new Error(
        `Invalid pickup pincode for Order #${order.id}`
      );

    }

    if (
      !order.pincode ||
      !/^\d{6}$/.test(
        String(
          order.pincode
        ).trim()
      )
    ) {

      throw new Error(
        `Invalid delivery pincode for Order #${order.id}`
      );

    }

    const products =
      await getOrderProducts(
        order.id
      );

    if (
      products.length === 0
    ) {

      throw new Error(
        `Product not found for Order #${order.id}`
      );

    }

    const packages =
      await getOrderPackages(
        order.id
      );

    if (
      packages.length === 0
    ) {

      throw new Error(
        `Package not found for Order #${order.id}`
      );

    }

    const totalWeight =
      packages.reduce(
        (
          total,
          packageData
        ) => {

          const weight =
            Number(
              packageData.weight
            ) || 0;

          const packageCount =
            Number(
              packageData.package_count
            ) || 1;

          return (
            total +
            weight *
            packageCount
          );

        },
        0
      );

    if (
      totalWeight <= 0
    ) {

      throw new Error(
        `Invalid package weight for Order #${order.id}`
      );

    }

    const rate =
      await calculateShippingRate(
        user_id,

        String(
          order.warehouse_pincode
        ).trim(),

        String(
          order.pincode
        ).trim(),

        totalWeight,

        normalizedServiceType
      );

    const shippingCharge =
      Number(
        rate.shipping_charge
      );

    if (
      !Number.isFinite(
        shippingCharge
      ) ||
      shippingCharge <= 0
    ) {

      throw new Error(
        `Invalid shipping charge for Order #${order.id}`
      );

    }

    totalCharge +=
      shippingCharge;

    const warehouse = {

      id:
        order.warehouse_db_id,

      warehouse_name:
        order.warehouse_name,

      contact_name:
        order.warehouse_contact_name,

      phone:
        order.warehouse_phone,

      email:
        order.warehouse_email,

      gstin:
        order.warehouse_gstin,

      address_line1:
        order.warehouse_address_line1,

      address_line2:
        order.warehouse_address_line2,

      floor_no:
        order.warehouse_floor_no,

      landmark:
        order.warehouse_landmark,

      pincode:
        order.warehouse_pincode,

      city:
        order.warehouse_city,

      state:
        order.warehouse_state,

      country:
        order.warehouse_country,

    };

    const delhiveryOrderId =
      `SD-${order.id}-${order.order_id}`;

    console.log(
      `Delhivery Order ID for Order #${order.order_id}:`,
      delhiveryOrderId
    );

    const delhiveryShipment =
      buildDelhiveryShipment({

        order,

        products,

        packages,

        warehouse,

        delhiveryOrderId,

        service_type:
  normalizedServiceType,

      });

    shipmentOrders.push({

      order,

      products,

      packages,

      warehouse,

      delhiveryShipment,

      rate,

      shippingCharge,

      totalWeight,

    });
  }

  const delhiveryResponse =
    await createDelhiveryShipment(
      shipmentOrders.map(
        (item) =>
          item.delhiveryShipment
      )
    );

  const delhiveryPackages =
    Array.isArray(
      delhiveryResponse.packages
    )
      ? delhiveryResponse.packages
      : [];

  if (
    delhiveryPackages.length !==
    shipmentOrders.length
  ) {

    throw new Error(
      "Delhivery did not return a response for every selected shipment"
    );

  }

  const shipmentResults =
    shipmentOrders.map(
      (shipment) => {

        const pkg =
          delhiveryPackages.find(
            (item) =>
              String(
                item.refnum ||
                ""
              ) ===

              String(
                shipment
                  .delhiveryShipment
                  .order
              )
          );

        if (
          !pkg ||
          String(
            pkg.status ||
            ""
          ).toLowerCase() !==
          "success"
        ) {

          const remarks =
            Array.isArray(
              pkg?.remarks
            )
              ? pkg.remarks.join(
                  ", "
                )
              : pkg?.remarks;

          throw new Error(
            remarks ||

            `Delhivery shipment failed for Order #${shipment.order.order_id}`
          );

        }

        const awb =
          String(
            pkg.waybill ||
            ""
          ).trim();

        if (
          !awb
        ) {

          throw new Error(
            `Delhivery did not generate AWB for Order #${shipment.order.order_id}`
          );

        }

        return {

          ...shipment,

          awb,

        };

      }
    );

  const connection =
    await beginTransaction();

  try {

    await txQuery(
      connection,

      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES
        (
          ?,
          0.00
        )

        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,

      [
        user_id,
      ]
    );

    const walletRows =
      await txQuery(
        connection,

        `
          SELECT
            id,
            user_id,
            balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,

        [
          user_id,
        ]
      );

    if (
      walletRows.length === 0
    ) {

      throw new Error(
        "Wallet not found"
      );

    }

    const currentBalance =
      Number(
        walletRows[0].balance
      );

    if (
      currentBalance <
      totalCharge
    ) {

      throw new Error(
        `Insufficient wallet balance. Available ₹${currentBalance.toFixed(
          2
        )}, required ₹${totalCharge.toFixed(
          2
        )}`
      );

    }

    const walletUpdate =
      await txQuery(
        connection,

        `
          UPDATE wallets
          SET
            balance =
              balance - ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            user_id = ?

            AND balance >= ?
        `,

        [
          totalCharge,

          user_id,

          totalCharge,
        ]
      );

    if (
      walletUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to deduct shipping charge"
      );

    }

    await txQuery(
      connection,

      `
        INSERT INTO wallet_transactions
        (
          user_id,
          type,
          amount,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status
        )
        VALUES
        (
          ?,
          'DEBIT',
          ?,
          NULL,
          NULL,
          NULL,
          'SUCCESS'
        )
      `,

      [
        user_id,

        totalCharge,
      ]
    );

    const shippedOrders = [];

    for (
      const shipment
      of shipmentResults
    ) {

      const order =
        shipment.order;

      const orderUpdate =
        await txQuery(
          connection,

          `
            UPDATE orders
            SET
              awb = ?,

              status = 'Manifested'

            WHERE
              id = ?

              AND user_id = ?

              AND UPPER(status) =
                'PROCESSING'
          `,

          [
            shipment.awb,

            order.id,

            user_id,
          ]
        );

      if (
        orderUpdate.affectedRows !== 1
      ) {

        throw new Error(
          `Unable to update Order #${order.id}`
        );

      }

      const manifestResult =
        await txQuery(
          connection,

          `
            INSERT INTO manifests
            (
              order_id,
              user_id,
              shipping_charge,
              zone,
              distance_km,
              service_type,
              status
            )
            VALUES
            (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `,

          [
            order.id,

            user_id,

            shipment.shippingCharge,

            shipment.rate.zone,

            Number(
              shipment.rate.distance_km
            ) || 0,

            normalizedServiceType,

            "Confirmed",
          ]
        );

      shippedOrders.push({

        order_id:
          order.order_id,

        awb:
          shipment.awb,

        manifest_id:
          manifestResult.insertId,

        shipping_charge:
          shipment.shippingCharge,

        zone:
          shipment.rate.zone,

        distance_km:
          Number(
            shipment.rate.distance_km
          ) || 0,

        service_type:
          normalizedServiceType,

        warehouse_id:
          shipment.warehouse.id,

        warehouse_name:
          shipment.warehouse.warehouse_name,

      });

    }

    const updatedWallet =
      await txQuery(
        connection,

        `
          SELECT
            balance
          FROM wallets
          WHERE user_id = ?
          LIMIT 1
        `,

        [
          user_id,
        ]
      );

    const remainingBalance =
      Number(
        updatedWallet[0]?.balance ||
        0
      );

    await commitTransaction(
      connection
    );

    return {

      success:
        true,

      message:
        "Selected orders manifested successfully",

      shipped_orders:
        shippedOrders.map(
          (item) =>
            item.order_id
        ),

      total_orders:
        shippedOrders.length,

      total_charge:
        Number(
          totalCharge.toFixed(2)
        ),

      wallet_balance:
        Number(
          remainingBalance.toFixed(2)
        ),

      orders:
        shippedOrders,

      delhivery_response:
        delhiveryResponse,

    };

  } catch (error) {

    await rollbackTransaction(
      connection
    );

    console.log(
      "Bulk shipment transaction failed:",
      error
    );

    throw error;
  }
};

module.exports = {

  confirmShipment,

  bulkConfirmShipments,

};