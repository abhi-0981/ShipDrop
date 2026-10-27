import toast from "react-hot-toast";

/**
 * Intelligent Error Message Normalizer for ShipDrop
 * Converts raw database, courier, network, and HTTP errors into crystal-clear, clean English messages.
 */
export function parseApiError(error, fallback = "An unexpected error occurred. Please try again.") {
  if (!error) return fallback;

  // If a plain string was passed
  if (typeof error === "string") {
    return cleanRawMessage(error, fallback);
  }

  // Network offline / connection failed
  if (
    error.code === "ERR_NETWORK" ||
    error.message === "Network Error" ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return "No internet connection detected. Please check your network connection and try again.";
  }

  // Timeout (Axios ECONNABORTED)
  if (error.code === "ECONNABORTED" || String(error.message || "").toLowerCase().includes("timeout")) {
    return "The server took too long to respond. Please try again in a moment.";
  }

  const response = error.response;
  const status = response?.status;
  const data = response?.data;

  // Extract raw message from API response
  let rawMsg = "";
  if (typeof data === "string") {
    rawMsg = data;
  } else if (data && typeof data === "object") {
    rawMsg =
      data.message ||
      data.error ||
      data.msg ||
      (Array.isArray(data.errors) ? data.errors.map((e) => e.msg || e.message || e).join(", ") : "") ||
      (Array.isArray(data.packages)
        ? data.packages
            .filter((p) => p.status && String(p.status).toLowerCase() !== "success")
            .map((p) => (Array.isArray(p.remarks) ? p.remarks.join(", ") : p.remarks))
            .filter(Boolean)
            .join("; ")
        : "");
  }

  if (!rawMsg && error.message) {
    rawMsg = error.message;
  }

  // Clean and map raw message to user-friendly English text
  if (rawMsg) {
    const cleaned = cleanRawMessage(rawMsg, "");
    if (cleaned) return cleaned;
  }

  // Fallback to standard HTTP status codes
  switch (status) {
    case 400:
      return "The provided details are invalid. Please check the form and try again.";
    case 401:
      return "Your session has expired. Please log in again to continue.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested record or resource was not found.";
    case 409:
      return "This record or Order ID is already registered in the system.";
    case 422:
      return "Unable to process the submitted details. Please verify all inputs.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "A temporary server error occurred. Please try again shortly.";
    default:
      return fallback;
  }
}

/**
 * Maps technical jargon, SQL errors, courier codes to plain, clean English explanations
 */
function cleanRawMessage(raw, fallback = "") {
  const str = String(raw).trim();
  const lower = str.toLowerCase();

  // 1. Insufficient Wallet Balance
  if (lower.includes("insufficient") && (lower.includes("wallet") || lower.includes("balance"))) {
    return "Insufficient wallet balance. Please recharge your wallet to continue.";
  }

  // 2. Duplicate entries (Database MySQL / Mongo)
  if (lower.includes("er_dup_entry") || lower.includes("duplicate entry") || lower.includes("e11000")) {
    if (lower.includes("order_id")) {
      return "This Order ID is already registered. Please use a unique Order ID.";
    }
    if (lower.includes("waybill") || lower.includes("awb")) {
      return "This AWB / Waybill number has already been used.";
    }
    if (lower.includes("phone") || lower.includes("mobile")) {
      return "This phone number is already registered.";
    }
    if (lower.includes("email")) {
      return "This email address is already registered.";
    }
    return "This record already exists in the system (Duplicate Entry).";
  }

  // 3. Pincode & Serviceability
  if (
    lower.includes("not serviceable") ||
    lower.includes("unserviceable") ||
    lower.includes("serviceability") ||
    lower.includes("pincode unavailable") ||
    lower.includes("non-serviceable")
  ) {
    return "This pincode is not serviceable by the selected courier partner. Please verify the pincode.";
  }

  // 4. Warehouse & Pickup Address
  if (lower.includes("pickup warehouse is required") || lower.includes("select a pickup address") || lower.includes("pickup address is required")) {
    return "Please select a valid pickup warehouse for this shipment.";
  }
  if (lower.includes("pickup location not found") || lower.includes("warehouse not registered")) {
    return "The selected pickup warehouse is not registered with the courier partner. Please verify warehouse settings.";
  }
  if (lower.includes("return address is required") || lower.includes("default return address")) {
    return "Default return address is missing. Please add a return address in Settings.";
  }

  // 5. Phone number validation
  if (lower.includes("phone") && (lower.includes("invalid") || lower.includes("format") || lower.includes("digit") || lower.includes("10"))) {
    return "Please enter a valid 10-digit mobile number.";
  }

  // 6. Weight & Dimension errors
  if (lower.includes("weight") && (lower.includes("less than") || lower.includes("zero") || lower.includes("invalid") || lower.includes("0.05"))) {
    return "Package weight must be at least 0.05 kg.";
  }
  if (lower.includes("dimension") || (lower.includes("length") && lower.includes("greater than zero"))) {
    return "Package length, width, and height must all be greater than zero.";
  }

  // 7. Delivery Address validation
  if (lower.includes("address") && (lower.includes("short") || lower.includes("missing") || lower.includes("required"))) {
    return "Delivery address is too short. Please provide a complete address with street details.";
  }

  // 8. Session / Auth
  if (lower.includes("jwt expired") || lower.includes("token expired") || lower.includes("unauthorized") || lower.includes("session expired")) {
    return "Your login session has expired. Please log in again to continue.";
  }

  // 9. Razorpay / Payment
  if (lower.includes("payment verification failed") || lower.includes("signature verification failed")) {
    return "Payment verification failed. If your account was debited, it will reflect in your wallet shortly.";
  }

  // 10. Excel / File Upload
  if (lower.includes("must be smaller than 10 mb") || lower.includes("file too large") || lower.includes("limit_file_size")) {
    return "File size exceeds the 10 MB limit. Please upload a smaller file.";
  }
  if (lower.includes("invalid file type") || lower.includes(".xlsx or .xls") || lower.includes("select an excel file")) {
    return "Please upload a valid Excel file (.xlsx or .xls).";
  }

  // 11. Technical crash filters (mask raw stack traces and programming errors)
  if (
    lower.includes("cannot read properties of") ||
    lower.includes("is not a function") ||
    lower.includes("syntaxerror") ||
    lower.includes("referenceerror") ||
    lower.includes("uncaught exception") ||
    lower.includes("internal server error") ||
    lower.includes("request failed with status code")
  ) {
    return "A temporary server error occurred. Please try again shortly.";
  }

  // If already a clean, human-readable sentence, return it
  if (str.length > 0 && str.length < 180 && !str.includes("Error:") && !str.includes("at ") && !str.includes("SQLSTATE")) {
    return str;
  }

  return fallback;
}

/**
 * Trigger styled toast notification for errors
 */
export function showErrorToast(error, fallback) {
  const msg = parseApiError(error, fallback);
  return toast.error(msg, {
    duration: 5000,
  });
}
