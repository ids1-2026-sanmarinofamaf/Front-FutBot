// SessionSocketProvider.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthProvider.jsx";
import useWebSocket from "../../shared/hooks.js";
import { getToken } from "./auth.js";

export const SessionSocketContext = createContext({ 
    isConnected: false, 
    messages: "" 
});

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

export const SessionSocketProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);
  const token = isAuthenticated ? getToken() : null;
  const url = token ? `${WS_BASE_URL}/ws/sessions?token=${token}` : null;

  {/** Estado para almacenar respuesta del ws de sesión */}
  const [messages, setMessages] = useState({
    friendly_games: [],
    //leagues: [],
  });

  useWebSocket(url, {
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
    onMessage: (data) => {
      //console.log("Datos:", data);
      setMessages(data)
    }
  });

  return (
    <SessionSocketContext.Provider value={{ isConnected, messages }}>
      {children}
    </SessionSocketContext.Provider>
  );
};

export const useSessionSocket = () => useContext(SessionSocketContext);