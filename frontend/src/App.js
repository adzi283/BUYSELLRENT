import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SearchItems from './pages/SearchItems';
import ItemDetails from './pages/ItemDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import OrdersHistory from './pages/OrdersHistory';
import DeliverItems from './pages/DeliverItems';
import NewItem from './pages/NewItem';
import MyListings from './pages/MyListings';
import ChatSupport from './components/ChatSupport';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0'
    },
    action: {
      active: '#FFFFFF',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF'
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          backgroundImage: 'none'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2C2C2C',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4F46E5'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#818CF8'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#404040'
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
          }
        },
        contained: {
          background: 'linear-gradient(45deg, #4F46E5, #818CF8)',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #3730A3, #4F46E5)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.5)'
          }
        },
        outlined: {
          borderColor: '#4F46E5',
          color: '#4F46E5',
          '&:hover': {
            borderColor: '#818CF8',
            backgroundColor: 'rgba(79, 70, 229, 0.08)'
          }
        },
        text: {
          color: '#4F46E5',
          '&:hover': {
            backgroundColor: 'rgba(79, 70, 229, 0.08)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#1E1E1E',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-colorPrimary': {
            background: 'linear-gradient(45deg, #4F46E5, #818CF8)',
          },
          '&.MuiChip-colorSecondary': {
            background: 'linear-gradient(45deg, #10B981, #34D399)',
          }
        }
      }
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="search" element={<SearchItems />} />
              <Route path="items/new" element={<NewItem />} />
              <Route path="items/:id" element={<ItemDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<OrdersHistory />} />
              <Route path="deliver" element={<DeliverItems />} />
              <Route path="my-listings" element={<MyListings />} />
            </Route>
          </Routes>
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            theme="dark"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 