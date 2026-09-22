const XLSX = require("xlsx");
const crypto = require("crypto");
const db = require("../config/db");

// ======================================================
// EXCEL IMPORT
// ======================================================

const REQUIRED_HEADERS = [
  "buyer_name",
  "buyer_mobile",
  "buyer_address1",
  "buyer_pincode",
  "buyer_city",
  "buyer_state",
  "payment_method",
  "count",
  "length",
  "width",
  "height",
  "weight",
  "product_name_1",
  "product_rate_1",
  "product_quantity_1",
  "product_total_1",
  "total_order_value",
];

const OPTIONAL_HEADERS = [
  "customer_ref_no",
  "alternate_buyer_mobile",
  "buyer_email",
  "buyer_address2",
  "cod_amount",
  "eway_bill_no",
  "invoice_number",
  "seller_name",
];

// ======================================================
// HELPERS
// ======================================================

const clean = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeHeader = (value) => {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");
};

const normalizePincode = (value) => {
  let valueText = clean(value);

  if (/^\d+\.0$/.test(valueText)) {
    valueText = valueText.replace(".0", "");
  }

  return valueText.replace(/\s+/g, "");
};

const normalizeMobile = (value) => {
  let valueText = clean(value);

  if (/^\d+\.0$/.test(valueText)) {
    valueText = valueText.replace(".0", "");
  }

  return valueText.replace(/\D/g, "");
};

const isBlank = (value) => {
  return clean(value) === "";
};

const isPositiveNumber = (value) => {
  if (isBlank(value)) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0;
};

const isPositiveInteger = (value) => {
  if (isBlank(value)) {
    return false;
  }

  const number = Number(value);

  return Number.isInteger(number) && number > 0;
};

const isNonNegativeNumber = (value) => {
  if (isBlank(value)) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0;
};

// ======================================================
// PAYMENT TYPE
// ======================================================

const normalizePaymentMethod = (value) => {
  const payment = clean(value).toUpperCase();

  if (payment === "PREPAID") {
    return "Prepaid";
  }

  if (payment === "COD") {
    return "COD";
  }

  if (
    payment === "TO PAY" ||
    payment === "TO_PAY" ||
    payment === "TOPAY"
  ) {
    return "To Pay";
  }

  return null;
};

// ======================================================
// DATABASE TRANSACTION
// ======================================================

const getTransactionConnection = () => {
  return new Promise((resolve, reject) => {
    // mysql2 pool
    if (typeof db.getConnection === "function") {
      return db.getConnection((error, connection) => {
        if (error) {
          return reject(error);
        }

        connection.beginTransaction((beginError) => {
          if (beginError) {
            try {
              connection.release();
            } catch (_) {}

            return reject(beginError);
          }

          resolve({
            connection,
            release: true,
          });
        });
      });
    }

    // mysql2 single connection
    if (typeof db.beginTransaction === "function") {
      return db.beginTransaction((error) => {
        if (error) {
          return reject(error);
        }

        resolve({
          connection: db,
          release: false,
        });
      });
    }

    reject(
      new Error(
        "Database connection does not support transactions. Check config/db.js"
      )
    );
  });
};

const runQuery = (
  connection,
  sql,
  params = []
) => {
  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      params,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );
  });
};

const commit = (transaction) => {
  return new Promise((resolve, reject) => {
    transaction.connection.commit(
      (error) => {
        if (error) {
          return reject(error);
        }

        if (transaction.release) {
          try {
            transaction.connection.release();
          } catch (_) {}
        }

        resolve();
      }
    );
  });
};

const rollback = (transaction) => {
  return new Promise((resolve) => {
    if (!transaction?.connection) {
      return resolve();
    }

    transaction.connection.rollback(() => {
      if (transaction.release) {
        try {
          transaction.connection.release();
        } catch (_) {}
      }

      resolve();
    });
  });
};

// ======================================================
// UNIQUE PUBLIC ORDER ID
// ======================================================

const generateUniqueOrderId = async (
  connection
) => {
  for (
    let attempt = 0;
    attempt < 20;
    attempt += 1
  ) {
    const orderId = String(
      crypto.randomInt(
        100000,
        1000000
      )
    );

    const rows = await runQuery(
      connection,
      `
        SELECT id
        FROM orders
        WHERE order_id = ?
        LIMIT 1
      `,
      [orderId]
    );

    if (rows.length === 0) {
      return orderId;
    }
  }

  throw new Error(
    "Unable to generate unique order ID"
  );
};

// ======================================================
// HEADER VALIDATION
// ======================================================

