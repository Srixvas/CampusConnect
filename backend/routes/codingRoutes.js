const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addCodingProfile,
    getCodingProfiles,
    deleteCodingProfile
} = require("../controllers/codingController");

router.post("/", protect, addCodingProfile);
router.get("/", protect, getCodingProfiles);
router.delete("/:profileId", protect, deleteCodingProfile);

module.exports = router;