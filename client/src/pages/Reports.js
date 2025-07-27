import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Daily task reporting functionality will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;