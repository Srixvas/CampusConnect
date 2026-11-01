const express = require("express");
const router = express.Router();

const {
    registerStudent,
    verifyEmail,
    loginStudent
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// Student registration
router.post("/register", registerStudent);

// Verify institute email OTP
router.post("/verify-email", verifyEmail);

// Student login
router.post("/login", loginStudent);

// Get currently authenticated student
router.get("/me", protect, (req, res) => {
    res.status(200).json({
        message: "Authenticated successfully!",
        student: req.student
    });
});

module.exports = router;