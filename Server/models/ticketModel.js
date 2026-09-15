const db = require("../config/db");

// ============================================================
// QUERY HELPER
// ============================================================

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// ============================================================
// HELPERS
// ============================================================

const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const normalizeUpper = (value) => {
  return normalizeValue(value).toUpperCase();
};





// ============================================================
// FIND USER ORDER
// ============================================================

const findUserOrder = async ({
  userId,
  orderId,
  awb,
}) => {
  const normalizedOrderId = normalizeValue(orderId);
  const normalizedAwb = normalizeValue(awb);

  let order = null;

  if (normalizedOrderId) {
    const rows = await query(
      `
        SELECT
          id,
          order_id,
          user_id,
          awb,
          status,
          tracking_status,
          tracking_updated_at
        FROM orders
        WHERE
          user_id = ?
          AND (
            order_id = ?
            OR id = ?
          )
        ORDER BY
          CASE
            WHEN CAST(order_id AS CHAR) = ? THEN 0
            ELSE 1
          END
        LIMIT 1
      `,
      [
        userId,
        normalizedOrderId,
        Number(normalizedOrderId) || 0,
        normalizedOrderId,
      ]
    );

    if (rows.length > 0) {
      order = rows[0];
    }
  }

  if (normalizedAwb) {
    const awbRows = await query(
      `
        SELECT
          id,
          order_id,
          user_id,
          awb,
          status,
          tracking_status,
          tracking_updated_at
        FROM orders
        WHERE
          user_id = ?
          AND awb = ?
        LIMIT 1
      `,
      [userId, normalizedAwb]
    );

    if (awbRows.length === 0) {
      throw new Error("AWB not found");
    }

    const awbOrder = awbRows[0];

    if (order && Number(order.id) !== Number(awbOrder.id)) {
      throw new Error(
        "Order ID and AWB do not belong to the same order"
      );
    }

    order = awbOrder;
  }

  if (!order) {
    throw new Error("Order not found");
  }

  if (!normalizedAwb && order.awb) {
    order.awb = String(order.awb).trim();
  }

  return order;
};

// ============================================================
// CREATE TICKET
// ============================================================

const createTicket = async ({
  user_id,
  order_id = null,
  awb = null,
  category,
  priority,
  subject,
  description,
}) => {
  const userId = Number(user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Valid user ID is required");
  }

  const normalizedCategory = normalizeUpper(category);
  const normalizedPriority = normalizeUpper(priority);
  const normalizedSubject = normalizeValue(subject);
  const normalizedDescription = normalizeValue(description);
  const normalizedOrderId = normalizeValue(order_id);
  const normalizedAwb = normalizeValue(awb);

  const allowedCategories = [
    "SHIPMENT",
    "DELIVERY",
    "PICKUP",
    "PAYMENT",
    "RATE_BILLING",
    "ACCOUNT",
    "TECHNICAL",
    "OTHER",
  ];

  if (!allowedCategories.includes(normalizedCategory)) {
    throw new Error("Invalid ticket category");
  }

  const allowedPriorities = [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ];

  if (!allowedPriorities.includes(normalizedPriority)) {
    throw new Error("Invalid ticket priority");
  }

  if (!normalizedSubject) {
    throw new Error("Subject is required");
  }

  if (!normalizedDescription) {
    throw new Error("Description is required");
  }

  let order = null;

  if (normalizedOrderId || normalizedAwb) {
    order = await findUserOrder({
      userId,
      orderId: normalizedOrderId,
      awb: normalizedAwb,
    });
  }

  const internalOrderId = order ? order.id : null;

  const finalAwb =
    normalizedAwb ||
    (order?.awb ? String(order.awb).trim() : null) ||
    null;

const ticketNumber = String(
  (
    await query(
      `
        SELECT GREATEST(
          COALESCE(MAX(CAST(ticket_number AS UNSIGNED)), 0) + 1,
          1001
        ) AS next_number
        FROM tickets
      `
    )
  )[0].next_number
);

  const result = await query(
    `
      INSERT INTO tickets
      (
        ticket_number,
        user_id,
        order_id,
        awb,
        category,
        priority,
        subject,
        description,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `,
    [
      ticketNumber,
      userId,
      internalOrderId,
      finalAwb,
      normalizedCategory,
      normalizedPriority,
      normalizedSubject,
      normalizedDescription,
    ]
  );

  const ticketId = result.insertId;

  await query(
    `
      INSERT INTO ticket_messages
      (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES (?, 'USER', ?, ?)
    `,
    [
      ticketId,
      userId,
      normalizedDescription,
    ]
  );

  const rows = await query(
    `
      SELECT
        id,
        ticket_number,
        user_id,
        order_id,
        awb,
        category,
        priority,
        subject,
        description,
        status,
        assigned_to,
        created_at,
        updated_at,
        resolved_at,
        closed_at
      FROM tickets
      WHERE id = ?
      LIMIT 1
    `,
    [ticketId]
  );

  return rows[0];
};

