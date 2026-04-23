const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:5000";

const RECOMMEND_ENDPOINT = `${API_BASE_URL}/recommend`;

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProject(project = {}, index = 0) {
  const aiEnhanced = project.aiEnhanced === true || project.geminiAvailable === true;

  const rawScore = Number(project.score || project.deterministicScore || 0);
  const baselineDisplayScore = rawScore <= 10 ? rawScore * 10 : rawScore;

  const aiConfidence = Number(
    project.aiConfidence ?? project.geminiConfidence ?? 0
  );

  const finalScore = aiEnhanced
    ? round1(baselineDisplayScore * 0.45 + aiConfidence * 0.55)
    : round1(baselineDisplayScore);

  const fitSummary =
    project.aiFitSummary ||
    project.geminiFitSummary ||
    project.fitSummary ||
    "No AI fit summary available.";

  const whyRecommended =
    toArray(project.whyRecommended).length > 0
      ? toArray(project.whyRecommended)
      : toArray(project.aiStrengths).length > 0
        ? toArray(project.aiStrengths)
        : toArray(project.deterministicSignals).slice(0, 3);

  const fallbackReason =
    project.aiReason ||
    project.insightSnapshot?.fallbackReason ||
    "Fallback mode is active.";

  return {
    ...project,

    // unified UI shape
    score: finalScore,
    geminiAvailable: aiEnhanced,
    geminiConfidence: aiEnhanced ? aiConfidence : 0,
    geminiFitSummary: fitSummary,
    fitSummary,
    whyRecommended,

    insightSnapshot: {
      mode: aiEnhanced ? "gemini_assisted" : "deterministic_fallback",
      geminiConfidence: `${Math.round(aiEnhanced ? aiConfidence : 0)}%`,
      topSignals: whyRecommended,
      fallbackReason: aiEnhanced ? "" : fallbackReason
    },

    explanationLayer: {
      mode: aiEnhanced ? "gemini_assisted" : "deterministic_fallback",
      fitSummary,
      whyRecommended
    },

    // keep rank info for sorting
    uiRank:
      Number.isFinite(Number(project.aiRank)) && Number(project.aiRank) > 0
        ? Number(project.aiRank)
        : index + 1
  };
}

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

  return data.map((project, index) => normalizeProject(project, index));
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