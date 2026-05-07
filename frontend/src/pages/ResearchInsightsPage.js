import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getSavedRecommendations } from "../utils/api";
import { fetchFeedbackMap } from "../utils/feedbackApi";
import { buildFeedbackAnalytics } from "../utils/recommendationFeedback";

function StatCard({ label, value, subtext = "" }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">
        {value}
      </p>
      {subtext ? (
        <p className="mt-2 text-sm text-white/55">{subtext}</p>
      ) : null}
    </div>
  );
}

function ResearchInsightsPage() {
  const [projects, setProjects] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setNotice("");

        const savedProjects = getSavedRecommendations();
        const fetchedFeedbackMap = await fetchFeedbackMap();

        if (!isMounted) return;

        setProjects(Array.isArray(savedProjects) ? savedProjects : []);
        setFeedbackMap(
          fetchedFeedbackMap && typeof fetchedFeedbackMap === "object"
            ? fetchedFeedbackMap
            : {}
        );
      } catch (error) {
        if (!isMounted) return;
        setNotice(error.message || "Failed to load research insights.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = useMemo(() => {
    return buildFeedbackAnalytics(projects, feedbackMap);
  }, [projects, feedbackMap]);

  const overview = analytics?.overview || {
    totalProjects: 0,
    projectsWithFeedback: 0,
    totalResponses: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    favoriteCount: 0,
    helpfulRate: 0,
    favoriteRate: 0
  };

  const projectRows = Array.isArray(analytics?.byProject) ? analytics.byProject : [];

  return (
    <main className="relative min-h-screen overflow-hidden pb-20 pt-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[8%] h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-[12%] right-[-6%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,0,0.10),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_30%)]" />
      </div>

      <div className="container-shell">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-400">
                Research Insights
              </p>
              <h1 className="text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
                Recommendation feedback
                <span className="block text-white/45">and evaluation signals.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                This page summarizes user reactions to recommendations so you can evaluate
                relevance, confidence, and which projects resonate the most.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/results" className="btn-secondary cursor-target">
                Back to Results
              </Link>
              <Link to="/questionnaire" className="btn-primary cursor-target">
                New Test Run
              </Link>
            </div>
          </div>

          {notice ? (
            <div className="mb-6 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className="glass-panel rounded-[2rem] p-10 text-center text-white/65">
              Loading insights...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Responses"
                  value={overview.totalResponses}
                  subtext="All saved feedback events"
                />
                <StatCard
                  label="Helpful Rate"
                  value={`${overview.helpfulRate}%`}
                  subtext={`${overview.helpfulCount} helpful votes`}
                />
                <StatCard
                  label="Favorite Rate"
                  value={`${overview.favoriteRate}%`}
                  subtext={`${overview.favoriteCount} saved favorites`}
                />
                <StatCard
                  label="Projects With Feedback"
                  value={overview.projectsWithFeedback}
                  subtext={`${overview.totalProjects} projects in current result set`}
                />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <StatCard
                  label="Helpful"
                  value={overview.helpfulCount}
                  subtext="Positive recommendation signals"
                />
                <StatCard
                  label="Not Relevant"
                  value={overview.notHelpfulCount}
                  subtext="Negative recommendation signals"
                />
                <StatCard
                  label="Favorites"
                  value={overview.favoriteCount}
                  subtext="Projects users wanted to keep"
                />
              </div>

              <div className="glass-panel mt-10 rounded-[2rem] p-6 shadow-soft sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    Project-level feedback
                  </h2>
                  <p className="text-sm text-white/40">
                    {projectRows.length} tracked project
                    {projectRows.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {!projectRows.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white/60">
                    No research feedback has been collected yet. Save a few “Helpful”,
                    “Not relevant”, or “Favorite” responses from the results page first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.18em] text-white/35">
                          <th className="px-4 py-2">Project</th>
                          <th className="px-4 py-2">Responses</th>
                          <th className="px-4 py-2">Helpful</th>
                          <th className="px-4 py-2">Not Relevant</th>
                          <th className="px-4 py-2">Favorites</th>
                          <th className="px-4 py-2">AI Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectRows.map((project) => (
                          <tr
                            key={project._id}
                            className="rounded-2xl border border-white/10 bg-black/20 text-white"
                          >
                            <td className="rounded-l-2xl px-4 py-4 align-top">
                              <div className="font-semibold">{project.title}</div>
                              <div className="mt-1 text-sm text-white/50">
                                {project.projectType || "Project"}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-white/80">
                              {project.feedback?.totalResponses ?? 0}
                            </td>
                            <td className="px-4 py-4 text-white/80">
                              {project.feedback?.helpfulCount ?? 0}
                            </td>
                            <td className="px-4 py-4 text-white/80">
                              {project.feedback?.notHelpfulCount ?? 0}
                            </td>
                            <td className="px-4 py-4 text-white/80">
                              {project.feedback?.favoriteCount ?? 0}
                            </td>
                            <td className="rounded-r-2xl px-4 py-4 text-white/80">
                              {Number(project.feedback?.avgGeminiConfidence || 0).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.section>
      </div>
    </main>
  );
}

export default ResearchInsightsPage;