const validateHeaders = (
  headers
) => {
  const normalizedHeaders =
    new Set(
      headers
        .map(normalizeHeader)
        .filter(Boolean)
    );

  const missingColumns =
    REQUIRED_HEADERS.filter(
      (header) =>
        !normalizedHeaders.has(
          header
        )
    );

  if (
    missingColumns.length > 0
  ) {
    return {
      valid: false,
      errors: missingColumns.map(
        (column) =>
          `Column "${column}" is required in Excel`
      ),
    };
  }

  return {
    valid: true,
    errors: [],
  };
};

// ======================================================
// ROW VALIDATION
// ======================================================

const validateRow = (
  row,
  rowNumber
) => {
  const errors = [];

  // ----------------------------------------------------
  // BUYER NAME
  // ----------------------------------------------------

  if (
    isBlank(row.buyer_name)
  ) {
    errors.push(
      "buyer_name is required"
    );
  }

  // ----------------------------------------------------
  // MOBILE
  // ----------------------------------------------------

  const mobile =
    normalizeMobile(
      row.buyer_mobile
    );

  if (!mobile) {
    errors.push(
      "buyer_mobile is required"
    );
  } else if (
    !/^\d{10}$/.test(mobile)
  ) {
    errors.push(
      "buyer_mobile must be a valid 10-digit mobile number"
    );
  }

  // ----------------------------------------------------
  // ALTERNATE MOBILE
  // ----------------------------------------------------

  const alternateMobile =
    normalizeMobile(
      row.alternate_buyer_mobile
    );

  if (
    alternateMobile &&
    !/^\d{10}$/.test(
      alternateMobile
    )
  ) {
    errors.push(
      "alternate_buyer_mobile must be a valid 10-digit mobile number"
    );
  }

  // ----------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------

  if (
    isBlank(row.buyer_address1)
  ) {
    errors.push(
      "buyer_address1 is required"
    );
  }

  // ----------------------------------------------------
  // PINCODE
  // ----------------------------------------------------

  const pincode =
    normalizePincode(
      row.buyer_pincode
    );

  if (!pincode) {
    errors.push(
      "buyer_pincode is required"
    );
  } else if (
    !/^\d{6}$/.test(pincode)
  ) {
    errors.push(
      "buyer_pincode must be a valid 6-digit pincode"
    );
  }

  // ----------------------------------------------------
  // CITY
  // ----------------------------------------------------

  if (
    isBlank(row.buyer_city)
  ) {
    errors.push(
      "buyer_city is required"
    );
  }

  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------

  if (
    isBlank(row.buyer_state)
  ) {
    errors.push(
      "buyer_state is required"
    );
  }

  // ----------------------------------------------------
  // PAYMENT METHOD
  // ----------------------------------------------------

  const paymentType =
    normalizePaymentMethod(
      row.payment_method
    );

  if (
    isBlank(row.payment_method)
  ) {
    errors.push(
      "payment_method is required"
    );
  } else if (!paymentType) {
    errors.push(
      "payment_method must be PREPAID, COD or TO PAY"
    );
  }

  // ----------------------------------------------------
  // COD
  // ----------------------------------------------------

  if (paymentType === "COD") {
    if (
      !isPositiveNumber(
        row.cod_amount
      )
    ) {
      errors.push(
        "cod_amount is required and must be greater than 0 for COD"
      );
    }
  } else if (
    !isBlank(row.cod_amount) &&
    !isNonNegativeNumber(
      row.cod_amount
    )
  ) {
    errors.push(
      "cod_amount must be a valid number"
    );
  }

  // ----------------------------------------------------
  // PACKAGE COUNT
  // ----------------------------------------------------

  if (
    !isPositiveInteger(
      row.count
    )
  ) {
    errors.push(
      "count is required and must be a positive integer"
    );
  }

  // ----------------------------------------------------
  // LENGTH
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.length
    )
  ) {
    errors.push(
      "length is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // WIDTH
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.width
    )
  ) {
    errors.push(
      "width is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // HEIGHT
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.height
    )
  ) {
    errors.push(
      "height is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // WEIGHT
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.weight
    )
  ) {
    errors.push(
      "weight is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // PRODUCT NAME
  // ----------------------------------------------------

  if (
    isBlank(row.product_name_1)
  ) {
    errors.push(
      "product_name_1 is required"
    );
  }

  // ----------------------------------------------------
  // PRODUCT RATE
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.product_rate_1
    )
  ) {
    errors.push(
      "product_rate_1 is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // PRODUCT QUANTITY
  // ----------------------------------------------------

  if (
    !isPositiveInteger(
      row.product_quantity_1
    )
  ) {
    errors.push(
      "product_quantity_1 is required and must be a positive integer"
    );
  }

  // ----------------------------------------------------
  // PRODUCT TOTAL
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.product_total_1
    )
  ) {
    errors.push(
      "product_total_1 is required and must be greater than 0"
    );
  }

  // ----------------------------------------------------
  // TOTAL ORDER VALUE
  // ----------------------------------------------------

  if (
    !isPositiveNumber(
      row.total_order_value
    )
  ) {
    errors.push(
      "total_order_value is required and must be greater than 0"
    );
  }

  // ====================================================
  // NORMALIZED DATA
  // ====================================================

  return {
    row: rowNumber,

    errors,

    normalized: {
      buyer_name:
        clean(row.buyer_name),

      buyer_mobile:
        mobile,

      alternate_buyer_mobile:
        alternateMobile || null,

      buyer_email:
        clean(row.buyer_email) ||
        null,

      buyer_address1:
        clean(
          row.buyer_address1
        ),

      buyer_address2:
        clean(
          row.buyer_address2
        ) || null,

      buyer_pincode:
        pincode,

      buyer_city:
        clean(row.buyer_city),

      buyer_state:
        clean(row.buyer_state),

      payment_type:
        paymentType,

      cod_amount:
        !isBlank(
          row.cod_amount
        )
          ? Number(
              row.cod_amount
            )
          : null,

      package_count:
        Number(row.count),

      length:
        Number(row.length),

      width:
        Number(row.width),

      height:
        Number(row.height),

      weight:
        Number(row.weight),

      product_name:
        clean(
          row.product_name_1
        ),

      product_rate:
        Number(
          row.product_rate_1
        ),

      product_quantity:
        Number(
          row.product_quantity_1
        ),

      product_total:
        Number(
          row.product_total_1
        ),

      total_order_value:
        Number(
          row.total_order_value
        ),

      customer_ref_no:
        clean(
          row.customer_ref_no
        ) || null,

      eway_bill_no:
        clean(
          row.eway_bill_no
        ) || null,

      invoice_number:
        clean(
          row.invoice_number
        ) || null,

      seller_name:
        clean(
          row.seller_name
        ) || null,
    },
  };
};

