import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { playLeadNotificationSound } from '../utils/soundUtils';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [socket, setSocket] = useState(null);
  const [latestLeadAlert, setLatestLeadAlert] = useState(null);
  // Bumped on any lead change pushed from the server so pages can refresh.
  const [leadsVersion, setLeadsVersion] = useState(0);
  const soundRef = useRef(soundEnabled);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!token) return undefined;

    // Vercel serverless can't hold WebSocket connections. With VITE_REALTIME=off,
    // fall back to polling so pages still refresh lead data periodically.
    if (import.meta.env.VITE_REALTIME === 'off') {
      const timer = setInterval(() => setLeadsVersion((v) => v + 1), 30000);
      return () => clearInterval(timer);
    }

    // Socket requires the logged-in user's token; the server rejects anonymous connections.
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
      timeout: 10000,
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket.io]: connection error -', err.message);
    });

    socketInstance.on('new_lead', (lead) => {
      setNotifications((prev) => [
        {
          id: `${lead._id}-${Date.now()}`,
          lead,
          title: 'New Lead',
          message: `${lead.name}${lead.course ? ` - ${lead.course}` : ''}`,
          timestamp: new Date(),
          read: false,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((prev) => prev + 1);
      setLatestLeadAlert(lead);
      setLeadsVersion((v) => v + 1);
      if (soundRef.current) playLeadNotificationSound();

      setTimeout(() => {
        setLatestLeadAlert((curr) => (curr?._id === lead._id ? null : curr));
      }, 6000);
    });

    socketInstance.on('lead_updated', () => setLeadsVersion((v) => v + 1));
    socketInstance.on('leads_imported', () => setLeadsVersion((v) => v + 1));

    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [token]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleSound = () => setSoundEnabled((prev) => !prev);
  const dismissToast = () => setLatestLeadAlert(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        toggleSound,
        markAllAsRead,
        latestLeadAlert,
        dismissToast,
        leadsVersion,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
