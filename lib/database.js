const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool
let pool = null;

// Initialize connection pool
function initializePool() {
  if (!pool) {
    // Tuned for serverless: each warm Vercel instance keeps its own pool, so
    // a large `max` with a long idle timeout multiplies across instances and
    // exhausts the Postgres connection limit. Keep the pool tiny and let idle
    // connections go quickly. Managed Postgres also drops idle connections on
    // its own, which is why the idle timeout must stay well under theirs.
    const poolSettings = {
      max: 2,
      idleTimeoutMillis: 10000,
      // Must stay below the platform's function timeout so a slow connect
      // surfaces as a JSON error rather than burning the whole invocation.
      connectionTimeoutMillis: 10000,
      // Managed providers (Render, Neon, Supabase) require SSL but present
      // certificates that don't chain to a bundled root.
      ssl: { rejectUnauthorized: false }
    };

    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...poolSettings
      });
    } else {
      pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ...poolSettings
      });
    }

    // An idle client dropped by the server is routine. Log it and let pg
    // discard the client -- never kill the process, which would fail every
    // other in-flight request on this instance.
    pool.on('error', (err) => {
      console.error('Idle database client error (recovering):', err.message);
    });
  }
  return pool;
}

// Get database connection
async function getConnection() {
  const pool = initializePool();
  const client = await pool.connect();
  return client;
}

// Execute query with automatic connection management
async function query(text, params = []) {
  const pool = initializePool();
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

// Execute transaction
async function transaction(queries) {
  const client = await getConnection();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const { text, params } of queries) {
      const result = await client.query(text, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
}

// Close database pool (for cleanup)
async function closePool() {
  if (pool) {
    await pool.end();
    console.log('Database pool closed');
  }
}

// Utility functions for common query patterns
const db = {
  // Basic CRUD operations
  async select(table, conditions = {}, orderBy = null, limit = null) {
    let query_text = `SELECT * FROM ${table}`;
    const params = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map((key, index) => {
        params.push(conditions[key]);
        return `${key} = $${index + 1}`;
      }).join(' AND ');
      query_text += ` WHERE ${whereClause}`;
    }
    
    if (orderBy) {
      query_text += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query_text += ` LIMIT ${limit}`;
    }
    
    const result = await query(query_text, params);
    return result.rows;
  },

  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query_text = `
      INSERT INTO ${table} (${keys.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await query(query_text, values);
    return result.rows[0];
  },

  async update(table, data, conditions) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const conditionKeys = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    
    const setClause = dataKeys.map((key, index) => 
      `${key} = $${index + 1}`
    ).join(', ');
    
    const whereClause = conditionKeys.map((key, index) => 
      `${key} = $${dataKeys.length + index + 1}`
    ).join(' AND ');
    
    const query_text = `
      UPDATE ${table} 
      SET ${setClause} 
      WHERE ${whereClause} 
      RETURNING *
    `;
    
    const result = await query(query_text, [...dataValues, ...conditionValues]);
    return result.rows[0];
  },

  async delete(table, conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, index) => 
      `${key} = $${index + 1}`
    ).join(' AND ');
    
    const query_text = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
    const result = await query(query_text, values);
    return result.rows;
  }
};

module.exports = {
  initializePool,
  getConnection,
  query,
  transaction,
  testConnection,
  closePool,
  db
};