// ======================================================
// IMPORT ORDERS CONTROLLER
// ======================================================

const importOrders = async (
  req,
  res
) => {
  let transaction = null;

  try {
    // ==================================================
    // REQUEST DATA
    // ==================================================

    const userId =
      Number(req.body.user_id);

    const warehouseId =
      Number(
        req.body.warehouse_id
      );

    const returnAddressId =
      Number(
        req.body.return_address_id
      );

    // ==================================================
    // BASIC VALIDATION
    // ==================================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup address is required",
      });
    }

    if (!returnAddressId) {
      return res.status(400).json({
        success: false,
        message:
          "Return address is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Excel file is required",
      });
    }

    // ==================================================
    // FILE TYPE
    // ==================================================

    const fileName =
      clean(
        req.file.originalname
      ).toLowerCase();

    if (
      !fileName.endsWith(
        ".xlsx"
      ) &&
      !fileName.endsWith(
        ".xls"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only .xlsx and .xls Excel files are allowed",
      });
    }

    // ==================================================
    // READ EXCEL
    // ==================================================

    let workbook;

    try {
      workbook =
        XLSX.read(
          req.file.buffer,
          {
            type: "buffer",
            cellDates: false,
          }
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to read Excel file. Please upload a valid Excel file.",
      });
    }

    // ==================================================
    // SHEET
    // ==================================================

    const sheetName =
      workbook
        .SheetNames?.[0];

    if (!sheetName) {
      return res.status(400).json({
        success: false,
        message:
          "Excel file does not contain a sheet",
      });
    }

    const sheet =
      workbook.Sheets[
        sheetName
      ];

    // ==================================================
    // GET HEADERS
    // ==================================================

    const range =
      XLSX.utils.decode_range(
        sheet["!ref"] ||
          "A1"
      );

    const headers = [];

    for (
      let column =
        range.s.c;
      column <=
        range.e.c;
      column += 1
    ) {
      const cellAddress =
        XLSX.utils.encode_cell(
          {
            r: range.s.r,
            c: column,
          }
        );

      headers.push(
        sheet[
          cellAddress
        ]?.v ?? ""
      );
    }

    // ==================================================
    // HEADER VALIDATION
    // ==================================================

    const headerValidation =
      validateHeaders(
        headers
      );

    if (
      !headerValidation.valid
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Excel format is invalid. Required columns are missing.",

        errors:
          headerValidation.errors.map(
            (message) => ({
              row:
                "Excel Header",

              errors: [
                message,
              ],
            })
          ),

        required_columns:
          REQUIRED_HEADERS,

        optional_columns:
          OPTIONAL_HEADERS,
      });
    }

    // ==================================================
    // CONVERT SHEET TO JSON
    // ==================================================

    const rawRows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          defval: "",
          raw: true,
        }
      );

    if (
      rawRows.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Excel file does not contain any order rows",
      });
    }

    // ==================================================
    // NORMALIZE ROW KEYS
    // ==================================================

    const rows =
      rawRows.map(
        (rawRow) => {
          const row = {};

          Object.entries(
            rawRow
          ).forEach(
            ([key, value]) => {
              row[
                normalizeHeader(
                  key
                )
              ] = value;
            }
          );

          return row;
        }
      );

    // ==================================================
    // VALIDATE ALL ROWS
    // ==================================================

    const validationResults =
      rows.map(
        (
          row,
          index
        ) =>
          validateRow(
            row,
            index + 2
          )
      );

    const invalidRows =
      validationResults.filter(
        (item) =>
          item.errors.length >
          0
      );

    // ==================================================
    // STOP BEFORE DB IF ANY ERROR
    // ==================================================

    if (
      invalidRows.length >
      0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Excel validation failed. Fix all highlighted fields before importing.",

        total_rows:
          rows.length,

        valid_rows:
          rows.length -
          invalidRows.length,

        invalid_rows:
          invalidRows.length,

        errors:
          invalidRows,
      });
    }

    // ==================================================
    // START TRANSACTION
    // ==================================================

    transaction =
      await getTransactionConnection();

    const connection =
      transaction.connection;

    // ==================================================
    // VERIFY WAREHOUSE
    // ==================================================

    const warehouseRows =
      await runQuery(
        connection,
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
            status
          FROM warehouses
          WHERE
            id = ?
            AND user_id = ?
          LIMIT 1
        `,
        [
          warehouseId,
          userId,
        ]
      );

    if (
      warehouseRows.length ===
      0
    ) {
      throw new Error(
        "Selected pickup address was not found"
      );
    }

    const warehouse =
      warehouseRows[0];

    // ==================================================
    // WAREHOUSE STATUS
    // ==================================================

    if (
      String(
        warehouse.status ||
          "ACTIVE"
      ).toUpperCase() !==
      "ACTIVE"
    ) {
      throw new Error(
        "Selected pickup address is inactive"
      );
    }

    // ==================================================
    // VERIFY RETURN ADDRESS
    // ==================================================

    const returnRows =
      await runQuery(
        connection,
        `
          SELECT
            id,
            user_id,
            name,
            phone,
            email,
            address_line1,
            address_line2,
            landmark,
            pincode,
            city,
            state,
            country,
            status
          FROM return_addresses
          WHERE
            id = ?
            AND user_id = ?
            AND status = 'ACTIVE'
          LIMIT 1
        `,
        [
          returnAddressId,
          userId,
        ]
      );

    if (
      returnRows.length ===
      0
    ) {
      throw new Error(
        "Selected return address was not found or is inactive"
      );
    }

    const returnAddress =
      returnRows[0];

    // ==================================================
    // PICKUP ADDRESS TEXT
    // ==================================================

    const pickupAddressText =
      [
        warehouse.address_line1,
        warehouse.address_line2,
        warehouse.landmark,
        warehouse.city,
        warehouse.state,
      ]
        .filter(Boolean)
        .join(", ");

    const pickupPincode =
      clean(
        warehouse.pincode
      );

    // ==================================================
    // FIND EXISTING PICKUP ADDRESS
    // ==================================================

    let pickupRows =
      await runQuery(
        connection,
        `
          SELECT id
          FROM pickup_addresses
          WHERE
            user_id = ?
            AND pickup_address = ?
            AND pickup_pincode = ?
          LIMIT 1
        `,
        [
          userId,
          pickupAddressText,
          pickupPincode,
        ]
      );

    let pickupAddressId;

    // ==================================================
    // CREATE PICKUP ADDRESS IF NEEDED
    // ==================================================

    if (
      pickupRows.length >
      0
    ) {
      pickupAddressId =
        pickupRows[0].id;
    } else {
      const pickupInsert =
        await runQuery(
          connection,
          `
            INSERT INTO pickup_addresses
            (
              user_id,
              pickup_pincode,
              pickup_city,
              pickup_address
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            userId,
            pickupPincode,
            warehouse.city ||
              null,
            pickupAddressText,
          ]
        );

      pickupAddressId =
        pickupInsert.insertId;
    }

    // ==================================================
    // CREATE ORDERS
    // ==================================================

    const importedOrders = [];

    for (
      const validation
      of validationResults
    ) {
      const data =
        validation.normalized;

      // =================================================
      // GENERATE PUBLIC ORDER ID
      // =================================================

      const publicOrderId =
        await generateUniqueOrderId(
          connection
        );

      // =================================================
      // IMPORTANT:
      // COLUMNS AND VALUES ARE BUILT TOGETHER.
      // THEREFORE SQL PLACEHOLDER COUNT CANNOT MISMATCH.
      // =================================================

      const orderColumns = [
        "order_id",
        "user_id",
        "pickup_address_id",
        "warehouse_id",

        "return_address_id",
        "return_name",
        "return_phone",
        "return_email",
        "return_address_line1",
        "return_address_line2",
        "return_landmark",
        "return_pincode",
        "return_city",
        "return_state",
        "return_country",

        "consignee_name",
        "mobile",
        "alternate_mobile",
        "email",
        "gstin",
        "company_name",
        "floor_no",
        "landmark",
        "address_line1",
        "address_line2",
        "pincode",
        "city",
        "state",
        "country",
        "payment_type",
        "risk_type",
        "status",
      ];

      const orderValues = [
        publicOrderId,

        userId,

        pickupAddressId,

        warehouseId,

        // RETURN ADDRESS
        returnAddress.id,

        returnAddress.name ||
          null,

        returnAddress.phone ||
          null,

        returnAddress.email ||
          null,

        returnAddress.address_line1 ||
          null,

        returnAddress.address_line2 ||
          null,

        returnAddress.landmark ||
          null,

        returnAddress.pincode ||
          null,

        returnAddress.city ||
          null,

        returnAddress.state ||
          null,

        returnAddress.country ||
          "India",

        // CONSIGNEE
        data.buyer_name,

        data.buyer_mobile,

        data.alternate_buyer_mobile,

        data.buyer_email,

        // GSTIN
        null,

        // COMPANY
        null,

        // FLOOR
        null,

        // LANDMARK
        null,

        data.buyer_address1,

        data.buyer_address2,

        data.buyer_pincode,

        data.buyer_city,

        data.buyer_state,

        "India",

        data.payment_type,

        "Owner Risk",

        "Processing",
      ];

      // =================================================
      // SAFETY CHECK
      // =================================================

      if (
        orderColumns.length !==
        orderValues.length
      ) {
        throw new Error(
          `Internal import mapping error: orders columns=${orderColumns.length}, values=${orderValues.length}`
        );
      }

      // =================================================
      // CREATE PLACEHOLDERS AUTOMATICALLY
      // =================================================

      const placeholders =
        orderColumns
          .map(
            () => "?"
          )
          .join(", ");

      // =================================================
      // INSERT ORDER
      // =================================================

      const orderInsert =
        await runQuery(
          connection,
          `
            INSERT INTO orders
            (
              ${orderColumns.join(
                ", "
              )}
            )
            VALUES
            (
              ${placeholders}
            )
          `,
          orderValues
        );

      const internalOrderId =
        orderInsert.insertId;

      // =================================================
      // PRODUCT
      // =================================================

      await runQuery(
        connection,
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
          internalOrderId,

          data.product_name,

          null,

          data.product_rate,

          data.product_quantity,

          0,
        ]
      );

      // =================================================
      // PACKAGE
      // =================================================

      await runQuery(
        connection,
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
          internalOrderId,

          data.length,

          data.width,

          data.height,

          data.weight,

          data.package_count,
        ]
      );

      // =================================================
      // RESPONSE DATA
      // =================================================

      importedOrders.push({
        id: internalOrderId,

        order_id:
          publicOrderId,

        status:
          "Processing",
      });
    }

    // ==================================================
    // COMMIT
    // ==================================================

    await commit(
      transaction
    );

    transaction = null;

    // ==================================================
    // SUCCESS
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        `${importedOrders.length} orders imported successfully and moved to Processing.`,

      total_imported:
        importedOrders.length,

      warehouse_id:
        warehouseId,

      pickup_address_id:
        pickupAddressId,

      return_address_id:
        returnAddressId,

      orders:
        importedOrders,
    });
  } catch (error) {
    // ==================================================
    // ERROR LOG
    // ==================================================

    console.error(
      "Import Orders Error:",
      error
    );

    // ==================================================
    // ROLLBACK
    // ==================================================

    if (transaction) {
      await rollback(
        transaction
      );

      transaction = null;
    }

    // ==================================================
    // ERROR RESPONSE
    // ==================================================

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to import orders",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  importOrders,
};