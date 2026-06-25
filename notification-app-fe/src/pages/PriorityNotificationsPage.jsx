import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Button
} from '@mui/material';
import { Star as StarIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import NotificationCard from '../components/NotificationCard';
import { fetchPriorityNotifications } from '../api/notifications';

export default function PriorityNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  const loadPriorityNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPriorityNotifications(limit);
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load priority notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriorityNotifications();
  }, [limit]);

  const handleLimitChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 100) {
      setLimit(value);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StarIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
        <Typography variant="h4" component="h1">
          Priority Notifications
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Number of notifications"
          type="number"
          value={limit}
          onChange={handleLimitChange}
          inputProps={{ min: 1, max: 100 }}
          size="small"
          sx={{ width: 200 }}
        />
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadPriorityNotifications}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Showing top {limit} notifications prioritized by: Placement → Result → Event (newest first)
      </Alert>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">
          No notifications found
        </Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          {notifications.map((notification, index) => (
            <Box key={notification.ID} sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: -40,
                  top: 20,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: index < 3 ? 'warning.main' : 'grey.400',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                {index + 1}
              </Box>
              <NotificationCard notification={notification} />
            </Box>
          ))}
        </>
      )}
    </Container>
  );
}
