import React from 'react';
import {
  Box,
  Select,
  MenuItem,
  Button,
  TextField,
  Grid,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const NOTIFICATION_TYPES = ['All', 'Event', 'Result', 'Placement'];
const LIMIT_OPTIONS = [5, 10, 20, 50, 100];

const NotificationFilters = ({
  notificationType,
  setNotificationType,
  limit,
  setLimit,
  onApplyFilters,
  isLoading,
}) => {
  return (
    <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Filters
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Select
            fullWidth
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            sx={{ backgroundColor: '#fff' }}
          >
            {NOTIFICATION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Select
            fullWidth
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            label="Limit"
            sx={{ backgroundColor: '#fff' }}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                Top {opt}
              </MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={onApplyFilters}
            disabled={isLoading}
            startIcon={<SearchIcon />}
            sx={{ height: '56px' }}
          >
            {isLoading ? 'Loading...' : 'Apply Filters'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationFilters;
