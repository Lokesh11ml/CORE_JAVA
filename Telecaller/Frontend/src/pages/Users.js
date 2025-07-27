import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Users = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Team Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            User and team management functionality will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Users;