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

function buildFallbackProject(project, fallbackReason) {
  const signals = Array.isArray(project.deterministicSignals)
    ? project.deterministicSignals.slice(0, 3)
    : [];

  return {
    ...project,
    score: round1(project.deterministicScore || project.score || 0),
    geminiAvailable: false,
    geminiScore: 0,
    geminiConfidence: 0,
    fitSummary:
      "The Gemini layer was unavailable, so the baseline recommender returned this project.",
    geminiFitSummary:
      "The Gemini layer was unavailable, so the baseline recommender returned this project.",
    whyRecommended: signals.length ? signals : ["Matched by baseline scoring logic."],
    insightSnapshot: {
      mode:
        project.aiMode === "deterministic_extension"
          ? "deterministic_extension"
          : "deterministic_fallback",
      geminiConfidence: "0%",
      topSignals: signals,
      fallbackReason: fallbackReason || project.aiReason || "Unknown Gemini fallback reason."
    },
    explanationLayer: {
      mode:
        project.aiMode === "deterministic_extension"
          ? "deterministic_extension"
          : "deterministic_fallback",
      fitSummary:
        project.aiMode === "deterministic_extension"
          ? "This result extends the list beyond the Gemini-ranked shortlist and comes from deterministic scoring."
          : "Fallback mode is active. This result comes from your deterministic scoring logic.",
      whyRecommended: signals.length ? signals : ["Matched by baseline scoring logic."]
    }
  };
}

function buildGeminiProject(project) {
  const geminiScore = Number(project.geminiScore || 0);
  const geminiConfidence = Number(project.geminiConfidence || 0);
  const deterministicScore = Number(project.deterministicScore || project.score || 0);

  const blendedScore = round1(deterministicScore * 0.55 + geminiScore * 0.45);

  const whyRecommended =
    Array.isArray(project.whyRecommended) && project.whyRecommended.length
      ? project.whyRecommended.slice(0, 3)
      : Array.isArray(project.deterministicSignals)
        ? project.deterministicSignals.slice(0, 3)
        : ["Matched by Gemini and baseline scoring."];

  const fitSummary =
    safeString(project.aiFitSummary) ||
    "Gemini ranked this project as a strong fit for the submitted preferences.";

  return {
    ...project,
    score: blendedScore,
    geminiAvailable: true,
    geminiScore,
    geminiConfidence,
    fitSummary,
    geminiFitSummary: fitSummary,
    whyRecommended,
    insightSnapshot: {
      mode: "gemini_assisted",
      geminiConfidence: `${Math.round(geminiConfidence)}%`,
      topSignals: whyRecommended
    },
    explanationLayer: {
      mode: "gemini_assisted",
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

    const finalProjects = hybrid.projects.map((project) => {
      if (project.aiEnhanced) {
        return buildGeminiProject(project);
      }

      return buildFallbackProject(project, hybrid.aiMeta?.reason || project.aiReason);
    });

    return res.json(finalProjects);
  } catch (err) {
    console.error("Recommendation route error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;