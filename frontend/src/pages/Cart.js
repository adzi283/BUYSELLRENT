import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import { Delete, ShoppingCart } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/cart');
      setItems(response.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemoveFromCart = async (itemId) => {
    try {
      await API.delete(`/cart/${itemId}`);
      fetchCartItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item from cart');
    }
  };

  const isItemAvailable = (item) => item.status === 'available';

  const handlePlaceOrder = async () => {
    try {
      setProcessingOrder(true);
      setError(''); // Reset error state at the start
      
      // Check for self-buying
      const selfBoughtItems = items.filter(item => item.seller._id === user._id);
      if (selfBoughtItems.length > 0) {
        setError('You cannot buy your own items. Please remove them from cart.');
        return;
      }

      // First verify item availability
      const itemVerifications = await Promise.all(
        items.map(async (item) => {
          const itemResponse = await API.get(`/items/${item._id}`);
          return itemResponse.data.data.item;
        })
      );

      // Check if any items are not available
      const unavailableItems = itemVerifications.filter(item => !isItemAvailable(item));
      if (unavailableItems.length > 0) {
        setError('Some items are no longer available. Please refresh your cart.');
        return;
      }

      // Create orders for each item
      const orderPromises = items.map(item =>
        API.post('/orders', { itemId: item._id })
      );

      const results = await Promise.all(orderPromises);
      
      // Check each response individually
      const failedOrders = results.filter(result => result.data.status !== 'success');
      if (failedOrders.length > 0) {
        const errorMessages = failedOrders.map(result => result.data.message).join(', ');
        throw new Error(errorMessages || 'Failed to place one or more orders');
      }

      // All orders were successful
      setOrderDetails(results.map(result => ({
        item: result.data.data.order.item,
        transactionId: result.data.data.order.transactionId,
        otp: result.data.data.order.otp
      })));
      
      setOrderSuccess(true);
      setConfirmDialogOpen(false);
      setError(''); // Ensure error is cleared
      
      // Clear cart after successful orders
      await API.delete('/cart');
      toast.success('Orders placed successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingOrder(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const getItemAvailabilityStatus = (item) => {
    if (!item) return 'Not available';
    if (item.status === 'available') return 'Available';
    if (item.status === 'sold') return 'Sold';
    return 'Not available';
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
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {items.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/search')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <List>
                {items.map((item, index) => (
                  <React.Fragment key={item._id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <Box sx={{ mr: 2 }}>
                        {item.image ? (
                          <img
                            src={`data:${item.image.contentType};base64,${item.image.data}`}
                            alt={item.name}
                            style={{ width: 80, height: 80, objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            No Image
                          </Box>
                        )}
                      </Box>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              ₹{item.price}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Seller: {item.seller.firstName} {item.seller.lastName}
                            </Typography>
                            <br />
                            <Chip
                              size="small"
                              label={getItemAvailabilityStatus(item)}
                              color={isItemAvailable(item) ? 'success' : 'error'}
                              sx={{ mt: 1 }}
                            />
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFromCart(item._id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Total Items:</Typography>
                <Typography>{items.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6">₹{calculateTotal()}</Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setConfirmDialogOpen(true)}
                disabled={processingOrder || items.length === 0}
              >
                Place Order
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => !processingOrder && setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to place orders for {items.length} item(s)?
            Total amount: ₹{calculateTotal()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={processingOrder}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlaceOrder}
            variant="contained"
            disabled={processingOrder}
          >
            {processingOrder ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={orderSuccess}
        onClose={() => {
          setOrderSuccess(false);
          navigate('/orders');
        }}
      >
        <DialogTitle>Orders Placed Successfully!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your orders have been placed successfully. Please save these OTPs - you'll need to share them with the sellers when receiving your items:
          </DialogContentText>
          <List>
            {orderDetails?.map((order, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Item: ${order.item.name}`}
                  secondary={
                    <>
                      <Typography variant="body2">
                        Transaction ID: {order.transactionId}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                        OTP: {order.otp}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Share this OTP with the seller when receiving the item
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOrderSuccess(false);
              navigate('/orders');
            }} 
            variant="contained"
          >
            View Orders
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart; 