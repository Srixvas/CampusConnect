
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const registerStudent = async (req, res) => {
    try {
        const {
            full_name,
            institute_email,
            password,
            academic_year,
            department
        } = req.body;

        // 1. Validate required fields
        if (
            !full_name ||
            !institute_email ||
            !password ||
            !academic_year ||
            !department
        ) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        // 2. Validate institute email
        const email = institute_email.trim().toLowerCase();
        const allowedDomain =
            process.env.INSTITUTE_EMAIL_DOMAIN?.toLowerCase();

        if (!allowedDomain || !email.endsWith(`@${allowedDomain}`)) {
            return res.status(400).json({
                error: "Only official institute email addresses are allowed"
            });
        }

        // 3. Validate password
        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must contain at least 8 characters"
            });
        }

        // 4. Validate academic year
        const year = Number(academic_year);

        if (!Number.isInteger(year) || year < 1 || year > 5) {
            return res.status(400).json({
                error: "Academic year must be between 1 and 5"
            });
        }

        // 5. Check whether email already exists
        const existingStudent = await pool.query(
            "SELECT student_id FROM student WHERE institute_email = $1",
            [email]
        );

        if (existingStudent.rows.length > 0) {
            return res.status(409).json({
                error: "This institute email is already registered"
            });
        }

        // 6. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 7. Generate six-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // 8. Hash OTP before storing it
        const otpHash = await bcrypt.hash(otp, 10);

        // 9. Store student as unverified
        const result = await pool.query(
            `INSERT INTO student (
                full_name,
                institute_email,
                password_hash,
                academic_year,
                department,
                is_active,
                is_email_verified,
                email_verification_otp,
                otp_expires_at
            )
            VALUES ($1, $2, $3, $4, $5, FALSE, FALSE, $6,
                    NOW() + INTERVAL '5 minutes')
            RETURNING student_id, full_name, institute_email`,
            [
                full_name.trim(),
                email,
                passwordHash,
                year,
                department.trim(),
                otpHash
            ]
        );

      
const emailHtml = `
    <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to CampusConnect!</h2>
        <p>Use the following OTP to verify your institute email:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
        <p>If you did not register, please ignore this email.</p>
    </div>
`;

await sendEmail(
    email,
    "CampusConnect - Email Verification",
    emailHtml
);

res.status(201).json({
    message: "Registration successful. Please check your institute email for the OTP.",
    student: result.rows[0]
});

    } catch (error) {
        console.error("Registration error:", error.message);

        res.status(500).json({
            error: "Registration failed"
        });
    }
};

// Implementing these in the next stages

const verifyEmail = async (req, res) => {
    try {
        const { institute_email, otp } = req.body;

        // 1. Validate input
        if (!institute_email || !otp) {
            return res.status(400).json({
                error: "Institute email and OTP are required"
            });
        }

        const email = institute_email.trim().toLowerCase();

        // 2. Find the student
        const result = await pool.query(
            `SELECT student_id, is_email_verified,
                    email_verification_otp, otp_expires_at
             FROM student
             WHERE institute_email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Student account not found"
            });
        }

        const student = result.rows[0];

        // 3. Check whether already verified
        if (student.is_email_verified) {
            return res.status(400).json({
                error: "Email is already verified"
            });
        }

        // 4. Check OTP existence and expiration
        if (
            !student.email_verification_otp ||
            !student.otp_expires_at ||
            new Date(student.otp_expires_at) <= new Date()
        ) {
            return res.status(400).json({
                error: "OTP is invalid or expired"
            });
        }

        // 5. Compare entered OTP with stored hash
        const isOtpValid = await bcrypt.compare(
            otp.toString(),
            student.email_verification_otp
        );

        if (!isOtpValid) {
            return res.status(400).json({
                error: "Incorrect OTP"
            });
        }

        // 6. Activate the verified student account
        await pool.query(
            `UPDATE student
             SET is_email_verified = TRUE,
                 is_active = TRUE,
                 email_verification_otp = NULL,
                 otp_expires_at = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE student_id = $1`,
            [student.student_id]
        );

        res.json({
            message: "Email verified successfully! Your account is now active."
        });

    } catch (error) {
        console.error("Email verification error:", error.message);

        res.status(500).json({
            error: "Email verification failed"
        });
    }
};



const loginStudent = async (req, res) => {
    try {
        const { institute_email, password } = req.body;

        // 1. Validate input
        if (!institute_email || !password) {
            return res.status(400).json({
                error: "Institute email and password are required"
            });
        }

        const email = institute_email.trim().toLowerCase();

        // 2. Find student in database
        const result = await pool.query(
            `SELECT *
             FROM student
             WHERE institute_email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const student = result.rows[0];

        // 3. Check password
        const isPasswordValid = await bcrypt.compare(
            password,
            student.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // 4. Check email verification
        if (!student.is_email_verified) {
            return res.status(403).json({
                error: "Please verify your institute email before logging in"
            });
        }

        // 5. Check account status
        if (!student.is_active) {
            return res.status(403).json({
                error: "Your account is inactive"
            });
        }

        // 6. Generate JWT
        const token = generateToken(student);

        // 7. Return token and student details
        res.status(200).json({
            message: "Login successful!",
            token,
            student: {
                student_id: student.student_id,
                full_name: student.full_name,
                institute_email: student.institute_email,
                academic_year: student.academic_year,
                department: student.department
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            error: "Login failed"
        });
    }
};


module.exports = {
    registerStudent,
    verifyEmail,
    loginStudent
};
