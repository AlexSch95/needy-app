const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// Admin Middleware
async function adminMiddleware(req, res, next) {
    try {
        const result = await pool.query(
            'SELECT id FROM admins WHERE user_id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Keine Admin-Berechtigung' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Server-Fehler' });
    }
}

// Search Users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT u.id, u.username, u.fivem_uuid, u.created_at,
                   p.display_name, p.gender, p.phone_number, p.profile_image, p.bio, p.is_complete,
                   (SELECT COUNT(*) FROM matches WHERE user1_id = u.id OR user2_id = u.id) as match_count
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
        `;

        const params = [];

        if (search && search.trim()) {
            query += `
                WHERE u.username ILIKE $1
                   OR u.fivem_uuid ILIKE $1
                   OR p.display_name ILIKE $1
                   OR p.phone_number ILIKE $1
            `;
            params.push(`%${search.trim()}%`);
        }

        query += ' ORDER BY u.created_at DESC LIMIT 50';

        const result = await pool.query(query, params);

        const users = result.rows.map(user => ({
            id: user.id,
            username: user.username,
            uuid: user.fivem_uuid,
            createdAt: user.created_at,
            displayName: user.display_name,
            gender: user.gender,
            phoneNumber: user.phone_number,
            profileImage: user.profile_image,
            bio: user.bio,
            isProfileComplete: user.is_complete || false,
            matchCount: parseInt(user.match_count) || 0
        }));

        res.json({ users });
    } catch (error) {
        console.error('Admin search error:', error);
        res.status(500).json({ error: 'Fehler bei der Suche' });
    }
});

// Get User Details
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await pool.query(`
            SELECT u.id, u.username, u.fivem_uuid, u.created_at,
                   p.display_name, p.gender, p.phone_number, p.profile_image, p.bio, p.is_complete
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }

        const user = userResult.rows[0];

        // Get matches
        const matchesResult = await pool.query(`
            SELECT m.id, m.created_at,
                   CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as matched_user_id,
                   p.display_name as matched_display_name
            FROM matches m
            JOIN profiles p ON p.user_id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
            WHERE m.user1_id = $1 OR m.user2_id = $1
            ORDER BY m.created_at DESC
        `, [userId]);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                uuid: user.fivem_uuid,
                createdAt: user.created_at,
                displayName: user.display_name,
                gender: user.gender,
                phoneNumber: user.phone_number,
                profileImage: user.profile_image,
                bio: user.bio,
                isProfileComplete: user.is_complete || false
            },
            matches: matchesResult.rows.map(m => ({
                id: m.id,
                matchedAt: m.created_at,
                matchedUserId: m.matched_user_id,
                matchedDisplayName: m.matched_display_name
            }))
        });
    } catch (error) {
        console.error('Admin get user error:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Users' });
    }
});

// Delete User
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent self-deletion
        if (parseInt(userId) === req.userId) {
            return res.status(400).json({ error: 'Du kannst dich selbst nicht löschen' });
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }

        res.json({ message: 'User erfolgreich gelöscht' });
    } catch (error) {
        console.error('Admin delete error:', error);
        res.status(500).json({ error: 'Fehler beim Löschen' });
    }
});

module.exports = router;
