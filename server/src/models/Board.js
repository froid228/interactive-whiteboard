const { pool } = require('../config/db');

class Board {
  static async create({ title, ownerId }) {
    const { rows } = await pool.query(
      `INSERT INTO boards (title, owner_id)
       VALUES ($1, $2)
       RETURNING *`,
      [title, ownerId]
    );

    return this.findDetailedById(rows[0].id);
  }

  static async findAllForUser(user) {
    const { rows } = await pool.query(
      `
        SELECT DISTINCT
          b.id,
          b.title,
          b.owner_id,
          b.snapshot,
          b.created_at,
          b.updated_at,
          owner.name AS owner_name,
          EXISTS (
            SELECT 1
            FROM board_members member_row
            WHERE member_row.board_id = b.id AND member_row.user_id = $1
          ) AS is_collaborator
        FROM boards b
        JOIN users owner ON owner.id = b.owner_id
        LEFT JOIN board_members bm ON bm.board_id = b.id
        WHERE $2 = 'admin' OR b.owner_id = $1 OR bm.user_id = $1
        ORDER BY b.updated_at DESC, b.created_at DESC
      `,
      [user.id, user.role]
    );

    return rows;
  }

  static async findDetailedById(id) {
    const { rows } = await pool.query(
      `
        SELECT
          b.id,
          b.title,
          b.owner_id,
          b.snapshot,
          b.created_at,
          b.updated_at,
          owner.name AS owner_name,
          owner.email AS owner_email
        FROM boards b
        JOIN users owner ON owner.id = b.owner_id
        WHERE b.id = $1
      `,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const board = rows[0];
    const collaborators = await pool.query(
      `
        SELECT u.id, u.name, u.email, u.role
        FROM board_members bm
        JOIN users u ON u.id = bm.user_id
        WHERE bm.board_id = $1
        ORDER BY u.name ASC
      `,
      [id]
    );

    return {
      ...board,
      collaborators: collaborators.rows,
    };
  }

  static async userHasAccess(boardId, user) {
    if (user.role === 'admin') {
      return true;
    }

    const { rows } = await pool.query(
      `
        SELECT 1
        FROM boards b
        LEFT JOIN board_members bm ON bm.board_id = b.id
        WHERE b.id = $1 AND (b.owner_id = $2 OR bm.user_id = $2)
        LIMIT 1
      `,
      [boardId, user.id]
    );

    return rows.length > 0;
  }

  static async canManage(boardId, user) {
    if (user.role === 'admin') {
      return true;
    }

    const { rows } = await pool.query(
      'SELECT 1 FROM boards WHERE id = $1 AND owner_id = $2 LIMIT 1',
      [boardId, user.id]
    );

    return rows.length > 0;
  }

  static async update(id, { title }) {
    await pool.query(
      `UPDATE boards
       SET title = $1, updated_at = NOW()
       WHERE id = $2`,
      [title, id]
    );

    return this.findDetailedById(id);
  }

  static async updateSnapshot(id, snapshot) {
    const { rows } = await pool.query(
      `UPDATE boards
       SET snapshot = $1::jsonb, updated_at = NOW()
       WHERE id = $2
       RETURNING snapshot, updated_at`,
      [JSON.stringify(snapshot), id]
    );

    return rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM boards WHERE id = $1', [id]);
    return true;
  }

  static async addCollaborator(boardId, userId) {
    await pool.query(
      `INSERT INTO board_members (board_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [boardId, userId]
    );

    return this.findDetailedById(boardId);
  }
}

module.exports = Board;
