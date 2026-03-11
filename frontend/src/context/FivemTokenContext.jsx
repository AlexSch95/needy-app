import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FivemTokenContext = createContext(null);

export function FivemTokenProvider({ children }) {
    const [fivemToken, setFivemToken] = useState(null);

    useEffect(() => {
        // Token von FiveM empfangen (aus listener.js integriert)
        const handleMessage = (event) => {
            if (event.data.type === 'uuid-token') {
                const receivedToken = event.data.token;
                console.log('[FiveM] Token empfangen:', receivedToken);
                setFivemToken(receivedToken);
                localStorage.setItem('fivem_token', receivedToken);
            }
        };

        window.addEventListener('message', handleMessage);

        // Prüfe auf bereits gespeicherten Token
        const savedToken = localStorage.getItem('fivem_token');
        if (savedToken) {
            setFivemToken(savedToken);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const clearToken = useCallback(() => {
        setFivemToken(null);
        localStorage.removeItem('fivem_token');
    }, []);

    return (
        <FivemTokenContext.Provider value={{ fivemToken, clearToken }}>
            {children}
        </FivemTokenContext.Provider>
    );
}

export function useFivemToken() {
    const context = useContext(FivemTokenContext);
    if (!context) {
        throw new Error('useFivemToken must be used within FivemTokenProvider');
    }
    return context;
}
