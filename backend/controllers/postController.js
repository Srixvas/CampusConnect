const pool = require("../config/db");

const getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.post_id,
        p.content,
        p.post_type,
        p.visibility,
        p.created_at,
        s.student_id,
        s.full_name,
        (
          SELECT COUNT(*)
          FROM post_like pl
          WHERE pl.post_id = p.post_id
        ) AS like_count,
        (
          SELECT COUNT(*)
          FROM post_comment pc
          WHERE pc.post_id = p.post_id
        ) AS comment_count
      FROM post p
      JOIN student s ON p.student_id = s.student_id
      WHERE p.is_deleted = FALSE
      ORDER BY p.created_at DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

module.exports = { getPosts };