import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const LeadDetail = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Lead Details
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Detailed lead view will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeadDetail;