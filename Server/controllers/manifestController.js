const manifestModel = require("../models/manifestModel");


// ======================================================
// GET ALL MANIFESTED ORDERS
// ======================================================

const getManifestedOrders = async (
  req,
  res
) => {

  try {

    const user_id =
      req.user?.id ||
      req.user?.user_id ||
      req.body?.user_id ||
      req.query?.user_id;


    if (!user_id) {

      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });

    }


    const manifests =
      await manifestModel.getManifestedOrders(
        user_id
      );


    return res.status(200).json({

      success: true,

      total:
        manifests.length,

      manifests

    });


  } catch (error) {

    console.log(
      "Get manifested orders error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to fetch manifested orders"

    });

  }

};


// ======================================================
// GET SINGLE MANIFEST
// ======================================================

const getManifestById = async (
  req,
  res
) => {

  try {

    const user_id =
      req.user?.id ||
      req.user?.user_id ||
      req.body?.user_id ||
      req.query?.user_id;


    const manifest_id =
      req.params?.manifest_id ||
      req.params?.id;


    if (!user_id) {

      return res.status(400).json({

        success: false,

        message:
          "User ID is required"

      });

    }


    if (!manifest_id) {

      return res.status(400).json({

        success: false,

        message:
          "Manifest ID is required"

      });

    }


    const manifest =
      await manifestModel.getManifestById(
        user_id,
        manifest_id
      );


    return res.status(200).json({

      success: true,

      manifest

    });


  } catch (error) {

    console.log(
      "Get manifest error:",
      error
    );


    if (
      error.message ===
      "Manifest not found"
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Manifest not found"

      });

    }


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to fetch manifest"

    });

  }

};


// ======================================================
// CANCEL MANIFESTED ORDERS
// ======================================================

const cancelManifestedOrders = async (
  req,
  res
) => {

  try {

    const user_id =
      req.user?.id ||
      req.user?.user_id ||
      req.body?.user_id;


    const order_ids =
      req.body?.order_ids;


    if (!user_id) {

      return res.status(400).json({

        success: false,

        message:
          "User ID is required"

      });

    }


    if (
      !Array.isArray(order_ids) ||
      order_ids.length === 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "At least one order must be selected"

      });

    }


    const result =
      await manifestModel.cancelManifestedOrders(
        user_id,
        order_ids
      );


    return res.status(200).json(
      result
    );


  } catch (error) {

    console.log(
      "Cancel manifested orders error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to cancel manifested orders"

    });

  }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getManifestedOrders,

  getManifestById,

  cancelManifestedOrders

};