import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import LoadingScreen from "../components/LoadingScreen";
import {
  fetchRecommendations,
  getSavedPreferences,
  getSavedRecommendations,
  saveRecommendations,
  shuffleProjects
} from "../utils/api";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

function ResultsPage() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = getSavedRecommendations();
    if (saved.length) {
      setProjects(saved);
    }
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [projects]);

  const handleRegenerate = async () => {
    const prefs = getSavedPreferences();

    if (!prefs) {
      setNotice("No saved questionnaire data found. Please complete the form first.");
      return;
    }

    try {
      setLoading(true);
      setNotice("");

      const freshProjects = await fetchRecommendations(prefs);
      const randomized = shuffleProjects(freshProjects);
      saveRecommendations(randomized);
      setProjects(randomized);
    } catch (err) {
      setNotice(err.message || "Failed to regenerate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen show={loading} />
      <main className="relative min-h-screen py-16">
        <div className="container-shell">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.22em] text-brand-400">
                Results
              </p>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                Your recommended projects.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
                Scored by your backend based on difficulty, project type,
                technologies, and interest alignment.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={handleRegenerate} className="btn-primary">
                Regenerate
              </button>
              <Link to="/questionnaire" className="btn-secondary">
                Edit Preferences
              </Link>
            </div>
          </motion.div>

          {notice && (
            <div className="mb-6 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
              {notice}
            </div>
          )}

          {!sortedProjects.length ? (
            <div className="glass-panel rounded-[2rem] p-10 text-center">
              <h2 className="text-2xl font-bold text-white">No results yet</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/60">
                Complete the questionnaire to generate project recommendations
                tailored to your preferences.
              </p>
              <Link to="/questionnaire" className="btn-primary mt-8">
                Go to Questionnaire
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {sortedProjects.map((project, index) => (
                <ProjectCard
                  key={`${project._id || project.title}-${index}`}
                  project={project}
                  index={index}
                  onOpen={() => setActiveProject(project)}
                />
              ))}
            </motion.div>
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
