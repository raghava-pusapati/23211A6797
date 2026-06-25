// Priority mapping for notification types
const PRIORITY_MAP = {
  'Placement': 1,
  'Result': 2,
  'Event': 3
};

/**
 * Get priority value for a notification type
 * @param {string} type - Notification type
 * @returns {number} Priority value (lower is higher priority)
 */
function getPriority(type) {
  return PRIORITY_MAP[type] || 999;
}

/**
 * Sort notifications by priority and timestamp
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Sorted notifications
 */
function sortByPriority(notifications) {
  return notifications.sort((a, b) => {
    const priorityA = getPriority(a.Type);
    const priorityB = getPriority(b.Type);
    
    // First compare by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by timestamp (newest first)
    return new Date(b.Timestamp) - new Date(a.Timestamp);
  });
}

/**
 * Get top N priority notifications
 * @param {Array} notifications - Array of notification objects
 * @param {number} limit - Number of notifications to return
 * @returns {Array} Top priority notifications
 */
function getTopPriority(notifications, limit = 10) {
  const sorted = sortByPriority([...notifications]);
  return sorted.slice(0, limit);
}

module.exports = {
  getPriority,
  sortByPriority,
  getTopPriority
};
