
const db = require("../config/db");

const query = async (sql, params = []) => {
  const [rows] = await db.promise().query(sql, params);
  return rows;
};

/**
 * Get label settings for a user.
 * Create default settings when no record exists.
 */
const getLabelSettings = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  let rows = await query(
    `
      SELECT *
      FROM label_settings
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  await query(
    `
      INSERT INTO label_settings (
        user_id,
        order_value,
        cod_amount,
        buyer_mobile,
        shipper_mobiles,
        shipper_address,
        product_name,
        services_tnc,
        order_id,
        order_weight,
        label_size,
        right_logo_mode,
        from_name,
        from_address,
        from_mobile,
        product_details,
        return_address,
        contact_line
      )
      VALUES (
        ?, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        '4x6', 'delhivery', 1, 1, 1, 1, 1, 1
      )
    `,
    [userId]
  );

  rows = await query(
    `
      SELECT *
      FROM label_settings
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0];
};

/**
 * Save or update label settings.
 *
 * Accepts both camelCase and snake_case property names
 * so existing and updated callers can use the model.
 */
const saveLabelSettings = async (userId, settings = {}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const pick = (camelKey, snakeKey, fallback) => {
    if (settings[camelKey] !== undefined) {
      return settings[camelKey];
    }

    if (settings[snakeKey] !== undefined) {
      return settings[snakeKey];
    }

    return fallback;
  };

  const toFlag = (value) => {
    if (value === true || value === 1 || value === "1") {
      return 1;
    }

    return 0;
  };

  const values = {
    order_value: toFlag(
      pick("orderValue", "order_value", 1)
    ),
    cod_amount: toFlag(
      pick("codAmount", "cod_amount", 1)
    ),
    buyer_mobile: toFlag(
      pick("buyerMobile", "buyer_mobile", 1)
    ),
    shipper_mobiles: toFlag(
      pick("shipperMobiles", "shipper_mobiles", 1)
    ),
    shipper_address: toFlag(
      pick("shipperAddress", "shipper_address", 1)
    ),
    product_name: toFlag(
      pick("productName", "product_name", 1)
    ),
    services_tnc: toFlag(
      pick("servicesTnc", "services_tnc", 1)
    ),
    order_id: toFlag(
      pick("orderId", "order_id", 1)
    ),
    order_weight: toFlag(
      pick("orderWeight", "order_weight", 1)
    ),

    label_size: pick("labelSize", "label_size", "4x6"),

    right_logo_mode: pick(
      "rightLogoMode",
      "right_logo_mode",
      "delhivery"
    ),

    from_name: toFlag(
      pick("fromName", "from_name", 1)
    ),
    from_address: toFlag(
      pick("fromAddress", "from_address", 1)
    ),
    from_mobile: toFlag(
      pick("fromMobile", "from_mobile", 1)
    ),
    product_details: toFlag(
      pick("productDetails", "product_details", 1)
    ),
    return_address: toFlag(
      pick("returnAddress", "return_address", 1)
    ),
    contact_line: toFlag(
      pick("contactLine", "contact_line", 1)
    ),

    custom_logo: pick(
      "customLogo",
      "custom_logo",
      null
    ),
  };

  const allowedSizes = [
    "4x6",
    "A4",
    "4x2",
    "4x2.5",
    "3x2",
  ];

  if (!allowedSizes.includes(values.label_size)) {
    throw new Error("Invalid label size");
  }

  if (!["delhivery", "custom"].includes(values.right_logo_mode)) {
    throw new Error("Invalid right logo mode");
  }

  await query(
    `
      INSERT INTO label_settings (
        user_id,
        order_value,
        cod_amount,
        buyer_mobile,
        shipper_mobiles,
        shipper_address,
        product_name,
        services_tnc,
        order_id,
        order_weight,
        label_size,
        custom_logo,
        right_logo_mode,
        from_name,
        from_address,
        from_mobile,
        product_details,
        return_address,
        contact_line
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        order_value = VALUES(order_value),
        cod_amount = VALUES(cod_amount),
        buyer_mobile = VALUES(buyer_mobile),
        shipper_mobiles = VALUES(shipper_mobiles),
        shipper_address = VALUES(shipper_address),
        product_name = VALUES(product_name),
        services_tnc = VALUES(services_tnc),
        order_id = VALUES(order_id),
        order_weight = VALUES(order_weight),
        label_size = VALUES(label_size),
        custom_logo = VALUES(custom_logo),
        right_logo_mode = VALUES(right_logo_mode),
        from_name = VALUES(from_name),
        from_address = VALUES(from_address),
        from_mobile = VALUES(from_mobile),
        product_details = VALUES(product_details),
        return_address = VALUES(return_address),
        contact_line = VALUES(contact_line)
    `,
    [
      userId,
      values.order_value,
      values.cod_amount,
      values.buyer_mobile,
      values.shipper_mobiles,
      values.shipper_address,
      values.product_name,
      values.services_tnc,
      values.order_id,
      values.order_weight,
      values.label_size,
      values.custom_logo,
      values.right_logo_mode,
      values.from_name,
      values.from_address,
      values.from_mobile,
      values.product_details,
      values.return_address,
      values.contact_line,
    ]
  );

  return getLabelSettings(userId);
};

/**
 * Remove custom logo and restore Delhivery logo mode.
 */
const removeCustomLogo = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  await query(
    `
      UPDATE label_settings
      SET
        custom_logo = NULL,
        right_logo_mode = 'delhivery'
      WHERE user_id = ?
    `,
    [userId]
  );

  return getLabelSettings(userId);
};

module.exports = {
  getLabelSettings,
  saveLabelSettings,
  removeCustomLogo,
};
