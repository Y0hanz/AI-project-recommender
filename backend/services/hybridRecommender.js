const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function shuffleArray(items = []) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const message = String(error?.message || "");
  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("fetch failed")
  );
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

  return allProjects.map((project) => {
    let score = 0;

    if (normalize(project.difficulty) === normalizedDifficulty) {
      score += 3;
    }

    if (
      normalizedProjectType &&
      normalize(project.projectType) === normalizedProjectType
    ) {
      score += 3;
    }

    const categoryMatches = toArray(project.categories).filter((category) =>
      normalizedInterests.includes(normalize(category))
    ).length;
    score += categoryMatches * 2;

    const techMatches = toArray(project.technologies).filter((tech) =>
      normalizedLanguages.includes(normalize(tech))
    ).length;
    score += techMatches * 1.5;

    if (normalizedSkill) {
      const skillMap = {
        beginner: "easy",
        intermediate: "medium",
        advanced: "hard"
      };

      if (skillMap[normalizedSkill] === normalize(project.difficulty)) {
        score += 1;
      }
    }

    return {
      ...project,
      score
    };
  });
}

function pickBaselineWindow(scoredProjects = []) {
  const sorted = [...scoredProjects].sort((a, b) => (b.score || 0) - (a.score || 0));
  const hasPositive = sorted.some((project) => (project.score || 0) > 0);

  return hasPositive
    ? sorted.slice(0, 10)
    : shuffleArray(sorted).slice(0, 5);
}

function sanitizeAiRecord(record) {
  return {
    candidateId: String(record?.candidateId || ""),
    aiRank: Number.isFinite(Number(record?.aiRank))
      ? Number(record.aiRank)
      : 999,
    aiConfidence: Number.isFinite(Number(record?.aiConfidence))
      ? Math.max(0, Math.min(100, Number(record.aiConfidence)))
      : null,
    aiFitSummary: String(record?.aiFitSummary || "").trim(),
    aiReason: String(record?.aiReason || "").trim(),
    aiStrengths: toArray(record?.aiStrengths)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 2),
    aiConcerns: toArray(record?.aiConcerns)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 2)
  };
}

function extractGeminiText(responseJson) {
  const parts = responseJson?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .filter(Boolean)
    .join("");
}

function safeJsonParse(text) {
  if (!text || typeof text !== "string") return null;

  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) {
    try {
      return JSON.parse(fencedJson[1]);
    } catch {
      // continue
    }
  }

  const firstObject = text.match(/\{[\s\S]*\}/);
  if (firstObject?.[0]) {
    try {
      return JSON.parse(firstObject[0]);
    } catch {
      return null;
    }
  }

  return null;
}

function mergeAiRanking(candidateProjects, aiOutput) {
  const aiRecords = toArray(aiOutput?.rerankedProjects).map(sanitizeAiRecord);

  const aiByCandidateId = new Map(
    aiRecords
      .filter((item) => item.candidateId)
      .map((item) => [item.candidateId, item])
  );

  const enhanced = candidateProjects.map((project, index) => {
    const ai = aiByCandidateId.get(String(project.__candidateId));

    return {
      ...project,
      aiEnhanced: Boolean(ai),
      aiRank: ai?.aiRank ?? index + 1,
      aiConfidence: ai?.aiConfidence ?? null,
      aiFitSummary:
        ai?.aiFitSummary ||
        "AI summary unavailable. Showing deterministic shortlist.",
      aiReason:
        ai?.aiReason ||
        "Gemini was unavailable for this request, so baseline ranking was used.",
      aiStrengths: ai?.aiStrengths || [],
      aiConcerns: ai?.aiConcerns || []
    };
  });

  return enhanced.sort((a, b) => {
    const aRank = Number.isFinite(Number(a.aiRank)) ? Number(a.aiRank) : 999;
    const bRank = Number.isFinite(Number(b.aiRank)) ? Number(b.aiRank) : 999;

    if (aRank !== bRank) return aRank - bRank;
    return (b.score || 0) - (a.score || 0);
  });
}

async function callGeminiOnce({ apiKey, model, systemInstruction, userPrompt }) {
  const endpoint =
    `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 900,
        responseMimeType: "application/json"
      }
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${responseText}`);
  }

  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini returned non-JSON HTTP payload: ${responseText}`);
  }

  const finishReason = json?.candidates?.[0]?.finishReason || "UNKNOWN";
  const text = extractGeminiText(json);

  console.log(`Gemini ${model} finishReason: ${finishReason}`);

  if (!text) {
    throw new Error(`Gemini returned no text output. Raw response: ${responseText}`);
  }

  const parsed = safeJsonParse(text);

  if (!parsed) {
    throw new Error(`Gemini did not return valid JSON. Raw text: ${text}`);
  }

  if (!Array.isArray(parsed?.rerankedProjects)) {
    throw new Error(
      `Gemini JSON did not include rerankedProjects. Parsed payload: ${JSON.stringify(parsed)}`
    );
  }

  return parsed;
}

async function callGeminiWithRetry({
  apiKey,
  model,
  systemInstruction,
  userPrompt,
  maxRetries = 3
}) {
  const retryDelays = [1000, 2000, 4000];
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      if (attempt > 0) {
        console.log(`Retrying Gemini model ${model}, attempt ${attempt + 1}...`);
      }

      return await callGeminiOnce({
        apiKey,
        model,
        systemInstruction,
        userPrompt
      });
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = retryDelays[Math.min(attempt, retryDelays.length - 1)];
      console.warn(`Gemini ${model} overloaded/unavailable. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

