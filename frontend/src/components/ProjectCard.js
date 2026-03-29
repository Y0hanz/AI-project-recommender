import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

function ProjectCard({ project, onOpen, index }) {
  const score = Number(project.score || 0);

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className="group glass-panel relative overflow-hidden rounded-[1.8rem] p-6 shadow-soft"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.16),transparent_35%),linear-gradient(to_bottom_right,rgba(255,255,255,0.03),transparent_35%)] opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-brand-300">
                #{index + 1}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
                {project.difficulty || "N/A"}
              </span>
            </div>

            <h3 className="max-w-[14ch] text-2xl font-bold leading-tight text-white">
              {project.title}
            </h3>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
              Score
            </p>
            <p className="text-xl font-black text-white">{score.toFixed(1)}</p>
          </div>
        </div>

        <p className="mb-5 line-clamp-4 text-sm leading-7 text-white/63">
          {project.description}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {(project.technologies || []).slice(0, 5).map((tech) => (
            <span key={tech} className="tag-pill">
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/35">
            {project.projectType || "Project"}
          </div>
          <button onClick={onOpen} className="btn-secondary cursor-target">
            View Details
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default ProjectCard;
