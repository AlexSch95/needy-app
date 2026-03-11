/**
 * FiveM Token Listener
 * 
 * Diese Funktionalitaet wurde in das React Frontend integriert.
 * Siehe: frontend/src/context/FivemTokenContext.jsx
 * 
 * Der Token ist ein JWT, signiert mit UUID_TOKEN_SECRET.
 * Er wird bei der Registrierung ans Backend geschickt und dort entschluesselt.
 * 
 * JWT Payload Format:
 * {
 *     uuid: "fivem:12345",  // Die FiveM UUID des Spielers
 *     type: "fivem-auth",   // Token-Typ zur Identifikation
 *     iat: 1738828800       // Issued At - Timestamp der Token-Erstellung
 * }
 */

// Standalone-Version fuer Testzwecke
window.addEventListener('message', (event) => {
    if (event.data.type === 'uuid-token') {
        const receivedToken = event.data.token;

        // Debug Message anzeigen
        if (typeof showDebugMessage === 'function') {
            showDebugMessage(`Token empfangen: ${receivedToken.substring(0, 20)}...`);
        }

        console.log('[FiveM] Token empfangen:', receivedToken);

        // Token im localStorage speichern
        localStorage.setItem('fivem_token', receivedToken);
        
        // Event dispatchen fuer React
        window.dispatchEvent(new CustomEvent('fivem-token-received', { 
            detail: { token: receivedToken } 
        }));
    }
});