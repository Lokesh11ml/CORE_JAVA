import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Settings = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        System Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            System configuration and settings will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;