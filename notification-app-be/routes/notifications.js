const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { sortByPriority, getTopPriority } = require('../utils/priorityHelper');
const { Log } = require('../../logging-middleware');

/**
 * GET /api/notifications/unread/count
 * Get count of unread notifications (must be before /:id route)
 */
router.get('/unread/count', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /api/notifications/unread/count request received');
    
    const notifications = await notificationService.fetchNotifications();
    
    const unreadCount = notificationService.getUnreadCount(notifications);

    await Log('backend', 'info', 'route', `Unread count calculated: ${unreadCount.total}`);

    res.json({
      success: true,
      data: unreadCount
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in GET /api/notifications/unread/count: ${error.message}`);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch unread count'
      }
    });
  }
});

/**
 * GET /api/notifications/priority
 * Fetch top priority notifications
 */
router.get('/priority', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /api/notifications/priority request received');
    
    const { limit = 10 } = req.query;
    
    // Fetch all notifications
    const notifications = await notificationService.fetchNotifications();
    
    // Get top priority notifications
    const topNotifications = getTopPriority(notifications, parseInt(limit));

    await Log('backend', 'info', 'route', `Returning top ${topNotifications.length} priority notifications`);

    res.json({
      success: true,
      data: topNotifications
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in GET /api/notifications/priority: ${error.message}`);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch priority notifications'
      }
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'PATCH /api/notifications/read-all request received');
    
    const notifications = await notificationService.fetchNotifications();
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    // In a real app, this would update the database
    // For this implementation, we just simulate the response
    const updatedCount = unreadNotifications.length;

    await Log('backend', 'info', 'route', `Marked ${updatedCount} notifications as read`);

    res.json({
      success: true,
      data: {
        updatedCount: updatedCount,
        message: 'All notifications marked as read'
      }
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in PATCH /api/notifications/read-all: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to mark notifications as read'
      }
    });
  }
});

/**
 * GET /api/notifications
 * Fetch paginated notifications with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /api/notifications request received');
    
    const { page = 1, limit = 10, notification_type } = req.query;
    
    // Validate query parameters
    if (notification_type && !['Placement', 'Result', 'Event'].includes(notification_type)) {
      await Log('backend', 'warn', 'route', `Invalid notification_type: ${notification_type}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid notification_type. Allowed: Placement, Result, Event'
        }
      });
    }

    // Fetch notifications from AffordMed API
    let notifications = await notificationService.fetchNotifications({
      notification_type
    });

    // Sort by timestamp (newest first)
    notifications = notifications.sort((a, b) => 
      new Date(b.Timestamp) - new Date(a.Timestamp)
    );

    // Filter by type if specified
    if (notification_type) {
      notifications = notificationService.filterByType(notifications, notification_type);
    }

    // Paginate results
    const result = notificationService.paginate(
      notifications,
      parseInt(page),
      parseInt(limit)
    );

    await Log('backend', 'info', 'route', `Returning ${result.notifications.length} notifications for page ${page}`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in GET /api/notifications: ${error.message}`);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch notifications at this time'
      }
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'POST /api/notifications request received');
    
    const { type, message, priority } = req.body;
    
    // Validate required fields
    if (!type || !message) {
      await Log('backend', 'warn', 'route', 'Missing required fields in POST request');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: type, message'
        }
      });
    }

    // Validate type
    if (!['Placement', 'Result', 'Event'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid type. Allowed: Placement, Result, Event'
        }
      });
    }

    // Create notification object (simulated - no real DB)
    const newNotification = {
      ID: `notif_${Date.now()}`,
      Type: type,
      Message: message,
      Timestamp: new Date().toISOString(),
      priority: priority || false,
      isRead: false
    };

    await Log('backend', 'info', 'route', `Notification created with ID: ${newNotification.ID}`);

    res.status(201).json({
      success: true,
      data: newNotification
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in POST /api/notifications: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to create notification'
      }
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get a single notification by ID
 */
router.get('/:id', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', `GET /api/notifications/${req.params.id} request received`);
    
    const notifications = await notificationService.fetchNotifications();
    const notification = notifications.find(n => n.ID === req.params.id);

    if (!notification) {
      await Log('backend', 'warn', 'route', `Notification not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    await Log('backend', 'info', 'route', `Notification found: ${req.params.id}`);

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in GET /api/notifications/:id: ${error.message}`);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch notification'
      }
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', `PATCH /api/notifications/${req.params.id}/read request received`);
    
    const notifications = await notificationService.fetchNotifications();
    const notification = notifications.find(n => n.ID === req.params.id);

    if (!notification) {
      await Log('backend', 'warn', 'route', `Notification not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    // Simulate marking as read
    const updatedNotification = {
      id: notification.ID,
      isRead: true,
      readAt: new Date().toISOString()
    };

    await Log('backend', 'info', 'route', `Notification marked as read: ${req.params.id}`);

    res.json({
      success: true,
      data: updatedNotification
    });

  } catch (error) {
    await Log('backend', 'error', 'route', `Error in PATCH /api/notifications/:id/read: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to mark notification as read'
      }
    });
  }
});

module.exports = router;
