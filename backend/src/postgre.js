const { Pool } = require('pg');

const DEFAULT_ITEMS = [
  { name: 'Laptop', price: 4999 },
  { name: 'Klawiatura', price: 299 },
];

function normalizeItem(row) {
  return {
    id: Number(row.id),
    name: row.name,
    price: Number(row.price),
  };
}

function createPostgreService({ connectionString, seedItems = DEFAULT_ITEMS }) {
  const pool = new Pool({ connectionString });

  pool.on('error', (error) => {
    console.error('PostgreSQL pool error:', error.message);
  });

  return {
    async connect() {
      await pool.query('SELECT 1');
    },

    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          price NUMERIC NOT NULL CHECK (price >= 0)
        )
      `);

      const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM items');
      if (countResult.rows[0].count === 0) {
        for (const item of seedItems) {
          await pool.query('INSERT INTO items (name, price) VALUES ($1, $2)', [item.name, item.price]);
        }
      }
    },

    async getItems() {
      const result = await pool.query('SELECT id, name, price FROM items ORDER BY id ASC');
      return result.rows.map(normalizeItem);
    },

    async getItemCount() {
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM items');
      return result.rows[0].count;
    },

    async addItem({ name, price }) {
      const result = await pool.query(
        'INSERT INTO items (name, price) VALUES ($1, $2) RETURNING id, name, price',
        [name, price]
      );
      return normalizeItem(result.rows[0]);
    },

    async checkHealth() {
      await pool.query('SELECT 1');
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = {
  createPostgreService,
};
