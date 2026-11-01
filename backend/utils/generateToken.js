
const jwt = require("jsonwebtoken");

const generateToken = (student) => {
    return jwt.sign(
        {
            student_id: student.student_id,
            institute_email: student.institute_email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
};

module.exports = generateToken;
