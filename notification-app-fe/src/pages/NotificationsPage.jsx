import { Container, Typography, Box, Pagination, CircularProgress, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import NotificationCard from '../components/NotificationCard';
import NotificationFilter from '../components/NotificationFilter';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsPage() {
  const {
    notifications,
    pagination,
    loading,
    error,
    changePage,
    changeFilter,
    refresh,
    currentFilter
  } = useNotifications();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          All Notifications
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refresh}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <NotificationFilter
        selectedFilter={currentFilter}
        onFilterChange={changeFilter}
      />

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
          {notifications.map((notification) => (
            <NotificationCard key={notification.ID} notification={notification} />
          ))}

          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={(e, page) => changePage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {pagination && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              Showing {notifications.length} of {pagination.totalItems} notifications
            </Typography>
          )}
        </>
      )}
    </Container>
  );
}
