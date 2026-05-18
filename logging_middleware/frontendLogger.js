const LOG_API_URL = "/api/evaluation-service/logs";

export async function Log(stack, level, packageName, message) {
  try {
    const token = import.meta.env.VITE_ACCESS_TOKEN;

    if (!token) {
      return null;
    }

    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });

    return await response.json();
  } catch (error) {
    return null;
  }
}