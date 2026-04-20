const FEEDBACK_ENDPOINT = "/feedback";

export function getProjectFeedbackId(project) {
  return String(
    project?._id ||
      project?.id ||
      project?.slug ||
      project?.title ||
      "unknown-project"
  );
}

export function feedbackDocsToMap(feedbackDocs = []) {
  return feedbackDocs.reduce((acc, doc) => {
    acc[String(doc.projectKey)] = {
      reaction: doc.reaction || null,
      note: doc.note || "",
      updatedAt: doc.updatedAt || null
    };
    return acc;
  }, {});
}

export async function fetchFeedbackMap() {
  const response = await fetch(FEEDBACK_ENDPOINT);

  if (!response.ok) {
    throw new Error("Failed to load feedback.");
  }

  const docs = await response.json();
  return feedbackDocsToMap(Array.isArray(docs) ? docs : []);
}

export async function saveProjectFeedback(project, patch = {}) {
  const payload = {
    projectKey: getProjectFeedbackId(project),
    projectId: String(project?._id || project?.id || ""),
    title: String(project?.title || "Untitled Project"),
    reaction:
      patch?.reaction === "up" || patch?.reaction === "down"
        ? patch.reaction
        : null,
    note: typeof patch?.note === "string" ? patch.note : "",
    score:
      typeof project?.score === "number"
        ? project.score
        : Number(project?.score || 0),
    aiEnhanced: Boolean(project?.aiEnhanced),
    aiConfidence: Number.isFinite(Number(project?.aiConfidence))
      ? Number(project.aiConfidence)
      : null,
    difficulty: String(project?.difficulty || ""),
    projectType: String(project?.projectType || "")
  };

  const response = await fetch(`${FEEDBACK_ENDPOINT}/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to save feedback.");
  }

  const saved = await response.json();

  return {
    key: String(saved.projectKey),
    feedback: {
      reaction: saved.reaction || null,
      note: saved.note || "",
      updatedAt: saved.updatedAt || null
    }
  };
}