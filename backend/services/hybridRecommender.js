const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function shuffleArray(items = []) {
  return [...items].sort(() => Math.random() - 0.5);
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildDeterministicSignals({
  difficultyScore,
  projectTypeScore,
  categoryMatches,
  technologyMatches,
  skillScore,
  project
}) {
  return [
    difficultyScore > 0 ? `Difficulty matches (${project.difficulty})` : null,
    projectTypeScore > 0 ? `Project type matches (${project.projectType})` : null,
    categoryMatches.length ? `Interest overlap: ${categoryMatches.join(", ")}` : null,
    technologyMatches.length ? `Tech overlap: ${technologyMatches.join(", ")}` : null,
    skillScore > 0 ? "Skill level aligns with difficulty" : null
  ].filter(Boolean);
}

function scoreBaselineProjects(allProjects, userPreferences = {}) {
  let {
    skill = "",
    difficulty = "",
    interests = [],
    projectType = "",
    languages = []
  } = userPreferences;

  const normalizedDifficulty = normalize(difficulty);
  const normalizedProjectType = normalize(projectType);
  const normalizedInterests = toArray(interests).map(normalize);
  const normalizedLanguages = toArray(languages).map(normalize);
  const normalizedSkill = normalize(skill);

  const skillMap = {
    beginner: "easy",
    intermediate: "medium",
    advanced: "hard"
  };

  return allProjects.map((project) => {
    const normalizedProjectDifficulty = normalize(project.difficulty);
    const normalizedProjectTypeValue = normalize(project.projectType);

    const categoryMatches = toArray(project.categories).filter((category) =>
      normalizedInterests.includes(normalize(category))
    );

    const technologyMatches = toArray(project.technologies).filter((tech) =>
      normalizedLanguages.includes(normalize(tech))
    );

    const difficultyScore =
      normalizedProjectDifficulty === normalizedDifficulty ? 30 : 0;

    const projectTypeScore =
      normalizedProjectType &&
      normalizedProjectTypeValue === normalizedProjectType
        ? 20
        : 0;

    const categoryScore = Math.min(categoryMatches.length * 10, 25);
    const technologyScore = Math.min(technologyMatches.length * 6, 20);

    const skillScore =
      normalizedSkill &&
      skillMap[normalizedSkill] === normalizedProjectDifficulty
        ? 5
        : 0;

    const deterministicScore =
      difficultyScore +
      projectTypeScore +
      categoryScore +
      technologyScore +
      skillScore;

    return {
      ...project,
      deterministicScore,
      score: deterministicScore,
      scoreBreakdown: {
        difficulty: difficultyScore,
        projectType: projectTypeScore,
        categories: categoryScore,
        technologies: technologyScore,
        skillAlignment: skillScore,
        total: deterministicScore
      },
      categoryMatches,
      technologyMatches,
      deterministicSignals: buildDeterministicSignals({
        difficultyScore,
        projectTypeScore,
        categoryMatches,
        technologyMatches,
        skillScore,
        project
      })
    };
  });
}

function pickBaselineWindow(scoredProjects = []) {
  const sorted = [...scoredProjects].sort(
    (a, b) => (b.deterministicScore || 0) - (a.deterministicScore || 0)
  );

  const hasPositive = sorted.some((project) => (project.deterministicScore || 0) > 0);

  return hasPositive ? sorted.slice(0, 10) : shuffleArray(sorted).slice(0, 10);
}

function extractGeminiText(responseJson) {
  const parts = responseJson?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .filter(Boolean)
    .join("")
    .trim();
}

function extractJson(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text.trim();

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Gemini response did not contain valid JSON.");
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

function sanitizeAiRecord(record) {
  return {
    candidateId: String(record?.candidateId || ""),
    geminiScore: clamp(Number(record?.geminiScore || 0), 0, 100),
    geminiConfidence: clamp(Number(record?.geminiConfidence || 0), 0, 100),
    fitSummary: String(record?.fitSummary || "").trim(),
    whyRecommended: toArray(record?.whyRecommended)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 3)
  };
}

function mergeAiRanking(candidateProjects, aiOutput) {
  const aiRecords = toArray(aiOutput?.evaluations).map(sanitizeAiRecord);

  const aiByCandidateId = new Map(
    aiRecords
      .filter((item) => item.candidateId)
      .map((item) => [item.candidateId, item])
  );

  return candidateProjects.map((project) => {
    const candidateId = String(project.__candidateId);
    const ai = aiByCandidateId.get(candidateId);

    if (!ai) {
      return {
        ...project,
        aiEnhanced: false,
        aiMode: "fallback",
        aiReason: "No Gemini evaluation returned for this candidate.",
        geminiScore: 0,
        geminiConfidence: 0,
        aiFitSummary:
          "The Gemini layer was unavailable, so the baseline recommender returned this project.",
        whyRecommended: project.deterministicSignals.slice(0, 3)
      };
    }

    return {
      ...project,
      aiEnhanced: true,
      aiMode: "gemini",
      aiReason: "",
      geminiScore: ai.geminiScore,
      geminiConfidence: ai.geminiConfidence,
      aiFitSummary:
        ai.fitSummary ||
        "Gemini ranked this project as a strong fit for the submitted preferences.",
      whyRecommended:
        ai.whyRecommended.length > 0
          ? ai.whyRecommended
          : project.deterministicSignals.slice(0, 3)
    };
  });
}

function buildGeminiPrompt({ userPreferences, candidateProjects }) {
  const compactCandidates = candidateProjects.map((project, index) => ({
    candidateId: String(project.__candidateId || `candidate-${index + 1}`),
    title: project.title || "",
    description: project.description || "",
    difficulty: project.difficulty || "",
    projectType: project.projectType || "",
    technologies: toArray(project.technologies).slice(0, 5),
    categories: toArray(project.categories).slice(0, 4),
    deterministicScore: round1(project.deterministicScore || 0),
    deterministicSignals: toArray(project.deterministicSignals).slice(0, 3)
  }));

  return `
Return ONLY valid JSON.

{
  "evaluations": [
    {
      "candidateId": "string",
      "geminiScore": 0,
      "geminiConfidence": 0,
      "fitSummary": "string",
      "whyRecommended": ["string", "string", "string"]
    }
  ]
}

Rules:
- Evaluate every candidate exactly once.
- geminiScore must be 0 to 100.
- geminiConfidence must be 0 to 100.
- fitSummary must be under 35 words.
- whyRecommended must contain exactly 3 short strings.
- Use only the supplied data.
- Prefer projects that best match the user's difficulty, project type, interests, and technologies.
- Do not invent new projects.

Input:
${JSON.stringify(
  {
    userProfile: {
      skill: userPreferences.skill || "",
      difficulty: userPreferences.difficulty || "",
      projectType: userPreferences.projectType || "",
      languages: toArray(userPreferences.languages),
      interests: toArray(userPreferences.interests)
    },
    candidates: compactCandidates
  },
  null,
  2
)}
`.trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function rerankWithGemini({ userPreferences, candidateProjects }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const timeoutMs = Math.max(
    5000,
    Number.parseInt(process.env.GEMINI_TIMEOUT_MS || "25000", 10) || 25000
  );

  if (!apiKey) {
    return {
      projects: candidateProjects.map((project) => ({
        ...project,
        aiEnhanced: false,
        aiMode: "fallback",
        aiReason: "GEMINI_API_KEY missing",
        geminiScore: 0,
        geminiConfidence: 0,
        aiFitSummary:
          "The Gemini layer was unavailable, so the baseline recommender returned this project.",
        whyRecommended: project.deterministicSignals.slice(0, 3)
      })),
      aiMeta: {
        enabled: false,
        used: false,
        model: null,
        reason: "GEMINI_API_KEY missing"
      }
    };
  }

  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
  const prompt = buildGeminiPrompt({ userPreferences, candidateProjects });

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300
        }
      })
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const text = extractGeminiText(json);
  const parsed = JSON.parse(extractJson(text));

  if (!Array.isArray(parsed?.evaluations)) {
    throw new Error("Gemini JSON did not include evaluations.");
  }

  const reranked = mergeAiRanking(candidateProjects, parsed);

  return {
    projects: reranked,
    aiMeta: {
      enabled: true,
      used: true,
      model,
      reason: null
    }
  };
}

