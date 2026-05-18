const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

async function Log(stack, level, packageName, message) {
  try {
    const token = process.env.ACCESS_TOKEN;

    if (!token) {
      return null;
    }

    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

module.exports = { Log };