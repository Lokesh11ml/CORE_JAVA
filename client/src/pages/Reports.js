import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
  Pagination,
  Fab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  AlertTitle,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user, hasRole } = useAuth();
  const { socket, submitReport } = useSocket();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reportType: '',
    status: '',
    user: '',
    dateRange: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // view, edit, create
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    reportType: 'daily',
    reportDate: new Date().toISOString().split('T')[0],
    totalCalls: 0,
    completedCalls: 0,
    followUpsCompleted: 0,
    convertedLeads: 0,
    dailyNotes: '',
    challenges: '',
    improvements: ''
  });

  // Fetch reports data
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`/api/reports?${params}`);
      setReports(response.data.reports);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.page, pagination.pageSize, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle dialog open/close
  const handleDialogOpen = (type, report = null) => {
    setDialogType(type);
    if (report) {
      setSelectedReport(report);
      setFormData({
        reportType: report.reportType || 'daily',
        reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        totalCalls: report.totalCalls || 0,
        completedCalls: report.completedCalls || 0,
        followUpsCompleted: report.followUpsCompleted || 0,
        convertedLeads: report.convertedLeads || 0,
        dailyNotes: report.dailyNotes || '',
        challenges: report.challenges || '',
        improvements: report.improvements || ''
      });
    } else {
      setSelectedReport(null);
      setFormData({
        reportType: 'daily',
        reportDate: new Date().toISOString().split('T')[0],
        totalCalls: 0,
        completedCalls: 0,
        followUpsCompleted: 0,
        convertedLeads: 0,
        dailyNotes: '',
        challenges: '',
        improvements: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedReport(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'create') {
        const response = await axios.post('/api/reports', formData);
        toast.success('Report submitted successfully');
        
        // Emit socket event
        if (socket) {
          socket.emit('submit-report', { 
            ...formData, 
            userId: user._id,
            userName: user.name 
          });
        }
      } else if (dialogType === 'edit') {
        await axios.put(`/api/reports/${selectedReport._id}`, formData);
        toast.success('Report updated successfully');
      }
      handleDialogClose();
      fetchReports();
    } catch (err) {
      console.error('Error saving report:', err);
      toast.error('Failed to save report');
    }
  };

  // Handle report deletion
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await axios.delete(`/api/reports/${reportId}`);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    }
  };

  // Handle report export
  const handleExportReport = async (reportId, format) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}/export/${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Failed to export report');
    }
  };

  // Handle bulk export
  const handleBulkExport = async (format) => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });
      
      const response = await axios.get(`/api/reports/export/bulk?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Reports exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting reports:', err);
      toast.error('Failed to export reports');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'draft': return 'warning';
      case 'reviewed': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Get report type color
  const getReportTypeColor = (type) => {
    switch (type) {
      case 'daily': return 'primary';
      case 'weekly': return 'secondary';
      case 'monthly': return 'success';
      case 'performance': return 'warning';
      default: return 'default';
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value?.name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value?.email || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'reportType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getReportTypeColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'reportDate',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'totalCalls',
      headerName: 'Calls',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'convertedLeads',
      headerName: 'Conversions',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleDialogOpen('view', params.row)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleExportReport(params.row._id, 'pdf')}
            >
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Excel">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleExportReport(params.row._id, 'excel')}
            >
              <ExcelIcon />
            </IconButton>
          </Tooltip>
          {hasRole(['admin', 'supervisor']) && (
            <>
              <Tooltip title="Edit Report">
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen('edit', params.row)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Report">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteReport(params.row._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }
  ];

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
            Reports Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, view, and export reports
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReports}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('create')}
          >
            Create Report
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Reports" />
          <Tab label="Daily Reports" />
          <Tab label="Performance Reports" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={filters.reportType}
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  label="User"
                >
                  <MenuItem value="">All Users</MenuItem>
                  <MenuItem value={user._id}>My Reports</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                onClick={() => setFilters({
                  reportType: '',
                  status: '',
                  user: '',
                  dateRange: '',
                  search: ''
                })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Export Options</Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={() => handleBulkExport('pdf')}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={() => handleBulkExport('excel')}
              >
                Export Excel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Reports DataGrid */}
      <Card>
        <DataGrid
          rows={reports}
          columns={columns}
          pageSize={pagination.pageSize}
          page={pagination.page}
          rowCount={pagination.total}
          paginationMode="server"
          onPageChange={handlePageChange}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0'
            }
          }}
        />
      </Card>

      {/* Report Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create' && 'Create New Report'}
          {dialogType === 'edit' && 'Edit Report'}
          {dialogType === 'view' && 'Report Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={formData.reportType}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Report Type"
                  >
                    <MenuItem value="daily">Daily Report</MenuItem>
                    <MenuItem value="weekly">Weekly Report</MenuItem>
                    <MenuItem value="monthly">Monthly Report</MenuItem>
                    <MenuItem value="performance">Performance Report</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Report Date"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  disabled={dialogType === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Calls"
                  type="number"
                  value={formData.totalCalls}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalCalls: parseInt(e.target.value) || 0 }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Completed Calls"
                  type="number"
                  value={formData.completedCalls}
                  onChange={(e) => setFormData(prev => ({ ...prev, completedCalls: parseInt(e.target.value) || 0 }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Follow-ups Completed"
                  type="number"
                  value={formData.followUpsCompleted}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUpsCompleted: parseInt(e.target.value) || 0 }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Converted Leads"
                  type="number"
                  value={formData.convertedLeads}
                  onChange={(e) => setFormData(prev => ({ ...prev, convertedLeads: parseInt(e.target.value) || 0 }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Daily Notes"
                  multiline
                  rows={3}
                  value={formData.dailyNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyNotes: e.target.value }))}
                  disabled={dialogType === 'view'}
                  placeholder="Describe your activities, achievements, and key highlights..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Challenges Faced"
                  multiline
                  rows={2}
                  value={formData.challenges}
                  onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                  disabled={dialogType === 'view'}
                  placeholder="Any challenges or obstacles you encountered..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Improvements Needed"
                  multiline
                  rows={2}
                  value={formData.improvements}
                  onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                  disabled={dialogType === 'view'}
                  placeholder="Suggestions for improvement or support needed..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            {dialogType === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogType !== 'view' && (
            <Button type="submit" variant="contained" onClick={handleSubmit}>
              {dialogType === 'create' ? 'Submit Report' : 'Update Report'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="create report"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleDialogOpen('create')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Reports;