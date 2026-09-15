const axios = require("axios");

const db = require("../config/db");

const warehouseModel =
  require("../models/warehouseModel");

const returnAddressModel =
  require("../models/returnAddressModel");


// ======================================================
// DELHIVERY CONFIG
// ======================================================

const DELHIVERY_API_TOKEN =
  process.env.DELHIVERY_API_TOKEN;

const DELHIVERY_API_BASE_URL =
  process.env.DELHIVERY_API_BASE_URL ||
  "https://track.delhivery.com";


// ======================================================
// GENERATE UNIQUE WAREHOUSE NAME
// ======================================================

const generateWarehouseName = (baseName) => {
  const cleanName =
    String(baseName || "").trim();

  const randomFourDigit =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `${cleanName} ${randomFourDigit}`;
};


// ======================================================
// COMMON RESPONSE HELPER
// ======================================================

const sendError = (
  res,
  status,
  message,
  error = null
) => {

  console.log(
    "Warehouse API Error:",
    message,
    error || ""
  );

  return res.status(status).json({
    success: false,
    message,

    ...(error
      ? {
          error:
            error.message ||
            String(error),
        }
      : {}),
  });
};


// ======================================================
// CREATE WAREHOUSE
// ======================================================

const createWarehouse = async (
  req,
  res
) => {

  try {

    const {
      user_id,

      warehouse_name,
      contact_name,
      phone,
      email,

      gstin,

      address_line1,
      address_line2,

      floor_no,
      landmark,

      pincode,
      city,
      state,
      country,

      return_address,
      return_city,
      return_pincode,
      return_state,
      return_country,

    } = req.body;


    // ==================================================
    // USER
    // ==================================================

    if (!user_id) {

      return sendError(
        res,
        400,
        "User ID is required"
      );

    }


    // ==================================================
    // REQUIRED FIELDS
    // ==================================================

    if (
      !warehouse_name ||
      !String(
        warehouse_name
      ).trim()
    ) {

      return sendError(
        res,
        400,
        "Warehouse name is required"
      );

    }


    if (
      !contact_name ||
      !String(
        contact_name
      ).trim()
    ) {

      return sendError(
        res,
        400,
        "Contact name is required"
      );

    }


    if (
      !phone ||
      !String(phone).trim()
    ) {

      return sendError(
        res,
        400,
        "Phone number is required"
      );

    }


    if (
      !address_line1 ||
      !String(
        address_line1
      ).trim()
    ) {

      return sendError(
        res,
        400,
        "Warehouse address is required"
      );

    }


    if (
      !pincode ||
      !/^\d{6}$/.test(
        String(pincode).trim()
      )
    ) {

      return sendError(
        res,
        400,
        "Valid 6-digit warehouse pincode is required"
      );

    }


    if (
      !city ||
      !String(city).trim()
    ) {

      return sendError(
        res,
        400,
        "Warehouse city is required"
      );

    }


    if (
      !state ||
      !String(state).trim()
    ) {

      return sendError(
        res,
        400,
        "Warehouse state is required"
      );

    }


    // ==================================================
    // FINAL UNIQUE WAREHOUSE NAME
    // ==================================================

    const finalWarehouseName =
      generateWarehouseName(
        warehouse_name
      );


    console.log(
      "Original warehouse name:",
      warehouse_name
    );

    console.log(
      "Generated Delhivery warehouse name:",
      finalWarehouseName
    );


    // ==================================================
    // DELHIVERY REGISTER
    // ==================================================

    let delhiveryResponse =
      null;


    if (
      DELHIVERY_API_TOKEN
    ) {

      try {

        const delhiveryUrl =
          `${DELHIVERY_API_BASE_URL}/api/backend/clientwarehouse/create/`;


        const delhiveryPayload = {

          name:
            finalWarehouseName,

          registered_name:
            finalWarehouseName,

          phone:
            String(
              phone
            ).trim(),

          address:
            String(
              address_line1
            ).trim(),

          address_2:
            address_line2 ||
            "",

          city:
            String(
              city
            ).trim(),

          state:
            String(
              state
            ).trim(),

          pin:
            String(
              pincode
            ).trim(),

          country:
            country ||
            "India",

          return_address:
            return_address ||
            address_line1,

          return_city:
            return_city ||
            city,

          return_pin:
            return_pincode ||
            pincode,

          return_state:
            return_state ||
            state,

          return_country:
            return_country ||
            country ||
            "India",

        };


        console.log(
          "Registering Delhivery warehouse:",
          finalWarehouseName
        );


        const response =
          await axios.post(
            delhiveryUrl,
            delhiveryPayload,
            {
              headers: {

                Authorization:
                  `Token ${DELHIVERY_API_TOKEN}`,

                "Content-Type":
                  "application/json",

              },

              timeout:
                30000,
            }
          );


        delhiveryResponse =
          response.data;


      } catch (error) {

        console.log(
          "Delhivery warehouse registration error:",
          error.response?.data ||
          error.message
        );


        return sendError(
          res,

          error.response?.status >= 400 &&
          error.response?.status < 500
            ? 400
            : 502,

          "Unable to register warehouse with Delhivery",

          error
        );

      }

    } else {

      console.log(
        "WARNING: DELHIVERY_API_TOKEN not configured"
      );

    }


    // ==================================================
    // LOCAL DATABASE
    // ==================================================

    const warehouseData = {

      user_id:
        Number(user_id),

      // IMPORTANT:
      // Save the SAME generated name that was
      // registered with Delhivery.
      warehouse_name:
        finalWarehouseName,

      contact_name:
        String(
          contact_name
        ).trim(),

      phone:
        String(
          phone
        ).trim(),

      email:
        email ||
        null,

      gstin:
        gstin ||
        null,

      address_line1:
        String(
          address_line1
        ).trim(),

      address_line2:
        address_line2 ||
        null,

      floor_no:
        floor_no ||
        null,

      landmark:
        landmark ||
        null,

      pincode:
        String(
          pincode
        ).trim(),

      city:
        String(
          city
        ).trim(),

      state:
        String(
          state
        ).trim(),

      country:
        country ||
        "India",

      return_address:
        String(
          return_address ||
          address_line1
        ).trim(),

      return_city:
        return_city ||
        city,

      return_pincode:
        return_pincode ||
        pincode,

      return_state:
        return_state ||
        state,

      return_country:
        return_country ||
        country ||
        "India",

      delhivery_registered:
        DELHIVERY_API_TOKEN
          ? true
          : false,

      status:
        "ACTIVE",

    };


    warehouseModel.createWarehouse(

      warehouseData,

      async (err, result) => {

        if (err) {

          console.log(
            "Warehouse database error:",
            err
          );


          return sendError(
            res,

            500,

            "Warehouse registered with Delhivery but could not be saved locally",

            err
          );

        }


        // ==================================================
        // AUTO-CREATE RETURN ADDRESS
        // ==================================================
        //
        // Every newly created pickup warehouse gets its own
        // ShipDrop return address.
        //
        // The return-address model automatically:
        // - makes the first address the default
        // - keeps the existing default when another address
        //   is created with is_default = false
        //
        // This is intentionally handled here, on the backend,
        // so Pickup Address and Return Address stay in sync
        // regardless of which frontend creates the warehouse.
        // ==================================================

        try {

          await returnAddressModel.createReturnAddress({

            user_id:
              Number(user_id),

            name:
              String(
                contact_name
              ).trim(),

            phone:
              String(
                phone
              ).trim(),

            email:
              email ||
              null,

            address_line1:
              String(
                address_line1
              ).trim(),

            address_line2:
              address_line2 ||
              null,

            landmark:
              landmark ||
              null,

            pincode:
              String(
                pincode
              ).trim(),

            city:
              String(
                city
              ).trim(),

            state:
              String(
                state
              ).trim(),

            country:
              country ||
              "India",

            // IMPORTANT:
            // Do not force a newly created return address
            // to become default. The model decides whether
            // it is the first address for this user.
            is_default:
              false,

          });

          console.log(
            "Return address created automatically for warehouse:",
            result.insertId
          );

        } catch (returnAddressError) {

          console.log(
            "Automatic return address creation error:",
            returnAddressError
          );

          // Warehouse creation itself succeeded. Do not
          // pretend the warehouse failed just because the
          // separate return-address sync failed.
          return res.status(201).json({

            success:
              true,

            message:
              "Warehouse created successfully, but return address could not be created",

            warehouse_id:
              result.insertId,

            warehouse_name:
              finalWarehouseName,

            delhivery:
              delhiveryResponse,

            return_address_created:
              false,

            return_address_error:
              returnAddressError.message ||
              String(returnAddressError),

          });

        }


        return res.status(201).json({

          success:
            true,

          message:
            "Warehouse created successfully",

          warehouse_id:
            result.insertId,

          // Return generated name to frontend.
          warehouse_name:
            finalWarehouseName,

          delhivery:
            delhiveryResponse,

        });

      }
    );


  } catch (error) {

    return sendError(

      res,

      500,

      error.message ||
        "Unable to create warehouse",

      error

    );

  }

};


