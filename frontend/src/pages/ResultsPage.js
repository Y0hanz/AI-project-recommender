// frontend/src/pages/ResultsPage.js
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform
} from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import RecommendationFeedbackBar from "../components/RecommendationFeedbackBar";
import LoadingScreen from "../components/LoadingScreen";
import {
  fetchRecommendations,
  getSavedPreferences,
  getSavedRecommendations,
  saveRecommendations
} from "../utils/api";

const pageReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12
    }
  }
};

function ResultsPage() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [gridKey, setGridKey] = useState(0);
  const [savedPreferences, setSavedPreferences] = useState(null);

  const heroRef = useRef(null);
  const autoRetryRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.74]);

  const requestFreshResults = async (prefs, { silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setNotice("");
      }

      const freshProjects = await fetchRecommendations(prefs);

      saveRecommendations(freshProjects);
      setProjects(freshProjects);
      setSavedPreferences(prefs);
      setGridKey((prev) => prev + 1);

      const anyGemini = freshProjects.some((item) => item?.geminiAvailable === true);

      if (!anyGemini) {
        setNotice("Gemini enrichment is still unavailable. Showing deterministic fallback results.");
      } else {
        setNotice("");
      }
    } catch (err) {
      setNotice(err.message || "Failed to regenerate recommendations.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const saved = getSavedRecommendations();
    const prefs = getSavedPreferences();

    if (prefs) {
      setSavedPreferences(prefs);
    }

    if (!saved.length) {
      return;
    }

    setProjects(saved);

    const anyGemini = saved.some((item) => item?.geminiAvailable === true);

    if (!anyGemini) {
      setNotice("Cached fallback results detected. Retrying fresh recommendations...");

      if (prefs && !autoRetryRef.current) {
        autoRetryRef.current = true;
        requestFreshResults(prefs, { silent: true });
      }
    }
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aRank = Number.isFinite(Number(a.uiRank)) ? Number(a.uiRank) : null;
      const bRank = Number.isFinite(Number(b.uiRank)) ? Number(b.uiRank) : null;

      if (a.geminiAvailable && b.geminiAvailable && aRank !== null && bRank !== null) {
        return aRank - bRank;
      }

      if (a.geminiAvailable && !b.geminiAvailable) return -1;
      if (!a.geminiAvailable && b.geminiAvailable) return 1;

      return (b.score || 0) - (a.score || 0);
    });
  }, [projects]);

  const topProject = sortedProjects[0] || null;
  const topConfidence = Math.round(Number(topProject?.geminiConfidence || 0));
  const topFitSummary =
    topProject?.geminiFitSummary ||
    topProject?.fitSummary ||
    "No AI fit summary available.";

  const handleRegenerate = async () => {
    const prefs = getSavedPreferences();

    if (!prefs) {
      setNotice("No saved questionnaire data found. Complete the questionnaire first.");
      return;
    }

    await requestFreshResults(prefs);
  };

  return (
    <>
      <LoadingScreen
        show={loading}
        title="Scoring your ideal builds..."
        subtitle="Re-matching difficulty, stack, and interests in real time."
      />

      <main className="relative min-h-screen overflow-hidden pb-20 pt-10">
        <motion.div
          style={{ y: bgY }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-[-10%] top-[8%] h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute bottom-[12%] right-[-6%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,0,0.10),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_30%)]" />
        </motion.div>

        <div className="container-shell">
          <motion.section
            ref={heroRef}
            variants={pageReveal}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
              <div className="max-w-3xl">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-400">
                  Recommendation Output
                </p>
                <h1 className="text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
                  Projects matched
                  <span className="block text-white/45">to your creative direction.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                  Ranked by your backend engine using deterministic scoring and Gemini enrichment when available.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleRegenerate}
                  className="btn-primary cursor-target"
                >
                  Regenerate Results
                </button>
                <Link to="/questionnaire" className="btn-secondary cursor-target">
                  Refine Preferences
                </Link>
              </div>
            </motion.div>

            {notice && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-100"
              >
                {notice}
              </motion.div>
            )}

            {topProject && (
              <motion.div
                style={{ y: panelY }}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel relative overflow-hidden rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/12 via-transparent to-white/[0.02]" />
                <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-300">
                        Top Match
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/50">
                        {topProject.projectType || "Project"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${
                          topProject.geminiAvailable
                            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                            : "border border-amber-400/30 bg-amber-400/10 text-amber-200"
                        }`}
                      >
                        {topProject.geminiAvailable ? "Gemini" : "Fallback"}
                      </span>
                    </div>

                    <h2 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
                      {topProject.title}
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/63 sm:text-base">
                      {topProject.description}
                    </p>

                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">
                        Gemini Fit Summary
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/70">
                        {topFitSummary}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {(topProject.technologies || []).slice(0, 6).map((tech) => (
                        <span key={tech} className="tag-pill">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <RecommendationFeedbackBar
                      project={topProject}
                      preferences={savedPreferences}
                      sourcePage="top_match"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                        Score
                      </p>
                      <p className="mt-3 text-4xl font-black text-white">
                        {Number(topProject.score || 0).toFixed(1)}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                        AI Confidence
                      </p>
                      <p className="mt-3 text-4xl font-black text-white">
                        {topConfidence}%
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                        Action
                      </p>
                      <button
                        onClick={() => setActiveProject(topProject)}
                        className="cursor-target mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-brand-500/40 hover:bg-white/10"
                      >
                        Open full brief
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>

          {!sortedProjects.length ? (
            <motion.div
              variants={pageReveal}
              initial="hidden"
              animate="visible"
              className="glass-panel rounded-[2rem] p-10 text-center"
            >
              <h2 className="text-2xl font-bold text-white">No recommendations yet</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/60">
                Complete the questionnaire to generate projects tailored to your
                skill level, preferred technologies, and interests.
              </p>
              <Link to="/questionnaire" className="btn-primary cursor-target mt-8">
                Start Questionnaire
              </Link>
            </motion.div>
          ) : (
            <motion.section
              key={gridKey}
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="mt-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mb-5 flex items-center justify-between"
              >
                <h3 className="text-xl font-semibold text-white sm:text-2xl">
                  Ranked project cards
                </h3>
                <p className="text-sm text-white/40">
                  {sortedProjects.length} result{sortedProjects.length !== 1 ? "s" : ""}
                </p>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedProjects.map((project, index) => (
                  <ProjectCard
                    key={`${project._id || project.title}-${index}-${gridKey}`}
                    project={project}
                    index={index}
                    onOpen={() => setActiveProject(project)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </div>

        <AnimatePresence>
          {activeProject && (
            <ProjectModal
              project={activeProject}
              onClose={() => setActiveProject(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default ResultsPage;