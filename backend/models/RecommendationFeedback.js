const mongoose = require("mongoose");

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    projectKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    projectId: {
      type: String,
      default: "",
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    reaction: {
      type: String,
      enum: ["up", "down", null],
      default: null
    },
    note: {
      type: String,
      default: "",
      trim: true
    },
    score: {
      type: Number,
      default: 0
    },
    aiEnhanced: {
      type: Boolean,
      default: false
    },
    aiConfidence: {
      type: Number,
      default: null
    },
    difficulty: {
      type: String,
      default: ""
    },
    projectType: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RecommendationFeedback",
  recommendationFeedbackSchema
);