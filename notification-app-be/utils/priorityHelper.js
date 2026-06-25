// priority rankings
const PRIORITY_MAP = {
  'Placement': 1,
  'Result': 2,
  'Event': 3
};

function getPriority(type) {
  return PRIORITY_MAP[type] || 999;
}

function sortByPriority(notifications) {
  return notifications.sort((a, b) => {
    const prioA = getPriority(a.Type);
    const prioB = getPriority(b.Type);
    
    // sort by priority first
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    
    // then by timestamp (newest first)
    return new Date(b.Timestamp) - new Date(a.Timestamp);
  });
}

function getTopPriority(notifications, limit = 10) {
  const sorted = sortByPriority([...notifications]);
  return sorted.slice(0, limit);
}

module.exports = {
  getPriority,
  sortByPriority,
  getTopPriority
};
