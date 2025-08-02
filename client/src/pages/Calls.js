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
  AlertTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Phone as PhoneIcon,
  CallEnd as CallEndIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  VolumeUp as VolumeUpIcon,
  Download as DownloadIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Calls = () => {
  const { user, hasRole } = useAuth();
  const { socket, startCall, endCall, callStatus } = useSocket();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    callType: '',
    telecaller: '',
    dateRange: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [selectedCall, setSelectedCall] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // view, edit, create
  const [currentCall, setCurrentCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [formData, setFormData] = useState({
    leadId: '',
    phoneNumber: '',
    callType: 'outbound',
    notes: '',
    scheduledTime: ''
  });

  // Fetch calls data
  const fetchCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`/api/calls?${params}`);
      setCalls(response.data.calls);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching calls:', err);
      setError('Failed to load calls');
      toast.error('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
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

  // Handle call initiation
  const handleStartCall = async (leadId, phoneNumber) => {
    try {
      setCurrentCall({ leadId, phoneNumber, startTime: new Date() });
      setCallTimer(0);
      
      // Start timer
      const interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      // Emit socket event
      if (socket) {
        socket.emit('start-call', { leadId, phoneNumber, telecallerId: user._id });
      }

      // Make API call to initiate call
      const response = await axios.post('/api/calls/initiate', {
        leadId,
        phoneNumber,
        telecallerId: user._id
      });

      toast.success('Call initiated successfully');
      
      // Update call status
      setCurrentCall(prev => ({ ...prev, callId: response.data.callId }));
      
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Failed to start call');
      handleEndCall();
    }
  };

  // Handle call end
  const handleEndCall = async () => {
    if (!currentCall) return;

    try {
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      // Emit socket event
      if (socket) {
        socket.emit('end-call', { 
          callId: currentCall.callId, 
          duration: callTimer,
          telecallerId: user._id 
        });
      }

      // Make API call to end call
      await axios.post('/api/calls/end', {
        callId: currentCall.callId,
        duration: callTimer,
        telecallerId: user._id
      });

      toast.success('Call ended successfully');
      setCurrentCall(null);
      setCallTimer(0);
      fetchCalls(); // Refresh calls list
      
    } catch (err) {
      console.error('Error ending call:', err);
      toast.error('Failed to end call');
    }
  };

  // Handle dialog open/close
  const handleDialogOpen = (type, call = null) => {
    setDialogType(type);
    if (call) {
      setSelectedCall(call);
      setFormData({
        leadId: call.lead?._id || '',
        phoneNumber: call.phoneNumber || '',
        callType: call.callType || 'outbound',
        notes: call.notes || '',
        scheduledTime: call.scheduledTime || ''
      });
    } else {
      setSelectedCall(null);
      setFormData({
        leadId: '',
        phoneNumber: '',
        callType: 'outbound',
        notes: '',
        scheduledTime: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCall(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'create') {
        await axios.post('/api/calls', formData);
        toast.success('Call scheduled successfully');
      } else if (dialogType === 'edit') {
        await axios.put(`/api/calls/${selectedCall._id}`, formData);
        toast.success('Call updated successfully');
      }
      handleDialogClose();
      fetchCalls();
    } catch (err) {
      console.error('Error saving call:', err);
      toast.error('Failed to save call');
    }
  };

  // Handle call deletion
  const handleDeleteCall = async (callId) => {
    if (!window.confirm('Are you sure you want to delete this call?')) return;
    
    try {
      await axios.delete(`/api/calls/${callId}`);
      toast.success('Call deleted successfully');
      fetchCalls();
    } catch (err) {
      console.error('Error deleting call:', err);
      toast.error('Failed to delete call');
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'scheduled': return 'info';
      case 'missed': return 'error';
      case 'no_answer': return 'warning';
      default: return 'default';
    }
  };

  // Get call type color
  const getCallTypeColor = (type) => {
    switch (type) {
      case 'outbound': return 'primary';
      case 'inbound': return 'success';
      default: return 'default';
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: 'lead',
      headerName: 'Lead',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value?.name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value?.phone || params.row.phoneNumber}
          </Typography>
        </Box>
      )
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon fontSize="small" />
          {params.value}
        </Box>
      )
    },
    {
      field: 'callType',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getCallTypeColor(params.value)}
          size="small"
        />
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
      field: 'duration',
      headerName: 'Duration',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? formatDuration(params.value) : '--'}
        </Typography>
      )
    },
    {
      field: 'startTime',
      headerName: 'Start Time',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'telecaller',
      headerName: 'Telecaller',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value?.name || 'Unknown'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
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
          {params.row.status === 'scheduled' && (
            <Tooltip title="Start Call">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleStartCall(params.row.lead?._id, params.row.phoneNumber)}
              >
                <PlayIcon />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'in_progress' && (
            <Tooltip title="End Call">
              <IconButton
                size="small"
                color="error"
                onClick={handleEndCall}
              >
                <CallEndIcon />
              </IconButton>
            </Tooltip>
          )}
          {hasRole(['admin', 'supervisor']) && (
            <>
              <Tooltip title="Edit Call">
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen('edit', params.row)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Call">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteCall(params.row._id)}
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
            Call Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all calls in your system
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCalls}
          >
            Refresh
          </Button>
          {hasRole(['admin', 'supervisor']) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleDialogOpen('create')}
            >
              Schedule Call
            </Button>
          )}
        </Box>
      </Box>

      {/* Current Call Status */}
      {currentCall && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Call in Progress</AlertTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography>
              Calling: {currentCall.phoneNumber}
            </Typography>
            <Typography variant="h6" color="primary">
              {formatDuration(callTimer)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={handleEndCall}
            >
              End Call
            </Button>
          </Box>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search calls..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
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
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="missed">Missed</MenuItem>
                  <MenuItem value="no_answer">No Answer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Call Type</InputLabel>
                <Select
                  value={filters.callType}
                  onChange={(e) => handleFilterChange('callType', e.target.value)}
                  label="Call Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="outbound">Outbound</MenuItem>
                  <MenuItem value="inbound">Inbound</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Telecaller</InputLabel>
                <Select
                  value={filters.telecaller}
                  onChange={(e) => handleFilterChange('telecaller', e.target.value)}
                  label="Telecaller"
                >
                  <MenuItem value="">All Telecallers</MenuItem>
                  <MenuItem value={user._id}>My Calls</MenuItem>
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
                  status: '',
                  callType: '',
                  telecaller: '',
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Calls DataGrid */}
      <Card>
        <DataGrid
          rows={calls}
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

      {/* Call Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create' && 'Schedule New Call'}
          {dialogType === 'edit' && 'Edit Call'}
          {dialogType === 'view' && 'Call Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={dialogType === 'view'}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Call Type</InputLabel>
                  <Select
                    value={formData.callType}
                    onChange={(e) => setFormData(prev => ({ ...prev, callType: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Call Type"
                  >
                    <MenuItem value="outbound">Outbound</MenuItem>
                    <MenuItem value="inbound">Inbound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Scheduled Time"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  disabled={dialogType === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={dialogType === 'view'}
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
              {dialogType === 'create' ? 'Schedule' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {hasRole(['admin', 'supervisor']) && (
        <Fab
          color="primary"
          aria-label="schedule call"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleDialogOpen('create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Calls;