// backend/routes/recommend.js
const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const {
  scoreBaselineProjects,
  pickBaselineWindow,
  buildHybridRecommendations
} = require("../services/hybridRecommender");

function safeString(value) {
  return String(value || "").trim();
}

function normalizeLowerArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildUnifiedProject(project = {}, index = 0, aiMeta = {}) {
  const aiEnhanced = project.aiEnhanced === true || project.geminiAvailable === true;

  const rawScore = Number(project.score || project.deterministicScore || 0);
  const baselineDisplayScore = rawScore <= 10 ? rawScore * 10 : rawScore;

  const rawConfidence = Number(
    project.aiConfidence ?? project.geminiConfidence ?? 0
  );

  const finalScore = aiEnhanced
    ? round1(baselineDisplayScore * 0.45 + rawConfidence * 0.55)
    : round1(baselineDisplayScore);

  const whyRecommended =
    toArray(project.whyRecommended).length > 0
      ? toArray(project.whyRecommended).slice(0, 3)
      : toArray(project.aiStrengths).length > 0
        ? toArray(project.aiStrengths).slice(0, 3)
        : toArray(project.deterministicSignals).slice(0, 3);

  const fitSummary =
    safeString(
      project.geminiFitSummary ||
      project.aiFitSummary ||
      project.fitSummary
    ) ||
    (aiEnhanced
      ? "Gemini ranked this project as a strong fit for the submitted preferences."
      : "The Gemini layer was unavailable, so the baseline recommender returned this project.");

  const fallbackReason =
    safeString(
      project.aiReason ||
      project.insightSnapshot?.fallbackReason ||
      aiMeta?.reason
    ) ||
    (aiEnhanced ? "" : "Fallback mode is active.");

  const uiRank =
    Number.isFinite(Number(project.aiRank)) && Number(project.aiRank) > 0
      ? Number(project.aiRank)
      : index + 1;

  return {
    _id: project._id,
    title: project.title,
    description: project.description,
    technologies: toArray(project.technologies),
    difficulty: project.difficulty,
    categories: toArray(project.categories),
    projectType: project.projectType,
    features: project.features || "",
    learning: project.learning || "",

    score: finalScore,
    deterministicScore: round1(baselineDisplayScore),
    scoreBreakdown: project.scoreBreakdown || null,
    categoryMatches: toArray(project.categoryMatches),
    technologyMatches: toArray(project.technologyMatches),
    deterministicSignals: toArray(project.deterministicSignals),

    geminiAvailable: aiEnhanced,
    geminiConfidence: aiEnhanced ? rawConfidence : 0,
    geminiScore: aiEnhanced ? rawConfidence : 0,
    geminiFitSummary: fitSummary,
    fitSummary,
    whyRecommended,

    uiRank,
    aiMeta: {
      enabled: Boolean(aiMeta?.enabled),
      used: Boolean(aiMeta?.used),
      model: aiMeta?.model || null
    },

    insightSnapshot: {
      mode: aiEnhanced ? "gemini_assisted" : "deterministic_fallback",
      geminiConfidence: `${Math.round(aiEnhanced ? rawConfidence : 0)}%`,
      topSignals: whyRecommended,
      fallbackReason: aiEnhanced ? "" : fallbackReason
    },

    explanationLayer: {
      mode: aiEnhanced ? "gemini_assisted" : "deterministic_fallback",
      fitSummary,
      whyRecommended
    }
  };
}

router.post("/", async (req, res) => {
  try {
    let { skill, difficulty, interests, projectType, languages } = req.body || {};

    const userPreferences = {
      skill: safeString(skill),
      difficulty: safeString(difficulty).toLowerCase(),
      interests: normalizeLowerArray(interests),
      projectType: safeString(projectType).toLowerCase(),
      languages: normalizeLowerArray(languages)
    };

    if (!userPreferences.difficulty || userPreferences.interests.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: difficulty and at least one interest."
      });
    }

    const allProjects = await Project.find().lean();

    if (!allProjects.length) {
      return res.status(404).json({ error: "No projects found." });
    }

    const scoredProjects = scoreBaselineProjects(allProjects, userPreferences);
    const shortlistedProjects = pickBaselineWindow(scoredProjects);

    const hybrid = await buildHybridRecommendations({
      userPreferences,
      shortlistedProjects
    });

    const unifiedProjects = hybrid.projects.map((project, index) =>
      buildUnifiedProject(project, index, hybrid.aiMeta)
    );

    return res.json(unifiedProjects);
  } catch (err) {
    console.error("Recommendation route error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;