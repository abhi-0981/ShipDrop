const {
  confirmShipment,
  bulkConfirmShipments,
} = require("../services/shipmentService");


// ========================================
// CONFIRM SINGLE SHIPMENT
// ========================================

const confirmShipmentController = async (
  req,
  res
) => {
  try {

    const {
      user_id,

      // PICKUP
      pickup_address,
      pickup_pincode,
      warehouse_id,

      // ORDER
      orderData,
      products,
      packages,

      // RATE
      shipping_charge,
      zone,
      distance_km,
      service_type,

    } = req.body;


    // ========================================
    // USER ID
    // ========================================

    if (!user_id) {

      return res.status(400).json({

        success: false,

        message:
          "User ID is required",

      });

    }


    // ========================================
    // WAREHOUSE ID
    // ========================================

    if (!warehouse_id) {

      return res.status(400).json({

        success: false,

        message:
          "Pickup warehouse is required",

      });

    }


    const normalizedWarehouseId =
      Number(
        warehouse_id
      );


    if (
      !Number.isInteger(
        normalizedWarehouseId
      ) ||
      normalizedWarehouseId <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid pickup warehouse is required",

      });

    }


    // ========================================
    // SERVICE TYPE
    // ========================================

    const normalizedServiceType =
      String(
        service_type ||
        "ROAD"
      )
        .trim()
        .toUpperCase();


    if (
      ![
        "ROAD",
        "AIR",
        "SHADOWFAX_ROAD",
      ].includes(
        normalizedServiceType
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid service type is required",

      });

    }


    // ========================================
    // PICKUP ADDRESS
    // ========================================

    if (
      !pickup_address ||
      !String(
        pickup_address
      ).trim()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Pickup address is required",

      });

    }


    // ========================================
    // PICKUP PINCODE
    // ========================================

    if (
      !pickup_pincode ||
      !/^\d{6}$/.test(
        String(
          pickup_pincode
        ).trim()
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid 6-digit pickup pincode is required",

      });

    }


    // ========================================
    // ORDER DATA
    // ========================================

    if (
      !orderData ||
      typeof orderData !== "object"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Order data is required",

      });

    }


    // ========================================
    // ORDER INTERNAL ID
    // ========================================

    if (
      !orderData.id
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Order ID is required",

      });

    }


    // ========================================
    // PRODUCTS
    // ========================================

    if (
      !Array.isArray(
        products
      ) ||
      products.length === 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "At least one product is required",

      });

    }


    // ========================================
    // PACKAGES
    // ========================================

    if (
      !Array.isArray(
        packages
      ) ||
      packages.length === 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "At least one package is required",

      });

    }


    // ========================================
    // SHIPPING CHARGE
    // ========================================

    if (
      shipping_charge === undefined ||
      shipping_charge === null ||
      Number(
        shipping_charge
      ) <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid shipping charge is required",

      });

    }


    // ========================================
    // ZONE
    // ========================================

    if (
      !zone ||
      !String(
        zone
      ).trim()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Shipping zone is required",

      });

    }


    // ========================================
    // CONFIRM SHIPMENT
    // ========================================

    const result =
      await confirmShipment({

        user_id,

        pickup_address,

        pickup_pincode,

        warehouse_id:
          normalizedWarehouseId,

        orderData,

        products,

        packages,

        shipping_charge,

        zone,

        distance_km,

        service_type:
          normalizedServiceType,

      });


    // ========================================
    // SUCCESS
    // ========================================

    return res.status(201).json(
      result
    );


  } catch (error) {

    console.log(
      "Confirm shipment error:",
      error
    );


    // ========================================
    // INSUFFICIENT BALANCE
    // ========================================

    if (
      error.message &&
      error.message
        .toLowerCase()
        .includes(
          "insufficient wallet balance"
        )
    ) {

      return res.status(400).json({

        success: false,

        message:
          error.message,

        code:
          "INSUFFICIENT_BALANCE",

      });

    }


    // ========================================
    // DELHIVERY / WAREHOUSE ERROR
    // ========================================

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Unable to confirm shipment",

    });

  }
};


// ========================================
// BULK CONFIRM SHIPMENTS
// ========================================

const bulkConfirmShipmentController =
  async (
    req,
    res
  ) => {

    try {

      const {
        user_id,
        order_ids,
        service_type,
      } = req.body;


      // ========================================
      // USER ID
      // ========================================

      if (!user_id) {

        return res.status(400).json({

          success: false,

          message:
            "User ID is required",

        });

      }


      // ========================================
      // SERVICE TYPE
      // ========================================

      const normalizedServiceType =
        String(
          service_type ||
          "ROAD"
        )
          .trim()
          .toUpperCase();


      if (
        ![
          "ROAD",
          "AIR",
          "SHADOWFAX_ROAD",
        ].includes(
          normalizedServiceType
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Valid service type is required",

        });

      }


      // ========================================
      // ORDER IDS
      // ========================================

      if (
        !Array.isArray(
          order_ids
        ) ||
        order_ids.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please select at least one order",

        });

      }


      // ========================================
      // CLEAN IDS
      // ========================================

      const cleanOrderIds = [

        ...new Set(

          order_ids

            .map(
              (id) =>
                Number(id)
            )

            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            )

        ),

      ];


      // ========================================
      // VALID IDS
      // ========================================

      if (
        cleanOrderIds.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid order selection",

        });

      }


      // ========================================
      // BULK SHIPMENT
      // ========================================

      const result =
        await bulkConfirmShipments({

          user_id,

          order_ids:
            cleanOrderIds,

          service_type:
            normalizedServiceType,

        });


      // ========================================
      // SUCCESS
      // ========================================

      return res.status(201).json(
        result
      );


    } catch (error) {

      console.log(
        "Bulk shipment error:",
        error
      );


      // ========================================
      // INSUFFICIENT BALANCE
      // ========================================

      if (
        error.message &&
        error.message
          .toLowerCase()
          .includes(
            "insufficient wallet balance"
          )
      ) {

        return res.status(400).json({

          success: false,

          message:
            error.message,

          code:
            "INSUFFICIENT_BALANCE",

        });

      }


      // ========================================
      // GENERAL ERROR
      // ========================================

      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to ship selected orders",

      });

    }

  };


// ========================================
// EXPORT
// ========================================

module.exports = {

  confirmShipmentController,

  bulkConfirmShipmentController,

};