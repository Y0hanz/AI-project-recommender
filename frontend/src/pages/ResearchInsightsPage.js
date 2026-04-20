import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getSavedRecommendations } from "../utils/api";
import { sortRecommendedProjects } from "../utils/projectInsights";
import { buildFeedbackAnalytics } from "../utils/recommendationFeedback";
import { fetchFeedbackMap } from "../utils/feedbackApi";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function MetricCard({ label, value, sublabel }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {sublabel && (
        <p className="mt-2 text-sm text-white/45">{sublabel}</p>
      )}
    </div>
  );
}

function ProjectSignalList({ title, items, emptyText, tone = "default" }) {
  const toneClasses =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-400/5"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-300/5"
        : "border-white/10 bg-black/25";

  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneClasses}`}>
      <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/40">
        {title}
      </p>

      {!items.length ? (
        <p className="text-sm leading-7 text-white/55">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.reaction || "note"}`}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  {item.title}
                </h3>

                <div className="flex flex-wrap gap-2">
                  {item.aiEnhanced && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                      Gemini
                    </span>
                  )}

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                    Score {typeof item.score === "number" ? item.score.toFixed(1) : item.score}
                  </span>
                </div>
              </div>

              {(item.note || item.reaction) && (
                <div className="mt-3">
                  {item.reaction && (
                    <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                      Reaction: {item.reaction === "up" ? "Helpful" : "Needs Work"}
                    </p>
                  )}

                  {item.note && (
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      {item.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchInsightsPage() {
  const [projects, setProjects] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const savedProjects = getSavedRecommendations();
    setProjects(sortRecommendedProjects(savedProjects || []));

    const loadFeedback = async () => {
      try {
        const map = await fetchFeedbackMap();
        setFeedbackMap(map);
      } catch (error) {
        console.error(error);
        setLoadError(error.message || "Failed to load research insights.");
      }
    };

    loadFeedback();
  }, []);

  const analytics = useMemo(
    () => buildFeedbackAnalytics(projects, feedbackMap),
    [projects, feedbackMap]
  );

  const hasAnyFeedback = analytics.summary.totalResponses > 0 || analytics.summary.notesCount > 0;

  return (
    <main className="relative min-h-screen overflow-hidden pb-20 pt-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-[8%] right-[-5%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      <div className="container-shell">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-400">
                Research Dashboard
              </p>
              <h1 className="text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
                Evaluation and
                <span className="block text-white/45">feedback insights.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                This view turns recommendation feedback into thesis-ready
                evaluation signals: positive reactions, weak matches, note themes,
                and recent reviewer activity.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/results" className="btn-primary cursor-target">
                Back to Results
              </Link>
              <Link to="/questionnaire" className="btn-secondary cursor-target">
                Run New Test
              </Link>
            </div>
          </div>

          {loadError && (
            <div className="mb-6 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
              {loadError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Helpful Votes"
              value={analytics.summary.helpfulCount}
              sublabel="Recommendations rated helpful"
            />
            <MetricCard
              label="Needs Work"
              value={analytics.summary.needsWorkCount}
              sublabel="Recommendations that need refinement"
            />
            <MetricCard
              label="Gemini Enhanced"
              value={analytics.geminiEnhancedCount}
              sublabel="AI-enriched projects in current set"
            />
            <MetricCard
              label="Avg AI Confidence"
              value={
                analytics.averageAiConfidence !== null
                  ? `${analytics.averageAiConfidence}%`
                  : "—"
              }
              sublabel="Average Gemini confidence across current set"
            />
          </div>
        </motion.section>

        {!hasAnyFeedback ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[2rem] p-10 text-center"
          >
            <h2 className="text-2xl font-bold text-white">
              No evaluation data yet
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/58">
              Open the Results page, vote on a few recommendations, and add notes
              in the modal. This dashboard will then summarize the strongest
              signals for your thesis discussion.
            </p>

            <Link to="/results" className="btn-primary mt-8 cursor-target">
              Go to Results
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="grid gap-6 xl:grid-cols-2"
            >
              <ProjectSignalList
                title="Positive Signals"
                items={analytics.helpfulProjects.slice(0, 5)}
                emptyText="No projects have been marked helpful yet."
                tone="positive"
              />

              <ProjectSignalList
                title="Weak Match Signals"
                items={analytics.needsWorkProjects.slice(0, 5)}
                emptyText="No projects have been marked as needing work yet."
                tone="warning"
              />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
                <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/40">
                  Common Note Themes
                </p>

                {!analytics.noteThemes.length ? (
                  <p className="text-sm leading-7 text-white/55">
                    No recurring note themes detected yet. Add more evaluator
                    notes from the Results modal to surface stronger patterns.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {analytics.noteThemes.map((theme) => (
                      <div
                        key={theme.label}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                      >
                        {theme.label} · {theme.count}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
                <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/40">
                  Recent Evaluator Activity
                </p>

                {!analytics.recentActivity.length ? (
                  <p className="text-sm leading-7 text-white/55">
                    No recent activity yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((item) => (
                      <div
                        key={`${item.id}-${item.updatedAt}`}
                        className="rounded-2xl border border-white/10 bg-black/25 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-white">
                            {item.title}
                          </h3>

                          <span className="text-xs text-white/40">
                            {formatDate(item.updatedAt)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.reaction && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
                              {item.reaction === "up" ? "Helpful" : "Needs Work"}
                            </span>
                          )}

                          {item.aiEnhanced && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                              Gemini
                            </span>
                          )}

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                            {item.difficulty || "N/A"}
                          </span>
                        </div>

                        {item.note && (
                          <p className="mt-3 text-sm leading-7 text-white/60">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/40">
                Thesis Interpretation Layer
              </p>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <h3 className="text-lg font-semibold text-white">
                    What this shows
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    This dashboard translates recommendation interactions into
                    measurable evaluation signals: approval, rejection, written
                    critique, and emerging feedback themes.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <h3 className="text-lg font-semibold text-white">
                    Why it matters
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    It strengthens your thesis by showing that the system is not
                    only generating recommendations, but also collecting
                    structured evidence about recommendation quality.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <h3 className="text-lg font-semibold text-white">
                    Future extension
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    The next logical step is feeding this evaluation data into a
                    backend analytics store so you can compare sessions,
                    participants, and model iterations over time.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </main>
  );
}

export default ResearchInsightsPage;