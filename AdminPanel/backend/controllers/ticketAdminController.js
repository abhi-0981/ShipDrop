const db = require("../config/db");

const {
  getAllTickets,
  getTicketCounts,
  getTicketById,
} = require("../model/ticketAdminModel");

/* =========================================================
   GET ALL TICKETS
========================================================= */

const getTicketsController = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      priority = "",
      category = "",
    } = req.query;

    const [tickets, counts] = await Promise.all([
      getAllTickets({
        search,
        status,
        priority,
        category,
      }),
      getTicketCounts(),
    ]);

    return res.status(200).json({
      success: true,
      tickets,
      counts,
    });
  } catch (error) {
    console.error(
      "Admin get tickets error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tickets",
    });
  }
};

/* =========================================================
   GET SINGLE TICKET
========================================================= */

const getTicketController = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error(
      "Admin get ticket detail error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch ticket",
    });
  }
};

/* =========================================================
   UPDATE TICKET STATUS
========================================================= */

const updateTicketStatusController = async (
  req,
  res
) => {
  try {
    const ticketId = Number(req.params.id);

    const status = String(
      req.body?.status || ""
    )
      .trim()
      .toUpperCase();

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_USER",
      "RESOLVED",
      "CLOSED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const [existingRows] = await db.query(
      `
        SELECT id, status
        FROM tickets
        WHERE id = ?
        LIMIT 1
      `,
      [ticketId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    let query = "";
    let params = [];

    if (status === "RESOLVED") {
      query = `
        UPDATE tickets
        SET
          status = ?,
          resolved_at = NOW(),
          closed_at = NULL,
          updated_at = NOW()
        WHERE id = ?
      `;

      params = [status, ticketId];
    } else if (status === "CLOSED") {
      query = `
        UPDATE tickets
        SET
          status = ?,
          closed_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `;

      params = [status, ticketId];
    } else {
      query = `
        UPDATE tickets
        SET
          status = ?,
          resolved_at = NULL,
          closed_at = NULL,
          updated_at = NOW()
        WHERE id = ?
      `;

      params = [status, ticketId];
    }

    await db.query(query, params);

    const updatedTicket =
      await getTicketById(ticketId);

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error(
      "Admin update ticket status error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update ticket status",
    });
  }
};

/* =========================================================
   ADMIN REPLY
========================================================= */

const replyToTicketController = async (
  req,
  res
) => {
  try {
    const ticketId = Number(req.params.id);

    const message = String(
      req.body?.message || ""
    ).trim();

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const [ticketRows] = await db.query(
      `
        SELECT id, status
        FROM tickets
        WHERE id = ?
        LIMIT 1
      `,
      [ticketId]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const currentStatus = String(
      ticketRows[0].status || ""
    ).toUpperCase();

    if (
      currentStatus === "RESOLVED" ||
      currentStatus === "CLOSED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Resolved or closed tickets cannot receive replies",
      });
    }

    /*
      Existing admin login stores admin identity
      inside JWT as `id`.
    */
    const adminId =
      req.admin?.id ||
      req.user?.id ||
      req.auth?.id ||
      1;

    const [result] = await db.query(
      `
        INSERT INTO ticket_messages
        (
          ticket_id,
          sender_type,
          sender_id,
          message
        )
        VALUES (?, 'ADMIN', ?, ?)
      `,
      [
        ticketId,
        adminId,
        message,
      ]
    );

    await db.query(
      `
        UPDATE tickets
        SET
          status = 'IN_PROGRESS',
          updated_at = NOW()
        WHERE id = ?
      `,
      [ticketId]
    );

    const [replyRows] = await db.query(
      `
        SELECT
          id,
          ticket_id,
          sender_type,
          sender_id,
          message,
          created_at
        FROM ticket_messages
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      reply: replyRows[0],
    });
  } catch (error) {
    console.error(
      "Admin reply error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send reply",
    });
  }
};

module.exports = {
  getTicketsController,
  getTicketController,
  updateTicketStatusController,
  replyToTicketController,
};