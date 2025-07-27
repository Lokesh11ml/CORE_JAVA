import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setLoginError('');
    const result = await login(data.email, data.password);
    
    if (!result.success) {
      setLoginError(result.error);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 3
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Left Side - Branding */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, color: 'white', mb: { xs: 4, md: 0 } }}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                TeleCaller CRM
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
                Streamline Your Telecalling Operations
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Manage calls and track performance
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Handle Meta ad leads in real-time
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Generate detailed reports
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h2" fontWeight="bold" color="primary">
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Sign in to access your dashboard
                    </Typography>
                  </Box>

                  {loginError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {loginError}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      margin="normal"
                      autoComplete="email"
                      autoFocus
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      margin="normal"
                      autoComplete="current-password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account? Contact your administrator
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Demo Credentials */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="body2" color="white" sx={{ mb: 1 }}>
              <strong>Demo Credentials:</strong>
            </Typography>
            <Typography variant="caption" color="white" sx={{ display: 'block' }}>
              Admin: admin@telecaller.com / admin123
            </Typography>
            <Typography variant="caption" color="white" sx={{ display: 'block' }}>
              Supervisor: supervisor@telecaller.com / supervisor123
            </Typography>
            <Typography variant="caption" color="white" sx={{ display: 'block' }}>
              Telecaller: telecaller@telecaller.com / telecaller123
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;