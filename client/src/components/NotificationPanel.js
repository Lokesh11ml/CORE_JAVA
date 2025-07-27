import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Business as LeadIcon,
  Call as CallIcon,
  Assessment as ReportIcon,
  Announcement as AnnouncementIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';

const NotificationPanel = ({ open, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    clearNotifications,
    clearNotification,
    getUnreadCount
  } = useSocket();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'lead_assigned':
      case 'lead_reassigned':
        return <LeadIcon color="primary" />;
      case 'call_completed':
        return <CallIcon color="success" />;
      case 'report_submitted':
        return <ReportIcon color="info" />;
      case 'status_update':
        return <PersonIcon color="action" />;
      case 'announcement':
        return <AnnouncementIcon color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'error';
    
    switch (type) {
      case 'lead_assigned':
        return 'primary';
      case 'call_completed':
        return 'success';
      case 'report_submitted':
        return 'info';
      case 'announcement':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'lead_assigned':
      case 'lead_reassigned':
        // Navigate to leads page or specific lead
        window.location.href = '/leads';
        break;
      case 'call_completed':
        // Navigate to calls page
        window.location.href = '/calls';
        break;
      case 'report_submitted':
        // Navigate to reports page
        window.location.href = '/reports';
        break;
      default:
        break;
    }
    
    onClose();
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Notifications
            {getUnreadCount() > 0 && (
              <Chip
                label={getUnreadCount()}
                size="small"
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {notifications.length > 0 && (
          <Button
            size="small"
            onClick={clearNotifications}
            sx={{ mt: 1 }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.timestamp)}
                          </Typography>
                          {notification.priority === 'high' && (
                            <Chip
                              label="!"
                              size="small"
                              color="error"
                              sx={{ minWidth: 20, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;