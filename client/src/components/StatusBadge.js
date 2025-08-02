import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status, type = 'default', size = 'small' }) => {
  const getStatusColor = () => {
    switch (type) {
      case 'lead':
        switch (status) {
          case 'new': return 'primary';
          case 'contacted': return 'info';
          case 'qualified': return 'success';
          case 'converted': return 'success';
          case 'lost': return 'error';
          case 'follow-up': return 'warning';
          default: return 'default';
        }
      case 'call':
        switch (status) {
          case 'completed': return 'success';
          case 'in-progress': return 'warning';
          case 'scheduled': return 'info';
          case 'missed': return 'error';
          default: return 'default';
        }
      case 'report':
        switch (status) {
          case 'completed': return 'success';
          case 'pending': return 'warning';
          case 'draft': return 'info';
          default: return 'default';
        }
      case 'user':
        return status ? 'success' : 'error';
      default:
        switch (status) {
          case 'active': return 'success';
          case 'inactive': return 'error';
          case 'pending': return 'warning';
          case 'completed': return 'success';
          case 'failed': return 'error';
          default: return 'default';
        }
    }
  };

  const getStatusLabel = () => {
    if (type === 'user') {
      return status ? 'Active' : 'Inactive';
    }
    return status;
  };

  return (
    <Chip
      label={getStatusLabel()}
      color={getStatusColor()}
      size={size}
      variant="outlined"
    />
  );
};

export default StatusBadge;