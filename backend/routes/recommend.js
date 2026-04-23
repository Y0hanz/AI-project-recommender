const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const {
  scoreBaselineProjects,
  pickBaselineWindow,
  buildHybridRecommendations
} = require("../services/hybridRecommender");

// POST /recommend
router.post("/", async (req, res) => {
  try {
    let { skill, difficulty, interests, projectType, languages } = req.body;

    if (!difficulty || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    interests = Array.isArray(interests) ? interests : [];
    languages = Array.isArray(languages) ? languages : [];

    const userPreferences = {
      skill: skill || "",
      difficulty: difficulty || "",
      projectType: projectType || "",
      interests,
      languages
    };

    const allProjects = await Project.find().lean();

    if (!allProjects.length) {
      return res.status(404).json({ error: "No projects found" });
    }

    const scoredProjects = scoreBaselineProjects(allProjects, userPreferences);
    const shortlistedProjects = pickBaselineWindow(scoredProjects);

    const hybridResults = await buildHybridRecommendations({
      userPreferences,
      shortlistedProjects
    });

    if (hybridResults?.aiMeta?.used === false) {
      console.warn("Hybrid AI fallback:", hybridResults.aiMeta);
    } else {
      console.log("Hybrid AI success:", hybridResults?.aiMeta);
    }

    return res.json(hybridResults.projects);
  } catch (err) {
    console.error("Recommend route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;