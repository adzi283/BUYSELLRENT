import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { AccountCircle, ShoppingCart } from '@mui/icons-material';
import { useState } from 'react';
import ChatSupport from './ChatSupport';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            IIIT Buy-Sell Portal
          </Typography>
          
          <Button 
            color="inherit" 
            onClick={() => navigate('/search')}
          >
            Search Items
          </Button>

          <Button 
            color="inherit" 
            onClick={() => navigate('/my-listings')}
          >
            My Listings
          </Button>
          
          <IconButton 
            color="inherit"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart />
          </IconButton>

          <div>
            <IconButton
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => {
                handleClose();
                navigate('/profile');
              }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                navigate('/orders');
              }}>
                Orders History
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                navigate('/deliver');
              }}>
                Deliver Items
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>

      <ChatSupport />
    </Box>
  );
};

export default Layout; 