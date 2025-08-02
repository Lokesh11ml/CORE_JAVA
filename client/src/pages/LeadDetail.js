import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper,
  Tabs,
  Tab,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Call as CallIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Notes as NotesIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { socket, startCall } = useSocket();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [callDialog, setCallDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    priority: '',
    quality: '',
    status: '',
    product: '',
    requirements: '',
    notes: ''
  });
  const [callData, setCallData] = useState({
    notes: '',
    outcome: 'contacted',
    followUpDate: ''
  });

  // Fetch lead data
  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/leads/${id}`);
      setLead(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        source: response.data.source || '',
        priority: response.data.priority || '',
        quality: response.data.quality || '',
        status: response.data.status || '',
        product: response.data.product || '',
        requirements: response.data.requirements || '',
        notes: response.data.notes || ''
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching lead:', err);
      setError('Failed to load lead details');
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`/api/leads/${id}`, formData);
      toast.success('Lead updated successfully');
      setEditMode(false);
      fetchLead();
    } catch (err) {
      console.error('Error updating lead:', err);
      toast.error('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  // Handle call initiation
  const handleStartCall = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/calls/initiate`, {
        leadId: id,
        phoneNumber: lead.phone,
        telecallerId: user._id,
        notes: callData.notes
      });
      
      // Emit socket event
      if (socket) {
        socket.emit('start-call', { 
          leadId: id, 
          phoneNumber: lead.phone, 
          telecallerId: user._id 
        });
      }
      
      toast.success('Call initiated successfully');
      setCallDialog(false);
      setCallData({ notes: '', outcome: 'contacted', followUpDate: '' });
      fetchLead();
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Failed to start call');
    } finally {
      setLoading(false);
    }
  };

  // Handle lead deletion
  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await axios.delete(`/api/leads/${id}`);
      toast.success('Lead deleted successfully');
      navigate('/leads');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box p={3}>
        <Alert severity="error">Lead not found</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/leads')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {lead.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Lead Details
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PhoneIcon />}
            onClick={() => setCallDialog(true)}
          >
            Call Now
          </Button>
          {hasRole(['admin', 'supervisor']) && (
            <>
              <Button
                variant="outlined"
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                onClick={editMode ? handleSubmit : () => setEditMode(true)}
                disabled={loading}
              >
                {editMode ? 'Save' : 'Edit'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteLead}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Lead Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Name"
                    secondary={lead.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={lead.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <PhoneIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={lead.phone}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Source"
                    secondary={lead.source}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={lead.status}
                  color={getStatusColor(lead.status)}
                  size="small"
                />
                <Chip
                  label={lead.priority}
                  color={getPriorityColor(lead.priority)}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {lead.assignedTo && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Assigned to:
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {lead.assignedTo.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {lead.assignedTo.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Details" />
                  <Tab label="History" />
                  <Tab label="Calls" />
                  <Tab label="Notes" />
                </Tabs>
              </Box>

              {/* Details Tab */}
              {activeTab === 0 && (
                <Box>
                  {editMode ? (
                    <Box component="form" onSubmit={handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Source</InputLabel>
                            <Select
                              value={formData.source}
                              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
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
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={formData.status}
                              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                              label="Status"
                            >
                              <MenuItem value="new">New</MenuItem>
                              <MenuItem value="contacted">Contacted</MenuItem>
                              <MenuItem value="qualified">Qualified</MenuItem>
                              <MenuItem value="interested">Interested</MenuItem>
                              <MenuItem value="converted">Converted</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                              value={formData.priority}
                              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                              label="Priority"
                            >
                              <MenuItem value="low">Low</MenuItem>
                              <MenuItem value="medium">Medium</MenuItem>
                              <MenuItem value="high">High</MenuItem>
                              <MenuItem value="urgent">Urgent</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Product/Service"
                            value={formData.product}
                            onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
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
                          />
                        </Grid>
                      </Grid>
                      <Box display="flex" gap={2} mt={3}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<SaveIcon />}
                          disabled={loading}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: lead.name || '',
                              email: lead.email || '',
                              phone: lead.phone || '',
                              source: lead.source || '',
                              priority: lead.priority || '',
                              quality: lead.quality || '',
                              status: lead.status || '',
                              product: lead.product || '',
                              requirements: lead.requirements || '',
                              notes: lead.notes || ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Product/Service
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {lead.product || 'Not specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Quality
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {lead.quality || 'Not specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Requirements
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {lead.requirements || 'Not specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Notes
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {lead.notes || 'No notes'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Created
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {new Date(lead.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {/* History Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Lead History
                  </Typography>
                  <Timeline>
                    <TimelineItem>
                      <TimelineOppositeContent>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(lead.createdAt).toLocaleString()}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary" />
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6" component="span">
                          Lead Created
                        </Typography>
                        <Typography>Lead was created from {lead.source}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                    
                    {lead.history?.map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color="secondary" />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="h6" component="span">
                            {event.type}
                          </Typography>
                          <Typography>{event.description}</Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Box>
              )}

              {/* Calls Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Call History
                  </Typography>
                  {lead.calls && lead.calls.length > 0 ? (
                    <List>
                      {lead.calls.map((call, index) => (
                        <ListItem key={call._id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: call.outcome === 'successful' ? 'success.main' : 'warning.main' }}>
                              <CallIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`Call to ${call.phoneNumber}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(call.startTime).toLocaleString()} • Duration: {call.duration || 0}s
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Outcome: {call.outcome} • Notes: {call.notes || 'No notes'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No calls recorded yet
                    </Typography>
                  )}
                </Box>
              )}

              {/* Notes Tab */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notes & Comments
                  </Typography>
                  {lead.notes && lead.notes.length > 0 ? (
                    <List>
                      {lead.notes.map((note, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.main' }}>
                              <NotesIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={note.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(note.timestamp).toLocaleString()}
                                </Typography>
                                <Typography variant="body1">
                                  {note.content}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No notes available
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Call Dialog */}
      <Dialog
        open={callDialog}
        onClose={() => setCallDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Initiate Call</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Calling: {lead.phone}
            </Typography>
            <TextField
              fullWidth
              label="Call Notes"
              multiline
              rows={3}
              value={callData.notes}
              onChange={(e) => setCallData(prev => ({ ...prev, notes: e.target.value }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Expected Outcome</InputLabel>
              <Select
                value={callData.outcome}
                onChange={(e) => setCallData(prev => ({ ...prev, outcome: e.target.value }))}
                label="Expected Outcome"
              >
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="interested">Interested</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
                <MenuItem value="not_interested">Not Interested</MenuItem>
                <MenuItem value="no_answer">No Answer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Follow-up Date"
              type="datetime-local"
              value={callData.followUpDate}
              onChange={(e) => setCallData(prev => ({ ...prev, followUpDate: e.target.value }))}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStartCall}
            disabled={loading}
            startIcon={<CallIcon />}
          >
            Start Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default LeadDetail;