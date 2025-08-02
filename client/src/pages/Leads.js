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
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Leads = () => {
  const { user, hasRole } = useAuth();
  const { socket, assignLead } = useSocket();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    source: '',
    assignedTo: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // view, edit, create
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual',
    priority: 'medium',
    quality: 'warm',
    product: '',
    requirements: '',
    notes: ''
  });

  // Fetch leads data
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`/api/leads?${params}`);
      setLeads(response.data.leads);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads');
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
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

  // Handle lead assignment
  const handleAssignLead = async (leadId, telecallerId) => {
    try {
      await axios.post(`/api/leads/${leadId}/assign`, { telecallerId });
      toast.success('Lead assigned successfully');
      fetchLeads();
      
      // Emit socket event
      if (socket) {
        socket.emit('assign-lead', { leadId, telecallerId });
      }
    } catch (err) {
      console.error('Error assigning lead:', err);
      toast.error('Failed to assign lead');
    }
  };

  // Handle lead status update
  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      await axios.patch(`/api/leads/${leadId}`, { status: newStatus });
      toast.success('Lead status updated');
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead status:', err);
      toast.error('Failed to update lead status');
    }
  };

  // Handle dialog open/close
  const handleDialogOpen = (type, lead = null) => {
    setDialogType(type);
    if (lead) {
      setSelectedLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        priority: lead.priority,
        quality: lead.quality,
        product: lead.product || '',
        requirements: lead.requirements || '',
        notes: lead.notes || ''
      });
    } else {
      setSelectedLead(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'manual',
        priority: 'medium',
        quality: 'warm',
        product: '',
        requirements: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedLead(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'create') {
        await axios.post('/api/leads', formData);
        toast.success('Lead created successfully');
      } else if (dialogType === 'edit') {
        await axios.put(`/api/leads/${selectedLead._id}`, formData);
        toast.success('Lead updated successfully');
      }
      handleDialogClose();
      fetchLeads();
    } catch (err) {
      console.error('Error saving lead:', err);
      toast.error('Failed to save lead');
    }
  };

  // Handle lead deletion
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await axios.delete(`/api/leads/${leadId}`);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Failed to delete lead');
    }
  };

  // Get status color
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

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.email}
          </Typography>
        </Box>
      )
    },
    {
      field: 'phone',
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
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value)}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value?.name || 'Unassigned'}
        </Typography>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
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
          {hasRole(['admin', 'supervisor']) && (
            <>
              <Tooltip title="Edit Lead">
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen('edit', params.row)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Lead">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteLead(params.row._id)}
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
            Leads Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all leads in your pipeline
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLeads}
          >
            Refresh
          </Button>
          {hasRole(['admin', 'supervisor']) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleDialogOpen('create')}
            >
              Add Lead
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" />
                }}
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
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="interested">Interested</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priority</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  label="Source"
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="instagram">Instagram</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="website">Website</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  label="Assigned To"
                >
                  <MenuItem value="">All Users</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                  {/* Add user options here */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({
                  status: '',
                  priority: '',
                  source: '',
                  assignedTo: '',
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

      {/* Leads DataGrid */}
      <Card>
        <DataGrid
          rows={leads}
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

      {/* Lead Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create' && 'Add New Lead'}
          {dialogType === 'edit' && 'Edit Lead'}
          {dialogType === 'view' && 'Lead Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={dialogType === 'view'}
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
                  disabled={dialogType === 'view'}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={dialogType === 'view'}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Source"
                  >
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="instagram">Instagram</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Quality</InputLabel>
                  <Select
                    value={formData.quality}
                    onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Quality"
                  >
                    <MenuItem value="cold">Cold</MenuItem>
                    <MenuItem value="warm">Warm</MenuItem>
                    <MenuItem value="hot">Hot</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product/Service"
                  value={formData.product}
                  onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirements"
                  multiline
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  disabled={dialogType === 'view'}
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
              {dialogType === 'create' ? 'Create' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {hasRole(['admin', 'supervisor']) && (
        <Fab
          color="primary"
          aria-label="add lead"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleDialogOpen('create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Leads;