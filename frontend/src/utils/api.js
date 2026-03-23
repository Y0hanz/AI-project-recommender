const RECOMMEND_ENDPOINT = "/recommend";

export async function fetchRecommendations(payload) {
  const response = await fetch(RECOMMEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch recommendations.");
  }

  return Array.isArray(data) ? data : [];
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

export function shuffleProjects(projects = []) {
  return [...projects].sort(() => Math.random() - 0.5);
}
