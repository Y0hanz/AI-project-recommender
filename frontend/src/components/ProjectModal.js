import { motion } from "framer-motion";

function ProjectModal({ project, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] p-6 shadow-soft sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="pr-12">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-300">
              {project.difficulty}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              {project.projectType || "Project"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
              Score {project.score ?? 0}
            </span>
          </div>

          <h2 className="text-3xl font-black text-white sm:text-4xl">
            {project.title}
          </h2>

          <p className="mt-5 text-base leading-8 text-white/68">
            {project.description}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40">
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

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40">
                Difficulty
              </p>
              <p className="text-lg font-semibold text-white">
                {project.difficulty || "Not specified"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:col-span-2">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40">
                Key Features
              </p>
              <p className="text-sm leading-7 text-white/68">
                {project.features || "No additional features listed."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:col-span-2">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40">
                Learning Outcomes
              </p>
              <p className="text-sm leading-7 text-white/68">
                {project.learning || "No learning outcomes listed."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProjectModal;
