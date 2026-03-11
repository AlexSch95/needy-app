const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Alle Matches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         m.id as match_id,
         m.created_at as matched_at,
         u.id as user_id,
         p.display_name,
         p.profile_image,
         p.phone_number,
         p.bio
       FROM matches m
       JOIN users u ON (
         (m.user1_id = $1 AND u.id = m.user2_id) OR
         (m.user2_id = $1 AND u.id = m.user1_id)
       )
       JOIN profiles p ON u.id = p.user_id
       ORDER BY m.created_at DESC`,
      [req.userId]
    );
    
    const matches = result.rows.map(row => ({
      matchId: row.match_id,
      matchedAt: row.matched_at,
      user: {
        id: row.user_id,
        displayName: row.display_name,
        profileImage: row.profile_image,
        phoneNumber: row.phone_number,
        bio: row.bio
      }
    }));
    
    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Matches' });
  }
});

// Match entfernen
router.delete('/:matchId', authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  
  try {
    // Prüfen ob Match dem User gehört
    const match = await pool.query(
      'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [matchId, req.userId]
    );
    
    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match nicht gefunden' });
    }
    
    await pool.query('DELETE FROM matches WHERE id = $1', [matchId]);
    
    res.json({ message: 'Match entfernt' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Fehler beim Entfernen des Matches' });
  }
});

module.exports = router;
