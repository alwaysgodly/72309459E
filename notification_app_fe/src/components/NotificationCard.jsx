import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailIcon from '@mui/icons-material/Mail';

const getTypeColor = (type) => {
  switch (type) {
    case 'Placement':
      return '#d32f2f'; // Red
    case 'Result':
      return '#f57c00'; // Orange
    case 'Event':
      return '#1976d2'; // Blue
    default:
      return '#757575'; // Gray
  }
};

const NotificationCard = ({ notification, isViewed, onMarkViewed }) => {
  const color = getTypeColor(notification.Type);
  
  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: `4px solid ${color}`,
        backgroundColor: isViewed ? '#f5f5f5' : '#ffffff',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Chip
                label={notification.Type}
                sx={{
                  backgroundColor: color,
                  color: '#fff',
                  fontWeight: 'bold',
                }}
                size="small"
              />
              {!isViewed && (
                <Chip
                  label="New"
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={{ mb: 1, color: isViewed ? '#757575' : '#000' }}>
              {notification.Message}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(notification.Timestamp).toLocaleString()}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onMarkViewed}
            sx={{ ml: 1 }}
            title={isViewed ? 'Marked as viewed' : 'Mark as viewed'}
          >
            {isViewed ? (
              <CheckCircleIcon sx={{ color: '#4caf50' }} />
            ) : (
              <MailIcon sx={{ color: '#f57f17' }} />
            )}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
