const TYPE_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1,
};

/**
 * Calculate priority score based on notification type and timestamp
 * Recent notifications get higher scores
 * @param {Object} notification - Notification object with Type and Timestamp
 * @returns {number} Priority score
 */
export const calculatePriorityScore = (notification) => {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  
  // Convert timestamp to date and calculate recency score
  // Newer notifications get higher scores
  const timestamp = new Date(notification.Timestamp).getTime();
  const now = Date.now();
  const ageInMs = now - timestamp;
  const ageInHours = ageInMs / (1000 * 60 * 60);
  
  // Recency score: decreases with age (max 100 for very recent)
  const recencyScore = Math.max(0, 100 - ageInHours);
  
  // Final score: type weight (0-3) * 100 + recency (0-100)
  const score = typeWeight * 100 + recencyScore;
  
  return score;
};

/**
 * Sort notifications by priority
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Sorted notifications
 */
export const sortByPriority = (notifications) => {
  return [...notifications].sort((a, b) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    return scoreB - scoreA; // Descending order (highest first)
  });
};
