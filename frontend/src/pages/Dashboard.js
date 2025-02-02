import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  CardMedia,
  Chip
} from '@mui/material';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await API.get('/items');
        setItems(response.data.data.items);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const isItemAvailable = (item) => item.status !== 'sold';

  const getItemAvailabilityStatus = (item) => {
    if (!item) return 'Not available';
    if (item.status === 'sold') return 'Sold';
    return 'Available';
  };

  const handleAddToCart = async (itemId) => {
    try {
      const response = await API.post('/cart', { itemId });
      if (response.data.status === 'success') {
        toast.success('Item added to cart');
        navigate('/cart');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add to cart';
      toast.error(errorMessage);
      // Don't navigate away on error, just show the toast
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/items/new')}
        >
          Add New Item
        </Button>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                position: 'relative',
                paddingTop: '75%', // 4:3 Aspect Ratio
                width: '100%',
                bgcolor: 'grey.100'
              }}>
                {item.image ? (
                  <CardMedia
                    component="img"
                    image={item.image ? `data:${item.image.contentType};base64,${item.image.data}` : ''}
                    alt={item.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 1
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography color="text.secondary">
                      No image available
                    </Typography>
                  </Box>
                )}
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                  {item.name}
                </Typography>
                <Typography color="text.secondary">
                  ₹{item.price}
                </Typography>
                <Typography variant="body2">
                  {item.description.substring(0, 100)}...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category: {item.category}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Seller: {item.seller.firstName} {item.seller.lastName}
                </Typography>
                <Chip
                  label={getItemAvailabilityStatus(item)}
                  color={isItemAvailable(item) ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/items/${item._id}`)}
                >
                  View Details
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAddToCart(item._id)}
                >
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 