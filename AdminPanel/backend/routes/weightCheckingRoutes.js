const express = require("express");
const multer = require("multer");

const router = express.Router();


// ======================================================
// MULTER
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const allowedExtensions = [
      ".xlsx",
      ".xls",
      ".csv",
    ];

    const extension =
      require("path")
        .extname(
          file.originalname
        )
        .toLowerCase();

    if (
      allowedExtensions.includes(
        extension
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only Excel (.xlsx, .xls) or CSV files are allowed"
        )
      );
    }
  },
});


// ======================================================
// CONTROLLERS
// ======================================================

const {
  getAllWeightCheckings,

  getWeightCheckingById,

  createWeightChecking,

  updateActualWeight,

  updateWeightCharges,

  settleWeightChecking,

  settleAllPendingWeightCheckings,

  settleSelectedWeightCheckings,

  resetImportedWeightCheckings,

  waiveWeightChecking,
} = require(
  "../controllers/weightCheckingController"
);


// ======================================================
// IMPORT CONTROLLER
// ======================================================

const {
  importWeightFile,
} = require(
  "../controllers/weightCheckingImportController"
);


// ======================================================
// GET ALL
// ======================================================

router.get(
  "/",
  getAllWeightCheckings
);


// ======================================================
// IMPORT EXCEL
// ======================================================

router.post(
  "/import",
  upload.single("file"),
  importWeightFile
);


// ======================================================
// SETTLE SELECTED
// ======================================================
//
// Frontend sends:
//
// {
//   ids: [1, 2, 3]
// }
//
// Only selected pending records are settled.
// ======================================================

router.patch(
  "/settle-selected",
  settleSelectedWeightCheckings
);


// ======================================================
// RESET IMPORTED
// ======================================================
//
// Frontend sends:
//
// {
//   ids: [1, 2, 3]
// }
//
// Only PENDING + COURIER_IMPORT records
// can be reset.
// ======================================================

router.patch(
  "/reset-imported",
  resetImportedWeightCheckings
);


// ======================================================
// LEGACY SETTLE ALL
// ======================================================
//
// Kept only for old compatibility.
// Current frontend does NOT use this.
// ======================================================

router.patch(
  "/settle-all",
  settleAllPendingWeightCheckings
);


// ======================================================
// GET SINGLE
// ======================================================
//
// IMPORTANT:
// This must stay AFTER the fixed routes above.
// Otherwise /settle-selected etc. can be treated
// as an :id.
// ======================================================

router.get(
  "/:id",
  getWeightCheckingById
);


// ======================================================
// CREATE
// ======================================================

router.post(
  "/",
  createWeightChecking
);


// ======================================================
// UPDATE ACTUAL WEIGHT
// ======================================================

router.patch(
  "/:id/actual-weight",
  updateActualWeight
);


// ======================================================
// UPDATE CHARGES
// ======================================================

router.patch(
  "/:id/charges",
  updateWeightCharges
);


// ======================================================
// SETTLE SINGLE
// ======================================================

router.patch(
  "/:id/settle",
  settleWeightChecking
);


// ======================================================
// WAIVE
// ======================================================

router.patch(
  "/:id/waive",
  waiveWeightChecking
);


// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
  (
    err,
    req,
    res,
    next
  ) => {
    if (
      err instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        success: false,
        message:
          err.message ||
          "File upload error",
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message:
          err.message ||
          "File upload failed",
      });
    }

    next();
  }
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;