async function rerankWithGemini({ userPreferences, candidateProjects }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3-flash-preview";

  if (!apiKey) {
    return {
      projects: candidateProjects.map((project, index) => ({
        ...project,
        aiEnhanced: false,
        aiRank: index + 1,
        aiConfidence: null,
        aiFitSummary: "AI summary unavailable. Showing deterministic shortlist.",
        aiReason: "No GEMINI_API_KEY was provided.",
        aiStrengths: [],
        aiConcerns: []
      })),
      aiMeta: {
        enabled: false,
        used: false,
        model: null,
        reason: "GEMINI_API_KEY missing"
      }
    };
  }

  const compactCandidates = candidateProjects.map((project, index) => ({
    candidateId: String(project.__candidateId || `candidate-${index + 1}`),
    title: project.title,
    difficulty: project.difficulty,
    projectType: project.projectType,
    technologies: toArray(project.technologies).slice(0, 4),
    categories: toArray(project.categories).slice(0, 4),
    baselineScore: project.score || 0,
    shortDescription: String(project.description || "").slice(0, 140)
  }));

  const systemInstruction = [
    "You are an AI reranking layer for a thesis project recommendation system.",
    "Only rerank the provided candidates.",
    "Do not invent projects.",
    "Return concise valid JSON only.",
    "Keep every string short."
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "Rerank these candidates for the user.",
      rules: [
        "Prefer best fit on difficulty, project type, technologies, and interests.",
        "Prefer realistic, demo-friendly scope.",
        "Keep text very short."
      ],
      outputFormat: {
        rerankedProjects: [
          {
            candidateId: "string",
            aiRank: "integer",
            aiConfidence: "integer 0-100",
            aiFitSummary: "max 12 words",
            aiReason: "max 14 words",
            aiStrengths: ["max 2 items", "max 3 words each"],
            aiConcerns: ["max 2 items", "max 3 words each"]
          }
        ]
      },
      userProfile: {
        skill: userPreferences.skill || "",
        difficulty: userPreferences.difficulty || "",
        projectType: userPreferences.projectType || "",
        languages: toArray(userPreferences.languages).slice(0, 4),
        interests: toArray(userPreferences.interests).slice(0, 4)
      },
      candidates: compactCandidates
    },
    null,
    2
  );

  let parsed;
  let usedModel = primaryModel;

  try {
    parsed = await callGeminiWithRetry({
      apiKey,
      model: primaryModel,
      systemInstruction,
      userPrompt,
      maxRetries: 3
    });
  } catch (primaryError) {
    console.warn(`Primary Gemini model failed: ${primaryError.message}`);

    if (fallbackModel && fallbackModel !== primaryModel) {
      console.log(`Trying fallback Gemini model: ${fallbackModel}`);
      parsed = await callGeminiWithRetry({
        apiKey,
        model: fallbackModel,
        systemInstruction,
        userPrompt,
        maxRetries: 2
      });
      usedModel = fallbackModel;
    } else {
      throw primaryError;
    }
  }

  const reranked = mergeAiRanking(candidateProjects, parsed);

  return {
    projects: reranked,
    aiMeta: {
      enabled: true,
      used: true,
      model: usedModel
    }
  };
}

async function buildHybridRecommendations({ userPreferences, shortlistedProjects }) {
  const topK = Math.max(
    3,
    Math.min(6, Number.parseInt(process.env.GEMINI_TOP_K || "4", 10) || 4)
  );

  const aiCandidates = shortlistedProjects.slice(0, topK).map((project, index) => ({
    ...project,
    __candidateId: String(project._id || project.id || `candidate-${index + 1}`)
  }));

  const remainingProjects = shortlistedProjects.slice(topK);

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
    console.error("Gemini rerank error:", error.message);

    return {
      projects: [
        ...aiCandidates.map(({ __candidateId, ...project }, index) => ({
          ...project,
          aiEnhanced: false,
          aiRank: index + 1,
          aiConfidence: null,
          aiFitSummary: "AI summary unavailable. Showing deterministic shortlist.",
          aiReason: "Gemini was unavailable, so baseline ranking was used.",
          aiStrengths: [],
          aiConcerns: []
        })),
        ...remainingProjects
      ],
      aiMeta: {
        enabled: true,
        used: false,
        model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
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