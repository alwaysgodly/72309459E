import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Container,
  TextField,
} from "@mui/material";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../api/notificationApi";
import { sortByPriority } from "../utils/priority";
import { Log } from "../../../logging_middleware/frontendLogger";

const PriorityNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);

  const [viewedNotifications, setViewedNotifications] = useState(() => {
    const stored = localStorage.getItem("viewedNotifications");
    return stored ? JSON.parse(stored) : [];
  });

  const loadNotifications = async (lim = limit) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications({
        limit: 100,
        page: 1,
        notificationType: "All",
      });

      const sorted = sortByPriority(data || []);
      const limited = sorted.slice(0, lim);

      setNotifications(limited);

      await Log("frontend", "info", "page", "Priority notifications loaded");
    } catch (err) {
      setError(err.message || "Failed to load priority notifications");
      await Log("frontend", "error", "page", "Failed to load priority notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);

    if (!newLimit || newLimit < 1) {
      return;
    }

    setLimit(newLimit);
    loadNotifications(newLimit);
  };

  const handleMarkViewed = async (notificationId) => {
    const updated = viewedNotifications.includes(notificationId)
      ? viewedNotifications.filter((id) => id !== notificationId)
      : [...viewedNotifications, notificationId];

    setViewedNotifications(updated);
    localStorage.setItem("viewedNotifications", JSON.stringify(updated));

    await Log("frontend", "info", "page", "Notification viewed state changed");
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Priority Settings
        </Typography>

        <TextField
          type="number"
          label="Show top N notifications"
          value={limit}
          onChange={handleLimitChange}
          inputProps={{ min: 1, max: 100 }}
          sx={{
            width: "220px",
            backgroundColor: "#fff",
            mr: 2,
          }}
        />

        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Weighted by: Placement (3) &gt; Result (2) &gt; Event (1) + Recency
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && notifications.length > 0 && (
        <Box>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
              isViewed={viewedNotifications.includes(notification.ID)}
              onMarkViewed={() => handleMarkViewed(notification.ID)}
            />
          ))}
        </Box>
      )}
    </Container>
  );
};

export default PriorityNotifications;