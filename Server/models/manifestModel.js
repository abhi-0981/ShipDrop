const db = require("../config/db");


// ======================================================
// QUERY HELPER
// ======================================================

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


// ======================================================
// GET MANIFESTED ORDERS
// ======================================================

const getManifestedOrders = async (
  user_id
) => {

  if (!user_id) {
    throw new Error(
      "User ID is required"
    );
  }


  const rows = await query(
    `
      SELECT

        /* ==========================================
           MANIFEST
        ========================================== */

        m.id AS manifest_id,
        m.order_id,
        m.user_id AS manifest_user_id,

        m.shipping_charge,
        m.zone,
        m.distance_km,
        m.service_type,
        m.status AS manifest_status,
        m.created_at AS manifest_created_at,


        /* ==========================================
           ORDER
        ========================================== */

        o.id AS order_db_id,
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

        o.status AS order_status,
        o.created_at AS order_created_at,


        /* ==========================================
           PICKUP ADDRESS
        ========================================== */

        pa.pickup_address,
        pa.pickup_pincode,
        pa.pickup_city,


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


      FROM manifests m


      INNER JOIN orders o
        ON o.id = m.order_id
       AND o.user_id = m.user_id


      LEFT JOIN pickup_addresses pa
        ON pa.id = o.pickup_address_id


      LEFT JOIN order_products op
        ON op.order_id = o.id


      LEFT JOIN order_packages pkg
        ON pkg.order_id = o.id


      WHERE
        m.user_id = ?

        AND UPPER(
          COALESCE(
            m.status,
            ''
          )
        ) = 'CONFIRMED'

        AND UPPER(
          COALESCE(
            o.status,
            ''
          )
        ) = 'MANIFESTED'


      ORDER BY
        m.created_at DESC
    `,
    [
      user_id
    ]
  );


  // ====================================================
  // GROUP DATA BY MANIFEST
  // ====================================================

  const manifestMap = {};


  for (
    const row of rows
  ) {

    const manifestId =
      row.manifest_id;


    // ================================================
    // CREATE MANIFEST OBJECT
    // ================================================

    if (
      !manifestMap[
        manifestId
      ]
    ) {

      manifestMap[
        manifestId
      ] = {

        manifest_id:
          row.manifest_id,

        order_id:
          row.order_id,

        user_id:
          row.manifest_user_id,


        shipping_charge:
          Number(
            row.shipping_charge || 0
          ),

        zone:
          row.zone,

        distance_km:
          Number(
            row.distance_km || 0
          ),


        service_type:
          row.service_type ||
          "ROAD",


        status:
          row.manifest_status ||
          "Confirmed",


        created_at:
          row.manifest_created_at ||
          row.order_created_at,


        // ==========================================
        // CUSTOMER
        // ==========================================

        consignee_name:
          row.consignee_name,

        mobile:
          row.mobile,

        alternate_mobile:
          row.alternate_mobile,

        email:
          row.email,


        // ==========================================
        // DELIVERY ADDRESS
        // ==========================================

        gstin:
          row.gstin,

        company_name:
          row.company_name,

        floor_no:
          row.floor_no,

        landmark:
          row.landmark,


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


        // ==========================================
        // PAYMENT
        // ==========================================

        payment_type:
          row.payment_type,

        risk_type:
          row.risk_type,


        // ==========================================
        // PICKUP
        // ==========================================

        pickup_address:
          row.pickup_address,

        pickup_pincode:
          row.pickup_pincode,

        pickup_city:
          row.pickup_city,


        // ==========================================
        // ORDER STATUS
        // ==========================================

        order_status:
          row.order_status,


        // ==========================================
        // PRODUCTS
        // ==========================================

        products: [],


        // ==========================================
        // PACKAGES
        // ==========================================

        packages: [],


        // ==========================================
        // TOTAL WEIGHT
        // ==========================================

        total_weight: 0

      };

    }


    const manifest =
      manifestMap[
        manifestId
      ];


    // =================================================
    // PRODUCT
    // =================================================

    if (
      row.product_name !== null &&
      row.product_name !== undefined
    ) {

      const productExists =
        manifest.products.some(
          (product) =>

            product.product_name ===
              row.product_name &&

            String(
              product.sku || ""
            ) ===
              String(
                row.sku || ""
              )
        );


      if (!productExists) {

        manifest.products.push({

          product_name:
            row.product_name,

          sku:
            row.sku,

          price:
            Number(
              row.price || 0
            ),

          qty:
            Number(
              row.qty || 1
            ),

          tax:
            Number(
              row.tax || 0
            )

        });

      }

    }


    // =================================================
    // PACKAGE
    // =================================================

    const packageExists =
      manifest.packages.some(
        (pkg) =>

          String(
            pkg.length
          ) ===
            String(
              row.length
            ) &&

          String(
            pkg.width
          ) ===
            String(
              row.width
            ) &&

          String(
            pkg.height
          ) ===
            String(
              row.height
            ) &&

          String(
            pkg.weight
          ) ===
            String(
              row.weight
            ) &&

          String(
            pkg.package_count
          ) ===
            String(
              row.package_count
            )
      );


    if (
      (
        row.length !== null &&
        row.length !== undefined
      ) ||

      (
        row.width !== null &&
        row.width !== undefined
      ) ||

      (
        row.height !== null &&
        row.height !== undefined
      ) ||

      (
        row.weight !== null &&
        row.weight !== undefined
      )
    ) {

      if (!packageExists) {

        const packageWeight =
          Number(
            row.weight || 0
          );

        const packageCount =
          Number(
            row.package_count || 1
          );


        manifest.packages.push({

          length:
            Number(
              row.length || 0
            ),

          width:
            Number(
              row.width || 0
            ),

          height:
            Number(
              row.height || 0
            ),

          weight:
            packageWeight,

          package_count:
            packageCount

        });


        // ==========================================
        // TOTAL WEIGHT
        // ==========================================

        manifest.total_weight +=
          packageWeight *
          packageCount;

      }

    }

  }


  // ====================================================
  // RETURN ARRAY
  // ====================================================

  return Object.values(
    manifestMap
  );

};


