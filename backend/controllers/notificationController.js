
const pool = require("../config/db");

// GET ALL NOTIFICATIONS
const getNotifications = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT
                n.notification_id,
                n.recipient_id,
                n.actor_id,
                n.notification_type,
                n.post_id,
                n.report_id,
                n.message,
                n.created_at,
                n.read_at,
                s.full_name AS actor_name
             FROM notification n
             LEFT JOIN student s
                ON n.actor_id = s.student_id
             WHERE n.recipient_id = $1
             ORDER BY n.created_at DESC`,
            [studentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get notifications error:", error.message);

        res.status(500).json({
            error: "Failed to fetch notifications"
        });
    }
};


// GET UNREAD NOTIFICATION COUNT
const getUnreadCount = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const result = await pool.query(
            `SELECT COUNT(*) AS unread_count
             FROM notification
             WHERE recipient_id = $1
               AND read_at IS NULL`,
            [studentId]
        );

        res.json({
            unread_count: Number(result.rows[0].unread_count)
        });

    } catch (error) {
        console.error("Unread count error:", error.message);

        res.status(500).json({
            error: "Failed to fetch unread count"
        });
    }
};


// MARK NOTIFICATION AS READ
const markAsRead = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { notificationId } = req.params;

        const result = await pool.query(
            `UPDATE notification
             SET read_at = CURRENT_TIMESTAMP
             WHERE notification_id = $1
               AND recipient_id = $2
               AND read_at IS NULL
             RETURNING *`,
            [notificationId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Notification not found or already read"
            });
        }

        res.json({
            message: "Notification marked as read",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("Mark notification error:", error.message);

        res.status(500).json({
            error: "Failed to mark notification as read"
        });
    }
};


module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead
};
