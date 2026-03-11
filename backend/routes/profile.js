const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { validateProfileData } = require('../utils/sanitize');

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

    // Validierung und Sanitization
    const validation = validateProfileData({ displayName, phoneNumber, bio, profileImage });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    const sanitized = validation.data;

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
            [sanitized.displayName, finalGender, sanitized.phoneNumber || null, sanitized.profileImage, sanitized.bio || null, req.userId]
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

    // Validierung und Sanitization
    const validation = validateProfileData({ displayName, phoneNumber, bio, profileImage });
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    const sanitized = validation.data;

    try {
        await pool.query(
            `UPDATE profiles 
       SET display_name = $1, phone_number = $2, profile_image = COALESCE($3, profile_image), 
           bio = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5`,
            [sanitized.displayName, sanitized.phoneNumber || null, sanitized.profileImage, sanitized.bio || null, req.userId]
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
