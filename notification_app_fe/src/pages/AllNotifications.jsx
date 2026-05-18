import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Container,
} from '@mui/material';

import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import { fetchNotifications } from '../api/notificationApi';
import { Log } from '../../../logging_middleware/frontendLogger';

const AllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [notificationType, setNotificationType] = useState('All');
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewedNotifications, setViewedNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('viewedNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const loadNotifications = useCallback(
    async (page = 1, type = notificationType, lim = limit) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchNotifications({
          limit: lim,
          page: page,
          notificationType: type !== 'All' ? type : null,
        });

        /*
          Expected possible backend responses:

          Case 1:
          {
            notifications: [...],
            totalPages: 5
          }

          Case 2:
          {
            data: [...],
            totalPages: 5
          }

          Case 3:
          [...]
        */

        const notificationList = Array.isArray(data)
          ? data
          : data.notifications || data.data || [];

        setNotifications(notificationList);

        if (data.totalPages) {
          setTotalPages(data.totalPages);
        } else if (data.total_pages) {
          setTotalPages(data.total_pages);
        } else if (data.total && lim) {
          setTotalPages(Math.ceil(data.total / lim));
        } else {
          setTotalPages(1);
        }

        setCurrentPage(page);

        Log(
          'frontend',
          'info',
          'page',
          'Notifications loaded successfully'
        );
      } catch (err) {
        const errorMessage =
          err?.message || 'Failed to load notifications';

        setError(errorMessage);

        Log(
          'frontend',
          'error',
          'page',
          'Failed to load notifications',
          { error: errorMessage }
        );
      } finally {
        setLoading(false);
      }
    },
    [notificationType, limit]
  );

  useEffect(() => {
    loadNotifications(1, notificationType, limit);
  }, []);

  const handleApplyFilters = () => {
    loadNotifications(1, notificationType, limit);
  };

  const handlePageChange = (event, value) => {
    loadNotifications(value, notificationType, limit);
  };

  const handleMarkViewed = (notificationId) => {
    const updated = viewedNotifications.includes(notificationId)
      ? viewedNotifications.filter((id) => id !== notificationId)
      : [...viewedNotifications, notificationId];

    setViewedNotifications(updated);
    localStorage.setItem('viewedNotifications', JSON.stringify(updated));

    Log(
      'frontend',
      'info',
      'page',
      'Notification marked',
      { notificationId }
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <NotificationFilters
        notificationType={notificationType}
        setNotificationType={setNotificationType}
        limit={limit}
        setLimit={setLimit}
        onApplyFilters={handleApplyFilters}
        isLoading={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {!loading && notifications.length === 0 && !error && (
        <Alert severity="info">
          No notifications found.
        </Alert>
      )}

      {!loading && notifications.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.ID || notification.id}
                notification={notification}
                isViewed={viewedNotifications.includes(
                  notification.ID || notification.id
                )}
                onMarkViewed={() =>
                  handleMarkViewed(notification.ID || notification.id)
                }
              />
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 3,
            }}
          >
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              disabled={loading}
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default AllNotifications;