require("dotenv").config();

const { Log } = require("../logging_middleware/backendLogger");

const NOTIFICATION_API_URL =
  "http://4.224.186.213/evaluation-service/notifications";

const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function fetchNotifications() {
  try {
    await Log("backend", "info", "api", "Fetching notifications from API");

    const response = await fetch(NOTIFICATION_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      await Log(
        "backend",
        "error",
        "api",
        `Failed to fetch notifications. Status: ${response.status}`
      );

      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    

    await Log("backend", "info", "api", "Notifications fetched successfully");

    return data.notifications || [];
  } catch (error) {
    await Log("backend", "error", "api", "Error while fetching notifications");
    
  }
}

function calculatePriority(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;

  const notificationTime = new Date(notification.Timestamp).getTime();
  const currentTime = Date.now();

  const ageInHours = Math.max(
    (currentTime - notificationTime) / (1000 * 60 * 60),
    1
  );

  const recencyScore = 1 / ageInHours;

  return typeWeight * 100 + recencyScore;
}

function getTopNotifications(notifications, n = 10) {
  return notifications
    .map((notification) => ({
      ...notification,
      priorityScore: calculatePriority(notification),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, n);
}

async function main() {
  try {
    const notifications = await fetchNotifications();
    const topNotifications = getTopNotifications(notifications, 10);

    await Log("backend", "info", "service", "Top priority notifications generated");

    console.table(
      topNotifications.map((notification, index) => ({
        Rank: index + 1,
        ID: notification.ID,
        Type: notification.Type,
        Message: notification.Message,
        Timestamp: notification.Timestamp,
        Score: notification.priorityScore.toFixed(4),
      }))
    );
  } catch (error) {
  await Log("backend", "fatal", "service", "Priority inbox execution failed");
  console.error("Error:", error.message);
}
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchNotifications,
  calculatePriority,
  getTopNotifications,
};