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
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [callStatus, setCallStatus] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling']
      });

      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-user-room', { userId: user._id });
        
        // Join role-specific room
        newSocket.emit('join-role-room', { role: user.role });
        
        // Update user status
        newSocket.emit('update-status', { 
          userId: user._id, 
          status: user.currentStatus || 'available' 
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Real-time events
      newSocket.on('new-lead-assigned', (data) => {
        console.log('New lead assigned:', data);
        addNotification({
          type: 'lead',
          title: 'New Lead Assigned',
          message: `Lead "${data.name}" has been assigned to you`,
          data: data,
          timestamp: new Date()
        });
        toast.success(`New lead assigned: ${data.name}`);
      });

      newSocket.on('lead-status-updated', (data) => {
        console.log('Lead status updated:', data);
        addNotification({
          type: 'lead',
          title: 'Lead Status Updated',
          message: `Lead "${data.name}" status changed to ${data.status}`,
          data: data,
          timestamp: new Date()
        });
      });

      newSocket.on('call-started', (data) => {
        console.log('Call started:', data);
        setCallStatus(data);
        addNotification({
          type: 'call',
          title: 'Call Started',
          message: `Call to ${data.phoneNumber} has started`,
          data: data,
          timestamp: new Date()
        });
      });

      newSocket.on('call-ended', (data) => {
        console.log('Call ended:', data);
        setCallStatus(null);
        addNotification({
          type: 'call',
          title: 'Call Ended',
          message: `Call to ${data.phoneNumber} ended (${data.duration}s)`,
          data: data,
          timestamp: new Date()
        });
      });

      newSocket.on('user-status-changed', (data) => {
        console.log('User status changed:', data);
        setOnlineUsers(prev => 
          prev.map(user => 
            user._id === data.userId 
              ? { ...user, currentStatus: data.status }
              : user
          )
        );
      });

      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data);
        setOnlineUsers(prev => {
          const existing = prev.find(u => u._id === data.user._id);
          if (!existing) {
            return [...prev, data.user];
          }
          return prev;
        });
      });

      newSocket.on('user-left', (data) => {
        console.log('User left:', data);
        setOnlineUsers(prev => prev.filter(u => u._id !== data.userId));
      });

      newSocket.on('notification', (data) => {
        console.log('New notification:', data);
        addNotification({
          type: data.type || 'info',
          title: data.title,
          message: data.message,
          data: data.data,
          timestamp: new Date()
        });
        toast(data.message, { 
          icon: data.type === 'error' ? '❌' : data.type === 'success' ? '✅' : 'ℹ️' 
        });
      });

      newSocket.on('dashboard-update', (data) => {
        console.log('Dashboard update:', data);
        // This will be handled by individual components
      });

      newSocket.on('report-submitted', (data) => {
        console.log('Report submitted:', data);
        addNotification({
          type: 'report',
          title: 'Report Submitted',
          message: `${data.userName} submitted their daily report`,
          data: data,
          timestamp: new Date()
        });
      });

      newSocket.on('meta-lead-received', (data) => {
        console.log('Meta lead received:', data);
        addNotification({
          type: 'meta',
          title: 'New Meta Lead',
          message: `New lead from ${data.campaignName}: ${data.name}`,
          data: data,
          timestamp: new Date()
        });
        toast.success(`New Meta lead: ${data.name}`);
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error occurred');
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Add notification to list
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Emit events
  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  // Update user status
  const updateStatus = (status) => {
    if (socket && connected) {
      socket.emit('update-status', { userId: user._id, status });
    }
  };

  // Assign lead
  const assignLead = (leadId, telecallerId) => {
    emitEvent('assign-lead', { leadId, telecallerId });
  };

  // Start call
  const startCall = (leadId, phoneNumber) => {
    emitEvent('start-call', { leadId, phoneNumber, telecallerId: user._id });
  };

  // End call
  const endCall = (callId, duration) => {
    emitEvent('end-call', { callId, duration, telecallerId: user._id });
  };

  // Submit report
  const submitReport = (reportData) => {
    emitEvent('submit-report', { ...reportData, userId: user._id });
  };

  // Join call room
  const joinCallRoom = (callId) => {
    emitEvent('join-call-room', { callId, userId: user._id });
  };

  // Leave call room
  const leaveCallRoom = (callId) => {
    emitEvent('leave-call-room', { callId, userId: user._id });
  };

  // Get unread count
  const getUnreadCount = () => {
    return unreadCount;
  };

  // Get notifications
  const getNotifications = () => {
    return notifications;
  };

  // Get online users
  const getOnlineUsers = () => {
    return onlineUsers;
  };

  // Get call status
  const getCallStatus = () => {
    return callStatus;
  };

  const value = {
    socket,
    connected,
    notifications: getNotifications(),
    unreadCount: getUnreadCount(),
    onlineUsers: getOnlineUsers(),
    callStatus: getCallStatus(),
    emitEvent,
    updateStatus,
    assignLead,
    startCall,
    endCall,
    submitReport,
    joinCallRoom,
    leaveCallRoom,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;