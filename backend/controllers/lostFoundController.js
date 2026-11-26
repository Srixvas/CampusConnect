const pool = require("../config/db");

// CREATE LOST OR FOUND REPORT
const createReport = async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const {
            report_type,
            item_name,
            description,
            location,
            event_date
        } = req.body;

        const type = report_type?.trim().toUpperCase();

        if (!["LOST", "FOUND"].includes(type)) {
            return res.status(400).json({
                error: "Report type must be LOST or FOUND"
            });
        }

        if (!item_name?.trim()) {
            return res.status(400).json({
                error: "Item name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO lost_found_report (
                student_id,
                report_type,
                item_name,
                description,
                location,
                event_date
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                studentId,
                type,
                item_name.trim(),
                description?.trim() || null,
                location?.trim() || null,
                event_date || null
            ]
        );

        res.status(201).json({
            message: "Lost & Found report created successfully!",
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Create report error:", error.message);

        res.status(500).json({
            error: "Failed to create report"
        });
    }
};

// GET ALL REPORTS
const getAllReports = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                r.*,
                s.full_name AS reporter_name,
                COALESCE(
                    (
                        SELECT json_agg(im.media_url)
                        FROM item_media im
                        WHERE im.report_id = r.report_id
                    ),
                    '[]'::json
                ) AS images
             FROM lost_found_report r
             JOIN student s
                ON r.student_id = s.student_id
             ORDER BY r.created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get reports error:", error.message);

        res.status(500).json({
            error: "Failed to fetch reports"
        });
    }
};

// GET SINGLE REPORT
const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;

        const result = await pool.query(
            `SELECT
                r.*,
                s.full_name AS reporter_name,
                s.institute_email AS reporter_email,
                COALESCE(
                    (
                        SELECT json_agg(im.media_url)
                        FROM item_media im
                        WHERE im.report_id = r.report_id
                    ),
                    '[]'::json
                ) AS images
             FROM lost_found_report r
             JOIN student s
                ON r.student_id = s.student_id
             WHERE r.report_id = $1`,
            [reportId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get report error:", error.message);

        res.status(500).json({
            error: "Failed to fetch report"
        });
    }
};


// ADD A RESPONSE AND NOTIFY REPORT OWNER
const addReportResponse = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { reportId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Response message is required"
            });
        }

        // Find report and its owner
        const report = await pool.query(
            `SELECT report_id, student_id
             FROM lost_found_report
             WHERE report_id = $1`,
            [reportId]
        );

        if (report.rows.length === 0) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        const recipientId = report.rows[0].student_id;

        // Insert response
        const result = await pool.query(
            `INSERT INTO item_response
                (report_id, student_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [reportId, studentId, message.trim()]
        );

        // Notify report owner (not when responding to own report)
        if (Number(recipientId) !== Number(studentId)) {
            await pool.query(
                `INSERT INTO notification (
                    recipient_id,
                    actor_id,
                    notification_type,
                    report_id,
                    message
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    recipientId,
                    studentId,
                    "ITEM_RESPONSE",
                    reportId,
                    "responded to your Lost & Found report"
                ]
            );
        }

        res.status(201).json({
            message: "Response added successfully!",
            response: result.rows[0]
        });

    } catch (error) {
        console.error("Add response error:", error.message);

        res.status(500).json({
            error: "Failed to add response"
        });
    }
};


// GET ALL RESPONSES FOR A REPORT
const getReportResponses = async (req, res) => {
    try {
        const { reportId } = req.params;

        const result = await pool.query(
            `SELECT
                ir.response_id,
                ir.report_id,
                ir.student_id,
                ir.message,
                ir.created_at,
                s.full_name AS responder_name
             FROM item_response ir
             JOIN student s
                ON ir.student_id = s.student_id
             WHERE ir.report_id = $1
             ORDER BY ir.created_at ASC`,
            [reportId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get responses error:", error.message);

        res.status(500).json({
            error: "Failed to fetch responses"
        });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const { reportId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "OPEN",
            "MATCHED",
            "RETURNED",
            "CLOSED"
        ];

        const newStatus = status?.trim().toUpperCase();

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        const result = await pool.query(
            `UPDATE lost_found_report
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE report_id = $2
               AND student_id = $3
             RETURNING *`,
            [newStatus, reportId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Report not found or you are not its owner"
            });
        }

        res.json({
            message: "Report status updated successfully!",
            report: result.rows[0]
        });

    } catch (error) {
        console.error("Update status error:", error.message);

        res.status(500).json({
            error: "Failed to update report status"
        });
    }
};


module.exports = {
    createReport,
    getAllReports,
    getReportById,
    addReportResponse,
    getReportResponses,
    updateReportStatus
};