import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Call as CallIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Analytics as AnalyticsIcon
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
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [leadAnalytics, setLeadAnalytics] = useState([]);
  const [callAnalytics, setCallAnalytics] = useState([]);

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

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        dateRange,
        userId: user._id
      });

      const response = await axios.get(`/api/analytics?${params}`);
      setAnalyticsData(response.data);
      
      // Set specific data arrays
      setTeamPerformance(response.data.teamPerformance || []);
      setLeadAnalytics(response.data.leadAnalytics || []);
      setCallAnalytics(response.data.callAnalytics || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle date range change
  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  // Export analytics data
  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        format,
        dateRange,
        userId: user._id
      });
      
      const response = await axios.get(`/api/analytics/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      toast.error('Failed to export analytics');
    }
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get trend icon and color
  const getTrendIcon = (percentage) => {
    if (percentage > 0) {
      return { icon: <TrendingUpIcon />, color: 'success' };
    } else if (percentage < 0) {
      return { icon: <TrendingDownIcon />, color: 'error' };
    }
    return { icon: null, color: 'default' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive performance insights and metrics
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={handleDateRangeChange}
              label="Date Range"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('excel')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      {analyticsData && (
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
                      {analyticsData.totalLeads || 0}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(calculatePercentageChange(
                        analyticsData.totalLeads || 0,
                        analyticsData.previousTotalLeads || 0
                      )).icon}
                      <Typography
                        variant="body2"
                        color={getTrendIcon(calculatePercentageChange(
                          analyticsData.totalLeads || 0,
                          analyticsData.previousTotalLeads || 0
                        )).color}
                      >
                        {calculatePercentageChange(
                          analyticsData.totalLeads || 0,
                          analyticsData.previousTotalLeads || 0
                        ).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: colors.primary }}>
                    <PeopleIcon fontSize="large" />
                  </Box>
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
                      {analyticsData.totalCalls || 0}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(calculatePercentageChange(
                        analyticsData.totalCalls || 0,
                        analyticsData.previousTotalCalls || 0
                      )).icon}
                      <Typography
                        variant="body2"
                        color={getTrendIcon(calculatePercentageChange(
                          analyticsData.totalCalls || 0,
                          analyticsData.previousTotalCalls || 0
                        )).color}
                      >
                        {calculatePercentageChange(
                          analyticsData.totalCalls || 0,
                          analyticsData.previousTotalCalls || 0
                        ).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: colors.success }}>
                    <CallIcon fontSize="large" />
                  </Box>
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
                      {analyticsData.conversions || 0}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(calculatePercentageChange(
                        analyticsData.conversions || 0,
                        analyticsData.previousConversions || 0
                      )).icon}
                      <Typography
                        variant="body2"
                        color={getTrendIcon(calculatePercentageChange(
                          analyticsData.conversions || 0,
                          analyticsData.previousConversions || 0
                        )).color}
                      >
                        {calculatePercentageChange(
                          analyticsData.conversions || 0,
                          analyticsData.previousConversions || 0
                        ).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: colors.warning }}>
                    <CheckCircleIcon fontSize="large" />
                  </Box>
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
                      Conversion Rate
                    </Typography>
                    <Typography variant="h4">
                      {analyticsData.conversionRate || 0}%
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(calculatePercentageChange(
                        analyticsData.conversionRate || 0,
                        analyticsData.previousConversionRate || 0
                      )).icon}
                      <Typography
                        variant="body2"
                        color={getTrendIcon(calculatePercentageChange(
                          analyticsData.conversionRate || 0,
                          analyticsData.previousConversionRate || 0
                        )).color}
                      >
                        {calculatePercentageChange(
                          analyticsData.conversionRate || 0,
                          analyticsData.previousConversionRate || 0
                        ).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: colors.error }}>
                    <TrendingUpIcon fontSize="large" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="Team Performance" />
              <Tab label="Lead Analytics" />
              <Tab label="Call Analytics" />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                {/* Lead Pipeline Chart */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Lead Pipeline
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData?.leadPipeline || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(analyticsData?.leadPipeline || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Call Performance Chart */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Call Performance Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={callAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="calls" stroke={colors.primary} />
                          <Line type="monotone" dataKey="successful" stroke={colors.success} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Conversion Trend */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Conversion Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={leadAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="leads" stackId="1" stroke={colors.primary} fill={colors.primary} />
                          <Area type="monotone" dataKey="conversions" stackId="1" stroke={colors.success} fill={colors.success} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Team Performance Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Team Performance
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell align="right">Total Calls</TableCell>
                      <TableCell align="right">Successful Calls</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                      <TableCell align="right">Total Leads</TableCell>
                      <TableCell align="right">Conversions</TableCell>
                      <TableCell align="right">Conversion Rate</TableCell>
                      <TableCell align="right">Avg Call Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamPerformance.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                              {member.name?.charAt(0)}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {member.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {member.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{member.totalCalls || 0}</TableCell>
                        <TableCell align="right">{member.successfulCalls || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${member.successRate || 0}%`}
                            color={member.successRate >= 80 ? 'success' : member.successRate >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{member.totalLeads || 0}</TableCell>
                        <TableCell align="right">{member.conversions || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${member.conversionRate || 0}%`}
                            color={member.conversionRate >= 20 ? 'success' : member.conversionRate >= 10 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{member.avgCallDuration || 0} min</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Lead Analytics Tab */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Lead Sources
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData?.leadSources || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(analyticsData?.leadSources || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Lead Quality Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData?.leadQuality || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="quality" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill={colors.primary} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Lead Conversion Timeline
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={leadAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="leads" fill={colors.primary} />
                          <Line type="monotone" dataKey="conversions" stroke={colors.success} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Call Analytics Tab */}
          {activeTab === 3 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Call Outcomes
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData?.callOutcomes || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(analyticsData?.callOutcomes || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Call Duration Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData?.callDuration || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="duration" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill={colors.info} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Daily Call Performance
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={callAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="calls" fill={colors.primary} />
                          <Line type="monotone" dataKey="successful" stroke={colors.success} />
                          <Line type="monotone" dataKey="converted" stroke={colors.warning} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Analytics;