async function buildHybridRecommendations({ userPreferences, shortlistedProjects }) {
  const topK = Math.max(
    1,
    Math.min(5, Number.parseInt(process.env.GEMINI_TOP_K || "3", 10) || 3)
  );

  const aiCandidates = shortlistedProjects.slice(0, topK).map((project, index) => ({
    ...project,
    __candidateId: String(project._id || project.id || `candidate-${index + 1}`)
  }));

  const remainingProjects = shortlistedProjects.slice(topK).map((project) => ({
    ...project,
    aiEnhanced: false,
    aiMode: "deterministic_extension",
    aiReason: "Not sent to Gemini; deterministic extension of result list.",
    geminiScore: 0,
    geminiConfidence: 0,
    aiFitSummary:
      "This result extends the list beyond the Gemini-ranked shortlist and comes from deterministic scoring.",
    whyRecommended: project.deterministicSignals.slice(0, 3)
  }));

  try {
    const hybrid = await rerankWithGemini({
      userPreferences,
      candidateProjects: aiCandidates
    });

    return {
      projects: [
        ...hybrid.projects.map(({ __candidateId, ...rest }) => rest),
        ...remainingProjects
      ],
      aiMeta: hybrid.aiMeta
    };
  } catch (error) {
    return {
      projects: shortlistedProjects.map((project) => ({
        ...project,
        aiEnhanced: false,
        aiMode: "fallback",
        aiReason: error.message,
        geminiScore: 0,
        geminiConfidence: 0,
        aiFitSummary:
          "The Gemini layer was unavailable, so the baseline recommender returned this project.",
        whyRecommended: project.deterministicSignals.slice(0, 3)
      })),
      aiMeta: {
        enabled: true,
        used: false,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
        reason: error.message
      }
    };
  }
}

module.exports = {
  scoreBaselineProjects,
  pickBaselineWindow,
  buildHybridRecommendations
};