// ======================================================
// GET USER WAREHOUSES
// ======================================================

const getWarehouses = (
  req,
  res
) => {

  try {

    const rawUserId =
      req.query.user_id;


    const userId =
      Number(rawUserId);


    console.log(
      "========================================"
    );

    console.log(
      "GET WAREHOUSES"
    );

    console.log(
      "Raw user_id:",
      rawUserId
    );

    console.log(
      "Parsed user_id:",
      userId
    );

    console.log(
      "========================================"
    );


    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid user ID is required",

      });

    }


    warehouseModel.getWarehousesByUser(

      userId,

      (err, result) => {

        if (err) {

          console.log(
            "========================================"
          );

          console.log(
            "GET WAREHOUSES DATABASE ERROR"
          );

          console.log(
            err
          );

          console.log(
            "========================================"
          );


          return res.status(500).json({

            success:
              false,

            message:
              "Unable to fetch warehouses",

            error:
              err.message,

          });

        }


        const warehouses =
          Array.isArray(result)
            ? result
            : [];


        console.log(
          "Warehouses found:",
          warehouses.length
        );


        return res.status(200).json({

          success:
            true,

          warehouses,

        });

      }

    );


  } catch (error) {

    console.log(
      "Get warehouses controller error:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        error.message ||
        "Unable to fetch warehouses",

    });

  }

};


