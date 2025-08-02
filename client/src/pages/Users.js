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
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  SupervisorAccount as SupervisorIcon,
  AdminPanelSettings as AdminIcon,
  Call as CallIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Users = () => {
  const { user, hasRole } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // view, edit, create
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'telecaller',
    department: 'lead_generation',
    phone: '',
    supervisor: '',
    isActive: true
  });

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`/api/users?${params}`);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  // Handle dialog open/close
  const handleDialogOpen = (type, userData = null) => {
    setDialogType(type);
    if (userData) {
      setSelectedUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        role: userData.role || 'telecaller',
        department: userData.department || 'lead_generation',
        phone: userData.phone || '',
        supervisor: userData.supervisor?._id || '',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'telecaller',
        department: 'lead_generation',
        phone: '',
        supervisor: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogType === 'create') {
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      } else if (dialogType === 'edit') {
        await axios.put(`/api/users/${selectedUser._id}`, formData);
        toast.success('User updated successfully');
      }
      handleDialogClose();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Failed to save user');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    }
  };

  // Handle user status toggle
  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await axios.patch(`/api/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update user status');
    }
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
  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  // Get online status
  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user._id === userId);
  };

  // DataGrid columns
  const columns = [
    {
      field: 'name',
      headerName: 'User',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {params.value?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getRoleColor(params.value)}
          size="small"
          icon={
            params.value === 'admin' ? <AdminIcon /> :
            params.value === 'supervisor' ? <SupervisorIcon /> :
            <PersonIcon />
          }
        />
      )
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon fontSize="small" />
          {params.value || 'N/A'}
        </Box>
      )
    },
    {
      field: 'performance',
      headerName: 'Performance',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            Calls: {params.value?.totalCalls || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Conv: {params.value?.convertedLeads || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={params.value ? 'Active' : 'Inactive'}
            color={getStatusColor(params.value)}
            size="small"
          />
          {isUserOnline(params.row._id) && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
          )}
        </Box>
      )
    },
    {
      field: 'lastActive',
      headerName: 'Last Active',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? new Date(params.value).toLocaleString() : 'Never'}
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
          {hasRole(['admin']) && (
            <>
              <Tooltip title="Edit User">
                <IconButton
                  size="small"
                  onClick={() => handleDialogOpen('edit', params.row)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={params.row.isActive ? 'Deactivate' : 'Activate'}>
                <IconButton
                  size="small"
                  color={params.row.isActive ? 'warning' : 'success'}
                  onClick={() => handleStatusToggle(params.row._id, params.row.isActive)}
                >
                  {params.row.isActive ? <CancelIcon /> : <CheckCircleIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete User">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteUser(params.row._id)}
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
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage team members and their roles
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          {hasRole(['admin']) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleDialogOpen('create')}
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {/* Team Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {users.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <GroupIcon />
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
                    Online Users
                  </Typography>
                  <Typography variant="h4">
                    {onlineUsers.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
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
                    Telecallers
                  </Typography>
                  <Typography variant="h4">
                    {users.filter(u => u.role === 'telecaller').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CallIcon />
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
                    Supervisors
                  </Typography>
                  <Typography variant="h4">
                    {users.filter(u => u.role === 'supervisor').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <SupervisorIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="telecaller">Telecaller</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  label="Department"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="lead_generation">Lead Generation</MenuItem>
                  <MenuItem value="follow_up">Follow Up</MenuItem>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => setFilters({
                  role: '',
                  department: '',
                  isActive: '',
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

      {/* Users DataGrid */}
      <Card>
        <DataGrid
          rows={users}
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

      {/* User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create' && 'Add New User'}
          {dialogType === 'edit' && 'Edit User'}
          {dialogType === 'view' && 'User Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
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
              {dialogType === 'create' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={dialogType === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Role"
                  >
                    <MenuItem value="telecaller">Telecaller</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    {hasRole(['admin']) && (
                      <MenuItem value="admin">Admin</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    disabled={dialogType === 'view'}
                    label="Department"
                  >
                    <MenuItem value="lead_generation">Lead Generation</MenuItem>
                    <MenuItem value="follow_up">Follow Up</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="support">Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.role === 'telecaller' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Supervisor</InputLabel>
                    <Select
                      value={formData.supervisor}
                      onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                      disabled={dialogType === 'view'}
                      label="Supervisor"
                    >
                      <MenuItem value="">No Supervisor</MenuItem>
                      {users.filter(u => u.role === 'supervisor').map(supervisor => (
                        <MenuItem key={supervisor._id} value={supervisor._id}>
                          {supervisor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {hasRole(['admin']) && (
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        disabled={dialogType === 'view'}
                      />
                    }
                    label="Active User"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            {dialogType === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogType !== 'view' && (
            <Button type="submit" variant="contained" onClick={handleSubmit}>
              {dialogType === 'create' ? 'Create User' : 'Update User'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {hasRole(['admin']) && (
        <Fab
          color="primary"
          aria-label="add user"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleDialogOpen('create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Users;