const returnAddressModel = require("../models/returnAddressModel");

// ======================================================
// VALIDATION
// ======================================================

const validateAddress = (data) => {
  const {
    name,
    phone,
    address_line1,
    pincode,
    city,
    state,
  } = data;

  if (!String(name || "").trim()) {
    return "Name is required";
  }

  if (!/^\d{10}$/.test(String(phone || "").trim())) {
    return "Valid 10-digit phone number is required";
  }

  if (!String(address_line1 || "").trim()) {
    return "Address is required";
  }

  if (!/^\d{6}$/.test(String(pincode || "").trim())) {
    return "Valid 6-digit pincode is required";
  }

  if (!String(city || "").trim()) {
    return "City is required";
  }

  if (!String(state || "").trim()) {
    return "State is required";
  }

  return null;
};

// ======================================================
// GET ALL
// ======================================================

const getReturnAddresses = async (req, res) => {
  try {
    const userId = Number(
      req.query.user_id
    );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const addresses =
      await returnAddressModel.getReturnAddresses(
        userId
      );

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error(
      "Get return addresses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch return addresses",
    });
  }
};

// ======================================================
// GET SINGLE
// ======================================================

const getReturnAddress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(
      req.query.user_id
    );

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Return address ID and User ID are required",
      });
    }

    const address =
      await returnAddressModel.getReturnAddressById(
        id,
        userId
      );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Return address not found",
      });
    }

    return res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    console.error(
      "Get return address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch return address",
    });
  }
};

// ======================================================
// GET DEFAULT
// ======================================================

const getDefaultReturnAddress = async (
  req,
  res
) => {
  try {
    const userId = Number(
      req.query.user_id
    );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const address =
      await returnAddressModel.getDefaultReturnAddress(
        userId
      );

    return res.status(200).json({
      success: true,
      return_address: address || null,
      address: address || null,
    });
  } catch (error) {
    console.error(
      "Get default return address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch default return address",
    });
  }
};

// ======================================================
// CREATE
// ======================================================

const createReturnAddress = async (
  req,
  res
) => {
  try {
    const {
      user_id,
      name,
      phone,
      email,
      address_line1,
      address_line2,
      landmark,
      pincode,
      city,
      state,
      country,
      is_default,
    } = req.body;

    const userId = Number(user_id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const validationError =
      validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result =
      await returnAddressModel.createReturnAddress({
        user_id: userId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        email:
          String(email || "").trim() ||
          null,
        address_line1:
          String(address_line1).trim(),
        address_line2:
          String(address_line2 || "").trim() ||
          null,
        landmark:
          String(landmark || "").trim() ||
          null,
        pincode:
          String(pincode).trim(),
        city:
          String(city).trim(),
        state:
          String(state).trim(),
        country:
          String(country || "India").trim() ||
          "India",
        is_default: Boolean(is_default),
      });

    const address =
      await returnAddressModel.getReturnAddressById(
        result.id,
        userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Return address created successfully",
      address,
    });
  } catch (error) {
    console.error(
      "Create return address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create return address",
    });
  }
};

// ======================================================
// UPDATE
// ======================================================

const updateReturnAddress = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(
      req.body.user_id
    );

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Return address ID and User ID are required",
      });
    }

    const validationError =
      validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updated =
      await returnAddressModel.updateReturnAddress(
        id,
        userId,
        req.body
      );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Return address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Return address updated successfully",
      address: updated,
    });
  } catch (error) {
    console.error(
      "Update return address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update return address",
    });
  }
};

// ======================================================
// DELETE
// ======================================================

const deleteReturnAddress = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(
      req.body.user_id ||
      req.query.user_id
    );

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Return address ID and User ID are required",
      });
    }

    const result =
      await returnAddressModel.deleteReturnAddress(
        id,
        userId
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Return address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Return address deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete return address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to delete return address",
    });
  }
};

// ======================================================
// SET DEFAULT
// ======================================================

const setDefaultReturnAddress = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(
      req.body.user_id
    );

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Return address ID and User ID are required",
      });
    }

    const address =
      await returnAddressModel.setDefaultReturnAddress(
        id,
        userId
      );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Return address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Default return address updated successfully",
      address,
    });
  } catch (error) {
    console.error(
      "Set default return address error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to set default return address",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getReturnAddresses,
  getReturnAddress,
  getDefaultReturnAddress,
  createReturnAddress,
  updateReturnAddress,
  deleteReturnAddress,
  setDefaultReturnAddress,
};