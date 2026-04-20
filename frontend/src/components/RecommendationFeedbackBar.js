function buttonClasses(active, variant) {
  if (active && variant === "up") {
    return "border-emerald-400/35 bg-emerald-400/10 text-emerald-200";
  }

  if (active && variant === "down") {
    return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  }

  return "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white";
}

function RecommendationFeedbackBar({
  feedback,
  onVote,
  compact = false
}) {
  const reaction = feedback?.reaction || null;
  const hasNote =
    typeof feedback?.note === "string" && feedback.note.trim().length > 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        compact ? "" : "justify-between"
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onVote?.("up")}
          className={`rounded-full border px-3 py-2 text-xs font-medium transition ${buttonClasses(
            reaction === "up",
            "up"
          )}`}
        >
          👍 Helpful
        </button>

        <button
          type="button"
          onClick={() => onVote?.("down")}
          className={`rounded-full border px-3 py-2 text-xs font-medium transition ${buttonClasses(
            reaction === "down",
            "down"
          )}`}
        >
          👎 Needs Work
        </button>
      </div>

      {hasNote && (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/50">
          Note added
        </span>
      )}
    </div>
  );
}

export default RecommendationFeedbackBar;