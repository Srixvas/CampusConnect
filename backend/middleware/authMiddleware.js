
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
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

            req.student = {
                student_id: decoded.student_id,
                institute_email: decoded.institute_email
            };

            next();

        } catch (error) {
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
