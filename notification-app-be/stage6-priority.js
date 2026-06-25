require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://4.224.186.213';
const NOTIF_ENDPOINT = '/evaluation-service/notifications';
const TOKEN = process.env.BEARER_TOKEN || '';

const priorityOrder = {
  'Placement': 1,
  'Result': 2,
  'Event': 3
};

async function fetchNotifications() {
  try {
    const response = await axios.get(`${API_URL}${NOTIF_ENDPOINT}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: 10000
    });

    return response.data && response.data.notifications ? response.data.notifications : [];
  } catch (err) {
    console.error('Failed to fetch:', err.message);
    throw err;
  }
}

function getPriorityScore(notif) {
  const typeScore = priorityOrder[notif.Type] || 999;
  const time = new Date(notif.Timestamp).getTime();
  return typeScore * 1000000000000 - time;
}

function sortByPriority(notifs) {
  return notifs.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
}

function getTopPriority(notifs, n = 10) {
  const sorted = sortByPriority([...notifs]);
  return sorted.slice(0, n);
}

function displayNotifs(notifs) {
  console.log('\n' + '='.repeat(60));
  console.log('Top Priority Notifications');
  console.log('='.repeat(60));
  
  notifs.forEach((n, i) => {
    console.log(`\n${i + 1}. [${n.Type}] ${n.Message}`);
    console.log(`   ID: ${n.ID}`);
    console.log(`   Time: ${new Date(n.Timestamp).toLocaleString()}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${notifs.length} notifications`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    const limit = parseInt(process.argv[2]) || 10;
    
    console.log('Fetching notifications...');
    const allNotifs = await fetchNotifications();
    console.log(`Got ${allNotifs.length} notifications from API`);
    
    const topNotifs = getTopPriority(allNotifs, limit);
    displayNotifs(topNotifs);
    
  } catch (err) {
    console.error('Something went wrong:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchNotifications, sortByPriority, getTopPriority };
