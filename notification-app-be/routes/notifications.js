const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { sortByPriority, getTopPriority } = require('../utils/priorityHelper');
const { Log } = require('../../logging-middleware');

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

router.get('/priority', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /api/notifications/priority request received');
    
    const { limit = 10 } = req.query;
    
    const notifications = await notificationService.fetchNotifications();
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

router.patch('/read-all', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'PATCH /api/notifications/read-all request received');
    
    const notifications = await notificationService.fetchNotifications();
    const unreadNotifications = notifications.filter(n => !n.isRead);
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

router.get('/', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'GET /api/notifications request received');
    
    const { page = 1, limit = 10, notification_type } = req.query;
    
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

    let notifications = await notificationService.fetchNotifications({
      notification_type
    });

    notifications = notifications.sort((a, b) => 
      new Date(b.Timestamp) - new Date(a.Timestamp)
    );

    if (notification_type) {
      notifications = notificationService.filterByType(notifications, notification_type);
    }

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

router.post('/', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'POST /api/notifications request received');
    
    const { type, message, priority } = req.body;
    
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

    if (!['Placement', 'Result', 'Event'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid type. Allowed: Placement, Result, Event'
        }
      });
    }

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
