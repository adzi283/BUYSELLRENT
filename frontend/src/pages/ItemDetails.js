import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  CardMedia,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ShoppingCart, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: ''
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await API.get(`/items/${id}`);
        setItem(response.data.data.item);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  useEffect(() => {
    if (item?.seller?._id) {
      fetchReviews();
    }
  }, [item]);

  const fetchReviews = async () => {
    try {
      const response = await API.get(`/reviews/seller/${item.seller._id}`);
      setReviews(response.data.data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleAddToCart = async () => {
    try {
      await API.post('/cart', { itemId: id });
      navigate('/cart');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/items/${id}`);
      toast.success('Item deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleReviewSubmit = async () => {
    try {
      await API.post('/reviews', {
        sellerId: item.seller._id,
        ...reviewData
      });
      setReviewDialogOpen(false);
      setReviewData({ rating: 0, comment: '' });
      fetchReviews();
      toast.success('Review submitted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
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

  if (!item) {
    return <Alert severity="info">Item not found</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '56.25%', // 16:9 Aspect Ratio
              width: '100%',
              bgcolor: 'grey.100',
              mb: 2,
              borderRadius: 1
            }}>
              {item.image ? (
                <CardMedia
                  component="img"
                  image={`data:${item.image.contentType};base64,${item.image.data}`}
                  alt={item.name}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    p: 2
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
            <Typography variant="h4" gutterBottom>
              {item.name}
            </Typography>
            <Chip 
              label={item.category} 
              color="primary" 
              sx={{ mb: 2 }}
            />
            <Typography variant="h5" color="primary" gutterBottom>
              ₹{item.price}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {item.description}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Seller Information
            </Typography>
            <Typography>
              {item.seller.firstName} {item.seller.lastName}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {item.seller.email}
            </Typography>
            {user.id === item.seller._id ? (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<Delete />}
                onClick={handleDelete}
                sx={{ mt: 2 }}
              >
                Delete Listing
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                sx={{ mt: 2 }}
                disabled={item.status !== 'available'}
              >
                Add to Cart
              </Button>
            )}
            {item.status !== 'available' && (
              <Typography color="error" sx={{ mt: 1, textAlign: 'center' }}>
                This item is no longer available
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Seller Reviews
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Rating 
                value={parseFloat(calculateAverageRating())} 
                precision={0.1} 
                readOnly 
              />
              <Typography variant="body2" ml={1}>
                ({calculateAverageRating()}/5 from {reviews.length} reviews)
              </Typography>
            </Box>

            {user && user.id !== item.seller._id && (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => setReviewDialogOpen(true)}
              >
                Write a Review
              </Button>
            )}

            <Divider sx={{ mb: 2 }} />

            {reviews.map((review) => (
              <Box key={review._id} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">
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
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}

            {reviews.length === 0 && (
              <Typography color="text.secondary" align="center">
                No reviews yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography mr={2}>Rating:</Typography>
              <Rating
                value={reviewData.rating}
                onChange={(event, newValue) => {
                  setReviewData({ ...reviewData, rating: newValue });
                }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Review"
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={!reviewData.rating || !reviewData.comment}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemDetails; 