import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications } from '../api/notifications';

export function useNotifications(initialParams = {}) {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    ...initialParams
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchNotifications(params);
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const changePage = (newPage) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const changeFilter = (filterType) => {
    setParams(prev => ({
      ...prev,
      page: 1,
      notification_type: filterType
    }));
  };

  const refresh = () => {
    loadNotifications();
  };

  return {
    notifications,
    pagination,
    loading,
    error,
    changePage,
    changeFilter,
    refresh,
    currentFilter: params.notification_type
  };
}
