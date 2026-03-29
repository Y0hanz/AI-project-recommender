import { motion } from "framer-motion";

const overlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modal = {
  hidden: { opacity: 0, y: 30, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.99,
    transition: {
      duration: 0.22
    }
  }
};

function ProjectModal({ project, onClose }) {
  const score = Number(project.score || 0);

  return (
    <motion.div
      variants={overlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-lg"
      onClick={onClose}
    >
      <motion.div
        variants={modal}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="glass-panel relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] p-6 shadow-soft sm:p-8"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.14),transparent_28%),linear-gradient(to_bottom_right,rgba(255,255,255,0.02),transparent_35%)]" />

        <button
          onClick={onClose}
          className="cursor-target absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="relative pr-12">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-brand-300">
              Detailed Brief
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              {project.projectType || "Project"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">
              {project.difficulty || "N/A"}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                {project.title}
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/67 sm:text-base">
                {project.description}
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/38">
                  Technologies
                </p>
                <div className="flex flex-wrap gap-2">
                  {(project.technologies || []).map((tech) => (
                    <span key={tech} className="tag-pill">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">
                    Match Score
                  </p>
                  <p className="mt-3 text-4xl font-black text-white">
                    {score.toFixed(1)}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">
                    Difficulty
                  </p>
                  <p className="mt-3 text-lg font-semibold capitalize text-white">
                    {project.difficulty || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/38">
                  Key Features
                </p>
                <p className="text-sm leading-7 text-white/66">
                  {project.features || "No additional feature breakdown was provided for this project."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/38">
                  Learning Path
                </p>
                <p className="text-sm leading-7 text-white/66">
                  {project.learning || "No learning path was defined yet. You can frame this around architecture, tooling, and implementation depth in your presentation."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProjectModal;