// ======================================================
// GET SINGLE WAREHOUSE
// ======================================================

const getWarehouseById = (
  req,
  res
) => {

  try {

    const warehouseId =
      Number(
        req.params.id
      );

    const userId =
      Number(
        req.query.user_id
      );


    if (
      !Number.isInteger(
        warehouseId
      ) ||
      warehouseId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid warehouse ID is required",

      });

    }


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid user ID is required",

      });

    }


    warehouseModel.getWarehouseById(

      warehouseId,

      userId,

      (err, result) => {

        if (err) {

          console.log(
            "Get warehouse error:",
            err
          );


          return res.status(500).json({

            success:
              false,

            message:
              err.message ||
              "Unable to fetch warehouse",

          });

        }


        if (
          !result ||
          result.length === 0
        ) {

          return res.status(404).json({

            success:
              false,

            message:
              "Warehouse not found",

          });

        }


        return res.status(200).json({

          success:
            true,

          warehouse:
            result[0],

        });

      }

    );


  } catch (error) {

    return res.status(500).json({

      success:
        false,

      message:
        error.message ||
        "Unable to fetch warehouse",

    });

  }

};


// ======================================================
// UPDATE WAREHOUSE
// ======================================================

const updateWarehouse = async (
  req,
  res
) => {

  try {

    const warehouseId =
      Number(
        req.params.id
      );


    const {
      user_id,

      contact_name,
      phone,
      email,

      gstin,

      address_line1,
      address_line2,

      floor_no,
      landmark,

      pincode,
      city,
      state,
      country,

      return_address,
      return_city,
      return_pincode,
      return_state,
      return_country,
      status,

    } = req.body;


    const userId =
      Number(user_id);


    if (
      !Number.isInteger(
        warehouseId
      ) ||
      warehouseId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid warehouse ID is required",

      });

    }


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid user ID is required",

      });

    }


    // ==================================================
    // STATUS ONLY UPDATE
    // ==================================================
    //
    // The status toggle only changes ShipDrop's local
    // warehouse status.
    //
    // It does NOT send an update to Delhivery.
    //
    // ACTIVE:
    // Warehouse is available for Create Order.
    //
    // INACTIVE:
    // Warehouse remains in ShipDrop but should be
    // hidden from Create Order selection.
    // ==================================================

    if (status !== undefined) {

      const normalizedStatus =
        String(
          status
        )
          .trim()
          .toUpperCase();


      if (
        ![
          "ACTIVE",
          "INACTIVE",
        ].includes(
          normalizedStatus
        )
      ) {

        return res.status(400).json({

          success:
            false,

          message:
            "Status must be ACTIVE or INACTIVE",

        });

      }


db.query(
  `
  UPDATE warehouses
  SET status = ?
  WHERE id = ?
    AND user_id = ?
  `,
  [
    normalizedStatus,
    warehouseId,
    userId,
  ],
  (statusError, statusResult) => {

    if (statusError) {
      console.log(
        "Warehouse status update error:",
        statusError
      );

      return res.status(500).json({
        success: false,
        message:
          statusError.message ||
          "Unable to update warehouse status",
      });
    }

    if (
      statusResult.affectedRows === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Warehouse status updated successfully",
      warehouse_id: warehouseId,
      status: normalizedStatus,
    });
  }
);

