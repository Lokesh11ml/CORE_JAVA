import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ReportDetail = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Report Details
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Detailed report view will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportDetail;