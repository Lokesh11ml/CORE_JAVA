import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Download as DownloadIcon, Email as EmailIcon, Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon, Schedule as ScheduleIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon, Delete as DeleteIcon, Refresh as RefreshIcon, PictureAsPdf as PdfIcon, TableChart as ExcelIcon, Share as ShareIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [exportDialog, setExportDialog] = useState(false);
  const [formData, setFormData] = useState({
    reportType: '', reportDate: '', totalCalls: 0, completedCalls: 0,
    followUpsCompleted: 0, convertedLeads: 0, dailyNotes: '', challenges: '', improvements: ''
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reports/${id}`);
      setReport(response.data);
      setFormData({
        reportType: response.data.reportType || '',
        reportDate: response.data.reportDate ? new Date(response.data.reportDate).toISOString().split('T')[0] : '',
        totalCalls: response.data.totalCalls || 0,
        completedCalls: response.data.completedCalls || 0,
        followUpsCompleted: response.data.followUpsCompleted || 0,
        convertedLeads: response.data.convertedLeads || 0,
        dailyNotes: response.data.dailyNotes || '',
        challenges: response.data.challenges || '',
        improvements: response.data.improvements || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/reports/${id}`, formData);
      setReport(response.data);
      setEditMode(false);
      toast.success('Report updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  const handleDeleteReport = async () => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await axios.delete(`/api/reports/${id}`);
        toast.success('Report deleted successfully');
        navigate('/reports');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete report');
      }
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/reports/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'daily': return 'primary';
      case 'weekly': return 'secondary';
      case 'monthly': return 'success';
      case 'performance': return 'warning';
      default: return 'default';
    }
  };

  const performanceData = report ? [
    { name: 'Total Calls', value: report.totalCalls, color: '#8884d8' },
    { name: 'Completed Calls', value: report.completedCalls, color: '#82ca9d' },
    { name: 'Follow-ups', value: report.followUpsCompleted, color: '#ffc658' },
    { name: 'Conversions', value: report.convertedLeads, color: '#ff7300' }
  ] : [];

  const conversionRate = report ? (report.convertedLeads / report.totalCalls * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box p={3}>
        <Alert severity="error">Report not found</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/reports')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Report Details</Typography>
          <Chip 
            label={report.reportType} 
            color={getReportTypeColor(report.reportType)}
            size="small"
          />
          <Chip 
            label={report.status} 
            color={getStatusColor(report.status)}
            size="small"
          />
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
                      reportType: report.reportType || '',
                      reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : '',
                      totalCalls: report.totalCalls || 0,
                      completedCalls: report.completedCalls || 0,
                      followUpsCompleted: report.followUpsCompleted || 0,
                      convertedLeads: report.convertedLeads || 0,
                      dailyNotes: report.dailyNotes || '',
                      challenges: report.challenges || '',
                      improvements: report.improvements || ''
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialog(true)}
          >
            Export
          </Button>
          {hasRole(['admin']) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteReport}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Report Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Report Information</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AssessmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Report Type"
                    secondary={report.reportType}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <ScheduleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Report Date"
                    secondary={new Date(report.reportDate).toLocaleDateString()}
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
                    secondary={report.status}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Performance Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary">
                        {report.totalCalls}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Calls
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="success.main">
                        {report.completedCalls}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completed Calls
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="warning.main">
                        {report.followUpsCompleted}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Follow-ups
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="secondary">
                        {report.convertedLeads}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Conversions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Performance" />
          <Tab label="Notes" />
        </Tabs>

        {/* Details Tab */}
        {activeTab === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Report Type"
                  value={editMode ? formData.reportType : report.reportType}
                  onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Report Date"
                  type="date"
                  value={editMode ? formData.reportDate : (report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : '')}
                  onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Total Calls"
                  type="number"
                  value={editMode ? formData.totalCalls : report.totalCalls}
                  onChange={(e) => setFormData({...formData, totalCalls: parseInt(e.target.value) || 0})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Completed Calls"
                  type="number"
                  value={editMode ? formData.completedCalls : report.completedCalls}
                  onChange={(e) => setFormData({...formData, completedCalls: parseInt(e.target.value) || 0})}
                  disabled={!editMode}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Follow-ups Completed"
                  type="number"
                  value={editMode ? formData.followUpsCompleted : report.followUpsCompleted}
                  onChange={(e) => setFormData({...formData, followUpsCompleted: parseInt(e.target.value) || 0})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Converted Leads"
                  type="number"
                  value={editMode ? formData.convertedLeads : report.convertedLeads}
                  onChange={(e) => setFormData({...formData, convertedLeads: parseInt(e.target.value) || 0})}
                  disabled={!editMode}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={report.status}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Conversion Rate"
                      secondary={`${conversionRate}%`}
                    />
                    <Chip 
                      label={conversionRate > 10 ? 'Good' : conversionRate > 5 ? 'Average' : 'Needs Improvement'}
                      color={conversionRate > 10 ? 'success' : conversionRate > 5 ? 'warning' : 'error'}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Completion Rate"
                      secondary={`${((report.completedCalls / report.totalCalls) * 100).toFixed(1)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Follow-up Rate"
                      secondary={`${((report.followUpsCompleted / report.totalCalls) * 100).toFixed(1)}%`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Notes Tab */}
        {activeTab === 2 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Daily Notes</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editMode ? formData.dailyNotes : report.dailyNotes}
                  onChange={(e) => setFormData({...formData, dailyNotes: e.target.value})}
                  disabled={!editMode}
                  placeholder="Enter daily notes..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Challenges</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editMode ? formData.challenges : report.challenges}
                  onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                  disabled={!editMode}
                  placeholder="Enter challenges faced..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Improvements</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editMode ? formData.improvements : report.improvements}
                  onChange={(e) => setFormData({...formData, improvements: e.target.value})}
                  disabled={!editMode}
                  placeholder="Enter improvement suggestions..."
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Choose the format to export this report:
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => {
                handleExport('pdf');
                setExportDialog(false);
              }}
              fullWidth
            >
              Export as PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={() => {
                handleExport('xlsx');
                setExportDialog(false);
              }}
              fullWidth
            >
              Export as Excel
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
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

export default ReportDetail;