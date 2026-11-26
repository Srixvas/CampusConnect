
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createReport,
    getAllReports,
    getReportById,
    addReportResponse,
    getReportResponses,
    updateReportStatus
} = require("../controllers/lostFoundController");

// Lost & Found reports
router.post("/", protect, createReport);
router.get("/", protect, getAllReports);
router.get("/:reportId", protect, getReportById);
router.patch("/:reportId/status", protect, updateReportStatus);

// Responses
router.post("/:reportId/responses", protect, addReportResponse);
router.get("/:reportId/responses", protect, getReportResponses);

module.exports = router;
