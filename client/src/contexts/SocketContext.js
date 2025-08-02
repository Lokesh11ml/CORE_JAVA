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
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join user-specific room
      newSocket.emit('join-user-room', user._id);
      
      // Update user status to online
      newSocket.emit('user-online', { userId: user._id });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Real-time notifications
    newSocket.on('notification', (notification) => {
      console.log('New notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      if (notification.type === 'success') {
        toast.success(notification.message);
      } else if (notification.type === 'error') {
        toast.error(notification.message);
      } else if (notification.type === 'warning') {
        toast(notification.message, { icon: '⚠️' });
      } else {
        toast(notification.message);
      }
    });

    // Lead assignment notifications
    newSocket.on('new-lead-assigned', (data) => {
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'New Lead Assigned',
        message: `Lead "${data.name}" has been assigned to you`,
        data: data,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      toast.success(`New lead assigned: ${data.name}`);
    });

    // Call status updates
    newSocket.on('call-status-updated', (data) => {
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'Call Status Updated',
        message: `Call to ${data.phoneNumber} is now ${data.status}`,
        data: data,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Report submission notifications (for supervisors)
    newSocket.on('report-submitted', (data) => {
      if (user.role === 'supervisor' || user.role === 'admin') {
        const notification = {
          id: Date.now(),
          type: 'info',
          title: 'Report Submitted',
          message: `${data.telecallerName} has submitted their daily report`,
          data: data,
          timestamp: new Date(),
          read: false
        };
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.success(`${data.telecallerName} submitted their report`);
      }
    });

    // User status changes
    newSocket.on('user-status-changed', (data) => {
      if (user.role === 'supervisor' || user.role === 'admin') {
        const notification = {
          id: Date.now(),
          type: 'info',
          title: 'User Status Changed',
          message: `${data.userName} is now ${data.status}`,
          data: data,
          timestamp: new Date(),
          read: false
        };
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    // Dashboard updates
    newSocket.on('dashboard-update', (data) => {
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'Dashboard Updated',
        message: 'New data available on dashboard',
        data: data,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Error notifications
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Please refresh the page.');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Send notification to other users
  const sendNotification = (targetUserId, notification) => {
    if (socket && isConnected) {
      socket.emit('send-notification', {
        targetUserId,
        notification: {
          ...notification,
          timestamp: new Date()
        }
      });
    }
  };

  // Update user status
  const updateStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('update-status', { status });
    }
  };

  // Start call
  const startCall = (leadId, phoneNumber) => {
    if (socket && isConnected) {
      socket.emit('start-call', { leadId, phoneNumber });
    }
  };

  // End call
  const endCall = (callId, outcome, notes) => {
    if (socket && isConnected) {
      socket.emit('end-call', { callId, outcome, notes });
    }
  };

  // Assign lead
  const assignLead = (leadId, telecallerId) => {
    if (socket && isConnected) {
      socket.emit('assign-lead', { leadId, telecallerId });
    }
  };

  // Submit report
  const submitReport = (reportData) => {
    if (socket && isConnected) {
      socket.emit('submit-report', reportData);
    }
  };

  // Join specific room
  const joinRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomName);
    }
  };

  // Leave room
  const leaveRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('leave-room', roomName);
    }
  };

  // Get filtered notifications
  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.read);
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendNotification,
    updateStatus,
    startCall,
    endCall,
    assignLead,
    submitReport,
    joinRoom,
    leaveRoom,
    getNotificationsByType,
    getUnreadNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;