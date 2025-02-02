import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { LocalShipping, CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DeliverItems = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ pending: 0, delivered: 0, totalEarnings: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [processingOtp, setProcessingOtp] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/orders/to-deliver');
      const filteredOrders = response.data.data.orders.filter(order => 
        statusFilter === 'all' || order.status === statusFilter
      );
      setOrders(filteredOrders);
      setStats(response.data.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const validateOtp = (otp) => {
    return /^\d{6}$/.test(otp);
  };

  const handleVerifyOtp = async () => {
    if (!selectedOrder) return;
    
    // Validate OTP format before sending to server
    if (!validateOtp(otp)) {
      setError('OTP must be exactly 6 digits');
      return;
    }
    
    try {
      setProcessingOtp(true);
      setError('');
      
      const response = await API.post(`/orders/${selectedOrder._id}/verify-otp`, { otp });
      
      if (response.data.status === 'success') {
        toast.success('Delivery completed successfully');
        setOtpDialogOpen(false);
        setOtp('');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        // This shouldn't happen with the current API, but handle it just in case
        throw new Error(response.data.message || 'Failed to verify OTP');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP';
      setError(errorMessage);
      // Don't close dialog on error to allow retry
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

  const getStatusColor = (status) => {
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
        Delivery Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Deliveries
              </Typography>
              <Typography variant="h4" component="div">
                {stats.pending}
              </Typography>
              <LocalShipping color="warning" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Deliveries
              </Typography>
              <Typography variant="h4" component="div">
                {stats.delivered}
              </Typography>
              <CheckCircle color="success" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h4" component="div">
                ₹{stats.totalEarnings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No orders found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Buyer</TableCell>
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
                          Quantity: {order.quantity}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.buyer && (
                      <>
                        <Typography variant="body2">
                          {order.buyer.firstName} {order.buyer.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.buyer.email}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>₹{order.totalAmount}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.status === 'pending' && (
                      <Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOtpDialogOpen(true);
                          }}
                          sx={{ mr: 1, mb: { xs: 1, md: 0 } }}
                        >
                          Complete Delivery
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={otpDialogOpen} onClose={() => !processingOtp && setOtpDialogOpen(false)}>
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
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setOtp(value);
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
            setOtp('');
            setError('');
            setSelectedOrder(null);
          }} disabled={processingOtp}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyOtp} 
            variant="contained" 
            disabled={processingOtp || !validateOtp(otp)}
          >
            {processingOtp ? <CircularProgress size={24} /> : 'Verify OTP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliverItems; 