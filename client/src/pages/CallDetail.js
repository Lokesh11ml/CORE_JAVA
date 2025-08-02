import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Phone as PhoneIcon, Email as EmailIcon, Business as BusinessIcon, Person as PersonIcon, Schedule as ScheduleIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon, Delete as DeleteIcon, Refresh as RefreshIcon, PlayArrow as PlayIcon, Pause as PauseIcon, Stop as StopIcon, Timer as TimerIcon, Call as CallIcon, CallEnd as CallEndIcon, VolumeUp as VolumeUpIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const CallDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { socket, startCall, endCall } = useSocket();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [recordingDialog, setRecordingDialog] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '', phoneNumber: '', callType: '', notes: '', outcome: '', followUpDate: '', scheduledTime: ''
  });

  useEffect(() => {
    fetchCall();
  }, [id]);

  const fetchCall = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/calls/${id}`);
      setCall(response.data);
      setFormData({
        leadId: response.data.leadId || '',
        phoneNumber: response.data.phoneNumber || '',
        callType: response.data.callType || '',
        notes: response.data.notes || '',
        outcome: response.data.outcome || '',
        followUpDate: response.data.followUpDate ? new Date(response.data.followUpDate).toISOString().split('T')[0] : '',
        scheduledTime: response.data.scheduledTime ? new Date(response.data.scheduledTime).toISOString().split('T')[0] : ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch call');
      toast.error('Failed to fetch call');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/calls/${id}`, formData);
      setCall(response.data);
      setEditMode(false);
      toast.success('Call updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update call');
    }
  };

  const handleDeleteCall = async () => {
    if (window.confirm('Are you sure you want to delete this call?')) {
      try {
        await axios.delete(`/api/calls/${id}`);
        toast.success('Call deleted successfully');
        navigate('/calls');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete call');
      }
    }
  };

  const handleStartCall = async () => {
    try {
      await startCall(call.leadId, call.phoneNumber);
      toast.success('Call initiated');
    } catch (err) {
      toast.error('Failed to start call');
    }
  };

  const handleEndCall = async () => {
    try {
      await endCall(call._id, call.duration);
      toast.success('Call ended');
    } catch (err) {
      toast.error('Failed to end call');
    }
  };

  const handleDownloadRecording = async () => {
    try {
      const response = await axios.get(`/api/calls/${id}/recording`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `call-${id}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Recording downloaded');
    } catch (err) {
      toast.error('Failed to download recording');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      case 'missed': return 'error';
      default: return 'default';
    }
  };

  const getCallTypeColor = (type) => {
    switch (type) {
      case 'outbound': return 'primary';
      case 'inbound': return 'secondary';
      case 'follow-up': return 'success';
      default: return 'default';
    }
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'contacted': return 'success';
      case 'no-answer': return 'warning';
      case 'busy': return 'error';
      case 'wrong-number': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!call) {
    return (
      <Box p={3}>
        <Alert severity="error">Call not found</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/calls')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Call Details</Typography>
          <Chip 
            label={call.callType} 
            color={getCallTypeColor(call.callType)}
            size="small"
          />
          <Chip 
            label={call.status} 
            color={getStatusColor(call.status)}
            size="small"
          />
          {call.outcome && (
            <Chip 
              label={call.outcome} 
              color={getOutcomeColor(call.outcome)}
              size="small"
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
          {hasRole(['admin', 'supervisor', 'telecaller']) && (
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
                      leadId: call.leadId || '',
                      phoneNumber: call.phoneNumber || '',
                      callType: call.callType || '',
                      notes: call.notes || '',
                      outcome: call.outcome || '',
                      followUpDate: call.followUpDate ? new Date(call.followUpDate).toISOString().split('T')[0] : '',
                      scheduledTime: call.scheduledTime ? new Date(call.scheduledTime).toISOString().split('T')[0] : ''
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          {call.status === 'scheduled' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayIcon />}
              onClick={handleStartCall}
            >
              Start Call
            </Button>
          )}
          {call.status === 'in-progress' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={handleEndCall}
            >
              End Call
            </Button>
          )}
          {call.recordingUrl && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadRecording}
            >
              Download Recording
            </Button>
          )}
          {hasRole(['admin']) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteCall}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Call Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Call Information</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PhoneIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone Number"
                    secondary={call.phoneNumber}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Lead"
                    secondary={call.leadName || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <ScheduleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Call Date"
                    secondary={new Date(call.createdAt).toLocaleString()}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Call Details</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <CallIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Duration"
                    secondary={formatDuration(call.duration)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <TimerIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Status"
                    secondary={call.status}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Outcome"
                    secondary={call.outcome || 'N/A'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Notes" />
          <Tab label="Recording" />
        </Tabs>

        {/* Details Tab */}
        {activeTab === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editMode ? formData.phoneNumber : call.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Lead ID"
                  value={editMode ? formData.leadId : call.leadId}
                  onChange={(e) => setFormData({...formData, leadId: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Call Type</InputLabel>
                  <Select
                    value={editMode ? formData.callType : call.callType}
                    onChange={(e) => setFormData({...formData, callType: e.target.value})}
                    label="Call Type"
                  >
                    <MenuItem value="outbound">Outbound</MenuItem>
                    <MenuItem value="inbound">Inbound</MenuItem>
                    <MenuItem value="follow-up">Follow-up</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Outcome</InputLabel>
                  <Select
                    value={editMode ? formData.outcome : call.outcome}
                    onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                    label="Outcome"
                  >
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="no-answer">No Answer</MenuItem>
                    <MenuItem value="busy">Busy</MenuItem>
                    <MenuItem value="wrong-number">Wrong Number</MenuItem>
                    <MenuItem value="voicemail">Voicemail</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Scheduled Time"
                  type="datetime-local"
                  value={editMode ? formData.scheduledTime : (call.scheduledTime ? new Date(call.scheduledTime).toISOString().slice(0, 16) : '')}
                  onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Follow-up Date"
                  type="date"
                  value={editMode ? formData.followUpDate : (call.followUpDate ? new Date(call.followUpDate).toISOString().split('T')[0] : '')}
                  onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                  disabled={!editMode}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  type="number"
                  value={call.duration || 0}
                  disabled
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Recording URL"
                  value={call.recordingUrl || 'N/A'}
                  disabled
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Notes Tab */}
        {activeTab === 1 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Call Notes</Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={editMode ? formData.notes : call.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              disabled={!editMode}
              placeholder="Enter call notes..."
              variant="outlined"
            />
          </Box>
        )}

        {/* Recording Tab */}
        {activeTab === 2 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Call Recording</Typography>
            {call.recordingUrl ? (
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Recording available for this call
                </Typography>
                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<VolumeUpIcon />}
                    onClick={() => window.open(call.recordingUrl, '_blank')}
                  >
                    Play Recording
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadRecording}
                  >
                    Download Recording
                  </Button>
                </Box>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Recording URL: {call.recordingUrl}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recording available for this call
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CallDetail;