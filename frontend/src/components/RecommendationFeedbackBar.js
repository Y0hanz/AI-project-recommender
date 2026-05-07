// frontend/src/components/RecommendationFeedbackBar.js
import { useState } from "react";
import { submitRecommendationFeedback } from "../utils/feedbackApi";
import { buildRecommendationFeedbackPayload } from "../utils/recommendationFeedback";

function RecommendationFeedbackBar({
  project,
  preferences,
  sourcePage = "top_match"
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(feedbackType) {
    if (!project?._id) return;

    try {
      setIsSubmitting(true);
      setMessage("");

      const payload = buildRecommendationFeedbackPayload({
        project,
        preferences,
        sourcePage,
        feedbackType,
        comment
      });

      await submitRecommendationFeedback(payload);

      setSelectedType(feedbackType);
      setMessage("Feedback saved.");
    } catch (error) {
      setMessage(error.message || "Could not save feedback.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/38">
        Recommendation Feedback
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit("helpful")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            selectedType === "helpful"
              ? "border border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Helpful
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit("not_helpful")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            selectedType === "not_helpful"
              ? "border border-red-400/40 bg-red-400/15 text-red-200"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Not relevant
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit("favorite")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            selectedType === "favorite"
              ? "border border-brand-500/40 bg-brand-500/15 text-brand-200"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          Save favorite
        </button>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional note about why this recommendation was or wasn’t useful."
        className="mt-4 min-h-[92px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
      />

      {message && (
        <p className="mt-3 text-sm text-white/60">
          {message}
        </p>
      )}
    </div>
  );
}

export default RecommendationFeedbackBar;