const db = require("../config/db");

const {
  calculateShippingRate,
} = require("./rateService");


// ========================================
// QUERY HELPER
// ========================================

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


// ========================================
// BEGIN TRANSACTION
// ========================================

const beginTransaction = () => {
  return new Promise(
    (resolve, reject) => {

      db.beginTransaction(
        (err) => {

          if (err) {
            reject(err);
          } else {
            resolve();
          }

        }
      );

    }
  );
};


// ========================================
// COMMIT
// ========================================

const commitTransaction = () => {
  return new Promise(
    (resolve, reject) => {

      db.commit(
        (err) => {

          if (err) {
            reject(err);
          } else {
            resolve();
          }

        }
      );

    }
  );
};


// ========================================
// ROLLBACK
// ========================================

const rollbackTransaction = () => {
  return new Promise(
    (resolve) => {

      db.rollback(
        () => {
          resolve();
        }
      );

    }
  );
};


// ========================================
// SUPPORTED SERVICES
// ========================================

const SUPPORTED_SERVICES = [
  "ROAD",
  "AIR",
  "SHADOWFAX_ROAD",
];


// ========================================
// CONFIRM SINGLE SHIPMENT
// ========================================

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
}) => {

  const charge =
    Number(
      shipping_charge
    );


  // ========================================
  // SERVICE TYPE
  // ========================================

  const normalizedServiceType =
    String(service_type || "ROAD")
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


  // ======================================
  // VALIDATION
  // ======================================

  if (
    !charge ||
    charge <= 0
  ) {
    throw new Error(
      "Invalid shipping charge"
    );
  }


  if (!user_id) {
    throw new Error(
      "User ID is required"
    );
  }


  if (
    !pickup_address ||
    !String(
      pickup_address
    ).trim()
  ) {
    throw new Error(
      "Pickup address is required"
    );
  }


  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    throw new Error(
      "At least one product is required"
    );
  }


  if (
    !Array.isArray(packages) ||
    packages.length === 0
  ) {
    throw new Error(
      "At least one package is required"
    );
  }


  // ====================================
  // START TRANSACTION
  // ====================================

  await beginTransaction();


  try {

    // ====================================
    // 1. CREATE WALLET IF NOT EXISTS
    // ====================================

    await query(
      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES (?, 0.00)

        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,
      [
        user_id,
      ]
    );


    // ====================================
    // 2. LOCK WALLET
    // ====================================

    const walletRows =
      await query(
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


    // ====================================
    // 3. CHECK BALANCE
    // ====================================

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


    // ====================================
    // 4. CREATE PICKUP ADDRESS
    // ====================================

    const pickupResult =
      await query(
        `
          INSERT INTO pickup_addresses
          (
            user_id,
            pickup_address,
            pickup_pincode
          )
          VALUES (?, ?, ?)
        `,
        [
          user_id,
          pickup_address,
          pickup_pincode,
        ]
      );


    const pickup_address_id =
      pickupResult.insertId;


  // ====================================
// 5. CREATE ORDER
// ====================================

// Generate unique 6-digit public order ID
let publicOrderId;

for (let attempt = 0; attempt < 10; attempt++) {

  const generatedId = String(
    Math.floor(
      100000 +
      Math.random() * 900000
    )
  );

  const existingOrder =
    await query(
      `
        SELECT id
        FROM orders
        WHERE order_id = ?
        LIMIT 1
      `,
      [generatedId]
    );

  if (existingOrder.length === 0) {
    publicOrderId = generatedId;
    break;
  }
}


if (!publicOrderId) {

  throw new Error(
    "Unable to generate unique order ID"
  );

}


// ====================================
// INSERT ORDER
// ====================================

const orderResult =
  await query(
    `
      INSERT INTO orders
      (
        order_id,
        user_id,
        pickup_address_id,
        consignee_name,
        mobile,
        alternate_mobile,
        email,
        gstin,
        company_name,
        floor_no,
        landmark,
        address_line1,
        address_line2,
        pincode,
        city,
        state,
        country,
        payment_type,
        risk_type,
        status
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
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

      // PUBLIC 6 DIGIT ORDER ID
      publicOrderId,

      user_id,

      pickup_address_id,

      orderData.consignee_name,

      orderData.mobile,

      orderData.alternate_mobile ||
        null,

      orderData.email ||
        null,

      orderData.gstin ||
        null,

      orderData.company_name ||
        null,

      orderData.floor_no ||
        null,

      orderData.landmark ||
        null,

      orderData.address_line1,

      orderData.address_line2 ||
        null,

      orderData.pincode,

      orderData.city,

      orderData.state,

      orderData.country ||
        "India",

      orderData.payment_type ||
        "Prepaid",

      orderData.risk_type ||
        "Owner Risk",

      "Manifested",

    ]
  );


// ====================================
// INTERNAL DB ORDER ID
// ====================================

// Ye products/packages/manifests ke FK ke liye hai
const order_id =
  orderResult.insertId;
    // ====================================
    // 6. CREATE PRODUCTS
    // ====================================

    for (
      const product of products
    ) {

      await query(
        `
          INSERT INTO order_products
          (
            order_id,
            product_name,
            sku,
            price,
            qty,
            tax
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          order_id,

          product.product_name ||
            "",

          product.sku ||
            null,

          Number(
            product.price
          ) || 0,

          Number(
            product.qty
          ) || 1,

          Number(
            product.tax
          ) || 0,
        ]
      );

    }


    // ====================================
    // 7. CREATE PACKAGES
    // ====================================

    for (
      const packageData
      of packages
    ) {

      await query(
        `
          INSERT INTO order_packages
          (
            order_id,
            length,
            width,
            height,
            weight,
            package_count
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          order_id,

          Number(
            packageData.length
          ) || 0,

          Number(
            packageData.width
          ) || 0,

          Number(
            packageData.height
          ) || 0,

          Number(
            packageData.weight
          ) || 0,

          Number(
            packageData.package_count
          ) || 1,
        ]
      );

    }


    // ====================================
    // 8. DEDUCT MONEY
    // ====================================

    const walletUpdate =
      await query(
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
          charge,
        ]
      );


    if (
      walletUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to deduct shipping charge"
      );

    }


    // ====================================
    // 9. WALLET DEBIT TRANSACTION
    // ====================================

    await query(
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
        VALUES (
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
        charge,
      ]
    );


    // ====================================
    // 10. CREATE MANIFEST
    // ====================================

    const manifestResult =
      await query(
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
          VALUES (
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
          order_id,
          user_id,
          charge,
          zone,

          Number(
            distance_km
          ) || 0,

          normalizedServiceType,

          "Confirmed",
        ]
      );


    const manifest_id =
      manifestResult.insertId;


    // ====================================
    // 11. UPDATED WALLET
    // ====================================

    const updatedWallet =
      await query(
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
        updatedWallet[0].balance
      );


    // ====================================
    // 12. COMMIT
    // ====================================

    await commitTransaction();


    // ====================================
    // SUCCESS
    // ====================================

    return {

      success: true,

      message:
        "Shipment confirmed successfully",

      order_id: publicOrderId,

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

      wallet_balance:
        remainingBalance,

    };


  } catch (error) {

    await rollbackTransaction();

    console.log(
      "Shipment transaction failed:",
      error
    );

    throw error;
  }
};


// ========================================
// BULK CONFIRM SHIPMENTS
// ========================================

const bulkConfirmShipments = async ({
  user_id,
  order_ids,
  service_type = "ROAD",
}) => {


  const normalizedServiceType =
    String(service_type || "ROAD")
      .trim()
      .toUpperCase();


  // ======================================
  // SERVICE TYPE
  // ======================================

  if (
    !SUPPORTED_SERVICES.includes(
      normalizedServiceType
    )
  ) {
    throw new Error(
      "Invalid service type"
    );
  }


  // ======================================
  // VALIDATION
  // ======================================

  if (!user_id) {
    throw new Error(
      "User ID is required"
    );
  }


  if (
    !Array.isArray(order_ids) ||
    order_ids.length === 0
  ) {
    throw new Error(
      "At least one order must be selected"
    );
  }


  // Remove duplicate IDs

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


  // ======================================
  // START TRANSACTION
  // ======================================

  await beginTransaction();


  try {

    // ====================================
    // 1. CREATE WALLET IF NOT EXISTS
    // ====================================

    await query(
      `
        INSERT INTO wallets
        (
          user_id,
          balance
        )
        VALUES (?, 0.00)

        ON DUPLICATE KEY UPDATE
          user_id = user_id
      `,
      [
        user_id,
      ]
    );


    // ====================================
    // 2. LOCK WALLET
    // ====================================

    const walletRows =
      await query(
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


    const wallet =
      walletRows[0];


    const currentBalance =
      Number(
        wallet.balance
      );


    if (
      !Number.isFinite(
        currentBalance
      )
    ) {
      throw new Error(
        "Invalid wallet balance"
      );
    }


    // ====================================
    // SHIPMENT DATA
    // ====================================

    const shipmentOrders = [];

    let totalCharge = 0;


    // ====================================
    // 3. PROCESS EACH ORDER
    // ====================================

    for (
      const orderId
      of uniqueOrderIds
    ) {

      // ==================================
      // GET ORDER
      // ==================================

      const orders =
        await query(
          `
            SELECT
              o.*,
              pa.pickup_address,
              pa.pickup_pincode,
              pa.pickup_city
            FROM orders o
            LEFT JOIN pickup_addresses pa
              ON pa.id =
                o.pickup_address_id
            WHERE
              o.id = ?
              AND o.user_id = ?
              AND o.status =
                'Processing'
            LIMIT 1
            FOR UPDATE
          `,
          [
            orderId,
            user_id,
          ]
        );


      if (
        !orders ||
        orders.length === 0
      ) {

        throw new Error(
          `Order #${orderId} not found or already shipped`
        );

      }


      const order =
        orders[0];


      // ==================================
      // PICKUP PINCODE
      // ==================================

      if (
        !order.pickup_pincode ||
        !/^\d{6}$/.test(
          String(
            order.pickup_pincode
          ).trim()
        )
      ) {

        throw new Error(
          `Invalid pickup pincode for Order #${order.id}`
        );

      }


      // ==================================
      // DELIVERY PINCODE
      // ==================================

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


      // ==================================
      // GET PACKAGES
      // ==================================

      const packages =
        await query(
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
            order.id,
          ]
        );


      if (
        !packages ||
        packages.length === 0
      ) {

        throw new Error(
          `Package not found for Order #${order.id}`
        );

      }


      // ==================================
      // CALCULATE TOTAL WEIGHT
      // ==================================

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


      // ==================================
      // RATE CALCULATION
      // ==================================

      const rate =
  await calculateShippingRate(
    user_id,
    String(order.pickup_pincode).trim(),
    String(order.pincode).trim(),
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


      shipmentOrders.push({

        order,

        packages,

        rate,

        shippingCharge,

        totalWeight,

      });

    }


    // ======================================
    // 4. CHECK TOTAL WALLET BALANCE
    // ======================================

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


    // ======================================
    // 5. DEDUCT TOTAL WALLET AMOUNT
    // ======================================

    const walletUpdate =
      await query(
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


    // ======================================
    // 6. ONE WALLET DEBIT TRANSACTION
    // ======================================

    await query(
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
        VALUES (
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


    // ======================================
    // 7. UPDATE ORDERS + MANIFESTS
    // ======================================

    const shippedOrders = [];


    for (
      const shipment
      of shipmentOrders
    ) {

      const order =
        shipment.order;


      const rate =
        shipment.rate;


      // ==================================
      // UPDATE ORDER STATUS
      // ==================================

      const orderUpdate =
        await query(
          `
            UPDATE orders
            SET
              status =
                'Manifested'
            WHERE
              id = ?
              AND user_id = ?
              AND status =
                'Processing'
          `,
          [
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


      // ==================================
      // CREATE MANIFEST
      // ==================================

      const manifestResult =
        await query(
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
            VALUES (
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

            rate.zone,

            Number(
              rate.distance_km
            ) || 0,

            normalizedServiceType,

            "Confirmed",
          ]
        );


      shippedOrders.push({

        order_id:
  order.order_id,

        manifest_id:
          manifestResult.insertId,

        shipping_charge:
          shipment.shippingCharge,

        zone:
          rate.zone,

        distance_km:
          Number(
            rate.distance_km
          ) || 0,

        service_type:
          normalizedServiceType,

      });

    }


    // ======================================
    // 8. GET UPDATED WALLET
    // ======================================

    const updatedWallet =
      await query(
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


    // ======================================
    // 9. COMMIT EVERYTHING
    // ======================================

    await commitTransaction();


    // ======================================
    // SUCCESS
    // ========================================

    return {

      success: true,

      message:
        "Selected orders shipped successfully",

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

    };


  } catch (error) {

    // ======================================
    // ROLLBACK EVERYTHING
    // ======================================

    await rollbackTransaction();


    console.log(
      "Bulk shipment transaction failed:",
      error
    );


    throw error;
  }
};


// ========================================
// EXPORT
// ========================================

module.exports = {

  confirmShipment,

  bulkConfirmShipments,

};