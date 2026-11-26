const pool = require("../config/db");
const fetchLeetCodeStats = require("../services/leetcodeService");

// SYNC LEETCODE STATISTICS
const syncLeetCodeStats = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { profileId } = req.params;

        // Find the student's LeetCode profile
        const profileResult = await pool.query(
            `SELECT profile_id, username
             FROM coding_profile
             WHERE profile_id = $1
               AND student_id = $2
               AND platform = 'LEETCODE'`,
            [profileId, studentId]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({
                error: "LeetCode profile not found"
            });
        }

        const profile = profileResult.rows[0];

        // Fetch live statistics
        const stats = await fetchLeetCodeStats(profile.username);

        // Save statistics in PostgreSQL
        const result = await pool.query(
            `INSERT INTO coding_stats
                (profile_id, rating, problems_solved, contests_participated)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                profile.profile_id,
                stats.rating,
                stats.problems_solved,
                stats.contests_participated
            ]
        );

        res.status(201).json({
            message: "LeetCode statistics synchronized successfully!",
            stats: {
                ...stats,
                recorded_at: result.rows[0].recorded_at
            }
        });

    } catch (error) {
        console.error("LeetCode sync error:", error.message);

        res.status(502).json({
            error: "Unable to synchronize LeetCode statistics"
        });
    }
};

// GET CODING STATISTICS
const getCodingStats = async (req, res) => {
    try {
        const { profileId } = req.params;

        const result = await pool.query(
            `SELECT cs.*
             FROM coding_stats cs
             JOIN coding_profile cp
               ON cs.profile_id = cp.profile_id
             WHERE cp.profile_id = $1
               AND cp.student_id = $2
             ORDER BY cs.recorded_at DESC`,
            [profileId, req.student.student_id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get coding stats error:", error.message);

        res.status(500).json({
            error: "Failed to fetch coding statistics"
        });
    }
};

// GET CAMPUS-WIDE CODING LEADERBOARDS
const getCampusLeaderboard = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                cp.profile_id,
                cp.platform,
                cp.username,
                cp.profile_url,
                s.student_id,
                s.full_name,
                latest.rating,
                latest.problems_solved,
                latest.contests_participated,
                latest.recorded_at
            FROM coding_profile cp
            JOIN student s
                ON s.student_id = cp.student_id
            AND s.is_active = TRUE
            LEFT JOIN LATERAL (
                SELECT
                    cs.rating,
                    cs.problems_solved,
                    cs.contests_participated,
                    cs.recorded_at
                FROM coding_stats cs
                WHERE cs.profile_id = cp.profile_id
                ORDER BY cs.recorded_at DESC
                LIMIT 1
            ) latest ON TRUE
            ORDER BY
                cp.platform ASC,
                latest.problems_solved DESC NULLS LAST,
                latest.rating DESC NULLS LAST,
                cp.username ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Campus leaderboard error:", error.message);
        res.status(500).json({
            error: "Failed to load campus leaderboard"
        });
    }
};

module.exports = {
    syncLeetCodeStats,
    getCodingStats,
    getCampusLeaderboard
};