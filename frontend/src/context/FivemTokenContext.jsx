import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FivemTokenContext = createContext(null);

export function FivemTokenProvider({ children }) {
  const [fivemToken, setFivemToken] = useState(null);
  const [debugMessage, setDebugMessage] = useState(null);

  const showDebugMessage = useCallback((message) => {
    setDebugMessage(message);
    setTimeout(() => setDebugMessage(null), 5000);
  }, []);

  // Globale Funktion für Debug Messages
  useEffect(() => {
    window.showDebugMessage = showDebugMessage;
    return () => {
      delete window.showDebugMessage;
    };
  }, [showDebugMessage]);

  useEffect(() => {
    // Token von FiveM empfangen (aus listener.js integriert)
    const handleMessage = (event) => {
      if (event.data.type === 'uuid-token') {
        const receivedToken = event.data.token;
        showDebugMessage(`Token empfangen: ${receivedToken.substring(0, 20)}...`);
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
  }, [showDebugMessage]);

  const clearToken = useCallback(() => {
    setFivemToken(null);
    localStorage.removeItem('fivem_token');
  }, []);

  return (
    <FivemTokenContext.Provider value={{ fivemToken, clearToken }}>
      {children}
      {debugMessage && <div className="debug-message">{debugMessage}</div>}
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
