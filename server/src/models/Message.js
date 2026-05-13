const { pool } = require('../config/db');

class Message {
  static async create({ boardId, authorId, text }) {
    const { rows } = await pool.query(
      `
        INSERT INTO board_messages (board_id, author_id, text)
        VALUES ($1, $2, $3)
        RETURNING id, board_id, author_id, text, created_at
      `,
      [boardId, authorId, text]
    );

    return this.findById(rows[0].id);
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `
        SELECT
          bm.id,
          bm.board_id,
          bm.author_id,
          bm.text,
          bm.created_at,
          u.name AS author_name,
          u.email AS author_email
        FROM board_messages bm
        JOIN users u ON u.id = bm.author_id
        WHERE bm.id = $1
        LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;
  }

  static async findForBoard(boardId, limit = 80) {
    const { rows } = await pool.query(
      `
        SELECT
          bm.id,
          bm.board_id,
          bm.author_id,
          bm.text,
          bm.created_at,
          u.name AS author_name,
          u.email AS author_email
        FROM board_messages bm
        JOIN users u ON u.id = bm.author_id
        WHERE bm.board_id = $1
        ORDER BY bm.created_at DESC
        LIMIT $2
      `,
      [boardId, limit]
    );

    return rows.reverse();
  }
}

module.exports = Message;
