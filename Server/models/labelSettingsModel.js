const db = require("../config/db");

/**
 * Get label settings for a user.
 * If settings do not exist, create them with default values.
 */
const getLabelSettings = async (userId) => {
  const [rows] = await db
    .promise()
    .query(
      `
      SELECT
        id,
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
        created_at,
        updated_at
      FROM label_settings
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

  if (rows.length > 0) {
    return rows[0];
  }

  await db
    .promise()
    .query(
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
        label_size
      )
      VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, '4x6')
      `,
      [userId]
    );

  const [newRows] = await db
    .promise()
    .query(
      `
      SELECT
        id,
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
        created_at,
        updated_at
      FROM label_settings
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

  return newRows[0];
};

/**
 * Save / update label settings for a user.
 */
const saveLabelSettings = async (userId, settings) => {
  const {
    order_value = 1,
    cod_amount = 1,
    buyer_mobile = 1,
    shipper_mobiles = 1,
    shipper_address = 1,
    product_name = 1,
    services_tnc = 1,
    order_id = 1,
    order_weight = 1,
    label_size = "4x6",
    custom_logo = null,
  } = settings;

  await db
    .promise()
    .query(
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
        custom_logo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        custom_logo = VALUES(custom_logo)
      `,
      [
        userId,
        order_value ? 1 : 0,
        cod_amount ? 1 : 0,
        buyer_mobile ? 1 : 0,
        shipper_mobiles ? 1 : 0,
        shipper_address ? 1 : 0,
        product_name ? 1 : 0,
        services_tnc ? 1 : 0,
        order_id ? 1 : 0,
        order_weight ? 1 : 0,
        label_size,
        custom_logo,
      ]
    );

  return getLabelSettings(userId);
};

/**
 * Remove custom logo for a user.
 */
const removeCustomLogo = async (userId) => {
  await db
    .promise()
    .query(
      `
      UPDATE label_settings
      SET custom_logo = NULL
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