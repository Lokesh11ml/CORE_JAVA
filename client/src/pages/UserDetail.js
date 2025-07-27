import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const UserDetail = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        User Details
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Detailed user view will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDetail;