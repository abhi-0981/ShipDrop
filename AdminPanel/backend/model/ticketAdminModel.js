const db = require("../config/db");

const getAllTickets = async ({
  search = "",
  status = "",
  priority = "",
  category = "",
} = {}) => {
  let query = `
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
      o.tracking_updated_at,

      u.id AS customer_id,
      u.full_name AS customer_name,
      u.email AS customer_email,
      u.phone_no AS customer_phone

    FROM tickets t
    LEFT JOIN orders o
      ON o.id = t.order_id
    LEFT JOIN users u
      ON u.id = t.user_id
    WHERE 1 = 1
  `;

  const params = [];

  if (search.trim()) {
    query += `
      AND (
        t.ticket_number LIKE ?
        OR t.subject LIKE ?
        OR t.awb LIKE ?
        OR u.full_name LIKE ?
        OR u.email LIKE ?
        OR u.phone_no LIKE ?
      )
    `;

    const value = `%${search.trim()}%`;

    params.push(
      value,
      value,
      value,
      value,
      value,
      value
    );
  }

  if (status.trim()) {
    query += ` AND t.status = ? `;
    params.push(status.trim().toUpperCase());
  }

  if (priority.trim()) {
    query += ` AND t.priority = ? `;
    params.push(priority.trim().toUpperCase());
  }

  if (category.trim()) {
    query += ` AND t.category = ? `;
    params.push(category.trim().toUpperCase());
  }

  query += ` ORDER BY t.id DESC `;

  const [rows] = await db.query(query, params);

  return rows;
};

const getTicketCounts = async () => {
  const [rows] = await db.query(`
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
  `);

  return {
    total: Number(rows[0]?.total || 0),
    open: Number(rows[0]?.open || 0),
    in_progress: Number(
      rows[0]?.in_progress || 0
    ),
    waiting_for_user: Number(
      rows[0]?.waiting_for_user || 0
    ),
    pending: Number(
      rows[0]?.pending || 0
    ),
    resolved: Number(
      rows[0]?.resolved || 0
    ),
    closed: Number(
      rows[0]?.closed || 0
    ),
    urgent: Number(
      rows[0]?.urgent || 0
    ),
  };
};

const getTicketById = async (ticketId) => {
  const [ticketRows] = await db.query(
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
        o.tracking_status,
        o.tracking_data,
        o.tracking_updated_at,

        u.id AS customer_id,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone_no AS customer_phone

      FROM tickets t
      LEFT JOIN orders o
        ON o.id = t.order_id
      LEFT JOIN users u
        ON u.id = t.user_id
      WHERE t.id = ?
      LIMIT 1
    `,
    [ticketId]
  );

  if (ticketRows.length === 0) {
    return null;
  }

  const ticket = ticketRows[0];

  const [messages] = await db.query(
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
    [ticketId]
  );

  const [internalNotes] = await db.query(
    `
      SELECT
        id,
        ticket_id,
        admin_id,
        note,
        created_at
      FROM ticket_internal_notes
      WHERE ticket_id = ?
      ORDER BY id ASC
    `,
    [ticketId]
  );

  const [attachments] = await db.query(
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
    [ticketId]
  );

  return {
    ...ticket,
    messages,
    internal_notes: internalNotes,
    attachments,
  };
};

const updateTicketStatus = async (
  ticketId,
  status
) => {
  const cleanStatus = String(status || "")
    .trim()
    .toUpperCase();

  const allowedStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "WAITING_FOR_USER",
    "RESOLVED",
    "CLOSED",
  ];

  if (!allowedStatuses.includes(cleanStatus)) {
    throw new Error("Invalid ticket status");
  }

  let query = `
    UPDATE tickets
    SET
      status = ?,
      updated_at = NOW(),
      resolved_at = ?,
      closed_at = ?
    WHERE id = ?
  `;

  let resolvedAt = null;
  let closedAt = null;

  if (cleanStatus === "RESOLVED") {
    resolvedAt = new Date();
  }

  if (cleanStatus === "CLOSED") {
    resolvedAt = new Date();
    closedAt = new Date();
  }

  const [result] = await db.query(
    query,
    [
      cleanStatus,
      resolvedAt,
      closedAt,
      ticketId,
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getTicketById(ticketId);
};

const updateTicketPriority = async (
  ticketId,
  priority
) => {
  const cleanPriority = String(priority || "")
    .trim()
    .toUpperCase();

  const allowedPriorities = [
    "LOW",
    "NORMAL",
    "HIGH",
    "URGENT",
  ];

  if (!allowedPriorities.includes(cleanPriority)) {
    throw new Error("Invalid ticket priority");
  }

  const [result] = await db.query(
    `
      UPDATE tickets
      SET
        priority = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
    [
      cleanPriority,
      ticketId,
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getTicketById(ticketId);
};

module.exports = {
  getAllTickets,
  getTicketCounts,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
};