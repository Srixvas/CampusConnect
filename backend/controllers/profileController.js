const pool = require("../config/db");

// GET STUDENT PROFILE
const getProfile = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT
                s.student_id,
                s.full_name,
                s.institute_email,
                s.academic_year,
                s.department,
                sp.bio,
                sp.avatar_url
             FROM student s
             LEFT JOIN student_profile sp
                ON s.student_id = sp.student_id
             WHERE s.student_id = $1
               AND s.is_active = TRUE`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Student profile not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get profile error:", error.message);
        res.status(500).json({
            error: "Failed to fetch profile"
        });
    }
};

// UPDATE STUDENT PROFILE
const updateProfile = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { bio, avatar_url } = req.body;

        const result = await pool.query(
            `INSERT INTO student_profile
                (student_id, bio, avatar_url, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (student_id)
             DO UPDATE SET
                bio = EXCLUDED.bio,
                avatar_url = EXCLUDED.avatar_url,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [studentId, bio || null, avatar_url || null]
        );

        res.json({
            message: "Profile updated successfully!",
            profile: result.rows[0]
        });

    } catch (error) {
        console.error("Update profile error:", error.message);
        res.status(500).json({
            error: "Failed to update profile"
        });
    }
};

module.exports = {
    getProfile,
    updateProfile
};