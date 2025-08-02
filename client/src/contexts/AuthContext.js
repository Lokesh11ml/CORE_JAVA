import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          const response = await axios.get('/api/auth/profile');
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { email, password });
      
      const { token: newToken, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set user data
      setUser(userData);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success(`Welcome back, ${userData.name}!`);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear token and user data
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    toast.success('Logged out successfully');
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', userData);
      
      toast.success('User registered successfully');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/auth/profile', profileData);
      
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const { token: newToken } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  // Check if user can access resource
  const canAccess = (resourceUserId) => {
    if (!user) return false;
    
    // Admin can access everything
    if (user.role === 'admin') return true;
    
    // User can access their own resources
    if (user._id === resourceUserId) return true;
    
    // Supervisor can access team member resources
    if (user.role === 'supervisor') {
      // This would need to be implemented based on team structure
      return true; // Simplified for now
    }
    
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    refreshToken,
    hasRole,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;