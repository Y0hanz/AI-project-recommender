// backend/routes/recommend.js
const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// POST /recommend
router.post("/", async (req, res) => {
    try {
        let { skill, difficulty, interests, projectType, languages } = req.body;

        if (!difficulty || !interests) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const allProjects = await Project.find();
        if (!allProjects.length) return res.status(404).json({ error: "No projects found" });

        // Normalize input
        interests = interests.map(i => i.toLowerCase());
        languages = (languages || []).map(l => l.toLowerCase());
        difficulty = difficulty.toLowerCase();
        projectType = projectType ? projectType.toLowerCase() : "";

        const scoredProjects = allProjects.map(proj => {
            let score = 0;

            // Difficulty match
            if (proj.difficulty.toLowerCase() === difficulty) score += 3;

            // Project type match
            if (projectType && proj.projectType.toLowerCase() === projectType) score += 3;

            // Categories match
            const categoryMatches = proj.categories.filter(cat => interests.includes(cat.toLowerCase())).length;
            score += categoryMatches * 2;

            // Technology / languages match
            const techMatches = proj.technologies.filter(t => languages.includes(t.toLowerCase())).length;
            score += techMatches * 1.5;

            // Optional: bonus if skill matches difficulty roughly
            if (skill) {
                const skillMap = { "beginner": "easy", "intermediate": "medium", "advanced": "hard" };
                if (skillMap[skill.toLowerCase()] === proj.difficulty.toLowerCase()) score += 1;
            }

            return { ...proj.toObject(), score };
        });

        // Sort descending by score
        const sorted = scoredProjects.sort((a, b) => b.score - a.score);

        // Fallback: if no project has score > 0, just return 5 random projects
        const hasPositive = sorted.some(p => p.score > 0);
        const topProjects = hasPositive
            ? sorted.slice(0, 10)
            : allProjects.sort(() => Math.random() - 0.5).slice(0, 5);

        res.json(topProjects);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
