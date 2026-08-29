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

  // Prevent infinite retry
  if (attempts >= 10) {

    return callback(
      new Error(
        "Unable to generate unique order ID"
      )
    );

  }


  // Generate 6 digit number
  const orderId = String(
    crypto.randomInt(
      100000,
      1000000
    )
  );


  // Check if already exists
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


      // Already exists
      if (rows.length > 0) {

        return generateUniqueOrderId(
          callback,
          attempts + 1
        );

      }


      // Unique
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

  // Generate public 6 digit Order ID
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;


      db.query(
        query,
        [

          publicOrderId,

          orderData.user_id,

          orderData.pickup_address_id,

          orderData.consignee_name,

          orderData.mobile,

          orderData.alternate_mobile || null,

          orderData.email || null,

          orderData.gstin || null,

          orderData.company_name || null,

          orderData.floor_no || null,

          orderData.landmark || null,

          orderData.address_line1,

          orderData.address_line2 || null,

          orderData.pincode,

          orderData.city,

          orderData.state,

          orderData.country || "India",

          orderData.payment_type || "Prepaid",

          orderData.risk_type || "Owner Risk",

          "Processing",

        ],

        (err, result) => {

          if (err) {
            return callback(err);
          }


          // Return both IDs
          return callback(
            null,
            {
              insertId:
                result.insertId,

              orderId:
                publicOrderId,
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
  product,
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

      product.order_id,

      product.product_name,

      product.sku || null,

      product.price,

      product.qty,

      product.tax,

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

      packageData.length,

      packageData.width,

      packageData.height,

      packageData.weight,

      packageData.package_count,

    ],
    callback,
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

      /* ORDER */

      o.id,
      o.order_id,
      o.user_id,
      o.pickup_address_id,

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


      /* PICKUP */

      pa.pickup_address,
      pa.pickup_pincode,
      pa.pickup_city,


      /* PRODUCT */

      op.product_name,
      op.sku,
      op.price,
      op.qty,
      op.tax,


      /* PACKAGE */

      pkg.length,
      pkg.width,
      pkg.height,
      pkg.weight,
      pkg.package_count


    FROM orders o


    LEFT JOIN pickup_addresses pa
      ON pa.id =
        o.pickup_address_id


    LEFT JOIN order_products op
      ON op.order_id =
        o.id


    LEFT JOIN order_packages pkg
      ON pkg.order_id =
        o.id


    WHERE
  o.user_id = ?
  AND UPPER(o.status) =
    'PROCESSING'


    ORDER BY
      o.created_at DESC
  `;


  db.query(
  query,
  [user_id],
  (err, rows) => {

      if (err) {

        console.log(
          "Get processing orders error:",
          err
        );

        return callback(
          err,
          null
        );

      }


      const orderMap = {};


      rows.forEach(
        (row) => {

          if (!orderMap[row.id]) {

            orderMap[row.id] = {

              // INTERNAL DB ID
              id:
                row.id,

              // PUBLIC 6 DIGIT ID
              order_id:
                row.order_id,


              user_id:
                row.user_id,


              pickup_address_id:
                row.pickup_address_id,


              // CUSTOMER

              consignee_name:
                row.consignee_name,

              mobile:
                row.mobile,

              alternate_mobile:
                row.alternate_mobile,

              email:
                row.email,

              gstin:
                row.gstin,

              company_name:
                row.company_name,

              floor_no:
                row.floor_no,

              landmark:
                row.landmark,


              // DELIVERY

              address_line1:
                row.address_line1,

              address_line2:
                row.address_line2,

              pincode:
                row.pincode,

              city:
                row.city,

              state:
                row.state,

              country:
                row.country,


              // PICKUP

              pickup_address:
                row.pickup_address,

              pickup_pincode:
                row.pickup_pincode,

              pickup_city:
                row.pickup_city,


              // PAYMENT

              payment_type:
                row.payment_type,

              risk_type:
                row.risk_type,


              // STATUS

              status:
                row.status,

              created_at:
                row.created_at,


              // CHILD DATA

              products: [],

              packages: [],

            };

          }


          // ==========================================
          // PRODUCT
          // ==========================================

          if (
            row.product_name !== null &&
            row.product_name !== undefined
          ) {

            const alreadyExists =
              orderMap[row.id]
                .products
                .some(
                  (product) =>
                    product.product_name ===
                      row.product_name &&
                    String(
                      product.sku || ""
                    ) ===
                      String(
                        row.sku || ""
                      ),
                );


            if (!alreadyExists) {

              orderMap[row.id]
                .products
                .push({

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

          }


          // ==========================================
          // PACKAGE
          // ==========================================

          if (
            row.length !== null ||
            row.width !== null ||
            row.height !== null ||
            row.weight !== null ||
            row.package_count !== null
          ) {

            const alreadyExists =
              orderMap[row.id]
                .packages
                .some(
                  (pkg) =>
                    String(pkg.length) ===
                      String(row.length) &&

                    String(pkg.width) ===
                      String(row.width) &&

                    String(pkg.height) ===
                      String(row.height) &&

                    String(pkg.weight) ===
                      String(row.weight),
                );


            if (!alreadyExists) {

              orderMap[row.id]
                .packages
                .push({

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


      return callback(
        null,
        Object.values(orderMap)
      );

    }
  );

};


// ======================================================
// GET SINGLE PROCESSING ORDER
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

          o.id,
          o.order_id,
          o.user_id,
          o.pickup_address_id,

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


          pa.pickup_address,
          pa.pickup_pincode,
          pa.pickup_city,


          op.product_name,
          op.sku,
          op.price,
          op.qty,
          op.tax,


          pkg.length,
          pkg.width,
          pkg.height,
          pkg.weight,
          pkg.package_count


        FROM orders o


        LEFT JOIN pickup_addresses pa
          ON pa.id =
            o.pickup_address_id


        LEFT JOIN order_products op
          ON op.order_id =
            o.id


        LEFT JOIN order_packages pkg
          ON pkg.order_id =
            o.id


        WHERE
          o.id = ?
          AND o.user_id = ?

          AND
          UPPER(o.status) =
            'PROCESSING'
      `;


      db.query(
        query,
        [orderId,userId],
        (err, rows) => {

          if (err) {
            return reject(err);
          }


          if (rows.length === 0) {
            return resolve(null);
          }


          const first =
            rows[0];


          const order = {

            // INTERNAL ID
            id:
              first.id,

            // PUBLIC 6 DIGIT ID
            order_id:
              first.order_id,


            user_id:
              first.user_id,

            pickup_address_id:
              first.pickup_address_id,


            consignee_name:
              first.consignee_name,

            mobile:
              first.mobile,

            alternate_mobile:
              first.alternate_mobile,

            email:
              first.email,


            gstin:
              first.gstin,

            company_name:
              first.company_name,

            floor_no:
              first.floor_no,

            landmark:
              first.landmark,


            address_line1:
              first.address_line1,

            address_line2:
              first.address_line2,


            pincode:
              first.pincode,

            city:
              first.city,

            state:
              first.state,

            country:
              first.country,


            pickup_address:
              first.pickup_address,

            pickup_pincode:
              first.pickup_pincode,

            pickup_city:
              first.pickup_city,


            payment_type:
              first.payment_type,

            risk_type:
              first.risk_type,


            status:
              first.status,

            created_at:
              first.created_at,


            products: [],

            packages: [],

          };


          const productKeys =
            new Set();


          const packageKeys =
            new Set();


          rows.forEach(
            (row) => {

              // ========================================
              // PRODUCT
              // ========================================

              if (
                row.product_name !== null &&
                row.product_name !== undefined
              ) {

                const key =
                  `${row.product_name}|${row.sku || ""}`;


                if (
                  !productKeys.has(key)
                ) {

                  productKeys.add(key);


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

              }


              // ========================================
              // PACKAGE
              // ========================================

              if (
                row.length !== null ||
                row.width !== null ||
                row.height !== null ||
                row.weight !== null ||
                row.package_count !== null
              ) {

                const key = [

                  row.length,

                  row.width,

                  row.height,

                  row.weight,

                  row.package_count,

                ].join("|");


                if (
                  !packageKeys.has(key)
                ) {

                  packageKeys.add(key);


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


          resolve(order);

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

  return new Promise(
    async (
      resolve,
      reject
    ) => {

      db.beginTransaction(
        async (
          transactionError
        ) => {

          if (transactionError) {
            return reject(
              transactionError
            );
          }


          const rollback = (
            error
          ) => {

            db.rollback(
              () => {
                reject(error);
              }
            );

          };


          try {

            // ==========================================
            // CHECK ORDER
            // ==========================================

            const orderRows =
              await runQuery(
                `
                  SELECT
                    id,
                    order_id,
                    pickup_address_id
                  FROM orders
                  WHERE
                    id = ?
                    AND user_id = ?
                    AND UPPER(status) = 'PROCESSING'
                  LIMIT 1
                `,
                [
                  orderId,
                  userId,
                ],
              );


            if (
              orderRows.length === 0
            ) {

              throw new Error(
                "Processing order not found"
              );

            }


            const pickupAddressId =
              orderRows[0]
                .pickup_address_id;


            // ==========================================
            // UPDATE PICKUP
            // ==========================================

            await runQuery(
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

                pickupData.pickup_address,

                pickupData.pickup_pincode,

                pickupData.pickup_city ||
                  null,

                pickupAddressId,

                userId,

              ],
            );


            // ==========================================
            // UPDATE ORDER
            // ==========================================

            await runQuery(
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


                orderId,

                userId,

              ],
            );


            // ==========================================
            // DELETE OLD PRODUCTS
            // ==========================================

            await runQuery(
              `
                DELETE FROM order_products
                WHERE order_id = ?
              `,
              [orderId],
            );


            // ==========================================
            // INSERT NEW PRODUCTS
            // ==========================================

            if (
              Array.isArray(products)
            ) {

              for (
                const product of products
              ) {

                await runQuery(
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

                  ],
                );

              }

            }


            // ==========================================
            // DELETE OLD PACKAGES
            // ==========================================

            await runQuery(
              `
                DELETE FROM order_packages
                WHERE order_id = ?
              `,
              [orderId],
            );


            // ==========================================
            // INSERT NEW PACKAGES
            // ==========================================

            if (
              Array.isArray(packages)
            ) {

              for (
                const pkg of packages
              ) {

                await runQuery(
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

                    Number(
                      pkg.length
                    ) || 0,

                    Number(
                      pkg.width
                    ) || 0,

                    Number(
                      pkg.height
                    ) || 0,

                    Number(
                      pkg.weight
                    ) || 0,

                    Number(
                      pkg.package_count
                    ) || 1,

                  ],
                );

              }

            }


            // ==========================================
            // COMMIT
            // ==========================================

            db.commit(
              (commitError) => {

                if (commitError) {
                  return rollback(
                    commitError
                  );
                }


                resolve(true);

              }
            );

          } catch (error) {

            rollback(error);

          }

        }
      );

    }
  );

};


// ======================================================
// QUERY HELPER FOR TRANSACTION
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
          err,
          result
        ) => {

          if (err) {
            return reject(err);
          }


          resolve(result);

        }
      );

    }
  );

};


