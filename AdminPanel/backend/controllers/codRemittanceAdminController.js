const db = require("../config/db");

// ========================================
// GET ALL COD REMITTANCES - ADMIN
// ========================================

const getAdminCODRemittances = async (req, res) => {
  try {
    const [remittances] = await db.query(`
      SELECT
        cr.id AS remittance_id,
        cr.order_id AS order_db_id,
        o.order_id,
        cr.user_id,
        u.full_name AS customer_name,
        o.consignee_name AS buyer,
        o.awb,
        cr.cod_amount,
        o.created_at,
        cr.status,
        cr.transferred_on,
        cr.description,
        cr.created_at AS remittance_created_at
      FROM cod_remittances cr
      INNER JOIN orders o
        ON o.id = cr.order_id
      LEFT JOIN users u
        ON u.id = cr.user_id
      ORDER BY cr.created_at DESC, cr.id DESC
    `);

    return res.status(200).json({
      success: true,
      remittances,
    });
  } catch (error) {
    console.error("Get admin COD remittances error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch COD remittances",
    });
  }
};

// ========================================
// MARK COD REMITTANCE AS SUCCESSFUL
// ========================================

const markCODRemittanceSuccessful = async (req, res) => {
  try {
    const remittanceId = Number(req.params.id);

    if (!Number.isInteger(remittanceId) || remittanceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid remittance ID",
      });
    }

    const [result] = await db.query(
      `
        UPDATE cod_remittances
        SET
          status = 'SUCCESSFUL',
          transferred_on = NOW(),
          description = 'Remittance marked successful by admin'
        WHERE id = ?
          AND status = 'PENDING'
      `,
      [remittanceId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `
          SELECT id, status
          FROM cod_remittances
          WHERE id = ?
          LIMIT 1
        `,
        [remittanceId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "COD remittance not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This remittance is not pending",
      });
    }

    return res.status(200).json({
      success: true,
      message: "COD remittance marked successful",
    });
  } catch (error) {
    console.error("Update COD remittance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update COD remittance",
    });
  }
};

module.exports = {
  getAdminCODRemittances,
  markCODRemittanceSuccessful,
};
