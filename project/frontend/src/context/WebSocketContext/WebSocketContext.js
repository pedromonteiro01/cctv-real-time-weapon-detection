import React, { createContext, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, wsUrl }) => {
  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'warning') {
        toast(data.message, {
          icon: '⚠️',
          style: {
            border: '1px solid #f97316',
            padding: '16px',
            color: '#f97316',
          },
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  return <WebSocketContext.Provider value={{}}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);
