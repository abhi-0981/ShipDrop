const express = require("express");

const {
  createRateCard,
  getRateCards,
  updateRateCard,
  updateRateCardStatus,
  getRateCardServices,
  updateServiceSettings,
  getServiceRates,
  saveServiceRate,
  deleteServiceRate,
  deleteRateCard,

  // ADDITIONS
  getServiceAdditions,
  saveServiceAddition,
  deleteServiceAddition,

} = require("../controllers/rateCardController");

const router = express.Router();


// =====================================================
// RATE CARDS
// =====================================================

// GET ALL RATE CARDS
router.get(
  "/",
  getRateCards
);


// CREATE RATE CARD
router.post(
  "/",
  createRateCard
);


// UPDATE RATE CARD
router.put(
  "/:id",
  updateRateCard
);


// DELETE RATE CARD
router.delete(
  "/:id",
  deleteRateCard
);


// UPDATE RATE CARD STATUS
router.patch(
  "/:id/status",
  updateRateCardStatus
);


// =====================================================
// RATE CARD SERVICES
// =====================================================

// GET ROAD + AIR SERVICES
router.get(
  "/:id/services",
  getRateCardServices
);


// UPDATE SERVICE API SETTINGS
router.patch(
  "/:rateCardId/services/:serviceId/settings",
  updateServiceSettings
);


// =====================================================
// SERVICE RATES
// =====================================================

// GET SERVICE RATES
router.get(
  "/:rateCardId/services/:serviceId/rates",
  getServiceRates
);


// CREATE / UPDATE RATE SLAB
router.post(
  "/:rateCardId/services/:serviceId/rates",
  saveServiceRate
);


// DELETE RATE SLAB
router.delete(
  "/:rateCardId/services/:serviceId/rates/:rateId",
  deleteServiceRate
);


// =====================================================
// SERVICE ADDITIONS
// =====================================================

// GET ADDITION RULES
router.get(
  "/:rateCardId/services/:serviceId/additions",
  getServiceAdditions
);


// CREATE / UPDATE ADDITION RULE
router.post(
  "/:rateCardId/services/:serviceId/additions",
  saveServiceAddition
);


// DELETE ADDITION RULE
router.delete(
  "/:rateCardId/services/:serviceId/additions/:additionId",
  deleteServiceAddition
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;