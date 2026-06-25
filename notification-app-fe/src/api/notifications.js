import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config';

/**
 * Fetch paginated notifications with optional filters
 * @param {Object} params - Query parameters (page, limit, notification_type)
 * @returns {Promise} API response
 */
export async function fetchNotifications(params = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS}`, {
      params,
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Fetch priority notifications
 * @param {number} limit - Number of notifications to fetch
 * @returns {Promise} API response
 */
export async function fetchPriorityNotifications(limit = 10) {
  try {
    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.PRIORITY_NOTIFICATIONS}`, {
      params: { limit },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching priority notifications:', error);
    throw error;
  }
}
