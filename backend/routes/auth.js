const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { validateUsername } = require('../utils/sanitize');

const router = express.Router();

// FiveM Token mit JWT Secret entschluesseln
function decodeFivemToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.UUID_TOKEN_SECRET);
        return decoded;
    } catch (error) {
        console.error('FiveM Token Fehler:', error.message);
        return null;
    }
}

// Registrierung
router.post('/register', async (req, res) => {
    const { username, password, fivemToken } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    // Username validieren und sanitieren
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return res.status(400).json({ error: usernameValidation.error });
    }
    const sanitizedUsername = usernameValidation.sanitized;

    if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // FiveM UUID extrahieren - Token ist Pflicht
    if (!fivemToken) {
        return res.status(400).json({ error: 'Registrierung nur mit gültiger Ausweis-ID möglich' });
    }

    const tokenData = decodeFivemToken(fivemToken);
    if (!tokenData || tokenData.type !== 'fivem-auth' || !tokenData.uuid) {
        return res.status(400).json({ error: 'Ungültiger FiveM Token' });
    }

    const fivemUuid = tokenData.uuid;

    try {
        // Prüfen ob UUID bereits registriert ist
        const existingUuid = await pool.query(
            'SELECT id FROM users WHERE fivem_uuid = $1',
            [fivemUuid]
        );

        if (existingUuid.rows.length > 0) {
            return res.status(400).json({ error: 'Mit dieser Ausweis-ID existiert bereits ein Account' });
        }

        // Prüfen ob Username existiert
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [sanitizedUsername]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username bereits vergeben' });
        }

        // Passwort hashen
        const passwordHash = await bcrypt.hash(password, 10);

        // User erstellen
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, fivem_uuid) VALUES ($1, $2, $3) RETURNING id',
            [sanitizedUsername, passwordHash, fivemUuid]
        );

        const userId = result.rows[0].id;

        // Leeres Profil erstellen
        await pool.query(
            'INSERT INTO profiles (user_id) VALUES ($1)',
            [userId]
        );

        // JWT Token erstellen
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: userId, username: sanitizedUsername },
            isProfileComplete: false
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Fehler bei der Registrierung' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }

    try {
        const result = await pool.query(
            'SELECT u.id, u.username, u.password_hash, p.is_complete FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.id, username: user.username },
            isProfileComplete: user.is_complete || false
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Fehler beim Login' });
    }
});

// User Info
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.fivem_uuid, 
              p.display_name, p.gender, p.phone_number, p.profile_image, p.bio, p.is_complete,
              (SELECT COUNT(*) FROM admins WHERE user_id = u.id) > 0 as is_admin
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.user_id 
       WHERE u.id = $1`,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            fivemUuid: user.fivem_uuid,
            displayName: user.display_name,
            gender: user.gender,
            phoneNumber: user.phone_number,
            profileImage: user.profile_image,
            bio: user.bio,
            isProfileComplete: user.is_complete || false,
            isAdmin: user.is_admin || false
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Users' });
    }
});

module.exports = router;
