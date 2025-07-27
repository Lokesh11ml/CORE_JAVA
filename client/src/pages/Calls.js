import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Calls = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Call Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Call logging and history functionality will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Calls;