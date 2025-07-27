import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        upgrade: true
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-user-room', user._id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Lead assignment notifications
      newSocket.on('new-lead-assigned', (data) => {
        toast.success(`New lead assigned: ${data.lead.name}`);
        addNotification({
          id: Date.now(),
          type: 'lead_assigned',
          title: 'New Lead Assigned',
          message: `You have been assigned a new lead: ${data.lead.name}`,
          data: data.lead,
          timestamp: new Date()
        });
      });

      // Lead reassignment notifications
      newSocket.on('lead-reassigned', (data) => {
        toast.info('A lead has been reassigned');
        addNotification({
          id: Date.now(),
          type: 'lead_reassigned',
          title: 'Lead Reassigned',
          message: 'One of your leads has been reassigned to another telecaller',
          data: data,
          timestamp: new Date()
        });
      });

      // Call completion notifications
      newSocket.on('call-completed', (data) => {
        if (data.telecaller._id !== user._id) {
          addNotification({
            id: Date.now(),
            type: 'call_completed',
            title: 'Call Completed',
            message: `${data.telecaller.name} completed a call`,
            data: data.call,
            timestamp: new Date()
          });
        }
      });

      // User status updates
      newSocket.on('user-status-updated', (data) => {
        if (data.userId !== user._id) {
          // Handle team member status updates for supervisors
          addNotification({
            id: Date.now(),
            type: 'status_update',
            title: 'Status Update',
            message: `Team member status updated to ${data.status}`,
            data: data,
            timestamp: new Date(),
            priority: 'low'
          });
        }
      });

      // Report submission notifications (for supervisors)
      newSocket.on('report-submitted', (data) => {
        if (user.role === 'supervisor' && user.teamMembers.includes(data.userId)) {
          toast.info('New report submitted for review');
          addNotification({
            id: Date.now(),
            type: 'report_submitted',
            title: 'Report Submitted',
            message: `${data.userName} has submitted a report for review`,
            data: data,
            timestamp: new Date()
          });
        }
      });

      // System announcements
      newSocket.on('system-announcement', (data) => {
        toast.info(data.message);
        addNotification({
          id: Date.now(),
          type: 'announcement',
          title: 'System Announcement',
          message: data.message,
          data: data,
          timestamp: new Date(),
          priority: 'high'
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  // Add notification to the list
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Clear notification by id
  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // Emit events
  const emitEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    }
  };

  // Assign lead event
  const assignLead = (leadData) => {
    emitEvent('assign-lead', leadData);
  };

  // Update call status event
  const updateCallStatus = (callData) => {
    emitEvent('update-call-status', callData);
  };

  // Submit report event
  const submitReport = (reportData) => {
    emitEvent('report-submitted', reportData);
  };

  // Get unread notifications count
  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.isRead).length;
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter(notif => notif.type === type);
  };

  // Get high priority notifications
  const getHighPriorityNotifications = () => {
    return notifications.filter(notif => notif.priority === 'high' && !notif.isRead);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    
    // Notification functions
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    clearNotification,
    getUnreadCount,
    getNotificationsByType,
    getHighPriorityNotifications,
    
    // Socket event functions
    emitEvent,
    assignLead,
    updateCallStatus,
    submitReport
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;