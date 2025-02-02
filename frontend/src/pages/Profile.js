import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Rating,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    age: user?.age || '',
    contactNumber: user?.contactNumber || ''
  });

  const fetchReviews = async () => {
    try {
      const response = await API.get(`/reviews/seller/${user._id}`);
      setReviews(response.data.data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: user.age || '',
        contactNumber: user.contactNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Store previous user state for rollback if needed
    const previousUser = { ...user };
    
    try {
      // Optimistically update UI
      updateUser({ ...user, ...formData });

      const response = await API.patch('/users/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        contactNumber: formData.contactNumber
      });

      if (response.data.status === 'success') {
        updateUser(response.data.data.user);
        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      // Rollback to previous state
      updateUser(previousUser);
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (!user) return null;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Profile Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5">Profile Details</Typography>
              <Button 
                variant="contained" 
                color={editMode ? "error" : "primary"}
                onClick={() => setEditMode(!editMode)}
                disabled={loading}
              >
                {editMode ? "Cancel" : "Edit Profile"}
              </Button>
            </Box>

            {editMode ? (
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </form>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {user.email}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Age:</strong> {user.age}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Contact:</strong> {user.contactNumber}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Reviews Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Seller Reviews
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Rating 
                value={parseFloat(calculateAverageRating())} 
                precision={0.1} 
                readOnly 
              />
              <Typography variant="body1" ml={1}>
                ({calculateAverageRating()}/5 from {reviews.length} reviews)
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Box key={review._id} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {review.comment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Typography>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">
                No reviews yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 