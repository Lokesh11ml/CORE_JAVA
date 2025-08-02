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
  LinearProgress,
  AlertTitle,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Campaign as CampaignIcon,
  Webhook as WebhookIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Sync as SyncIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MetaIntegration = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [configDialog, setConfigDialog] = useState(false);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [metaConfig, setMetaConfig] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    webhookVerifyToken: '',
    webhookSecret: '',
    isEnabled: false
  });
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Fetch Meta integration data
  const fetchMetaData = async () => {
    try {
      setLoading(true);
      
      // Fetch configuration
      const configResponse = await axios.get('/api/meta/config');
      setMetaConfig(configResponse.data);
      
      // Fetch campaigns
      const campaignsResponse = await axios.get('/api/meta/campaigns');
      setCampaigns(campaignsResponse.data);
      
      // Fetch leads
      const leadsResponse = await axios.get('/api/meta/leads');
      setLeads(leadsResponse.data);
      
      // Fetch stats
      const statsResponse = await axios.get('/api/meta/stats');
      setStats(statsResponse.data);
      
      // Generate webhook URL
      setWebhookUrl(`${window.location.origin}/api/meta/webhook`);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching Meta data:', err);
      setError('Failed to load Meta integration data');
      toast.error('Failed to load Meta integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle configuration save
  const handleConfigSave = async () => {
    try {
      setLoading(true);
      await axios.post('/api/meta/config', metaConfig);
      toast.success('Meta configuration saved successfully');
      setConfigDialog(false);
      fetchMetaData();
    } catch (err) {
      console.error('Error saving Meta config:', err);
      toast.error('Failed to save Meta configuration');
    } finally {
      setLoading(false);
    }
  };

  // Handle webhook test
  const handleWebhookTest = async () => {
    try {
      await axios.post('/api/meta/webhook/test');
      toast.success('Webhook test sent successfully');
    } catch (err) {
      console.error('Error testing webhook:', err);
      toast.error('Failed to test webhook');
    }
  };

  // Handle sync leads
  const handleSyncLeads = async () => {
    try {
      setLoading(true);
      await axios.post('/api/meta/sync');
      toast.success('Meta leads synced successfully');
      fetchMetaData();
    } catch (err) {
      console.error('Error syncing leads:', err);
      toast.error('Failed to sync Meta leads');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'deleted': return 'error';
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
            Meta Ads Integration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage Meta Ads integration
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchMetaData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setConfigDialog(true)}
          >
            Configure
          </Button>
        </Box>
      </Box>

      {/* Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Integration Status
                  </Typography>
                  <Typography variant="h4">
                    {metaConfig.isEnabled ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: metaConfig.isEnabled ? 'success.main' : 'error.main' }}>
                  <FacebookIcon />
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
                    Active Campaigns
                  </Typography>
                  <Typography variant="h4">
                    {campaigns.filter(c => c.status === 'active').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CampaignIcon />
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
                    Total Leads
                  </Typography>
                  <Typography variant="h4">
                    {leads.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
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
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4">
                    {stats?.conversionRate || 0}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AnalyticsIcon />
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
              <Tab label="Configuration" />
              <Tab label="Campaigns" />
              <Tab label="Leads" />
              <Tab label="Analytics" />
            </Tabs>
          </Box>

          {/* Configuration Tab */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Integration Settings
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <FacebookIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="App ID"
                            secondary={metaConfig.appId || 'Not configured'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                              <SecurityIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="App Secret"
                            secondary={metaConfig.appSecret ? '*** Configured ***' : 'Not configured'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <LinkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="Access Token"
                            secondary={metaConfig.accessToken ? '*** Configured ***' : 'Not configured'}
                          />
                        </ListItem>
                      </List>
                      <Button
                        variant="contained"
                        startIcon={<SettingsIcon />}
                        onClick={() => setConfigDialog(true)}
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Configure Integration
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Webhook Configuration
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Webhook URL
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            fullWidth
                            size="small"
                            value={webhookUrl}
                            InputProps={{ readOnly: true }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(webhookUrl)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Verify Token
                        </Typography>
                        <Typography variant="body1">
                          {metaConfig.webhookVerifyToken || 'Not set'}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<WebhookIcon />}
                        onClick={() => setWebhookDialog(true)}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        Configure Webhook
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<SyncIcon />}
                        onClick={handleWebhookTest}
                        fullWidth
                      >
                        Test Webhook
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Campaigns Tab */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Meta Campaigns
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={handleSyncLeads}
                >
                  Sync Campaigns
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {campaigns.map((campaign) => (
                  <Grid item xs={12} md={6} key={campaign.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {campaign.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {campaign.id}
                            </Typography>
                          </Box>
                          <Chip
                            label={campaign.status}
                            color={getStatusColor(campaign.status)}
                            size="small"
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Budget:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${campaign.budget || 0}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Spent:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${campaign.spent || 0}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Leads:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {campaign.leads || 0}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Conversions:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {campaign.conversions || 0}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Leads Tab */}
          {activeTab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Meta Leads
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={handleSyncLeads}
                >
                  Sync Leads
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {leads.map((lead) => (
                  <Grid item xs={12} md={6} key={lead._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {lead.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {lead.email}
                            </Typography>
                          </Box>
                          <Chip
                            label={lead.status}
                            color={getStatusColor(lead.status)}
                            size="small"
                          />
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Campaign:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {lead.metaData?.campaignName || 'Unknown'}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Ad Set:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {lead.metaData?.adSetName || 'Unknown'}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Form:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {lead.metaData?.leadGenFormName || 'Unknown'}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Created:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Analytics Tab */}
          {activeTab === 3 && (
            <Box>
              {stats ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Lead Performance
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Leads:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.totalLeads}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Converted Leads:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.convertedLeads}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Conversion Rate:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.conversionRate}%
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Total Value:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${stats.totalValue || 0}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Campaign Performance
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Active Campaigns:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.activeCampaigns}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Spent:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${stats.totalSpent || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Avg. Quality:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.avgQuality || 0}/5
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Last Sync:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'Never'}
                          </Typography>
                        </Box>
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
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog}
        onClose={() => setConfigDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Meta Ads Configuration</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="App ID"
                  value={metaConfig.appId}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, appId: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="App Secret"
                  type="password"
                  value={metaConfig.appSecret}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Access Token"
                  type="password"
                  value={metaConfig.accessToken}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook Verify Token"
                  value={metaConfig.webhookVerifyToken}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook Secret"
                  type="password"
                  value={metaConfig.webhookSecret}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={metaConfig.isEnabled}
                      onChange={(e) => setMetaConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    />
                  }
                  label="Enable Meta Integration"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfigSave}
            disabled={loading}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Webhook Configuration Dialog */}
      <Dialog
        open={webhookDialog}
        onClose={() => setWebhookDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Webhook Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Webhook URL to configure in Meta Ads:
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TextField
                fullWidth
                value={webhookUrl}
                InputProps={{ readOnly: true }}
              />
              <IconButton onClick={() => copyToClipboard(webhookUrl)}>
                <CopyIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Verify Token (set in Meta Ads):
            </Typography>
            <TextField
              fullWidth
              value={metaConfig.webhookVerifyToken}
              onChange={(e) => setMetaConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
              margin="normal"
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Instructions</AlertTitle>
              1. Copy the webhook URL above<br/>
              2. Go to Meta Ads Manager<br/>
              3. Navigate to Webhooks section<br/>
              4. Add the webhook URL and verify token<br/>
              5. Subscribe to lead events
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleConfigSave();
              setWebhookDialog(false);
            }}
          >
            Save & Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MetaIntegration;