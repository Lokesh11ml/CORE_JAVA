import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, FormControlLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Phone as PhoneIcon, Email as EmailIcon, Business as BusinessIcon, Person as PersonIcon, TrendingUp as TrendingUpIcon, Call as CallIcon, Assessment as AssessmentIcon, Schedule as ScheduleIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Security as SecurityIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: '', department: '', supervisor: '', isActive: true
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${id}`);
      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        role: response.data.role || '',
        department: response.data.department || '',
        supervisor: response.data.supervisor || '',
        isActive: response.data.isActive !== undefined ? response.data.isActive : true
      });
      
      // Fetch performance data
      const perfResponse = await axios.get(`/api/users/${id}/performance`);
      setPerformanceData(perfResponse.data);
      
      // Fetch activity history
      const activityResponse = await axios.get(`/api/users/${id}/activity`);
      setActivityHistory(activityResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user');
      toast.error('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/users/${id}`, formData);
      setUser(response.data);
      setEditMode(false);
      toast.success('User updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await axios.put(`/api/users/${id}/password`, {
        newPassword: passwordData.newPassword
      });
      setPasswordDialog(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleStatusToggle = async () => {
    try {
      const response = await axios.put(`/api/users/${id}/status`, {
        isActive: !user.isActive
      });
      setUser(response.data);
      toast.success(`User ${response.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        toast.success('User deleted successfully');
        navigate('/users');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'supervisor': return 'warning';
      case 'telecaller': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const performanceChartData = performanceData ? [
    { name: 'Total Calls', value: performanceData.totalCalls || 0, color: '#8884d8' },
    { name: 'Completed Calls', value: performanceData.completedCalls || 0, color: '#82ca9d' },
    { name: 'Follow-ups', value: performanceData.followUpsCompleted || 0, color: '#ffc658' },
    { name: 'Conversions', value: performanceData.convertedLeads || 0, color: '#ff7300' }
  ] : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="error">User not found</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/users')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">User Details</Typography>
          <Chip 
            label={user.role} 
            color={getRoleColor(user.role)}
            size="small"
          />
          <Chip 
            label={user.isActive ? 'Active' : 'Inactive'} 
            color={getStatusColor(user.isActive)}
            size="small"
          />
          {isUserOnline(user._id) && (
            <Chip 
              label="Online" 
              color="success"
              size="small"
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
          {hasRole(['admin', 'supervisor']) && (
            <>
              <Button
                variant={editMode ? "contained" : "outlined"}
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                onClick={editMode ? handleSubmit : () => setEditMode(true)}
              >
                {editMode ? 'Save' : 'Edit'}
              </Button>
              {editMode && (
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phone || '',
                      role: user.role || '',
                      department: user.department || '',
                      supervisor: user.supervisor || '',
                      isActive: user.isActive !== undefined ? user.isActive : true
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          {hasRole(['admin']) && (
            <>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => setPasswordDialog(true)}
              >
                Change Password
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteUser}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* User Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>User Information</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Name"
                    secondary={user.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PhoneIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={user.phone}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Role & Department</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Role"
                    secondary={user.role}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Department"
                    secondary={user.department}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Status"
                    secondary={user.isActive ? 'Active' : 'Inactive'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Performance" />
          <Tab label="Activity" />
        </Tabs>

        {/* Details Tab */}
        {activeTab === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editMode ? formData.name : user.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editMode ? formData.email : user.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={editMode ? formData.phone : user.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editMode ? formData.role : user.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    label="Role"
                  >
                    <MenuItem value="telecaller">Telecaller</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={editMode ? formData.department : user.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    label="Department"
                  >
                    <MenuItem value="lead_generation">Lead Generation</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="support">Support</MenuItem>
                    <MenuItem value="marketing">Marketing</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.isActive}
                      onChange={handleStatusToggle}
                      disabled={!hasRole(['admin'])}
                    />
                  }
                  label="Active Status"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Performance Tab */}
        {activeTab === 1 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Performance Overview</Typography>
                {performanceData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No performance data available
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                {performanceData ? (
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Total Calls"
                        secondary={performanceData.totalCalls || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Completed Calls"
                        secondary={performanceData.completedCalls || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Follow-ups Completed"
                        secondary={performanceData.followUpsCompleted || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Converted Leads"
                        secondary={performanceData.convertedLeads || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Conversion Rate"
                        secondary={`${performanceData.conversionRate || 0}%`}
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No metrics available
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Activity Tab */}
        {activeTab === 2 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            {activityHistory.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityHistory.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{activity.type}</TableCell>
                        <TableCell>{activity.details}</TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.status} 
                            color={activity.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No activity history available
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
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
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default UserDetail;