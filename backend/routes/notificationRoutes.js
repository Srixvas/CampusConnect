
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getNotifications,
    getUnreadCount,
    markAsRead
} = require("../controllers/notificationController");

// Get all notifications
router.get("/", protect, getNotifications);

// Get unread notification count
router.get("/unread-count", protect, getUnreadCount);

// Mark a notification as read
router.patch("/:notificationId/read", protect, markAsRead);

module.exports = router;
