import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

/**
 * Custom hook để fetch và quản lý notification counts theo từng loại
 * @param {number} refreshInterval - Thời gian refresh (ms), mặc định 30s
 * @returns {Object} { counts, loading, error, refetch }
 */
export const useNotificationCounts = (refreshInterval = 30000) => {
  const [counts, setCounts] = useState({
    total: 0,
    byType: {
      task: 0,
      calendar: 0,
      report: 0
    },
    taskByStatus: {
      'not-started': 0,
      'in-progress': 0,
      'completed': 0,
      'overdue': 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUnreadCountByType();

      if (response.success) {
        setCounts(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch notification counts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lần đầu khi mount
  useEffect(() => {
    fetchCounts();

    // Setup polling để refresh định kỳ
    const interval = setInterval(fetchCounts, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
};