// ======================================================
// DELETE PROCESSING ORDERS
// ======================================================

const deleteProcessingOrders = (
  user_id,
  order_ids,
) => {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if (!user_id) {

        return reject(
          new Error(
            "User ID is required"
          )
        );

      }


      if (
        !Array.isArray(order_ids) ||
        order_ids.length === 0
      ) {

        return reject(
          new Error(
            "Please select at least one order"
          )
        );

      }


      const validIds = [

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
            ),

        ),

      ];


      if (
        validIds.length === 0
      ) {

        return reject(
          new Error(
            "Invalid order IDs"
          )
        );

      }


      const placeholders =
        validIds
          .map(
            () => "?"
          )
          .join(",");


      // ==========================================
      // PRODUCTS
      // ==========================================

      db.query(
        `
          DELETE FROM order_products
          WHERE order_id IN
            (${placeholders})
        `,
        validIds,
        (
          productError
        ) => {

          if (productError) {
            return reject(
              productError
            );
          }


          // ==========================================
          // PACKAGES
          // ==========================================

          db.query(
            `
              DELETE FROM order_packages
              WHERE order_id IN
                (${placeholders})
            `,
            validIds,
            (
              packageError
            ) => {

              if (packageError) {
                return reject(
                  packageError
                );
              }


              // ==========================================
              // ORDERS
              // ==========================================

              db.query(
                `
                  DELETE FROM orders
                  WHERE
                    user_id = ?
                    AND UPPER(status) =
                      'PROCESSING'
                    AND id IN
                      (${placeholders})
                `,
                [
                  user_id,
                  ...validIds,
                ],
                (
                  orderError,
                  result
                ) => {

                  if (orderError) {
                    return reject(
                      orderError
                    );
                  }


                  resolve(
                    result.affectedRows
                  );

                },
              );

            },
          );

        },
      );

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

  getOrderById,

  updateOrder,

  deleteProcessingOrders,

};