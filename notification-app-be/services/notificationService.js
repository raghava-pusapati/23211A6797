const axios = require('axios');
const config = require('../config');
const { Log } = require('../../logging-middleware');

class NotificationService {
  constructor() {
    this.baseUrl = config.affordmedApi.baseUrl;
    this.bearerToken = config.auth.bearerToken;
  }

  async fetchNotifications(params = {}) {
    try {
      await Log('backend', 'info', 'service', 'Fetching notifications from AffordMed API');
      
      const url = `${this.baseUrl}${config.affordmedApi.endpoints.notifications}`;
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${this.bearerToken}` },
        params: params,
        timeout: 10000
      });

      if (response.data && response.data.notifications) {
        await Log('backend', 'info', 'service', `Successfully fetched ${response.data.notifications.length} notifications`);
        return response.data.notifications;
      }

      await Log('backend', 'warn', 'service', 'Received empty or invalid notification data');
      return [];
    } catch (error) {
      await Log('backend', 'error', 'service', `Failed to fetch notifications: ${error.message}`);
      throw error;
    }
  }

  filterByType(notifications, type) {
    if (!type) return notifications;
    return notifications.filter(n => n.Type === type);
  }

  paginate(notifications, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedItems = notifications.slice(startIndex, endIndex);
    const totalItems = notifications.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      notifications: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  getUnreadCount(notifications) {
    const unreadNotifs = notifications.filter(n => !n.isRead);
    
    const byType = {
      Placement: 0,
      Result: 0,
      Event: 0
    };

    unreadNotifs.forEach(n => {
      if (byType.hasOwnProperty(n.Type)) {
        byType[n.Type]++;
      }
    });

    return {
      total: unreadNotifs.length,
      byType: byType
    };
  }
}

module.exports = new NotificationService();
