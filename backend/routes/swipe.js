const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Nächstes Profil zum Swipen
router.get('/next', authMiddleware, async (req, res) => {
  try {
    // Hole eigenes Geschlecht
    const userProfile = await pool.query(
      'SELECT gender FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    
    if (!userProfile.rows[0]?.gender) {
      return res.status(400).json({ error: 'Profil nicht vollständig' });
    }
    
    const userGender = userProfile.rows[0].gender;
    const targetGender = userGender === 'male' ? 'female' : 'male';
    
    // Finde Profile die noch nicht geswiped wurden
    const result = await pool.query(
      `SELECT u.id, p.display_name, p.profile_image, p.bio
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE p.is_complete = TRUE
         AND p.gender = $1
         AND u.id != $2
         AND u.id NOT IN (
           SELECT swiped_id FROM swipes WHERE swiper_id = $2
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [targetGender, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ profile: null, message: 'Keine weiteren Profile' });
    }
    
    const profile = result.rows[0];
    res.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        profileImage: profile.profile_image,
        bio: profile.bio
      }
    });
  } catch (error) {
    console.error('Get next profile error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Profils' });
  }
});

// Swipe
router.post('/', authMiddleware, async (req, res) => {
  const { targetUserId, direction } = req.body;
  
  if (!targetUserId || !['left', 'right'].includes(direction)) {
    return res.status(400).json({ error: 'Ungültige Anfrage' });
  }
  
  if (targetUserId === req.userId) {
    return res.status(400).json({ error: 'Du kannst dich nicht selbst swipen' });
  }
  
  try {
    // Swipe speichern
    await pool.query(
      'INSERT INTO swipes (swiper_id, swiped_id, direction) VALUES ($1, $2, $3) ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET direction = $3',
      [req.userId, targetUserId, direction]
    );
    
    // Check auf Match bei right swipe
    let isMatch = false;
    if (direction === 'right') {
      const matchCheck = await pool.query(
        `SELECT id FROM swipes 
         WHERE swiper_id = $1 AND swiped_id = $2 AND direction = 'right'`,
        [targetUserId, req.userId]
      );
      
      if (matchCheck.rows.length > 0) {
        // Match erstellen
        const user1 = Math.min(req.userId, targetUserId);
        const user2 = Math.max(req.userId, targetUserId);
        
        await pool.query(
          'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user1, user2]
        );
        
        isMatch = true;
      }
    }
    
    res.json({ success: true, isMatch });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Fehler beim Swipen' });
  }
});

module.exports = router;