return;
    }


    // ==================================================
    // GET EXISTING WAREHOUSE
    // ==================================================

    warehouseModel.getWarehouseById(

      warehouseId,

      userId,

      async (
        err,
        result
      ) => {

        if (err) {

          return res.status(500).json({

            success:
              false,

            message:
              err.message,

          });

        }


        if (
          !result ||
          result.length === 0
        ) {

          return res.status(404).json({

            success:
              false,

            message:
              "Warehouse not found",

          });

        }


        const existing =
          result[0];


        // ==================================================
        // UPDATED DATA
        // ==================================================

        const updateData = {

          // IMPORTANT:
          // Generated Delhivery warehouse name should
          // never change during normal edit.
          warehouse_name:
            existing.warehouse_name,

          contact_name:
            contact_name ||
            existing.contact_name,

          phone:
            phone ||
            existing.phone,

          email:
            email ??
            existing.email,

          gstin:
            gstin ??
            existing.gstin,

          address_line1:
            address_line1 ||
            existing.address_line1,

          address_line2:
            address_line2 ??
            existing.address_line2,

          floor_no:
            floor_no ??
            existing.floor_no,

          landmark:
            landmark ??
            existing.landmark,

          pincode:
            pincode ||
            existing.pincode,

          city:
            city ||
            existing.city,

          state:
            state ||
            existing.state,

          country:
            country ||
            existing.country ||
            "India",

          return_address:
            return_address ||
            existing.return_address ||
            address_line1 ||
            existing.address_line1,

          return_city:
            return_city ||
            existing.return_city ||
            city ||
            existing.city,

          return_pincode:
            return_pincode ||
            existing.return_pincode ||
            pincode ||
            existing.pincode,

          return_state:
            return_state ||
            existing.return_state ||
            state ||
            existing.state,

          return_country:
            return_country ||
            existing.return_country ||
            country ||
            existing.country ||
            "India",

          delhivery_registered:
            true,

          // Preserve current status unless this is
          // explicitly handled by the status-only block.
          status:
            existing.status ||
            "ACTIVE",

        };


        // ==================================================
        // UPDATE LOCAL DATABASE
        // ==================================================

        warehouseModel.updateWarehouse(

          warehouseId,

          userId,

          updateData,

          (
            updateError,
            updateResult
          ) => {

            if (updateError) {

              console.log(
                "Local warehouse update error:",
                updateError
              );


              return res.status(500).json({

                success:
                  false,

                message:
                  "Warehouse update failed",

                error:
                  updateError.message,

              });

            }


            if (
              updateResult.affectedRows ===
              0
            ) {

              return res.status(404).json({

                success:
                  false,

                message:
                  "Warehouse not found",

              });

            }


            // ==================================================
            // FETCH UPDATED RECORD
            // ==================================================

            warehouseModel.getWarehouseById(

              warehouseId,

              userId,

              (
                fetchError,
                updatedRows
              ) => {

                if (fetchError) {

                  return res.status(200).json({

                    success:
                      true,

                    message:
                      "Warehouse updated successfully",

                    warehouse_id:
                      warehouseId,

                  });

                }


                return res.status(200).json({

                  success:
                    true,

                  message:
                    "Warehouse updated successfully",

                  warehouse_id:
                    warehouseId,

                  warehouse:
                    updatedRows?.[0] ||
                    null,

                });

              }

            );

          }

        );

      }

    );


  } catch (error) {

    console.log(
      "Update warehouse controller error:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        error.message ||
        "Unable to update warehouse",

    });

  }

};


// ======================================================
// DELETE WAREHOUSE
// ======================================================

const deleteWarehouse = (
  req,
  res
) => {

  try {

    const warehouseId =
      Number(
        req.params.id
      );


    const userId =
      Number(
        req.body.user_id
      );


    if (
      !Number.isInteger(
        warehouseId
      ) ||
      warehouseId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid warehouse ID is required",

      });

    }


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <= 0
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Valid user ID is required",

      });

    }


    warehouseModel.deleteWarehouse(

      warehouseId,

      userId,

      (
        err,
        result
      ) => {

        if (err) {

          return res.status(500).json({

            success:
              false,

            message:
              err.message,

          });

        }


        if (
          result.affectedRows ===
          0
        ) {

          return res.status(404).json({

            success:
              false,

            message:
              "Warehouse not found",

          });

        }


        return res.status(200).json({

          success:
            true,

          message:
            "Warehouse deleted successfully",

        });

      }

    );


  } catch (error) {

    return res.status(500).json({

      success:
        false,

      message:
        error.message ||
        "Unable to delete warehouse",

    });

  }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  createWarehouse,

  getWarehouses,

  getWarehouseById,

  updateWarehouse,

  deleteWarehouse,

};