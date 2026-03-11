/**
 * Input Sanitization & Content Moderation
 */

// Blacklist für verbotene Wörter/Begriffe (case-insensitive)
const BLACKLISTED_WORDS = [
    // Rassistische Begriffe
    'nigger', 'nigga', 'neger', 'negro', 'kanake', 'kanacke', 'kanak',

    // Nazi/Rechtsextreme Begriffe
    'nazi', 'heil', 'sieg heil', 'hitler', 'führer', 'fuehrer',
    'reichs', 'white power', 'white pride',
    '1488', '88', '14 words', 'rahowa',

    // Homophobe/Transphobe Begriffe
    'faggot', 'fag', 'dyke', 'tranny', 'shemale',

    // Reservierte/Verbotene Nutzernamen
    'admin', 'administrator', 'moderator', 'mod', 'developer', 'dev',
    'support', 'system', 'root', 'owner', 'staff', 'team',
    'official', 'offiziell', 'server', 'bot', 'api',
    'cringe', 'cringeapp', 'needy', 'needyapp',
];

// Regex-Patterns für zusätzliche Erkennung (umgehen von Leetspeak etc.)
const BLACKLIST_PATTERNS = [
    /n[i1!|]+[gq]+[e3]+r/gi,
    /n[i1!|]+[gq]+[a@4]/gi,
    /h[e3]+[i1!|]+l\s*h[i1!|]+tl[e3]+r/gi,
];

/**
 * Entfernt HTML-Tags aus einem String
 */
function stripHtml(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Prüft ob ein String verbotene Wörter enthält
 * @returns {string|null} Das gefundene verbotene Wort oder null
 */
function containsBlacklistedWord(str) {
    if (!str || typeof str !== 'string') return null;

    const lowerStr = str.toLowerCase();

    // Direkte Wort-Prüfung
    for (const word of BLACKLISTED_WORDS) {
        if (lowerStr.includes(word.toLowerCase())) {
            return word;
        }
    }

    // Pattern-Prüfung (Leetspeak etc.)
    for (const pattern of BLACKLIST_PATTERNS) {
        if (pattern.test(str)) {
            return 'verbotenes Muster';
        }
    }

    return null;
}

/**
 * Validiert dass ein Profilbild ein gültiges Base64-Bild ist
 */
function isValidProfileImage(imageData) {
    if (!imageData || typeof imageData !== 'string') return false;

    // Muss mit data:image/ beginnen
    if (!imageData.startsWith('data:image/')) return false;

    // Erlaubte Bildformate
    const validFormats = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    const hasValidFormat = validFormats.some(format => imageData.startsWith(format));

    if (!hasValidFormat) return false;

    // Muss base64 enthalten
    if (!imageData.includes(';base64,')) return false;

    // Größenlimit (ca. 5MB in Base64)
    if (imageData.length > 7 * 1024 * 1024) return false;

    return true;
}

/**
 * Sanitiert einen Text-Input
 */
function sanitizeText(str, maxLength = 1000) {
    if (!str || typeof str !== 'string') return '';

    // HTML entfernen
    let sanitized = stripHtml(str);

    // Mehrfache Leerzeichen/Newlines reduzieren
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Maximale Länge
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitiert einen Anzeigenamen
 */
function sanitizeDisplayName(name) {
    if (!name || typeof name !== 'string') return '';

    let sanitized = sanitizeText(name, 100);

    // Nur alphanumerisch, Leerzeichen, Bindestriche, Unterstriche
    sanitized = sanitized.replace(/[^\w\s\-äöüÄÖÜß]/g, '').trim();

    return sanitized;
}

/**
 * Sanitiert eine Telefonnummer
 */
function sanitizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';

    // Nur Zahlen, +, -, Leerzeichen, Klammern
    return phone.replace(/[^\d+\-\s()]/g, '').trim().substring(0, 30);
}

/**
 * Validiert und sanitiert alle Profildaten
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
function validateProfileData({ displayName, phoneNumber, bio, profileImage }) {
    const errors = [];
    const sanitized = {};

    // Display Name
    if (displayName !== undefined) {
        sanitized.displayName = sanitizeDisplayName(displayName);

        if (sanitized.displayName.length < 2) {
            errors.push('Anzeigename muss mindestens 2 Zeichen lang sein');
        }

        const blacklisted = containsBlacklistedWord(sanitized.displayName);
        if (blacklisted) {
            errors.push('Der Anzeigename enthält einen verbotenen Begriff');
        }
    }

    // Phone Number
    if (phoneNumber !== undefined) {
        sanitized.phoneNumber = sanitizePhoneNumber(phoneNumber);
    }

    // Bio
    if (bio !== undefined) {
        sanitized.bio = sanitizeText(bio, 500);

        const blacklisted = containsBlacklistedWord(sanitized.bio);
        if (blacklisted) {
            errors.push('Die Bio enthält einen verbotenen Begriff');
        }
    }

    // Profile Image
    if (profileImage !== undefined && profileImage !== null && profileImage !== '') {
        if (!isValidProfileImage(profileImage)) {
            errors.push('Ungültiges Bildformat');
        }
        sanitized.profileImage = profileImage;
    }

    if (errors.length > 0) {
        return { valid: false, error: errors[0] };
    }

    return { valid: true, data: sanitized };
}

/**
 * Validiert einen Username
 * @returns {{ valid: boolean, error?: string, sanitized?: string }}
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username ist erforderlich' };
    }

    // Nur alphanumerisch und Unterstriche
    const sanitized = username.replace(/[^\w]/g, '').trim();

    if (sanitized.length < 3 || sanitized.length > 50) {
        return { valid: false, error: 'Username muss zwischen 3 und 50 Zeichen lang sein' };
    }

    const blacklisted = containsBlacklistedWord(sanitized);
    if (blacklisted) {
        return { valid: false, error: 'Dieser Username ist nicht erlaubt' };
    }

    return { valid: true, sanitized };
}

module.exports = {
    stripHtml,
    containsBlacklistedWord,
    isValidProfileImage,
    sanitizeText,
    sanitizeDisplayName,
    sanitizePhoneNumber,
    validateProfileData,
    validateUsername,
};