// ============================================================
// GET USER TICKETS
// ============================================================

const getUserTickets = async (
  user_id,
  {
    status = "",
    search = "",
  } = {}
) => {
  const userId = Number(user_id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Valid user ID is required");
  }

  const normalizedStatus = normalizeUpper(status);
  const normalizedSearch = normalizeValue(search);

  let ticketQuery = `
    SELECT
      t.id,
      t.ticket_number,
      t.user_id,
      t.order_id,
      t.awb,
      t.category,
      t.priority,
      t.subject,
      t.description,
      t.status,
      t.assigned_to,
      t.created_at,
      t.updated_at,
      t.resolved_at,
      t.closed_at,

      o.order_id AS public_order_id,
      o.status AS order_status,
      o.tracking_status,
      o.tracking_updated_at

    FROM tickets t

    LEFT JOIN orders o
      ON o.id = t.order_id

    WHERE t.user_id = ?
  `;

  const ticketParams = [userId];

  // ----------------------------------------------------------
  // STATUS FILTER
  // ----------------------------------------------------------

  if (normalizedStatus === "OPEN") {
    ticketQuery += `
      AND t.status = 'OPEN'
    `;
  }

  if (normalizedStatus === "PENDING") {
    ticketQuery += `
      AND t.status IN (
        'IN_PROGRESS',
        'WAITING_FOR_USER'
      )
    `;
  }

  if (normalizedStatus === "RESOLVED") {
    ticketQuery += `
      AND t.status IN (
        'RESOLVED',
        'CLOSED'
      )
    `;
  }

  if (
    normalizedStatus === "IN_PROGRESS" ||
    normalizedStatus === "WAITING_FOR_USER" ||
    normalizedStatus === "CLOSED"
  ) {
    ticketQuery += `
      AND t.status = ?
    `;

    ticketParams.push(normalizedStatus);
  }

  // ----------------------------------------------------------
  // SEARCH FILTER
  // ----------------------------------------------------------

  if (normalizedSearch) {
    const searchValue = `%${normalizedSearch}%`;

    ticketQuery += `
      AND (
        t.ticket_number LIKE ?
        OR t.subject LIKE ?
        OR t.awb LIKE ?
        OR CAST(o.order_id AS CHAR) LIKE ?
      )
    `;

    ticketParams.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  ticketQuery += `
    ORDER BY t.id DESC
  `;

  const tickets = await query(
    ticketQuery,
    ticketParams
  );

  // ==========================================================
  // COUNTS
  // ==========================================================

  const countRows = await query(
    `
      SELECT
        COUNT(*) AS total,

        SUM(
          CASE
            WHEN status = 'OPEN'
            THEN 1
            ELSE 0
          END
        ) AS open,

        SUM(
          CASE
            WHEN status = 'IN_PROGRESS'
            THEN 1
            ELSE 0
          END
        ) AS in_progress,

        SUM(
          CASE
            WHEN status = 'WAITING_FOR_USER'
            THEN 1
            ELSE 0
          END
        ) AS waiting_for_user,

        SUM(
          CASE
            WHEN status IN (
              'IN_PROGRESS',
              'WAITING_FOR_USER'
            )
            THEN 1
            ELSE 0
          END
        ) AS pending,

        SUM(
          CASE
            WHEN status = 'RESOLVED'
            THEN 1
            ELSE 0
          END
        ) AS resolved,

        SUM(
          CASE
            WHEN status = 'CLOSED'
            THEN 1
            ELSE 0
          END
        ) AS closed,

        SUM(
          CASE
            WHEN priority = 'URGENT'
            THEN 1
            ELSE 0
          END
        ) AS urgent

      FROM tickets

      WHERE user_id = ?
    `,
    [userId]
  );

  const counts = countRows[0] || {};

  return {
    tickets,

    counts: {
      total: Number(counts.total || 0),
      open: Number(counts.open || 0),
      in_progress: Number(counts.in_progress || 0),
      waiting_for_user: Number(
        counts.waiting_for_user || 0
      ),
      pending: Number(counts.pending || 0),
      resolved: Number(counts.resolved || 0),
      closed: Number(counts.closed || 0),
      urgent: Number(counts.urgent || 0),
    },
  };
};

// ============================================================
// GET SINGLE USER TICKET
// ============================================================

const getTicketById = async (
  ticketId,
  user_id
) => {
  const id = Number(ticketId);
  const userId = Number(user_id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid ticket ID");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Valid user ID is required");
  }

  const ticketRows = await query(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.user_id,
        t.order_id,
        t.awb,
        t.category,
        t.priority,
        t.subject,
        t.description,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,

        o.order_id AS public_order_id,
        o.status AS order_status,
        o.awb AS order_awb,
        o.tracking_status,
        o.tracking_data,
        o.tracking_updated_at

      FROM tickets t

      LEFT JOIN orders o
        ON o.id = t.order_id

      WHERE
        t.id = ?
        AND t.user_id = ?

      LIMIT 1
    `,
    [id, userId]
  );

  if (ticketRows.length === 0) {
    return null;
  }

  const ticket = ticketRows[0];

  const messages = await query(
    `
      SELECT
        id,
        ticket_id,
        sender_type,
        sender_id,
        message,
        created_at
      FROM ticket_messages
      WHERE ticket_id = ?
      ORDER BY id ASC
    `,
    [id]
  );

  const attachments = await query(
    `
      SELECT
        id,
        ticket_id,
        message_id,
        uploaded_by_type,
        uploaded_by_id,
        file_name,
        file_path,
        mime_type,
        file_size,
        created_at
      FROM ticket_attachments
      WHERE ticket_id = ?
      ORDER BY id ASC
    `,
    [id]
  );

  return {
    ...ticket,
    messages,
    attachments,
  };
};

// ============================================================
// ADD USER REPLY
// ============================================================

const addUserReply = async ({
  ticket_id,
  user_id,
  message,
}) => {
  const ticketId = Number(ticket_id);
  const userId = Number(user_id);
  const normalizedMessage = normalizeValue(message);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw new Error("Invalid ticket ID");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Valid user ID is required");
  }

  if (!normalizedMessage) {
    throw new Error("Message is required");
  }

  const ticketRows = await query(
    `
      SELECT
        id,
        status
      FROM tickets
      WHERE
        id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [ticketId, userId]
  );

  if (ticketRows.length === 0) {
    throw new Error("Ticket not found");
  }

  const status = normalizeUpper(
    ticketRows[0].status
  );

  if (
    status === "RESOLVED" ||
    status === "CLOSED"
  ) {
    throw new Error(
      "Resolved or closed tickets cannot receive replies"
    );
  }

  const result = await query(
    `
      INSERT INTO ticket_messages
      (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES (?, 'USER', ?, ?)
    `,
    [
      ticketId,
      userId,
      normalizedMessage,
    ]
  );

  await query(
    `
      UPDATE tickets
      SET
        status = 'IN_PROGRESS',
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ?
        AND user_id = ?
    `,
    [ticketId, userId]
  );

  return {
    id: result.insertId,
    ticket_id: ticketId,
    sender_type: "USER",
    sender_id: userId,
    message: normalizedMessage,
  };
};

// ============================================================
// CLOSE TICKET
// ============================================================

const closeTicket = async ({
  ticket_id,
  user_id,
}) => {
  const ticketId = Number(ticket_id);
  const userId = Number(user_id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    throw new Error("Invalid ticket ID");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Valid user ID is required");
  }

  const ticketRows = await query(
    `
      SELECT
        id,
        status
      FROM tickets
      WHERE
        id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [ticketId, userId]
  );

  if (ticketRows.length === 0) {
    throw new Error("Ticket not found");
  }

  await query(
    `
      UPDATE tickets
      SET
        status = 'CLOSED',
        closed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ?
        AND user_id = ?
    `,
    [ticketId, userId]
  );

  const rows = await query(
    `
      SELECT
        id,
        ticket_number,
        user_id,
        order_id,
        awb,
        category,
        priority,
        subject,
        description,
        status,
        assigned_to,
        created_at,
        updated_at,
        resolved_at,
        closed_at
      FROM tickets
      WHERE
        id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [ticketId, userId]
  );

  return rows[0];
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createTicket,
  getUserTickets,
  getTicketById,
  addUserReply,
  closeTicket,
};