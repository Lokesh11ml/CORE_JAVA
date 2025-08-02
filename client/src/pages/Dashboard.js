import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
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
  Line,
  AreaChart,
  Area
} from 'recharts';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Colors for charts
  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  };

  const pieColors = [colors.primary, colors.success, colors.warning, colors.error, colors.info];

  useEffect(() => {
    fetchDashboardData();
    
    // Socket listeners for real-time updates
    if (socket) {
      socket.on('dashboard-update', (data) => {
        setDashboardData(prev => ({ ...prev, ...data }));
        toast.success('Dashboard updated with new data!');
      });

      socket.on('new-lead-assigned', (data) => {
        toast.success(`New lead assigned: ${data.name}`);
        fetchDashboardData();
      });

      return () => {
        socket.off('dashboard-update');
        socket.off('new-lead-assigned');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box p={3}>
        <Alert severity="info">No dashboard data available</Alert>
      </Box>
    );
  }

  const {
    stats,
    recentLeads,
    recentCalls,
    upcomingFollowups,
    teamPerformance,
    leadPipeline,
    callTrends,
    notifications
  } = dashboardData;

  // Role-based content
  const isAdmin = user.role === 'admin';
  const isSupervisor = user.role === 'supervisor';
  const isTelecaller = user.role === 'telecaller';

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user.name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your {isAdmin ? 'organization' : isSupervisor ? 'team' : 'leads'} today
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {notifications?.length > 0 && (
            <Chip
              icon={<NotificationsIcon />}
              label={`${notifications.length} new`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Leads
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalLeads || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{stats?.newLeadsToday || 0} today
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: colors.primary }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Calls
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalCalls || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats?.successRate || 0}% success rate
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: colors.success }}>
                  <PhoneIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Conversions
                  </Typography>
                  <Typography variant="h4">
                    {stats?.conversions || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats?.conversionRate || 0}% rate
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: colors.warning }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Follow-ups
                  </Typography>
                  <Typography variant="h4">
                    {stats?.pendingFollowups || 0}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {stats?.overdueFollowups || 0} overdue
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: colors.error }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        {/* Lead Pipeline Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Pipeline
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadPipeline}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadPipeline?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Call Trends Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Performance (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={callTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="calls" fill={colors.primary} />
                  <Bar dataKey="successful" fill={colors.success} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Performance (Admin/Supervisor only) */}
      {(isAdmin || isSupervisor) && teamPerformance && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="calls" fill={colors.primary} />
                    <Bar dataKey="conversions" fill={colors.success} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity Section */}
      <Grid container spacing={3}>
        {/* Recent Leads */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Leads
                </Typography>
                <Button size="small" color="primary">
                  View All
                </Button>
              </Box>
              <List>
                {recentLeads?.map((lead, index) => (
                  <React.Fragment key={lead._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPriorityColor(lead.priority) }}>
                          <PeopleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={lead.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {lead.phone} • {lead.source}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip
                                label={lead.status}
                                size="small"
                                color={getStatusColor(lead.status)}
                              />
                              <Chip
                                label={lead.priority}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentLeads.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Calls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Recent Calls
                </Typography>
                <Button size="small" color="primary">
                  View All
                </Button>
              </Box>
              <List>
                {recentCalls?.map((call, index) => (
                  <React.Fragment key={call._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getCallOutcomeColor(call.outcome) }}>
                          <PhoneIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={call.phoneNumber}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {call.duration} min • {call.outcome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(call.startTime).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        {call.isSuccessful ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </Box>
                    </ListItem>
                    {index < recentCalls.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Follow-ups */}
      {upcomingFollowups && upcomingFollowups.length > 0 && (
        <Grid container spacing={3} mt={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Follow-ups
                </Typography>
                <List>
                  {upcomingFollowups.map((followup, index) => (
                    <React.Fragment key={followup._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: isOverdue(followup.nextFollowupDate) ? colors.error : colors.info }}>
                            <ScheduleIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={followup.leadName}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {followup.phone} • {followup.telecallerName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Due: {new Date(followup.nextFollowupDate).toLocaleDateString()}
                                {isOverdue(followup.nextFollowupDate) && (
                                  <Chip
                                    label="Overdue"
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button size="small" variant="outlined">
                          Call Now
                        </Button>
                      </ListItem>
                      {index < upcomingFollowups.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// Helper functions
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#d32f2f';
    case 'high': return '#ed6c02';
    case 'medium': return '#1976d2';
    case 'low': return '#2e7d32';
    default: return '#757575';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'converted': return 'success';
    case 'interested': return 'primary';
    case 'qualified': return 'info';
    case 'contacted': return 'warning';
    case 'new': return 'default';
    default: return 'default';
  }
};

const getCallOutcomeColor = (outcome) => {
  switch (outcome) {
    case 'connected': return '#2e7d32';
    case 'converted': return '#1976d2';
    case 'no_answer': return '#ed6c02';
    case 'busy': return '#d32f2f';
    default: return '#757575';
  }
};

const isOverdue = (date) => {
  return new Date(date) < new Date();
};

export default Dashboard;