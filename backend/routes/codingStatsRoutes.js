const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    syncLeetCodeStats,
    getCodingStats,
    getCampusLeaderboard
} = require("../controllers/codingStatsController");

// Campus-wide leaderboard
router.get("/leaderboard", protect, getCampusLeaderboard);

// Individual coding profile stats
router.post("/:profileId/sync", protect, syncLeetCodeStats);
router.get("/:profileId", protect, getCodingStats);

module.exports = router;