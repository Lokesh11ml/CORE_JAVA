import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Call as CallIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { socket, updateStatus } = useSocket();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [performanceData, setPerformanceData] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    avatar: user?.avatar || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const response = await axios.get(`/api/users/${user._id}/performance`);
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        avatar: user.avatar || ''
      });
      fetchPerformanceData();
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await updateProfile(formData);
      if (result.success) {
        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Password changed successfully');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = (status) => {
    updateStatus(status);
    toast.success(`Status changed to ${status}`);
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'supervisor': return 'warning';
      case 'telecaller': return 'primary';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'break': return 'info';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  // Performance chart data
  const performanceChartData = performanceData ? [
    { name: 'Total Calls', value: performanceData.totalCalls || 0 },
    { name: 'Successful Calls', value: performanceData.successfulCalls || 0 },
    { name: 'Converted Leads', value: performanceData.convertedLeads || 0 }
  ] : [];

  const colors = ['#1976d2', '#2e7d32', '#ed6c02'];

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account settings and view performance
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPerformanceData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={editMode ? handleSubmit : () => setEditMode(true)}
            disabled={loading}
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{ width: 120, height: 120, mb: 2 }}
                  src={user?.avatar}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user?.name}
                </Typography>
                <Chip
                  label={user?.role}
                  color={getRoleColor(user?.role)}
                  sx={{ mb: 1 }}
                />
                <Chip
                  label={user?.currentStatus || 'offline'}
                  color={getStatusColor(user?.currentStatus)}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={user?.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <PhoneIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={user?.phone || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Department"
                    secondary={user?.department || 'Not assigned'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <ScheduleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Last Active"
                    secondary={user?.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    onClick={() => setPasswordDialog(true)}
                    fullWidth
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<NotificationsIcon />}
                    fullWidth
                  >
                    Notification Settings
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Profile Details" />
                  <Tab label="Performance" />
                  <Tab label="Settings" />
                </Tabs>
              </Box>

              {/* Profile Details Tab */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!editMode}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          disabled={!editMode}
                          label="Department"
                        >
                          <MenuItem value="lead_generation">Lead Generation</MenuItem>
                          <MenuItem value="follow_up">Follow Up</MenuItem>
                          <MenuItem value="sales">Sales</MenuItem>
                          <MenuItem value="support">Support</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Avatar URL"
                        value={formData.avatar}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                        disabled={!editMode}
                        helperText="Enter a URL for your profile picture"
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box display="flex" gap={2} mt={3}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            department: user?.department || '',
                            avatar: user?.avatar || ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Performance Tab */}
              {activeTab === 1 && (
                <Box>
                  {performanceData ? (
                    <Grid container spacing={3}>
                      {/* Performance Cards */}
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography color="text.secondary" gutterBottom>
                                  Total Calls
                                </Typography>
                                <Typography variant="h4">
                                  {performanceData.totalCalls || 0}
                                </Typography>
                              </Box>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <CallIcon />
                              </Avatar>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography color="text.secondary" gutterBottom>
                                  Successful Calls
                                </Typography>
                                <Typography variant="h4">
                                  {performanceData.successfulCalls || 0}
                                </Typography>
                              </Box>
                              <Avatar sx={{ bgcolor: 'success.main' }}>
                                <CheckCircleIcon />
                              </Avatar>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography color="text.secondary" gutterBottom>
                                  Converted Leads
                                </Typography>
                                <Typography variant="h4">
                                  {performanceData.convertedLeads || 0}
                                </Typography>
                              </Box>
                              <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <TrendingUpIcon />
                              </Avatar>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Performance Chart */}
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Performance Overview
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={performanceChartData}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${value}`}
                                >
                                  {performanceChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}

              {/* Settings Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Status Settings
                  </Typography>
                  <Box display="flex" gap={2} mb={3}>
                    <Button
                      variant={user?.currentStatus === 'available' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => handleStatusChange('available')}
                    >
                      Available
                    </Button>
                    <Button
                      variant={user?.currentStatus === 'busy' ? 'contained' : 'outlined'}
                      color="warning"
                      onClick={() => handleStatusChange('busy')}
                    >
                      Busy
                    </Button>
                    <Button
                      variant={user?.currentStatus === 'break' ? 'contained' : 'outlined'}
                      color="info"
                      onClick={() => handleStatusChange('break')}
                    >
                      On Break
                    </Button>
                    <Button
                      variant={user?.currentStatus === 'offline' ? 'contained' : 'outlined'}
                      color="default"
                      onClick={() => handleStatusChange('offline')}
                    >
                      Offline
                    </Button>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  <Box>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Email notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="SMS notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Desktop notifications"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              required
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              required
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;