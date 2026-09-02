const db = require("../config/db");
const crypto = require("crypto");


// ======================================================
// CREATE PICKUP ADDRESS
// ======================================================

const createPickupAddress = (
  user_id,
  pickup_address,
  pickup_pincode,
  pickup_city,
  callback,
) => {

  const query = `
    INSERT INTO pickup_addresses
    (
      user_id,
      pickup_pincode,
      pickup_city,
      pickup_address
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      user_id,
      pickup_pincode,
      pickup_city || null,
      pickup_address,
    ],
    callback,
  );
};


// ======================================================
// GENERATE UNIQUE 6 DIGIT ORDER ID
// ======================================================

const generateUniqueOrderId = (
  callback,
  attempts = 0,
) => {

  if (attempts >= 10) {

    return callback(
      new Error(
        "Unable to generate unique order ID"
      )
    );

  }


  const orderId = String(
    crypto.randomInt(
      100000,
      1000000
    )
  );


  const checkQuery = `
    SELECT id
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `;


  db.query(
    checkQuery,
    [orderId],
    (err, rows) => {

      if (err) {
        return callback(err);
      }


      if (rows.length > 0) {

        return generateUniqueOrderId(
          callback,
          attempts + 1
        );

      }


      return callback(
        null,
        orderId
      );

    }
  );

};


// ======================================================
// CREATE ORDER
// ======================================================

const createOrder = (
  orderData,
  callback,
) => {

  generateUniqueOrderId(
    (idError, publicOrderId) => {

      if (idError) {
        return callback(idError);
      }


      const query = `
        INSERT INTO orders
        (
          order_id,
          user_id,
          pickup_address_id,
          warehouse_id,
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
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `;


      db.query(
        query,
        [

          publicOrderId,

          orderData.user_id,

          orderData.pickup_address_id,

          orderData.warehouse_id ||
            null,

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

          "Processing",

        ],

        (err, result) => {

          if (err) {
            return callback(err);
          }


          return callback(
            null,
            {
              id:
                result.insertId,

              order_id:
                publicOrderId,

              warehouse_id:
                orderData.warehouse_id ||
                null,

              message:
                "Order created successfully",
            }
          );

        }
      );

    }
  );

};


// ======================================================
// CREATE PRODUCT
// ======================================================

const createProduct = (
  productData,
  callback,
) => {

  const query = `
    INSERT INTO order_products
    (
      order_id,
      product_name,
      sku,
      price,
      qty,
      tax
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;


  db.query(
    query,
    [

      productData.order_id,

      productData.product_name,

      productData.sku ||
        null,

      productData.price ||
        0,

      productData.qty ||
        1,

      productData.tax ||
        0,

    ],
    callback,
  );

};


// ======================================================
// CREATE PACKAGE
// ======================================================

const createPackage = (
  packageData,
  callback,
) => {

  const query = `
    INSERT INTO order_packages
    (
      order_id,
      length,
      width,
      height,
      weight,
      package_count
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;


  db.query(
    query,
    [

      packageData.order_id,

      packageData.length ||
        0,

      packageData.width ||
        0,

      packageData.height ||
        0,

      packageData.weight ||
        0,

      packageData.package_count ||
        1,

    ],
    callback,
  );

};


// ======================================================
// RUN QUERY PROMISE
// ======================================================

const runQuery = (
  sql,
  params = [],
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      db.query(
        sql,
        params,
        (
          error,
          result
        ) => {

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }

        }
      );

    }
  );

};


// ======================================================
// GET PROCESSING ORDERS
// ======================================================

const getProcessingOrders = (
  user_id,
  callback,
) => {

  const query = `
    SELECT

      /* ==========================================
         ORDER
      ========================================== */

      o.id,
      o.order_id,
      o.user_id,

      o.pickup_address_id,
      o.warehouse_id,

      o.awb,

      o.consignee_name,
      o.mobile,
      o.alternate_mobile,
      o.email,

      o.gstin,
      o.company_name,

      o.floor_no,
      o.landmark,

      o.address_line1,
      o.address_line2,

      o.pincode,
      o.city,
      o.state,
      o.country,

      o.payment_type,
      o.risk_type,

      o.status,
      o.created_at,


      /* ==========================================
         OLD PICKUP ADDRESS
      ========================================== */

      pa.pickup_address,
      pa.pickup_pincode,
      pa.pickup_city,


      /* ==========================================
         WAREHOUSE
      ========================================== */

      w.id AS warehouse_id_joined,

      w.warehouse_name,

      w.contact_name
        AS warehouse_contact_name,

      w.phone
        AS warehouse_phone,

      w.email
        AS warehouse_email,

      w.gstin
        AS warehouse_gstin,

      w.address_line1
        AS warehouse_address_line1,

      w.address_line2
        AS warehouse_address_line2,

      w.floor_no
        AS warehouse_floor_no,

      w.landmark
        AS warehouse_landmark,

      w.pincode
        AS warehouse_pincode,

      w.city
        AS warehouse_city,

      w.state
        AS warehouse_state,

      w.country
        AS warehouse_country,

      w.delhivery_registered,

      w.status
        AS warehouse_status,


      /* ==========================================
         PRODUCT
      ========================================== */

      op.product_name,
      op.sku,
      op.price,
      op.qty,
      op.tax,


      /* ==========================================
         PACKAGE
      ========================================== */

      pkg.length,
      pkg.width,
      pkg.height,
      pkg.weight,
      pkg.package_count


    FROM orders o


    LEFT JOIN pickup_addresses pa
      ON pa.id =
        o.pickup_address_id


    LEFT JOIN warehouses w
      ON w.id =
        o.warehouse_id
      AND w.user_id =
        o.user_id


    LEFT JOIN order_products op
      ON op.order_id =
        o.id


    LEFT JOIN order_packages pkg
      ON pkg.order_id =
        o.id


    WHERE
      o.user_id = ?

      AND UPPER(
        o.status
      ) = 'PROCESSING'


    ORDER BY
      o.id DESC
  `;


  db.query(
    query,
    [
      user_id,
    ],
    callback,
  );

};


// ======================================================
// GET ALL ORDERS
// ======================================================

const getAllOrders = (
  user_id,
  callback,
) => {

  const query = `
    SELECT

      /* ==========================================
         ORDER
      ========================================== */

      o.id,
      o.order_id,
      o.user_id,

      o.pickup_address_id,
      o.warehouse_id,

      o.awb,

      o.consignee_name,
      o.mobile,
      o.alternate_mobile,
      o.email,

      o.gstin,
      o.company_name,

      o.floor_no,
      o.landmark,

      o.address_line1,
      o.address_line2,

      o.pincode,
      o.city,
      o.state,
      o.country,

      o.payment_type,
      o.risk_type,

      o.status,
      o.created_at,


      /* ==========================================
         PICKUP ADDRESS
      ========================================== */

      pa.pickup_address,
      pa.pickup_pincode,
      pa.pickup_city,


      /* ==========================================
         WAREHOUSE
      ========================================== */

      w.id AS warehouse_id_joined,

      w.warehouse_name,

      w.contact_name
        AS warehouse_contact_name,

      w.phone
        AS warehouse_phone,

      w.email
        AS warehouse_email,

      w.gstin
        AS warehouse_gstin,

      w.address_line1
        AS warehouse_address_line1,

      w.address_line2
        AS warehouse_address_line2,

      w.floor_no
        AS warehouse_floor_no,

      w.landmark
        AS warehouse_landmark,

      w.pincode
        AS warehouse_pincode,

      w.city
        AS warehouse_city,

      w.state
        AS warehouse_state,

      w.country
        AS warehouse_country,

      w.delhivery_registered,

      w.status
        AS warehouse_status,


      /* ==========================================
         PRODUCT
      ========================================== */

      op.product_name,
      op.sku,
      op.price,
      op.qty,
      op.tax,


      /* ==========================================
         PACKAGE
      ========================================== */

      pkg.length,
      pkg.width,
      pkg.height,
      pkg.weight,
      pkg.package_count


    FROM orders o


    LEFT JOIN pickup_addresses pa
      ON pa.id =
        o.pickup_address_id


    LEFT JOIN warehouses w
      ON w.id =
        o.warehouse_id
      AND w.user_id =
        o.user_id


    LEFT JOIN order_products op
      ON op.order_id =
        o.id


    LEFT JOIN order_packages pkg
      ON pkg.order_id =
        o.id


    WHERE
      o.user_id = ?


    ORDER BY
      o.id DESC
  `;


  db.query(
    query,
    [
      user_id,
    ],
    callback,
  );

};


// ======================================================
// GET ORDER BY ID
// ======================================================

const getOrderById = (
  orderId,
  userId
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const query = `
        SELECT

          /* ========================================
             ORDER
          ======================================== */

          o.id,
          o.order_id,
          o.user_id,

          o.pickup_address_id,
          o.warehouse_id,

          o.awb,

          o.consignee_name,
          o.mobile,
          o.alternate_mobile,
          o.email,

          o.gstin,
          o.company_name,

          o.floor_no,
          o.landmark,

          o.address_line1,
          o.address_line2,

          o.pincode,
          o.city,
          o.state,
          o.country,

          o.payment_type,
          o.risk_type,

          o.status,
          o.created_at,


          /* ========================================
             OLD PICKUP ADDRESS
          ======================================== */

          pa.pickup_address,
          pa.pickup_pincode,
          pa.pickup_city,


          /* ========================================
             WAREHOUSE
          ======================================== */

          w.id AS warehouse_id_joined,

          w.warehouse_name,

          w.contact_name
            AS warehouse_contact_name,

          w.phone
            AS warehouse_phone,

          w.email
            AS warehouse_email,

          w.gstin
            AS warehouse_gstin,

          w.address_line1
            AS warehouse_address_line1,

          w.address_line2
            AS warehouse_address_line2,

          w.floor_no
            AS warehouse_floor_no,

          w.landmark
            AS warehouse_landmark,

          w.pincode
            AS warehouse_pincode,

          w.city
            AS warehouse_city,

          w.state
            AS warehouse_state,

          w.country
            AS warehouse_country,

          w.delhivery_registered,

          w.status
            AS warehouse_status,


          /* ========================================
             PRODUCT
          ======================================== */

          op.product_name,
          op.sku,
          op.price,
          op.qty,
          op.tax,


          /* ========================================
             PACKAGE
          ======================================== */

          pkg.length,
          pkg.width,
          pkg.height,
          pkg.weight,
          pkg.package_count


        FROM orders o


        LEFT JOIN pickup_addresses pa
          ON pa.id =
            o.pickup_address_id


        LEFT JOIN warehouses w
          ON w.id =
            o.warehouse_id
          AND w.user_id =
            o.user_id


        LEFT JOIN order_products op
          ON op.order_id =
            o.id


        LEFT JOIN order_packages pkg
          ON pkg.order_id =
            o.id


        WHERE
          o.id = ?
          AND o.user_id = ?

        LIMIT 1
      `;


      db.query(
        query,
        [
          orderId,
          userId,
        ],
        (
          error,
          rows
        ) => {

          if (error) {
            return reject(error);
          }


          if (
            rows.length === 0
          ) {

            return reject(
              new Error(
                "Order not found"
              )
            );

          }


          const firstRow =
            rows[0];


          const order = {

            id:
              firstRow.id,

            order_id:
              firstRow.order_id,

            user_id:
              firstRow.user_id,

            pickup_address_id:
              firstRow.pickup_address_id,

            warehouse_id:
              firstRow.warehouse_id,

            awb:
              firstRow.awb,

            consignee_name:
              firstRow.consignee_name,

            mobile:
              firstRow.mobile,

            alternate_mobile:
              firstRow.alternate_mobile,

            email:
              firstRow.email,

            gstin:
              firstRow.gstin,

            company_name:
              firstRow.company_name,

            floor_no:
              firstRow.floor_no,

            landmark:
              firstRow.landmark,

            address_line1:
              firstRow.address_line1,

            address_line2:
              firstRow.address_line2,

            pincode:
              firstRow.pincode,

            city:
              firstRow.city,

            state:
              firstRow.state,

            country:
              firstRow.country,

            payment_type:
              firstRow.payment_type,

            risk_type:
              firstRow.risk_type,

            status:
              firstRow.status,

            created_at:
              firstRow.created_at,


            pickup: {

              id:
                firstRow.pickup_address_id,

              address:
                firstRow.pickup_address,

              pincode:
                firstRow.pickup_pincode,

              city:
                firstRow.pickup_city,

            },


            warehouse: firstRow.warehouse_id
              ? {

                  id:
                    firstRow.warehouse_id_joined,

                  warehouse_name:
                    firstRow.warehouse_name,

                  contact_name:
                    firstRow.warehouse_contact_name,

                  phone:
                    firstRow.warehouse_phone,

                  email:
                    firstRow.warehouse_email,

                  gstin:
                    firstRow.warehouse_gstin,

                  address_line1:
                    firstRow.warehouse_address_line1,

                  address_line2:
                    firstRow.warehouse_address_line2,

                  floor_no:
                    firstRow.warehouse_floor_no,

                  landmark:
                    firstRow.warehouse_landmark,

                  pincode:
                    firstRow.warehouse_pincode,

                  city:
                    firstRow.warehouse_city,

                  state:
                    firstRow.warehouse_state,

                  country:
                    firstRow.warehouse_country,

                  delhivery_registered:
                    firstRow.delhivery_registered,

                  status:
                    firstRow.warehouse_status,

                }

              : null,

            products: [],

            packages: [],

          };


          const productKeys =
            new Set();

          const packageKeys =
            new Set();


          rows.forEach(
            (row) => {

              if (
                row.product_name &&
                !productKeys.has(
                  `${row.product_name}-${row.sku}`
                )
              ) {

                productKeys.add(
                  `${row.product_name}-${row.sku}`
                );


                order.products.push({

                  product_name:
                    row.product_name,

                  sku:
                    row.sku,

                  price:
                    row.price,

                  qty:
                    row.qty,

                  tax:
                    row.tax,

                });

              }


              if (
                row.weight !== null &&
                row.weight !== undefined
              ) {

                const packageKey =
                  [
                    row.length,
                    row.width,
                    row.height,
                    row.weight,
                    row.package_count,
                  ].join(
                    "-"
                  );


                if (
                  !packageKeys.has(
                    packageKey
                  )
                ) {

                  packageKeys.add(
                    packageKey
                  );


                  order.packages.push({

                    length:
                      row.length,

                    width:
                      row.width,

                    height:
                      row.height,

                    weight:
                      row.weight,

                    package_count:
                      row.package_count,

                  });

                }

              }

            }
          );


          return resolve(
            order
          );

        }
      );

    }
  );

};


// ======================================================
// UPDATE ORDER
// ======================================================

const updateOrder = (
  orderId,
  userId,
  orderData,
  pickupData,
  products,
  packages,
) => {
  return new Promise(async (resolve, reject) => {
    let connection;

    try {
      // ==========================================
      // GET TRANSACTION CONNECTION
      // ==========================================
      connection = await db.promise().getConnection();

      await connection.beginTransaction();

      // ==========================================
      // TRANSACTION QUERY HELPER
      // ==========================================
      const txQuery = (sql, params = []) => {
        return connection
          .query(sql, params)
          .then(([rows]) => rows);
      };

      // ==========================================
      // CHECK ORDER
      // ==========================================
      const orderRows = await txQuery(
        `
          SELECT
            id,
            order_id,
            pickup_address_id,
            warehouse_id
          FROM orders
          WHERE
            id = ?
            AND user_id = ?
            AND UPPER(status) = 'PROCESSING'
          LIMIT 1
        `,
        [orderId, userId],
      );

      if (orderRows.length === 0) {
        throw new Error("Processing order not found");
      }

      const pickupAddressId =
        orderRows[0].pickup_address_id;

      const existingWarehouseId =
        orderRows[0].warehouse_id;

      // ==========================================
      // VALIDATE / UPDATE WAREHOUSE
      // ==========================================
      const requestedWarehouseId = Number(
        orderData?.warehouse_id ||
          existingWarehouseId ||
          0
      );

      if (!requestedWarehouseId) {
        throw new Error(
          "Pickup warehouse is required"
        );
      }

      const warehouseRows = await txQuery(
        `
          SELECT
            id,
            warehouse_name,
            delhivery_registered,
            status
          FROM warehouses
          WHERE
            id = ?
            AND user_id = ?
          LIMIT 1
        `,
        [requestedWarehouseId, userId],
      );

      if (warehouseRows.length === 0) {
        throw new Error(
          "Selected pickup warehouse not found"
        );
      }

      if (
        String(
          warehouseRows[0].status || ""
        ).toUpperCase() !== "ACTIVE"
      ) {
        throw new Error(
          "Selected pickup warehouse is inactive"
        );
      }

      if (
        Number(
          warehouseRows[0].delhivery_registered
        ) !== 1
      ) {
        throw new Error(
          "Selected pickup warehouse is not registered with Delhivery"
        );
      }

      // ==========================================
      // UPDATE WAREHOUSE REFERENCE
      // ==========================================
      await txQuery(
        `
          UPDATE orders
          SET
            warehouse_id = ?
          WHERE
            id = ?
            AND user_id = ?
            AND UPPER(status) = 'PROCESSING'
        `,
        [
          requestedWarehouseId,
          orderId,
          userId,
        ],
      );

      // ==========================================
      // UPDATE PICKUP ADDRESS
      // ==========================================
      await txQuery(
        `
          UPDATE pickup_addresses
          SET
            pickup_address = ?,
            pickup_pincode = ?,
            pickup_city = ?
          WHERE
            id = ?
            AND user_id = ?
        `,
        [
          pickupData?.pickup_address || "",
          pickupData?.pickup_pincode || "",
          pickupData?.pickup_city || null,
          pickupAddressId,
          userId,
        ],
      );

      // ==========================================
      // UPDATE ORDER
      // ==========================================
      await txQuery(
        `
          UPDATE orders
          SET
            consignee_name = ?,
            mobile = ?,
            alternate_mobile = ?,
            email = ?,

            gstin = ?,
            company_name = ?,
            floor_no = ?,
            landmark = ?,

            address_line1 = ?,
            address_line2 = ?,

            pincode = ?,
            city = ?,
            state = ?,
            country = ?,

            payment_type = ?,
            risk_type = ?
          WHERE
            id = ?
            AND user_id = ?
            AND UPPER(status) = 'PROCESSING'
        `,
        [
          orderData?.consignee_name || "",
          orderData?.mobile || "",
          orderData?.alternate_mobile || null,
          orderData?.email || null,

          orderData?.gstin || null,
          orderData?.company_name || null,
          orderData?.floor_no || null,
          orderData?.landmark || null,

          orderData?.address_line1 || "",
          orderData?.address_line2 || null,

          orderData?.pincode || "",
          orderData?.city || "",
          orderData?.state || "",
          orderData?.country || "India",

          orderData?.payment_type || "Prepaid",
          orderData?.risk_type || "Owner Risk",

          orderId,
          userId,
        ],
      );

      // ==========================================
      // DELETE OLD PRODUCTS
      // ==========================================
      await txQuery(
        `
          DELETE FROM order_products
          WHERE order_id = ?
        `,
        [orderId],
      );

      // ==========================================
      // INSERT NEW PRODUCTS
      // ==========================================
      if (Array.isArray(products)) {
        for (const product of products) {
          await txQuery(
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
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              orderId,
              product?.product_name || "",
              product?.sku || null,
              Number(product?.price) || 0,
              Number(product?.qty) || 1,
              Number(product?.tax) || 0,
            ],
          );
        }
      }

      // ==========================================
      // DELETE OLD PACKAGES
      // ==========================================
      await txQuery(
        `
          DELETE FROM order_packages
          WHERE order_id = ?
        `,
        [orderId],
      );

      // ==========================================
      // INSERT NEW PACKAGES
      // ==========================================
      if (Array.isArray(packages)) {
        for (const pkg of packages) {
          await txQuery(
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
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              orderId,
              Number(pkg?.length) || 0,
              Number(pkg?.width) || 0,
              Number(pkg?.height) || 0,
              Number(pkg?.weight) || 0,
              Number(pkg?.package_count) || 1,
            ],
          );
        }
      }

      // ==========================================
      // COMMIT
      // ==========================================
      await connection.commit();

      resolve({
  success: true,
  message: "Order updated successfully",
  order_id: orderId,
  warehouse_id: requestedWarehouseId,
});
    } catch (error) {
      // ==========================================
      // ROLLBACK
      // ==========================================
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.log(
            "Rollback error:",
            rollbackError
          );
        }
      }

      reject(error);
    } finally {
      // ==========================================
      // RELEASE CONNECTION
      // ==========================================
      if (connection) {
        connection.release();
      }
    }
  });
};


// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

const deleteProcessingOrders = (
  userId,
  orderIds,
) => {

  return new Promise(
    async (
      resolve,
      reject
    ) => {

      if (
        !Array.isArray(orderIds) ||
        orderIds.length === 0
      ) {

        return reject(
          new Error(
            "No orders selected"
          )
        );

      }


      try {

        const placeholders =
          orderIds
            .map(
              () => "?"
            )
            .join(
              ","
            );


        const result =
          await runQuery(
            `
              DELETE FROM orders
              WHERE
                user_id = ?
                AND id IN (
                  ${placeholders}
                )
                AND UPPER(status) =
                  'PROCESSING'
            `,
            [
              userId,
              ...orderIds,
            ]
          );


        return resolve({

          success:
            true,

          deleted:
            result.affectedRows,

        });


      } catch (
        error
      ) {

        return reject(
          error
        );

      }

    }
  );

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  createPickupAddress,

  createOrder,

  createProduct,

  createPackage,

  getProcessingOrders,

  getAllOrders,

  getOrderById,

  updateOrder,

  deleteProcessingOrders,

};