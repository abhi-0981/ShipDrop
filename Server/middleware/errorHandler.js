/**
 * Global Server Error Handler Middleware
 * Catches all synchronous and asynchronous errors across all routes.
 * Logs debug info for developers on server console, while returning clean,
 * sanitized, professional English JSON messages to clients.
 */

function errorHandler(err, req, res, next) {
  // If response headers have already been sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const isDev = process.env.NODE_ENV !== "production";

  // Log full error details on server terminal for debugging
  console.error("=================== SERVER ERROR ===================");
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  console.error("Time:", new Date().toISOString());
  console.error("Message:", err.message);
  if (err.code) {
    console.error("Code:", err.code);
  }
  if (err.stack && isDev) {
    console.error("Stack:", err.stack);
  }
  console.error("====================================================");

  let statusCode = Number(err.statusCode || err.status) || 500;
  let userMessage = err.message || "Internal server error";
  let errorCode = err.code || "SERVER_ERROR";

  // 1. MySQL Duplicate Key Error (ER_DUP_ENTRY / 1062)
  if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
    statusCode = 409;
    errorCode = "DUPLICATE_ENTRY";
    const msg = String(err.message || "").toLowerCase();
    if (msg.includes("order_id")) {
      userMessage = "This Order ID is already registered. Please use a unique Order ID.";
    } else if (msg.includes("waybill") || msg.includes("awb")) {
      userMessage = "This AWB / Waybill number is already registered.";
    } else if (msg.includes("email")) {
      userMessage = "This email address is already registered.";
    } else if (msg.includes("phone") || msg.includes("mobile")) {
      userMessage = "This phone number is already registered.";
    } else {
      userMessage = "This record already exists in the system (Duplicate Entry).";
    }
  }

  // 2. MySQL Foreign Key Constraint Error (ER_NO_REFERENCED_ROW / 1452)
  else if (err.code === "ER_NO_REFERENCED_ROW_2" || err.errno === 1452) {
    statusCode = 400;
    errorCode = "INVALID_REFERENCE";
    userMessage = "The selected user or warehouse record could not be found.";
  }

  // 3. MySQL Data Too Long (ER_DATA_TOO_LONG / 1406)
  else if (err.code === "ER_DATA_TOO_LONG" || err.errno === 1406) {
    statusCode = 400;
    errorCode = "DATA_TOO_LONG";
    userMessage = "The entered details exceed the maximum allowed character limit.";
  }

  // 4. JWT Authentication Errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "INVALID_TOKEN";
    userMessage = "Invalid authentication token. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorCode = "TOKEN_EXPIRED";
    userMessage = "Your login session has expired. Please log in again.";
  }

  // 5. Multer / File Upload Errors
  else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    errorCode = "FILE_TOO_LARGE";
    userMessage = "The uploaded file exceeds the 10 MB size limit.";
  }

  // 6. Insufficient Wallet Balance (business rule)
  else if (
    String(err.message || "").toLowerCase().includes("insufficient") &&
    String(err.message || "").toLowerCase().includes("balance")
  ) {
    statusCode = 400;
    errorCode = "INSUFFICIENT_BALANCE";
    userMessage = "Insufficient wallet balance. Please recharge your wallet to continue.";
  }

  // 7. Sanitization for generic internal errors (don't leak stack traces or code to user)
  else if (statusCode >= 500) {
    const raw = String(err.message || "");
    if (
      raw.includes("TypeError") ||
      raw.includes("ReferenceError") ||
      raw.includes("Cannot read properties") ||
      raw.includes("syntax error") ||
      raw.includes("query:")
    ) {
      userMessage = "A temporary server error occurred. Please try again shortly.";
      errorCode = "INTERNAL_ERROR";
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: userMessage,
    code: errorCode,
    ...(isDev ? { devDetail: err.message } : {}),
  });
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    code: "ROUTE_NOT_FOUND",
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
