import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Analytics = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Analytics and performance tracking will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;