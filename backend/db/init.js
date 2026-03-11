const pool = require('./pool');

async function initDB() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fivem_uuid VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        display_name VARCHAR(100),
        gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
        phone_number VARCHAR(20),
        profile_image TEXT,
        bio TEXT,
        is_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS swipes (
        id SERIAL PRIMARY KEY,
        swiper_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        swiped_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        direction VARCHAR(10) CHECK (direction IN ('left', 'right')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(swiper_id, swiped_id)
      );
      
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      );

      CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
      CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
      CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
      CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
    `);
    
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = { initDB };
