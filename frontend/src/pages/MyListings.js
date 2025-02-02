import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const MyListings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchMyListings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get('/items/my-listings');
      setItems(response.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const handleDelete = async (itemId) => {
    try {
      await API.delete(`/items/${itemId}`);
      fetchMyListings(); // Refresh the list after deletion
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          My Listings
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/items/new')}
        >
          Add New Item
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {item.name}
                </Typography>
                <Typography color="text.secondary">
                  ₹{item.price}
                </Typography>
                <Typography variant="body2">
                  {item.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category: {item.category}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="error"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete Listing
                </Button>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate(`/items/${item._id}`)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {items.length === 0 && (
          <Grid item xs={12}>
            <Box textAlign="center" mt={4}>
              <Typography variant="h6" color="text.secondary">
                You haven't listed any items yet
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/items/new')}
              >
                Add Your First Item
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MyListings; 