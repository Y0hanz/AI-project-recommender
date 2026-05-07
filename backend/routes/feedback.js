const express = require("express");
const router = express.Router();
const RecommendationFeedback = require("../models/RecommendationFeedback");

function safeString(value) {
  return String(value || "").trim();
}

function toArray(value) {
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
}

function buildProjectKey({
  sessionId,
  sourcePage,
  feedbackType,
  projectId
}) {
  return [
    safeString(sessionId),
    safeString(sourcePage),
    safeString(feedbackType),
    safeString(projectId)
  ].join("::");
}

router.post("/", async (req, res) => {
  try {
    const {
      sessionId,
      sourcePage,
      feedbackType,
      comment,
      projectId,
      projectTitle,
      projectType,
      technologies,
      uiRank,
      score,
      geminiAvailable,
      geminiConfidence,
      geminiFitSummary,
      whyRecommended,
      userPreferences
    } = req.body || {};

    if (!safeString(sessionId)) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    if (!["top_match", "results_card", "project_modal"].includes(sourcePage)) {
      return res.status(400).json({ error: "Invalid sourcePage." });
    }

    if (!["helpful", "not_helpful", "favorite"].includes(feedbackType)) {
      return res.status(400).json({ error: "Invalid feedbackType." });
    }

    if (!safeString(projectId) || !safeString(projectTitle)) {
      return res.status(400).json({
        error: "projectId and projectTitle are required."
      });
    }

    const projectKey = buildProjectKey({
      sessionId,
      sourcePage,
      feedbackType,
      projectId
    });

    const update = {
      projectKey,
      sessionId: safeString(sessionId),
      sourcePage,
      feedbackType,
      comment: safeString(comment),

      projectId: safeString(projectId),
      projectTitle: safeString(projectTitle),
      projectType: safeString(projectType),
      technologies: toArray(technologies),

      uiRank:
        Number.isFinite(Number(uiRank)) && Number(uiRank) > 0
          ? Number(uiRank)
          : null,
      score: Number(score || 0),
      geminiAvailable: Boolean(geminiAvailable),
      geminiConfidence: Number(geminiConfidence || 0),
      geminiFitSummary: safeString(geminiFitSummary),
      whyRecommended: toArray(whyRecommended),

      userPreferences: {
        skill: safeString(userPreferences?.skill),
        difficulty: safeString(userPreferences?.difficulty),
        projectType: safeString(userPreferences?.projectType),
        interests: toArray(userPreferences?.interests),
        languages: toArray(userPreferences?.languages)
      }
    };

    const feedback = await RecommendationFeedback.findOneAndUpdate(
      { projectKey },
      { $set: update },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );

    return res.status(201).json({
      success: true,
      message: "Feedback saved successfully.",
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return res.status(500).json({ error: "Failed to save feedback." });
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const summary = await RecommendationFeedback.aggregate([
      {
        $group: {
          _id: "$projectId",
          projectTitle: { $first: "$projectTitle" },
          projectType: { $first: "$projectType" },
          totalFeedback: { $sum: 1 },
          helpfulCount: {
            $sum: {
              $cond: [{ $eq: ["$feedbackType", "helpful"] }, 1, 0]
            }
          },
          notHelpfulCount: {
            $sum: {
              $cond: [{ $eq: ["$feedbackType", "not_helpful"] }, 1, 0]
            }
          },
          favoriteCount: {
            $sum: {
              $cond: [{ $eq: ["$feedbackType", "favorite"] }, 1, 0]
            }
          },
          avgScore: { $avg: "$score" },
          avgGeminiConfidence: { $avg: "$geminiConfidence" }
        }
      },
      {
        $sort: {
          totalFeedback: -1,
          favoriteCount: -1,
          helpfulCount: -1
        }
      }
    ]);

    return res.json(summary);
  } catch (error) {
    console.error("Feedback summary GET error:", error);
    return res.status(500).json({ error: "Failed to fetch feedback summary." });
  }
});

module.exports = router;