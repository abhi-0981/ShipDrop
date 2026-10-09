
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
// UPDATE COD REMITTANCE DESCRIPTION - ADMIN
// ========================================

const updateCODRemittanceDescription = async (req, res) => {
  try {
    const remittanceId = Number(req.params.id);
    const { description } = req.body || {};

    if (!Number.isInteger(remittanceId) || remittanceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid remittance ID",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be text",
      });
    }

    const cleanDescription = description.trim();

    if (cleanDescription.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters",
      });
    }

    const [result] = await db.query(
      `
        UPDATE cod_remittances
        SET description = ?
        WHERE id = ?
      `,
      [cleanDescription || null, remittanceId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `
          SELECT id
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
    }

    return res.status(200).json({
      success: true,
      message: "Description saved successfully",
    });
  } catch (error) {
    console.error("Update COD remittance description error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save description",
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
          transferred_on = NOW()
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



/* ========================================
   BULK MARK COD REMITTANCES SUCCESSFUL
======================================== */

const bulkMarkCODRemittancesSuccessful = async (req, res) => {
  let connection;

  try {
    const { ids, description } = req.body || {};

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select valid remittances",
      });
    }

    const uniqueIds = [...new Set(ids.map(Number))];

    if (uniqueIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate remittance IDs are not allowed",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be text",
      });
    }

    const cleanDescription = description.trim();

    if (cleanDescription.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const placeholders = uniqueIds.map(() => "?").join(", ");

    const [rows] = await connection.query(
      `SELECT id, status
       FROM cod_remittances
       WHERE id IN (${placeholders})
       FOR UPDATE`,
      uniqueIds
    );

    if (rows.length !== uniqueIds.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "One or more remittances were not found",
      });
    }

    const nonPending = rows.filter(
      (row) => String(row.status).toUpperCase() !== "PENDING"
    );

    if (nonPending.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "All selected remittances must be PENDING. Refresh and try again.",
      });
    }

    await connection.query(
      `UPDATE cod_remittances
       SET
         status = 'SUCCESSFUL',
         transferred_on = NOW(),
         description = ?
       WHERE id IN (${placeholders})
         AND status = 'PENDING'`,
      [cleanDescription || null, ...uniqueIds]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `${uniqueIds.length} remittances marked successful`,
      updatedCount: uniqueIds.length,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Bulk remittance rollback error:", rollbackError);
      }
    }

    console.error("Bulk COD remittance update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update selected remittances",
    });
  } finally {
    if (connection) connection.release();
  }
};


module.exports = {
  getAdminCODRemittances,
  updateCODRemittanceDescription,
  markCODRemittanceSuccessful,
  bulkMarkCODRemittancesSuccessful,
};
