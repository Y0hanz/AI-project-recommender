const express = require("express");
const router = express.Router();
const RecommendationFeedback = require("../models/RecommendationFeedback");

function normalizeReaction(value) {
  if (value === "up" || value === "down") return value;
  return null;
}

// GET /feedback
router.get("/", async (req, res) => {
  try {
    const feedbackDocs = await RecommendationFeedback.find()
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(feedbackDocs);
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch feedback." });
  }
});

// POST /feedback/upsert
router.post("/upsert", async (req, res) => {
  try {
    const {
      projectKey,
      projectId,
      title,
      reaction,
      note,
      score,
      aiEnhanced,
      aiConfidence,
      difficulty,
      projectType
    } = req.body;

    if (!projectKey || !title) {
      return res.status(400).json({
        error: "projectKey and title are required."
      });
    }

    const payload = {
      projectKey: String(projectKey),
      projectId: String(projectId || ""),
      title: String(title),
      reaction: normalizeReaction(reaction),
      note: typeof note === "string" ? note.trim() : "",
      score: Number.isFinite(Number(score)) ? Number(score) : 0,
      aiEnhanced: Boolean(aiEnhanced),
      aiConfidence: Number.isFinite(Number(aiConfidence))
        ? Number(aiConfidence)
        : null,
      difficulty: String(difficulty || ""),
      projectType: String(projectType || "")
    };

    const saved = await RecommendationFeedback.findOneAndUpdate(
      { projectKey: payload.projectKey },
      { $set: payload },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return res.json(saved);
  } catch (error) {
    console.error("Feedback upsert error:", error);
    return res.status(500).json({ error: "Failed to save feedback." });
  }
});

module.exports = router;