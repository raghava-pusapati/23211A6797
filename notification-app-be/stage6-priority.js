/**
 * Stage 6: Priority Notification Fetcher
 * 
 * This script fetches notifications from AffordMed API and displays
 * the top N priority notifications based on type weighting:
 * - Placement (highest priority)
 * - Result (medium priority)
 * - Event (lowest priority)
 * 
 * Within each type, notifications are sorted by recency (newest first)
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://4.224.186.213';
const NOTIFICATIONS_ENDPOINT = '/evaluation-service/notifications';
const BEARER_TOKEN = process.env.BEARER_TOKEN || '';

// Priority weights
const PRIORITY_WEIGHTS = {
  'Placement': 1,
  'Result': 2,
  'Event': 3
};

/**
 * Fetch notifications from AffordMed API
 */
async function fetchNotifications() {
  try {
    const url = `${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      timeout: 10000
    });

    if (response.data && response.data.notifications) {
      return response.data.notifications;
    }

    return [];
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    throw error;
  }
}

/**
 * Calculate priority score for a notification
 * Lower score = higher priority
 */
function calculatePriority(notification) {
  const typeWeight = PRIORITY_WEIGHTS[notification.Type] || 999;
  const timestamp = new Date(notification.Timestamp).getTime();
  
  // Combine type priority with recency
  // Newer notifications get slightly higher priority within same type
  return typeWeight * 1000000000000 - timestamp;
}

/**
 * Sort notifications by priority
 */
function sortByPriority(notifications) {
  return notifications.sort((a, b) => {
    return calculatePriority(a) - calculatePriority(b);
  });
}

/**
 * Get top N priority notifications
 */
function getTopPriority(notifications, limit = 10) {
  const sorted = sortByPriority([...notifications]);
  return sorted.slice(0, limit);
}

/**
 * Format and display notifications
 */
function displayNotifications(notifications) {
  console.log('\n='.repeat(60));
  console.log('Top Priority Notifications');
  console.log('='.repeat(60));
  
  notifications.forEach((notif, index) => {
    console.log(`\n${index + 1}. [${notif.Type}] ${notif.Message}`);
    console.log(`   ID: ${notif.ID}`);
    console.log(`   Time: ${new Date(notif.Timestamp).toLocaleString()}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${notifications.length} notifications`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    const limit = parseInt(process.argv[2]) || 10;
    
    console.log('Fetching notifications...');
    const notifications = await fetchNotifications();
    console.log(`Fetched ${notifications.length} notifications`);
    
    const topNotifications = getTopPriority(notifications, limit);
    displayNotifications(topNotifications);
    
  } catch (error) {
    console.error('Failed to fetch and display notifications:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchNotifications,
  sortByPriority,
  getTopPriority
};
