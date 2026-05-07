const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:5000";

const FEEDBACK_ENDPOINT = `${API_BASE_URL}/feedback`;

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitRecommendationFeedback(payload) {
  let response;

  try {
    response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    console.error("[submitRecommendationFeedback] Network error:", networkError);
    throw new Error("Could not submit feedback.");
  }

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to submit feedback.");
  }

  return data;
}

export async function fetchRecommendationFeedbackSummary() {
  let response;

  try {
    response = await fetch(`${FEEDBACK_ENDPOINT}/summary`);
  } catch (networkError) {
    console.error(
      "[fetchRecommendationFeedbackSummary] Network error:",
      networkError
    );
    throw new Error("Could not fetch feedback summary.");
  }

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch feedback summary.");
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchFeedbackMap() {
  const summary = await fetchRecommendationFeedbackSummary();

  return summary.reduce((acc, item) => {
    const projectId = String(item?._id || "");

    if (!projectId) return acc;

    acc[projectId] = {
      projectId,
      projectTitle: item?.projectTitle || "",
      projectType: item?.projectType || "",
      totalResponses: Number(item?.totalFeedback || 0),
      helpfulCount: Number(item?.helpfulCount || 0),
      notHelpfulCount: Number(item?.notHelpfulCount || 0),
      favoriteCount: Number(item?.favoriteCount || 0),
      avgScore: Number(item?.avgScore || 0),
      avgGeminiConfidence: Number(item?.avgGeminiConfidence || 0)
    };

    return acc;
  }, {});
}