const {
  createTicket,
  getUserTickets,
  getTicketById,
  addUserReply,
  closeTicket,
} = require("../models/ticketModel");

// ======================================================
// CREATE TICKET
// ======================================================

const createTicketController = async (req, res) => {
  try {
    const {
      user_id,
      order_id,
      awb,
      category,
      priority,
      subject,
      description,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const ticket = await createTicket({
      user_id,
      order_id,
      awb,
      category,
      priority,
      subject,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to create ticket",
    });
  }
};

// ======================================================
// GET USER TICKETS
// ======================================================

const getTicketsController = async (req, res) => {
  try {
    const userId =
      req.query.user_id ||
      req.body?.user_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await getUserTickets(userId, {
      status: req.query.status,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      tickets: result.tickets,
      counts: result.counts,
    });
  } catch (error) {
    console.error("Get tickets error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to fetch tickets",
    });
  }
};

// ======================================================
// GET SINGLE TICKET
// ======================================================

const getTicketController = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    const userId = Number(
      req.query.user_id ||
      req.body?.user_id
    );

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const ticket = await getTicketById(
      ticketId,
      userId
    );

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
    console.error("Get ticket error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to fetch ticket",
    });
  }
};

// ======================================================
// USER REPLY
// ======================================================

const replyToTicketController = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    const {
      user_id,
      message,
    } = req.body;

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    if (
      !Number.isInteger(Number(user_id)) ||
      Number(user_id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (
      !message ||
      !String(message).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // IMPORTANT:
    // ticketModel.addUserReply expects an object.
    const reply = await addUserReply({
      ticket_id: ticketId,
      user_id: Number(user_id),
      message: String(message).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Reply added successfully",
      reply,
    });
  } catch (error) {
    console.error("Ticket reply error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to add reply",
    });
  }
};

// ======================================================
// CLOSE TICKET
// ======================================================

const closeTicketController = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    const {
      user_id,
    } = req.body;

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    if (
      !Number.isInteger(Number(user_id)) ||
      Number(user_id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // IMPORTANT:
    // ticketModel.closeTicket expects an object.
    const result = await closeTicket({
      ticket_id: ticketId,
      user_id: Number(user_id),
    });

    return res.status(200).json({
      success: true,
      message: "Ticket closed successfully",
      ticket: result,
    });
  } catch (error) {
    console.error("Close ticket error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to close ticket",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  createTicketController,
  getTicketsController,
  getTicketController,
  replyToTicketController,
  closeTicketController,
};