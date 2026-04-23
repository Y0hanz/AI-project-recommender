const http = require("node:http");
const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

dns.setDefaultResultOrder("ipv4first");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

if (typeof http.setGlobalProxyFromEnv === "function") {
  http.setGlobalProxyFromEnv();
  console.log("Global proxy loaded from env for Node HTTP/fetch.");
}

const recommendRoute = require("./routes/recommend");
const feedbackRoute = require("./routes/feedback");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Project Recommender API Running");
});

app.use("/recommend", recommendRoute);
app.use("/feedback", feedbackRoute);

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