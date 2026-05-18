const API_BASE_URL = "/api/evaluation-service/notifications";

export async function fetchNotifications({
  limit = 20,
  page = 1,
  notificationType = "All",
} = {}) {
  const params = new URLSearchParams();

  if (limit) params.append("limit", limit);
  if (page) params.append("page", page);

  if (notificationType && notificationType !== "All") {
    params.append("notification_type", notificationType);
  }

  const url = API_BASE_URL;

  console.log("Request URL:", url);
  console.log("Token exists:", !!import.meta.env.VITE_ACCESS_TOKEN);
  console.log("Token start:", import.meta.env.VITE_ACCESS_TOKEN?.slice(0, 10));

  const response = await fetch(url, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    },
  });

  console.log("Status:", response.status);

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    throw new Error(`API failed with status ${response.status}`);
  }

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("API did not return JSON. Check API URL and token.");
  }

  const data = await response.json();
  console.log("API data:", data);
  if (Array.isArray(data)) {
  return data;
}

if (Array.isArray(data.notifications)) {
  return data.notifications;
}

if (Array.isArray(data.data)) {
  return data.data;
}

return [];
}