
const pool = require("../config/db");

// FOLLOW A STUDENT
const followStudent = async (req, res) => {
    try {
        const followerId = req.student.student_id;
        const { studentId } = req.params;

        if (Number(followerId) === Number(studentId)) {
            return res.status(400).json({
                error: "You cannot follow yourself"
            });
        }

        // Check whether target student exists
        const student = await pool.query(
            `SELECT student_id
             FROM student
             WHERE student_id = $1
               AND is_active = TRUE`,
            [studentId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        // Insert follow relationship
        const result = await pool.query(
            `INSERT INTO student_follow (follower_id, following_id)
             VALUES ($1, $2)
             ON CONFLICT (follower_id, following_id) DO NOTHING
             RETURNING *`,
            [followerId, studentId]
        );

        // Create notification only for a new follow
        if (result.rowCount > 0) {
            await pool.query(
                `INSERT INTO notification (
                    recipient_id,
                    actor_id,
                    notification_type,
                    message
                )
                VALUES ($1, $2, $3, $4)`,
                [
                    studentId,
                    followerId,
                    "FOLLOW",
                    "started following you"
                ]
            );
        }

        res.status(201).json({
            message: result.rowCount
                ? "Student followed successfully!"
                : "You are already following this student."
        });

    } catch (error) {
        console.error("Follow error:", error.message);

        res.status(500).json({
            error: "Failed to follow student"
        });
    }
};

// UNFOLLOW A STUDENT
const unfollowStudent = async (req, res) => {
    try {
        const followerId = req.student.student_id;
        const { studentId } = req.params;

        const result = await pool.query(
            `DELETE FROM student_follow
             WHERE follower_id = $1
               AND following_id = $2
             RETURNING *`,
            [followerId, studentId]
        );

        res.json({
            message: result.rowCount
                ? "Student unfollowed successfully!"
                : "You are not following this student."
        });

    } catch (error) {
        console.error("Unfollow error:", error.message);

        res.status(500).json({
            error: "Failed to unfollow student"
        });
    }
};

// GET FOLLOWERS AND FOLLOWING
const getFollowDetails = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT
                (SELECT COUNT(*)
                 FROM student_follow
                 WHERE following_id = $1) AS followers_count,

                (SELECT COUNT(*)
                 FROM student_follow
                 WHERE follower_id = $1) AS following_count,

                (SELECT COALESCE(
                    json_agg(json_build_object(
                        'student_id', s.student_id,
                        'full_name', s.full_name
                    )), '[]'::json)
                 FROM student_follow sf
                 JOIN student s ON sf.follower_id = s.student_id
                 WHERE sf.following_id = $1) AS followers,

                (SELECT COALESCE(
                    json_agg(json_build_object(
                        'student_id', s.student_id,
                        'full_name', s.full_name
                    )), '[]'::json)
                 FROM student_follow sf
                 JOIN student s ON sf.following_id = s.student_id
                 WHERE sf.follower_id = $1) AS following`,
            [studentId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Follow details error:", error.message);

        res.status(500).json({
            error: "Failed to fetch follow details"
        });
    }
};

module.exports = {
    followStudent,
    unfollowStudent,
    getFollowDetails
};