// ======================================================
// GET SINGLE MANIFEST
// ======================================================

const getManifestById = async (
  user_id,
  manifest_id
) => {

  if (!user_id) {
    throw new Error(
      "User ID is required"
    );
  }


  if (!manifest_id) {
    throw new Error(
      "Manifest ID is required"
    );
  }


  const manifests =
    await getManifestedOrders(
      user_id
    );


  const manifest =
    manifests.find(
      (item) =>
        Number(
          item.manifest_id
        ) ===
        Number(
          manifest_id
        )
    );


  if (!manifest) {

    throw new Error(
      "Manifest not found"
    );

  }


  return manifest;

};


// ======================================================
// CANCEL MANIFESTED ORDERS
// ======================================================

const cancelManifestedOrders = async (
  user_id,
  order_ids
) => {

  if (!user_id) {

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


  // ====================================================
  // CLEAN IDS
  // ====================================================

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
    )
  ];


  if (
    uniqueOrderIds.length === 0
  ) {

    throw new Error(
      "Invalid order selection"
    );

  }


  // ====================================================
  // PLACEHOLDERS
  // ====================================================

  const placeholders =
    uniqueOrderIds
      .map(
        () => "?"
      )
      .join(",");


  // ====================================================
  // START TRANSACTION
  // ====================================================

  await new Promise(
    (
      resolve,
      reject
    ) => {

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


  try {

    // ==================================================
    // CHECK MANIFESTED ORDERS
    // ==================================================

    const existingRows =
      await query(
        `
          SELECT

            m.id AS manifest_id,
            m.order_id,
            m.shipping_charge

          FROM manifests m

          INNER JOIN orders o
            ON o.id = m.order_id
           AND o.user_id = m.user_id

          WHERE
            m.user_id = ?

            AND m.order_id IN (
              ${placeholders}
            )

            AND UPPER(
              COALESCE(
                m.status,
                ''
              )
            ) = 'CONFIRMED'

            AND UPPER(
              COALESCE(
                o.status,
                ''
              )
            ) = 'MANIFESTED'

          FOR UPDATE
        `,
        [
          user_id,
          ...uniqueOrderIds
        ]
      );


    if (
      existingRows.length === 0
    ) {

      throw new Error(
        "No manifested orders found"
      );

    }


    // ==================================================
    // CANCEL MANIFESTS
    // ==================================================

    const validOrderIds =
      existingRows.map(
        (row) =>
          row.order_id
      );


    const cancelPlaceholders =
      validOrderIds
        .map(
          () => "?"
        )
        .join(",");


    await query(
      `
        UPDATE manifests

        SET
          status = 'Cancelled'

        WHERE
          user_id = ?

          AND order_id IN (
            ${cancelPlaceholders}
          )

          AND UPPER(
            COALESCE(
              status,
              ''
            )
          ) = 'CONFIRMED'
      `,
      [
        user_id,
        ...validOrderIds
      ]
    );


    // ==================================================
    // UPDATE ORDERS
    // ==================================================

    const orderUpdate =
      await query(
        `
          UPDATE orders

          SET
            status = 'Cancelled'

          WHERE
            user_id = ?

            AND id IN (
              ${cancelPlaceholders}
            )

            AND UPPER(
              COALESCE(
                status,
                ''
              )
            ) = 'MANIFESTED'
        `,
        [
          user_id,
          ...validOrderIds
        ]
      );


    if (
      orderUpdate.affectedRows === 0
    ) {

      throw new Error(
        "Unable to cancel selected orders"
      );

    }


    // ==================================================
    // COMMIT
    // ==================================================

    await new Promise(
      (
        resolve,
        reject
      ) => {

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


    // ==================================================
    // SUCCESS
    // ==================================================

    return {

      success: true,

      message:
        "Selected shipments cancelled successfully",

      cancelled_orders:
        validOrderIds,

      total_cancelled:
        validOrderIds.length

    };


  } catch (error) {

    // ==================================================
    // ROLLBACK
    // ==================================================

    await new Promise(
      (resolve) => {

        db.rollback(
          () => {
            resolve();
          }
        );

      }
    );


    console.log(
      "Cancel manifested orders error:",
      error
    );


    throw error;

  }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getManifestedOrders,

  getManifestById,

  cancelManifestedOrders

};