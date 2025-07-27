import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Call as CallIcon,
  Assessment as ReportIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Facebook as FacebookIcon,
  Analytics as AnalyticsIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import StatusIndicator from './StatusIndicator';
import NotificationPanel from './NotificationPanel';

const drawerWidth = 280;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateStatus, isAdmin, isSupervisor } = useAuth();
  const { getUnreadCount } = useSocket();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleStatusChange = (status) => {
    updateStatus(status);
    handleProfileMenuClose();
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      {
        text: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/dashboard',
        roles: ['admin', 'supervisor', 'telecaller']
      },
      {
        text: 'Leads',
        icon: <BusinessIcon />,
        path: '/leads',
        roles: ['admin', 'supervisor', 'telecaller']
      },
      {
        text: 'Calls',
        icon: <CallIcon />,
        path: '/calls',
        roles: ['admin', 'supervisor', 'telecaller']
      },
      {
        text: 'Reports',
        icon: <ReportIcon />,
        path: '/reports',
        roles: ['admin', 'supervisor', 'telecaller']
      }
    ];

    // Add admin/supervisor only items
    if (isSupervisor()) {
      items.push(
        {
          text: 'Team',
          icon: <PeopleIcon />,
          path: '/users',
          roles: ['admin', 'supervisor']
        },
        {
          text: 'Analytics',
          icon: <AnalyticsIcon />,
          path: '/analytics',
          roles: ['admin', 'supervisor']
        }
      );
    }

    // Add admin only items
    if (isAdmin()) {
      items.push(
        {
          text: 'Meta Integration',
          icon: <FacebookIcon />,
          path: '/meta',
          roles: ['admin']
        },
        {
          text: 'Settings',
          icon: <SettingsIcon />,
          path: '/settings',
          roles: ['admin']
        }
      );
    }

    return items.filter(item => item.roles.includes(user?.role));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'break': return 'info';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          TeleCaller CRM
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.department} Department
        </Typography>
      </Box>

      <List sx={{ px: 1, py: 2 }}>
        {getNavigationItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/profile');
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={isActive('/profile')}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.contrastText,
                }
              }
            }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getNavigationItems().find(item => isActive(item.path))?.text || 'TeleCaller CRM'}
          </Typography>

          {/* Status Indicator */}
          <StatusIndicator 
            status={user?.currentStatus} 
            onChange={handleStatusChange}
            sx={{ mr: 2 }}
          />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={() => setNotificationOpen(true)}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={getUnreadCount()} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              avatar={<Avatar sx={{ width: 24, height: 24 }}>{user?.name?.charAt(0)}</Avatar>}
              label={user?.name}
              variant="outlined"
              color={getStatusColor(user?.currentStatus)}
              onClick={handleProfileMenuOpen}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '& .MuiChip-avatar': {
                  color: theme.palette.primary.main,
                  backgroundColor: 'white'
                }
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <Avatar /> Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleStatusChange('available')}>
          <Box sx={{ width: 32, height: 32, mr: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
          </Box>
          Available
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('busy')}>
          <Box sx={{ width: 32, height: 32, mr: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
          </Box>
          Busy
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('break')}>
          <Box sx={{ width: 32, height: 32, mr: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
          </Box>
          On Break
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('offline')}>
          <Box sx={{ width: 32, height: 32, mr: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.400' }} />
          </Box>
          Offline
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Outlet />
      </Box>

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  );
};

export default Layout;