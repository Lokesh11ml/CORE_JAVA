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
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tabs,
  Tab,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  IntegrationInstructions as IntegrationIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Facebook as FacebookIcon,
  WhatsApp as WhatsAppIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    general: {
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      desktopNotifications: true,
      leadAssignmentNotifications: true,
      callReminderNotifications: true,
      reportNotifications: true
    },
    integrations: {
      twilioEnabled: false,
      metaEnabled: false,
      emailEnabled: false,
      webhookEnabled: false
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: 'medium',
      twoFactorAuth: false,
      ipWhitelist: '',
      maxLoginAttempts: 5
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      cloudBackup: false
    }
  });
  const [backupHistory, setBackupHistory] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});

  // Fetch settings data
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/settings');
      setSettings(response.data);
      
      // Fetch backup history
      const backupResponse = await axios.get('/api/settings/backups');
      setBackupHistory(backupResponse.data);
      
      // Fetch system status
      const statusResponse = await axios.get('/api/settings/status');
      setSystemStatus(statusResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle settings save
  const handleSaveSettings = async (section) => {
    try {
      setLoading(true);
      await axios.put(`/api/settings/${section}`, settings[section]);
      toast.success(`${section} settings saved successfully`);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle backup creation
  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await axios.post('/api/settings/backup');
      toast.success('Backup created successfully');
      fetchSettings();
    } catch (err) {
      console.error('Error creating backup:', err);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  // Handle backup restore
  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/settings/backup/${backupId}/restore`);
      toast.success('Backup restored successfully');
      fetchSettings();
    } catch (err) {
      console.error('Error restoring backup:', err);
      toast.error('Failed to restore backup');
    } finally {
      setLoading(false);
    }
  };

  // Handle backup download
  const handleDownloadBackup = async (backupId) => {
    try {
      const response = await axios.get(`/api/settings/backup/${backupId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${backupId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Backup downloaded successfully');
    } catch (err) {
      console.error('Error downloading backup:', err);
      toast.error('Failed to download backup');
    }
  };

  // Handle backup deletion
  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      await axios.delete(`/api/settings/backup/${backupId}`);
      toast.success('Backup deleted successfully');
      fetchSettings();
    } catch (err) {
      console.error('Error deleting backup:', err);
      toast.error('Failed to delete backup');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
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
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage system settings
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleSaveSettings('general')}
            disabled={loading}
          >
            Save All
          </Button>
        </Box>
      </Box>

      {/* System Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Database Status
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.database || 'Unknown'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: systemStatus.database === 'online' ? 'success.main' : 'error.main' }}>
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
                    API Status
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.api || 'Unknown'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: systemStatus.api === 'online' ? 'success.main' : 'error.main' }}>
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
                    Storage Usage
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.storage || '0'}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: (systemStatus.storage || 0) > 80 ? 'error.main' : 'success.main' }}>
                  <CloudUploadIcon />
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
                    Active Users
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.activeUsers || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SettingsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="General" />
              <Tab label="Notifications" />
              <Tab label="Integrations" />
              <Tab label="Security" />
              <Tab label="Backup" />
            </Tabs>
          </Box>

          {/* General Settings Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={settings.general.companyName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, companyName: e.target.value }
                    }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Email"
                    type="email"
                    value={settings.general.companyEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, companyEmail: e.target.value }
                    }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Phone"
                    value={settings.general.companyPhone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, companyPhone: e.target.value }
                    }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.general.timezone}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, timezone: e.target.value }
                      }))}
                      label="Timezone"
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">Eastern Time</MenuItem>
                      <MenuItem value="PST">Pacific Time</MenuItem>
                      <MenuItem value="GMT">GMT</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.general.dateFormat}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, dateFormat: e.target.value }
                      }))}
                      label="Date Format"
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.general.currency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: e.target.value }
                      }))}
                      label="Currency"
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="INR">INR (₹)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('general')}
                  disabled={loading}
                >
                  Save General Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* Notifications Settings Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.smsNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, smsNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="SMS Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.desktopNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, desktopNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Desktop Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.leadAssignmentNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, leadAssignmentNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Lead Assignment Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.callReminderNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, callReminderNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Call Reminder Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.reportNotifications}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, reportNotifications: e.target.checked }
                        }))}
                      />
                    }
                    label="Report Notifications"
                  />
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={loading}
                >
                  Save Notification Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* Integrations Settings Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Integration Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Twilio Integration</Typography>
                        <Switch
                          checked={settings.integrations.twilioEnabled}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integrations: { ...prev.integrations, twilioEnabled: e.target.checked }
                          }))}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Enable Twilio for calling functionality
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Meta Ads Integration</Typography>
                        <Switch
                          checked={settings.integrations.metaEnabled}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integrations: { ...prev.integrations, metaEnabled: e.target.checked }
                          }))}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Enable Meta Ads for lead generation
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Email Integration</Typography>
                        <Switch
                          checked={settings.integrations.emailEnabled}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integrations: { ...prev.integrations, emailEnabled: e.target.checked }
                          }))}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Enable email notifications and campaigns
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Webhook Integration</Typography>
                        <Switch
                          checked={settings.integrations.webhookEnabled}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integrations: { ...prev.integrations, webhookEnabled: e.target.checked }
                          }))}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Enable webhook notifications
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('integrations')}
                  disabled={loading}
                >
                  Save Integration Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* Security Settings Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Session Timeout (minutes)
                  </Typography>
                  <Slider
                    value={settings.security.sessionTimeout}
                    onChange={(e, value) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: value }
                    }))}
                    min={15}
                    max={120}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Password Policy</InputLabel>
                    <Select
                      value={settings.security.passwordPolicy}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordPolicy: e.target.value }
                      }))}
                      label="Password Policy"
                    >
                      <MenuItem value="low">Low (6 characters)</MenuItem>
                      <MenuItem value="medium">Medium (8 characters + complexity)</MenuItem>
                      <MenuItem value="high">High (10 characters + complexity)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, twoFactorAuth: e.target.checked }
                        }))}
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Login Attempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                    }))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">attempts</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="IP Whitelist (comma-separated)"
                    value={settings.security.ipWhitelist}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, ipWhitelist: e.target.value }
                    }))}
                    helperText="Leave empty to allow all IPs"
                  />
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('security')}
                  disabled={loading}
                >
                  Save Security Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* Backup Settings Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Backup & Restore
              </Typography>
              
              {/* Backup Settings */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.backup.autoBackup}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          backup: { ...prev.backup, autoBackup: e.target.checked }
                        }))}
                      />
                    }
                    label="Automatic Backup"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={settings.backup.backupFrequency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        backup: { ...prev.backup, backupFrequency: e.target.value }
                      }))}
                      label="Backup Frequency"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Backup Retention (days)"
                    type="number"
                    value={settings.backup.backupRetention}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      backup: { ...prev.backup, backupRetention: parseInt(e.target.value) }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.backup.cloudBackup}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          backup: { ...prev.backup, cloudBackup: e.target.checked }
                        }))}
                      />
                    }
                    label="Cloud Backup"
                  />
                </Grid>
              </Grid>

              {/* Manual Backup Actions */}
              <Box display="flex" gap={2} mb={3}>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  onClick={handleCreateBackup}
                  disabled={loading}
                >
                  Create Backup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('backup')}
                >
                  Export Settings
                </Button>
              </Box>

              {/* Backup History */}
              <Typography variant="h6" gutterBottom>
                Backup History
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Backup Date</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backupHistory.map((backup) => (
                      <TableRow key={backup._id}>
                        <TableCell>
                          {new Date(backup.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>
                          <Chip
                            label={backup.type}
                            size="small"
                            color={backup.type === 'manual' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={backup.status}
                            size="small"
                            color={getStatusColor(backup.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadBackup(backup._id)}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRestoreBackup(backup._id)}
                            >
                              <RestoreIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteBackup(backup._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('backup')}
                  disabled={loading}
                >
                  Save Backup Settings
                </Button>
              </Box>
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

export default Settings;