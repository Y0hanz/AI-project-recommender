const mongoose = require("mongoose");

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    projectKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    sessionId: {
      type: String,
      required: true,
      index: true
    },
    sourcePage: {
      type: String,
      enum: ["top_match", "results_card", "project_modal"],
      required: true
    },
    feedbackType: {
      type: String,
      enum: ["helpful", "not_helpful", "favorite"],
      required: true
    },
    comment: {
      type: String,
      default: ""
    },

    projectId: {
      type: String,
      required: true,
      index: true
    },
    projectTitle: {
      type: String,
      required: true
    },
    projectType: {
      type: String,
      default: ""
    },
    technologies: {
      type: [String],
      default: []
    },

    uiRank: {
      type: Number,
      default: null
    },
    score: {
      type: Number,
      default: 0
    },
    geminiAvailable: {
      type: Boolean,
      default: false
    },
    geminiConfidence: {
      type: Number,
      default: 0
    },
    geminiFitSummary: {
      type: String,
      default: ""
    },
    whyRecommended: {
      type: [String],
      default: []
    },

    userPreferences: {
      skill: { type: String, default: "" },
      difficulty: { type: String, default: "" },
      projectType: { type: String, default: "" },
      interests: { type: [String], default: [] },
      languages: { type: [String], default: [] }
    }
  },
  {
    timestamps: true
  }
);

recommendationFeedbackSchema.index({
  projectId: 1,
  feedbackType: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "RecommendationFeedback",
  recommendationFeedbackSchema
);