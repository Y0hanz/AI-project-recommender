const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const recommendRoute = require("./routes/recommend");
const feedbackRoute = require("./routes/feedback");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("AI Project Recommender API Running");
});

// Routes
app.use("/recommend", recommendRoute);
app.use("/feedback", feedbackRoute);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });