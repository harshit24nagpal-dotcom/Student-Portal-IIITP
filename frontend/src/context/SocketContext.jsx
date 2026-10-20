import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [inAppAlerts, setInAppAlerts] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to backend Socket.IO server
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[SOCKET] Connected to server');
      // Join role-based and user-specific rooms
      newSocket.emit('join_room', {
        userId: user.id,
        role: user.role,
      });
    });

    // Listen for new emergency triggers (Admins / Security / Responders)
    newSocket.on('new_emergency', (data) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'); // Soft alarm sound
      audio.play().catch(() => {}); // Play alert sound if allowed by browser

      addAlert({
        id: Date.now(),
        type: 'danger',
        title: '🚨 NEW SOS TRIGGERED!',
        message: `${data.emergency.reporterName} reported: ${data.emergency.type} at ${data.emergency.manualLocation || 'GPS coordinates'}`,
        timestamp: new Date(),
      });
    });

    // Listen for general updates (status changes)
    newSocket.on('emergency_updated', (data) => {
      addAlert({
        id: Date.now(),
        type: 'info',
        title: '🔄 Emergency Status Update',
        message: `Incident ${data.requestId} is now: ${data.status.replace(/_/g, ' ')}`,
        timestamp: new Date(),
      });
    });

    // Listen for escalations
    newSocket.on('emergency_escalated', (data) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-84.wav'); // High pitch warning sound
      audio.play().catch(() => {});

      addAlert({
        id: Date.now(),
        type: 'warning',
        title: `🚨 EMERGENCY ESCALATED (LEVEL ${data.escalationLevel})`,
        message: `Incident ${data.requestId} has been escalated: ${data.reason}`,
        timestamp: new Date(),
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const addAlert = (alert) => {
    setInAppAlerts((prev) => [alert, ...prev].slice(0, 5)); // Keep last 5 alerts
  };

  const removeAlert = (id) => {
    setInAppAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const value = {
    socket,
    inAppAlerts,
    removeAlert,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
