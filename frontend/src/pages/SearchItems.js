import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';

const categories = ['clothing', 'grocery', 'electronics', 'books', 'furniture', 'other'];

const SearchItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/items?';
      if (searchQuery) {
        url += `search=${searchQuery}&`;
      }
      if (selectedCategory !== 'all') {
        url += `categories=${selectedCategory}`;
      }
      const response = await API.get(url);
      setItems(response.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Search Items
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Filters Section */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <TextField
              fullWidth
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" gutterBottom>
              Categories
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedCategory === 'all'}
                    onChange={() => handleCategoryChange('all')}
                  />
                }
                label="All"
              />
              {categories.map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategory === category}
                      onChange={() => handleCategoryChange(category)}
                    />
                  }
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* Items Grid */}
        <Grid item xs={12} md={9}>
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
                      color="primary"
                      onClick={() => navigate(`/items/${item._id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {items.length === 0 && !loading && (
              <Grid item xs={12}>
                <Box textAlign="center" mt={4}>
                  <Typography variant="h6" color="text.secondary">
                    No items found
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchItems;