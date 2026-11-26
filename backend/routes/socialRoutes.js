const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addSocialAccount,
    getSocialAccounts,
    deleteSocialAccount
} = require("../controllers/socialController");

router.post("/", protect, addSocialAccount);
router.get("/", protect, getSocialAccounts);
router.delete("/:accountId", protect, deleteSocialAccount);

module.exports = router;