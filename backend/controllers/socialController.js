const pool = require("../config/db");

// ADD SOCIAL ACCOUNT
const addSocialAccount = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { platform, profile_url } = req.body;

        const allowedPlatforms = [
            "INSTAGRAM",
            "LINKEDIN",
            "GITHUB",
            "X"
        ];

        const normalizedPlatform = platform?.trim().toUpperCase();

        if (!allowedPlatforms.includes(normalizedPlatform)) {
            return res.status(400).json({
                error: "Invalid social media platform"
            });
        }

        if (!profile_url?.trim()) {
            return res.status(400).json({
                error: "Profile URL is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO social_account
                (student_id, platform, profile_url)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [studentId, normalizedPlatform, profile_url.trim()]
        );

        res.status(201).json({
            message: "Social account added successfully!",
            account: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "This social account is already added"
            });
        }

        console.error("Add social account error:", error.message);
        res.status(500).json({
            error: "Failed to add social account"
        });
    }
};

// GET SOCIAL ACCOUNTS
const getSocialAccounts = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT account_id, platform, profile_url, created_at
             FROM social_account
             WHERE student_id = $1
             ORDER BY created_at DESC`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get social accounts error:", error.message);
        res.status(500).json({
            error: "Failed to fetch social accounts"
        });
    }
};

// DELETE SOCIAL ACCOUNT
const deleteSocialAccount = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { accountId } = req.params;

        const result = await pool.query(
            `DELETE FROM social_account
             WHERE account_id = $1 AND student_id = $2
             RETURNING account_id`,
            [accountId, studentId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Social account not found"
            });
        }

        res.json({
            message: "Social account removed successfully!"
        });

    } catch (error) {
        console.error("Delete social account error:", error.message);
        res.status(500).json({
            error: "Failed to delete social account"
        });
    }
};

module.exports = {
    addSocialAccount,
    getSocialAccounts,
    deleteSocialAccount
};
