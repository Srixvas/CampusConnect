
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const protect = async (req, res, next) =>{
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // Fetch the complete student details from PostgreSQL
            const result = await pool.query(
                `SELECT student_id, full_name, institute_email, academic_year, department
                 FROM student
                 WHERE student_id = $1`,
                [decoded.student_id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: "Student account not found. Please login again."
                });
            }

            // Attach full student information to the request
            req.student = result.rows[0];

            next();

        } catch (error) {
            console.error("Authentication error:", error.message);

            return res.status(401).json({
                error: "Invalid or expired token. Please login again."
            });
        }
    } else {
        return res.status(401).json({
            error: "Authentication required. Please provide a token."
        });
    }
};

module.exports = protect;
