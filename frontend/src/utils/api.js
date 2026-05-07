const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:5000";

const RECOMMEND_ENDPOINT = `${API_BASE_URL}/recommend`;

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchRecommendations(payload) {
  let response;

  try {
    response = await fetch(RECOMMEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    console.error("[fetchRecommendations] Network error:", networkError);
    throw new Error(
      "Could not reach the backend API. Make sure node server.js is running on http://127.0.0.1:5000."
    );
  }

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const backendMessage =
      data?.error ||
      data?.message ||
      `Backend request failed with status ${response.status}.`;

    console.error("[fetchRecommendations] Backend error:", {
      status: response.status,
      data
    });

    throw new Error(backendMessage);
  }

  if (!Array.isArray(data)) {
    console.error("[fetchRecommendations] Unexpected response shape:", data);
    throw new Error("Backend returned an unexpected response format.");
  }

  return data;
}

export function savePreferences(payload) {
  localStorage.setItem("userPreferences", JSON.stringify(payload));
}

export function getSavedPreferences() {
  try {
    return JSON.parse(localStorage.getItem("userPreferences")) || null;
  } catch {
    return null;
  }
}

export function saveRecommendations(projects) {
  localStorage.setItem("recommendedProjects", JSON.stringify(projects));
}

export function getSavedRecommendations() {
  try {
    return JSON.parse(localStorage.getItem("recommendedProjects")) || [];
  } catch {
    return [];
  }
}