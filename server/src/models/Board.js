const pool = require('../config/db');

class Board {
  static async create(title, ownerId = 1) {
    const { rows } = await pool.query(
      'INSERT INTO boards (title, owner_id) VALUES ($1, $2) RETURNING *',
      [title, ownerId]
    );
    return rows[0];
  }

  static async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM boards ORDER BY created_at DESC'
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM boards WHERE id = $1', [id]
    );
    return rows[0];
  }

  static async update(id, title) {
    const { rows } = await pool.query(
      'UPDATE boards SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [title, id]
    );
    return rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM boards WHERE id = $1', [id]);
    return true;
  }
}

module.exports = Board;