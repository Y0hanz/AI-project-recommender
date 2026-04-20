function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function getProjectFeedbackId(project) {
  return String(
    project?._id ||
      project?.id ||
      project?.slug ||
      project?.title ||
      "unknown-project"
  );
}

export function getDefaultFeedback() {
  return {
    reaction: null,
    note: "",
    updatedAt: null
  };
}

export function getProjectFeedback(project, feedbackMap = {}) {
  const key = getProjectFeedbackId(project);
  return feedbackMap[key] || getDefaultFeedback();
}

export function getFeedbackSummary(feedbackMap = {}) {
  const values = Object.values(feedbackMap || {});
  const helpfulCount = values.filter((item) => item?.reaction === "up").length;
  const needsWorkCount = values.filter((item) => item?.reaction === "down").length;
  const notesCount = values.filter(
    (item) => typeof item?.note === "string" && item.note.trim().length > 0
  ).length;

  return {
    helpfulCount,
    needsWorkCount,
    notesCount,
    totalResponses: helpfulCount + needsWorkCount
  };
}

function detectNoteThemes(notes = []) {
  const themeRules = [
    { label: "Too Easy", keywords: ["too easy", "easy", "simple", "basic"] },
    { label: "Too Hard", keywords: ["too hard", "hard", "difficult", "complex"] },
    { label: "Tech Mismatch", keywords: ["tech", "stack", "language", "framework", "tool"] },
    { label: "Scope Issues", keywords: ["scope", "broad", "narrow", "large", "small"] },
    { label: "Good Thesis Fit", keywords: ["thesis", "demo", "presentation", "showcase"] },
    { label: "Interesting Idea", keywords: ["interesting", "creative", "unique", "cool"] }
  ];

  const counts = new Map();

  notes.forEach((note) => {
    const lower = normalize(note);

    themeRules.forEach((rule) => {
      const matched = rule.keywords.some((keyword) => lower.includes(keyword));
      if (matched) {
        counts.set(rule.label, (counts.get(rule.label) || 0) + 1);
      }
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function buildFeedbackAnalytics(projects = [], feedbackMap = {}) {
  const projectRows = projects.map((project) => {
    const feedback = getProjectFeedback(project, feedbackMap);

    return {
      id: getProjectFeedbackId(project),
      title: project?.title || "Untitled Project",
      score:
        typeof project?.score === "number"
          ? project.score
          : Number(project?.score || 0),
      aiEnhanced: Boolean(project?.aiEnhanced),
      aiConfidence: Number.isFinite(Number(project?.aiConfidence))
        ? Number(project?.aiConfidence)
        : null,
      reaction: feedback?.reaction || null,
      note: feedback?.note || "",
      updatedAt: feedback?.updatedAt || null,
      difficulty: project?.difficulty || "",
      projectType: project?.projectType || ""
    };
  });

  const ratedProjects = projectRows.filter(
    (row) => row.reaction || (typeof row.note === "string" && row.note.trim())
  );

  const helpfulProjects = ratedProjects
    .filter((row) => row.reaction === "up")
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const needsWorkProjects = ratedProjects
    .filter((row) => row.reaction === "down")
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const notedProjects = ratedProjects
    .filter((row) => row.note.trim().length > 0)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const recentActivity = ratedProjects
    .filter((row) => row.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8);

  const noteThemes = detectNoteThemes(notedProjects.map((row) => row.note));
  const summary = getFeedbackSummary(feedbackMap);

  const geminiEnhancedCount = projectRows.filter((row) => row.aiEnhanced).length;
  const averageAiConfidenceValues = projectRows
    .map((row) => row.aiConfidence)
    .filter((value) => value !== null);

  const averageAiConfidence = averageAiConfidenceValues.length
    ? Math.round(
        averageAiConfidenceValues.reduce((sum, value) => sum + value, 0) /
          averageAiConfidenceValues.length
      )
    : null;

  return {
    summary,
    totalProjects: projectRows.length,
    geminiEnhancedCount,
    averageAiConfidence,
    helpfulProjects,
    needsWorkProjects,
    notedProjects,
    recentActivity,
    noteThemes
  };
}