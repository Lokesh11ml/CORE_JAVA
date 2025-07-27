import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  FiberManualRecord as StatusIcon
} from '@mui/icons-material';

const StatusIndicator = ({ status, onChange, sx, size = 'small' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          color: 'success',
          icon: <StatusIcon sx={{ fontSize: 12 }} />,
          bgColor: '#4caf50'
        };
      case 'busy':
        return {
          label: 'Busy',
          color: 'warning',
          icon: <StatusIcon sx={{ fontSize: 12 }} />,
          bgColor: '#ff9800'
        };
      case 'break':
        return {
          label: 'On Break',
          color: 'info',
          icon: <StatusIcon sx={{ fontSize: 12 }} />,
          bgColor: '#2196f3'
        };
      case 'offline':
      default:
        return {
          label: 'Offline',
          color: 'default',
          icon: <StatusIcon sx={{ fontSize: 12 }} />,
          bgColor: '#9e9e9e'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  if (size === 'icon') {
    return (
      <Tooltip title={statusConfig.label}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: statusConfig.bgColor,
            display: 'inline-block',
            ...sx
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Status: ${statusConfig.label}`}>
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        color={statusConfig.color}
        size={size}
        variant="outlined"
        sx={{
          '& .MuiChip-icon': {
            color: statusConfig.bgColor
          },
          ...sx
        }}
      />
    </Tooltip>
  );
};

export default StatusIndicator;