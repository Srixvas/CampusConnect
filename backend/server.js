require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/db");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const socialRoutes = require("./routes/socialRoutes");
const codingRoutes = require("./routes/codingRoutes");
const codingStatsRoutes = require("./routes/codingStatsRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const protect = require("./middleware/authMiddleware");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/profile", profileRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/coding-stats", codingStatsRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/notifications", notificationRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "CampusConnect API is running!"
  });
});

// Students API
app.get("/api/students", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT student_id, full_name, institute_email,
             academic_year, department
      FROM student
      WHERE is_active = TRUE
      ORDER BY student_id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Database query failed:", error.message);
    res.status(500).json({
      error: "Unable to fetch students"
    });
  }
});

// Posts API
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CampusConnect API running on port ${PORT}`);
});

app.post("/api/posts", async (req, res) => {
  try {
    const { student_id, content } = req.body;

    if (!student_id || !content || !content.trim()) {
      return res.status(400).json({
        error: "Student ID and post content are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO post (student_id, content, post_type, visibility)
       VALUES ($1, $2, 'TEXT', 'CAMPUS')
       RETURNING *`,
      [student_id, content.trim()]
    );

    res.status(201).json({
      message: "Post created successfully!",
      post: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating post:", error.message);
    res.status(500).json({ error: "Failed to create post" });
  }
});


// LIKE A POST AND CREATE NOTIFICATION
app.post("/api/posts/:postId/like", protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const studentId = req.student.student_id;

        // Find the post owner
        const post = await pool.query(
            `SELECT student_id
             FROM post
             WHERE post_id = $1`,
            [postId]
        );

        if (post.rows.length === 0) {
            return res.status(404).json({
                error: "Post not found"
            });
        }

        const recipientId = post.rows[0].student_id;

        // Insert like
        const like = await pool.query(
            `INSERT INTO post_like (student_id, post_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, post_id) DO NOTHING
             RETURNING *`,
            [studentId, postId]
        );

        // Create notification only for a new like
        // Do not notify users about their own posts
        if (like.rowCount > 0 && Number(recipientId) !== Number(studentId)) {
            await pool.query(
                `INSERT INTO notification (
                    recipient_id,
                    actor_id,
                    notification_type,
                    post_id,
                    message
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    recipientId,
                    studentId,
                    "LIKE",
                    postId,
                    "liked your post"
                ]
            );
        }

        res.status(201).json({
            message: like.rowCount
                ? "Post liked successfully!"
                : "You have already liked this post."
        });

    } catch (error) {
        console.error("Like error:", error.message);

        res.status(500).json({
            error: "Failed to like post"
        });
    }
});


// UNLIKE A POST
app.delete("/api/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        error: "Student ID is required"
      });
    }

    const result = await pool.query(
      `DELETE FROM post_like
       WHERE student_id = $1 AND post_id = $2
       RETURNING *`,
      [student_id, postId]
    );

    res.json({
      message: result.rowCount
        ? "Post unliked successfully!"
        : "You have not liked this post."
    });

  } catch (error) {
    console.error("Unlike error:", error.message);
    res.status(500).json({ error: "Failed to unlike post" });
  }
});

// ADD A COMMENT AND CREATE NOTIFICATION
app.post("/api/posts/:postId/comments", protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const studentId = req.student.student_id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                error: "Comment content is required"
            });
        }

        // Find the post owner
        const post = await pool.query(
            `SELECT student_id
             FROM post
             WHERE post_id = $1`,
            [postId]
        );

        if (post.rows.length === 0) {
            return res.status(404).json({
                error: "Post not found"
            });
        }

        const recipientId = post.rows[0].student_id;

        // Insert comment
        const result = await pool.query(
            `INSERT INTO post_comment (post_id, student_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [postId, studentId, content.trim()]
        );

        // Notify post owner, but not when commenting on own post
        if (Number(recipientId) !== Number(studentId)) {
            await pool.query(
                `INSERT INTO notification (
                    recipient_id,
                    actor_id,
                    notification_type,
                    post_id,
                    message
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    recipientId,
                    studentId,
                    "COMMENT",
                    postId,
                    "commented on your post"
                ]
            );
        }

        res.status(201).json({
            message: "Comment added successfully!",
            comment: result.rows[0]
        });

    } catch (error) {
        console.error("Comment error:", error.message);

        res.status(500).json({
            error: "Failed to add comment"
        });
    }
});
// GET COMMENTS FOR A POST
app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT 
          pc.comment_id,
          pc.post_id,
          pc.content,
          pc.created_at,
          pc.student_id,
          s.full_name
       FROM post_comment pc
       JOIN student s ON pc.student_id = s.student_id
       WHERE pc.post_id = $1
       ORDER BY pc.created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch comments error:", error.message);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});
