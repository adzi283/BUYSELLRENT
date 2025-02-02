import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { toast } from 'react-hot-toast';

const OrdersHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [processingOtp, setProcessingOtp] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get(activeTab === 0 ? '/orders/my-orders' : '/orders/to-deliver');
      
      if (response.data.status === 'success') {
        setOrders(response.data.data.orders);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const validateOtp = (otp) => {
    return /^\d{6}$/.test(otp);
  };

  const handleOtpSubmit = async () => {
    if (!selectedOrder) return;

    // Validate OTP format
    if (!validateOtp(selectedOrder.otp)) {
      setError('OTP must be exactly 6 digits');
      return;
    }
    
    try {
      setProcessingOtp(true);
      setError('');
      
      const response = await API.post(`/orders/${selectedOrder._id}/verify-otp`, { 
        otp: selectedOrder.otp 
      });
      
      if (response.data.status === 'success') {
        toast.success('Order completed successfully');
        setOtpDialogOpen(false);
        setSelectedOrder(null);
        // Fetch orders again to get updated statuses of all orders
        // This will show any auto-cancelled orders
        fetchOrders();
      } else {
        throw new Error(response.data.message || 'Failed to verify OTP');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP';
      setError(errorMessage);
      if (errorMessage.includes('attempts remaining') || 
          errorMessage.includes('expired') || 
          errorMessage.includes('Invalid OTP')) {
        toast.error(errorMessage);
      }
    } finally {
      setProcessingOtp(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await API.post(`/orders/${orderId}/cancel`);
      
      if (response.data.status === 'success') {
        toast.success('Order cancelled successfully');
        fetchOrders();
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel order';
      toast.error(errorMessage);
    }
  };

  const handleRegenerateOtp = async (orderId) => {
    try {
      const response = await API.post(`/orders/${orderId}/regenerate-otp`);
      
      if (response.data.status === 'success') {
        toast.success('New OTP generated successfully');
        fetchOrders();
      } else {
        throw new Error(response.data.message || 'Failed to regenerate OTP');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to regenerate OTP';
      toast.error(errorMessage);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
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
      <Typography variant="h4" gutterBottom>
        Orders History
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="My Orders" />
        <Tab label="Orders to Deliver" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No orders found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>{activeTab === 0 ? 'Seller' : 'Buyer'}</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.transactionId}</TableCell>
                  <TableCell>
                    {order.item && (
                      <>
                        <Typography variant="body2">{order.item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quantity: {order.quantity || 1}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {(activeTab === 0 ? order.seller : order.buyer) && (
                      <>
                        <Typography variant="body2">
                          {activeTab === 0 
                            ? `${order.seller.firstName} ${order.seller.lastName}`
                            : `${order.buyer.firstName} ${order.buyer.lastName}`
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activeTab === 0 ? order.seller.email : order.buyer.email}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>₹{order.totalAmount}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      color={getStatusChipColor(order.status)}
                    />
                    {order.status === 'cancelled' && order.item.status === 'sold' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Item was purchased by another user
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.status === 'pending' && (
                      <Box>
                        {activeTab === 0 ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleCancelOrder(order._id)}
                            >
                              Cancel Order
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                              setSelectedOrder({ ...order, otp: '' });
                              setOtpDialogOpen(true);
                            }}
                          >
                            Complete Delivery
                          </Button>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={otpDialogOpen} 
        onClose={() => !processingOtp && setOtpDialogOpen(false)}
      >
        <DialogTitle>Enter OTP to Complete Delivery</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the 6-digit OTP provided by the buyer to complete the delivery.
            The OTP will be verified to ensure secure delivery completion.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="OTP"
            type="text"
            fullWidth
            value={selectedOrder?.otp || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setSelectedOrder(prev => ({ ...prev, otp: value }));
              // Clear error when user starts typing again
              if (error) setError('');
            }}
            error={Boolean(error)}
            helperText="Enter exactly 6 digits"
            inputProps={{ 
              maxLength: 6,
              pattern: '[0-9]*',
              inputMode: 'numeric'
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOtpDialogOpen(false);
            setSelectedOrder(null);
            setError('');
          }} disabled={processingOtp}>
            Cancel
          </Button>
          <Button 
            onClick={handleOtpSubmit} 
            variant="contained" 
            disabled={processingOtp || !selectedOrder?.otp || !validateOtp(selectedOrder.otp)}
          >
            {processingOtp ? <CircularProgress size={24} /> : 'Verify OTP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersHistory; 