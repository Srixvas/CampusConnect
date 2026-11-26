const pool = require("../config/db");

// ADD CODING PROFILE
const addCodingProfile = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { platform, username, profile_url } = req.body;

        const normalizedPlatform = platform?.trim().toUpperCase();

        if (!["LEETCODE", "CODEFORCES"].includes(normalizedPlatform)) {
            return res.status(400).json({
                error: "Platform must be LEETCODE or CODEFORCES"
            });
        }

        if (!username?.trim() || !profile_url?.trim()) {
            return res.status(400).json({
                error: "Username and profile URL are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO coding_profile
                (student_id, platform, username, profile_url)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                studentId,
                normalizedPlatform,
                username.trim(),
                profile_url.trim()
            ]
        );

        res.status(201).json({
            message: "Coding profile added successfully!",
            profile: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "You have already added this coding platform"
            });
        }

        console.error("Add coding profile error:", error.message);
        res.status(500).json({
            error: "Failed to add coding profile"
        });
    }
};

// GET CODING PROFILES
const getCodingProfiles = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT
                cp.profile_id,
                cp.platform,
                cp.username,
                cp.profile_url,
                cp.created_at
             FROM coding_profile cp
             WHERE cp.student_id = $1
             ORDER BY cp.created_at DESC`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get coding profiles error:", error.message);
        res.status(500).json({
            error: "Failed to fetch coding profiles"
        });
    }
};

// DELETE CODING PROFILE
const deleteCodingProfile = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { profileId } = req.params;

        const result = await pool.query(
            `DELETE FROM coding_profile
             WHERE profile_id = $1 AND student_id = $2
             RETURNING profile_id`,
            [profileId, studentId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Coding profile not found"
            });
        }

        res.json({
            message: "Coding profile deleted successfully!"
        });

    } catch (error) {
        console.error("Delete coding profile error:", error.message);
        res.status(500).json({
            error: "Failed to delete coding profile"
        });
    }
};

module.exports = {
    addCodingProfile,
    getCodingProfiles,
    deleteCodingProfile
};