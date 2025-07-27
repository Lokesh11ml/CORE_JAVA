import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            User profile management will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;