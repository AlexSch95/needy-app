const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Profil vervollständigen / aktualisieren
router.put('/complete', authMiddleware, async (req, res) => {
  const { displayName, gender, phoneNumber, profileImage, bio } = req.body;
  
  if (!displayName || !gender || !profileImage) {
    return res.status(400).json({ error: 'Anzeigename, Geschlecht und Profilbild sind erforderlich' });
  }
  
  if (!['male', 'female'].includes(gender)) {
    return res.status(400).json({ error: 'Geschlecht muss male oder female sein' });
  }
  
  if (displayName.length < 2 || displayName.length > 100) {
    return res.status(400).json({ error: 'Anzeigename muss zwischen 2 und 100 Zeichen lang sein' });
  }
  
  try {
    // Prüfen ob Geschlecht bereits gesetzt ist
    const existingProfile = await pool.query(
      'SELECT gender FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    
    const existingGender = existingProfile.rows[0]?.gender;
    const finalGender = existingGender || gender;
    
    await pool.query(
      `UPDATE profiles 
       SET display_name = $1, gender = $2, phone_number = $3, profile_image = $4, bio = $5, 
           is_complete = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [displayName, finalGender, phoneNumber || null, profileImage, bio || null, req.userId]
    );
    
    res.json({ message: 'Profil aktualisiert' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
  }
});

// Profil aktualisieren (ohne Geschlecht)
router.put('/update', authMiddleware, async (req, res) => {
  const { displayName, phoneNumber, profileImage, bio } = req.body;
  
  if (!displayName) {
    return res.status(400).json({ error: 'Anzeigename ist erforderlich' });
  }
  
  try {
    await pool.query(
      `UPDATE profiles 
       SET display_name = $1, phone_number = $2, profile_image = COALESCE($3, profile_image), 
           bio = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5`,
      [displayName, phoneNumber || null, profileImage, bio || null, req.userId]
    );
    
    res.json({ message: 'Profil aktualisiert' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
  }
});

// Profil löschen
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ message: 'Account gelöscht' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Accounts' });
  }
});

module.exports = router;
