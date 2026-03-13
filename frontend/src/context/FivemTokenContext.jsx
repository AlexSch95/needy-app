import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FivemTokenContext = createContext(null);

export function FivemTokenProvider({ children }) {
    const [fivemToken, setFivemToken] = useState(null);

    useEffect(() => {
        // Token von FiveM empfangen (aus listener.js integriert)
        const handleMessage = (event) => {
            if (event.data.type === 'uuid-token') {
                const receivedToken = event.data.token;
                const maskedToken = receivedToken.slice(0, 8) + '****';
                console.log('[FiveM] Token empfangen:', maskedToken);
                setFivemToken(receivedToken);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const clearToken = useCallback(() => {
        setFivemToken(null);
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
