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
// TRANSACTION QUERY HELPER
// ======================================================

const txQuery = async (
  connection,
  sql,
  params = []
) => {
  const [result] = await connection.query(
    sql,
    params
  );

  return result;
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

        m.id AS manifest_id,
        m.order_id,
        m.user_id AS manifest_user_id,

        m.shipping_charge,
        m.zone,
        m.distance_km,
        m.service_type,
        m.status AS manifest_status,
        m.created_at AS manifest_created_at,

        o.id AS order_db_id,
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

        o.status AS order_status,
        o.created_at AS order_created_at,

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

        awb:
          row.awb
            ? String(
                row.awb
              ).trim()
            : null,

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

        payment_type:
          row.payment_type,

        risk_type:
          row.risk_type,

        pickup_address:
          row.pickup_address,

        pickup_pincode:
          row.pickup_pincode,

        pickup_city:
          row.pickup_city,

        order_status:
          row.order_status,

        products: [],

        packages: [],

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

    const hasPackageData =
      row.length !== null ||
      row.width !== null ||
      row.height !== null ||
      row.weight !== null;


    if (
      hasPackageData
    ) {

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
        !packageExists
      ) {

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


        manifest.total_weight +=
          packageWeight *
          packageCount;

      }

    }

  }


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
// DELHIVERY CANCEL + WALLET REFUND
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
    !Array.isArray(order_ids) ||
    order_ids.length === 0
  ) {
    throw new Error(
      "At least one order must be selected"
    );
  }


  // ====================================================
  // CLEAN ORDER IDS
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


  const placeholders =
    uniqueOrderIds
      .map(
        () => "?"
      )
      .join(",");


  // ====================================================
  // GET MANIFESTED ORDERS
  // ====================================================

  const shipments =
    await query(
      `
        SELECT

          m.id AS manifest_id,
          m.order_id,
          m.shipping_charge,

          o.awb,
          o.status AS order_status

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
      `,
      [
        user_id,
        ...uniqueOrderIds
      ]
    );


  if (
    shipments.length === 0
  ) {

    throw new Error(
      "No manifested orders found"
    );

  }


  // ====================================================
  // DELHIVERY TOKEN
  // ====================================================

  const token =
    process.env.DELHIVERY_API_TOKEN ||
    process.env.DELHIVERY_AUTH_TOKEN ||
    process.env.DELHIVERY_TOKEN;


  if (!token) {

    throw new Error(
      "Delhivery API token is not configured"
    );

  }


  // ====================================================
  // DELHIVERY URL
  // ====================================================

  const baseUrl =
    process.env.DELHIVERY_API_BASE_URL ||
    "https://track.delhivery.com";


  const url =
    new URL(
      "/api/p/edit",
      baseUrl
    ).toString();


  // ====================================================
  // CANCEL ON DELHIVERY
  // ====================================================

  const cancelled = [];
  const failed = [];


  for (
    const shipment of shipments
  ) {

    const awb =
      String(
        shipment.awb || ""
      ).trim();


    // ==================================================
    // AWB REQUIRED
    // ==================================================

    if (!awb) {

      failed.push({

        order_id:
          shipment.order_id,

        manifest_id:
          shipment.manifest_id,

        message:
          "AWB not found"

      });

      continue;

    }


    try {

      const response =
        await fetch(
          url,
          {
            method:
              "POST",

            headers: {

              Authorization:
                `Token ${token}`,

              Accept:
                "application/json",

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                waybill:
                  awb,

                cancellation:
                  "true"

              })

          }
        );


      let data = null;


      try {

        data =
          await response.json();

      } catch {

        data = null;

      }


      console.log(
        "DELHIVERY CANCEL RESPONSE:",
        {
          awb,
          status:
            response.status,
          data
        }
      );


      if (
        !response.ok
      ) {

        throw new Error(

          data?.error ||

          data?.message ||

          data?.detail ||

          `Delhivery returned HTTP ${response.status}`

        );

      }


      cancelled.push({

        order_id:
          shipment.order_id,

        manifest_id:
          shipment.manifest_id,

        awb,

        shipping_charge:
          Number(
            shipment.shipping_charge || 0
          ),

        response:
          data

      });


    } catch (error) {

      failed.push({

        order_id:
          shipment.order_id,

        manifest_id:
          shipment.manifest_id,

        awb,

        message:
          error.message ||
          "Unable to cancel shipment"

      });

    }

  }


  // ====================================================
  // NOTHING CANCELLED
  // ====================================================

  if (
    cancelled.length === 0
  ) {

    throw new Error(
      failed[0]?.message ||
      "Unable to cancel selected shipments on Delhivery"
    );

  }


   // ====================================================
  // DATABASE TRANSACTION
  // ====================================================

  let connection = null;

  try {

    // Get dedicated connection from pool
    connection = await db.promise().getConnection();

    // Start transaction
    await connection.beginTransaction();


    const successfulIds =
      cancelled.map(
        (item) =>
          item.order_id
      );


    const successfulPlaceholders =
      successfulIds
        .map(
          () => "?"
        )
        .join(",");


    // ==================================================
    // GET / LOCK WALLET
    // ==================================================

    const walletRows =
      await txQuery(
        connection,
        `
          SELECT
            id,
            user_id,
            balance
          FROM wallets
          WHERE
            user_id = ?
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


    // ==================================================
    // CALCULATE REFUND
    // ==================================================

    const totalRefund =
      cancelled.reduce(
        (
          total,
          shipment
        ) => {

          return (
            total +
            Number(
              shipment.shipping_charge || 0
            )
          );

        },
        0
      );


    if (
      !Number.isFinite(
        totalRefund
      ) ||
      totalRefund <= 0
    ) {

      throw new Error(
        "Invalid refund amount"
      );

    }


    // ==================================================
    // ADD REFUND TO WALLET
    // ==================================================

    const walletUpdate =
      await txQuery(
        connection,
        `
          UPDATE wallets
          SET
            balance = balance + ?
          WHERE
            user_id = ?
        `,
        [
          totalRefund,
          user_id
        ]
      );


    if (
      walletUpdate.affectedRows !== 1
    ) {

      throw new Error(
        "Unable to refund shipping charge"
      );

    }


    // ==================================================
    // WALLET TRANSACTION
    //
    // REFUND = RECHARGE
    // ==================================================

    for (
      const shipment of cancelled
    ) {

      const refundAmount =
        Number(
          shipment.shipping_charge || 0
        );


      if (
        !Number.isFinite(
          refundAmount
        ) ||
        refundAmount <= 0
      ) {

        throw new Error(
          `Invalid refund amount for Order #${shipment.order_id}`
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
            'RECHARGE',
            ?,
            NULL,
            NULL,
            NULL,
            'SUCCESS'
          )
        `,
        [
          user_id,
          refundAmount
        ]
      );

    }


    // ==================================================
    // CANCEL MANIFESTS
    // ==================================================

    const manifestUpdate =
      await txQuery(
        connection,
        `
          UPDATE manifests
          SET
            status = 'Cancelled'
          WHERE
            user_id = ?
            AND order_id IN (
              ${successfulPlaceholders}
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
          ...successfulIds
        ]
      );


    if (
      manifestUpdate.affectedRows !==
      successfulIds.length
    ) {

      throw new Error(
        "Unable to cancel selected manifests"
      );

    }


    // ==================================================
    // CANCEL ORDERS
    // ==================================================

    const orderUpdate =
      await txQuery(
        connection,
        `
          UPDATE orders
          SET
            status = 'Cancelled'
          WHERE
            user_id = ?
            AND id IN (
              ${successfulPlaceholders}
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
          ...successfulIds
        ]
      );


    if (
      orderUpdate.affectedRows !==
      successfulIds.length
    ) {

      throw new Error(
        "Unable to cancel selected orders"
      );

    }


    // ==================================================
    // GET FINAL WALLET BALANCE
    // ==================================================

    const updatedWallet =
      await txQuery(
        connection,
        `
          SELECT
            balance
          FROM wallets
          WHERE
            user_id = ?
          LIMIT 1
        `,
        [
          user_id
        ]
      );


    const remainingBalance =
      Number(
        updatedWallet[0]?.balance || 0
      );


    // ==================================================
    // COMMIT
    // ==================================================

    await connection.commit();


    // Release connection back to pool
    connection.release();
    connection = null;


    // ==================================================
    // SUCCESS
    // ==================================================

    return {

      success:
        true,

      message:
        failed.length > 0
          ? "Some shipments cancelled and refunded successfully"
          : "Selected shipments cancelled and refunded successfully",

      cancelled_orders:
        successfulIds,

      total_cancelled:
        successfulIds.length,

      refund_amount:
        Number(
          totalRefund.toFixed(2)
        ),

      wallet_balance:
        Number(
          remainingBalance.toFixed(2)
        ),

      failed_orders:
        failed

    };


  } catch (error) {

    // ==================================================
    // ROLLBACK
    // ==================================================

    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.log(
          "Rollback error:",
          rollbackError
        );

      }


      try {

        connection.release();

      } catch (releaseError) {

        console.log(
          "Connection release error:",
          releaseError
        );

      }

    }


    console.log(
      "Cancel manifested orders + refund error:",
      error
    );


    throw error;

  }

  

    

  }




// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getManifestedOrders,

  getManifestById,

  cancelManifestedOrders

};