import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingScreen from "../components/LoadingScreen";
import {
  fetchRecommendations,
  savePreferences,
  saveRecommendations,
  getSavedPreferences
} from "../utils/api";

const languageOptions = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "PHP",
  "MongoDB",
  "Express",
  "HTML/CSS"
];

const interestOptions = [
  "AI",
  "Machine Learning",
  "Web Development",
  "Mobile Apps",
  "Data Visualization",
  "Automation",
  "Cybersecurity",
  "Games",
  "E-Commerce",
  "Education Tech"
];

const projectTypeOptions = [
  {
    value: "web",
    label: "Web App",
    copy: "Interfaces, dashboards, responsive systems."
  },
  {
    value: "mobile",
    label: "Mobile App",
    copy: "App-driven experiences for Android or iOS."
  },
  {
    value: "fullstack",
    label: "Full Stack",
    copy: "Frontend + backend architecture together."
  },
  {
    value: "ai",
    label: "AI Project",
    copy: "Recommendation, automation, intelligence."
  },
  {
    value: "data",
    label: "Data Project",
    copy: "Analytics, visualization, interpretation."
  },
  {
    value: "desktop",
    label: "Desktop App",
    copy: "Standalone software and utility tools."
  }
];

const difficultyOptions = [
  {
    value: "easy",
    label: "Easy",
    copy: "Fast to build, lighter technical depth."
  },
  {
    value: "medium",
    label: "Medium",
    copy: "Balanced challenge and scope."
  },
  {
    value: "hard",
    label: "Hard",
    copy: "Ambitious, deeper architecture and learning."
  }
];

const skillOptions = [
  {
    value: "beginner",
    label: "Beginner",
    copy: "Learning fundamentals and core workflows."
  },
  {
    value: "intermediate",
    label: "Intermediate",
    copy: "Comfortable building and combining tools."
  },
  {
    value: "advanced",
    label: "Advanced",
    copy: "Ready for bigger systems and complexity."
  }
];

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

function SectionHeading({ eyebrow, title, copy, count }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-brand-400">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">{copy}</p>
      </div>

      {typeof count === "number" && (
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/45">
          {count} selected
        </div>
      )}
    </div>
  );
}

function SelectChip({ active, label, copy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-target rounded-[1.6rem] border p-4 text-left transition duration-300 ${
        active
          ? "border-brand-500/60 bg-brand-500/10 text-white shadow-glow"
          : "border-white/10 bg-white/[0.03] text-white/68 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
            {label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/55">{copy}</p>
        </div>

        <div
          className={`mt-1 h-4 w-4 rounded-full border transition ${
            active
              ? "border-brand-400 bg-brand-500 shadow-[0_0_16px_rgba(255,90,31,0.35)]"
              : "border-white/20 bg-transparent"
          }`}
        />
      </div>
    </button>
  );
}

function ToggleCard({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-target rounded-2xl border px-4 py-4 text-left text-sm transition ${
        active
          ? "border-brand-500/60 bg-brand-500/10 text-white shadow-glow"
          : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <div
          className={`h-4 w-4 rounded-full border transition ${
            active
              ? "border-brand-400 bg-brand-500"
              : "border-white/20 bg-transparent"
          }`}
        />
      </div>
    </button>
  );
}

function QuestionnairePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    skill: "beginner",
    difficulty: "easy",
    projectType: "web",
    languages: [],
    interests: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = getSavedPreferences();
    if (saved) {
      setFormData({
        skill: saved.skill || "beginner",
        difficulty: saved.difficulty || "easy",
        projectType: saved.projectType || "web",
        languages: Array.isArray(saved.languages) ? saved.languages : [],
        interests: Array.isArray(saved.interests) ? saved.interests : []
      });
    }
    setHydrated(true);
  }, []);

  const completedCount = useMemo(() => {
    let count = 0;
    if (formData.skill) count += 1;
    if (formData.difficulty) count += 1;
    if (formData.projectType) count += 1;
    if (formData.languages.length > 0) count += 1;
    if (formData.interests.length > 0) count += 1;
    return count;
  }, [formData]);

  const progress = (completedCount / 5) * 100;
  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference - (progress / 100) * circumference;

  const handleCheckboxToggle = (field, value) => {
    setError("");
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value]
      };
    });
  };

  const validateForm = () => {
    if (!formData.skill) {
      return "Please choose your current skill level.";
    }
    if (!formData.difficulty) {
      return "Please choose a preferred difficulty.";
    }
    if (!formData.projectType) {
      return "Please choose a project type.";
    }
    if (!formData.languages.length) {
      return "Please select at least one language or technology.";
    }
    if (!formData.interests.length) {
      return "Please select at least one interest area.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        skill: formData.skill,
        difficulty: formData.difficulty,
        projectType: formData.projectType,
        languages: formData.languages,
        interests: formData.interests
      };

      const projects = await fetchRecommendations(payload);
      const sortedProjects = [...projects].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      );

      savePreferences(payload);
      saveRecommendations(sortedProjects);
      navigate("/results");
    } catch (err) {
      setError(err.message || "Unable to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen
        show={loading}
        title="Scoring your ideal builds..."
        subtitle="Mapping your experience, interests, and preferred stack into project recommendations."
      />

      <main className="relative min-h-screen overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute right-[-8%] top-[35%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,0,0.10),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_35%)]" />
        </div>

        <div className="container-shell">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-7xl"
          >
            <div className="mb-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-brand-400">
                  Guided Questionnaire
                </p>
                <h1 className="text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
                  Shape the direction
                  <span className="block text-white/45">of your next build.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                  Tell the recommendation engine how you want to work — your skill,
                  your preferred challenge, your project format, and the tools or
                  domains you want to explore.
                </p>

                {hydrated && (
                  <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/45">
                    {getSavedPreferences()
                      ? "Saved preferences restored"
                      : "Fresh session"}
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-[2rem] p-5 shadow-soft sm:p-6">
                <div className="grid gap-6 sm:grid-cols-[120px_1fr] sm:items-center">
                  <div className="relative mx-auto h-[120px] w-[120px]">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        fill="none"
                        stroke="#ff5a1f"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 0.45s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">
                        {Math.round(progress)}%
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Complete
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/38">
                      Progress Tracker
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-white">
                      Build your profile
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      Complete all five recommendation dimensions for the strongest
                      matches. Your selections are saved locally so you can return
                      and refine them later.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        { label: "Skill", active: !!formData.skill },
                        { label: "Difficulty", active: !!formData.difficulty },
                        { label: "Type", active: !!formData.projectType },
                        { label: "Stack", active: formData.languages.length > 0 },
                        { label: "Interests", active: formData.interests.length > 0 }
                      ].map((item) => (
                        <span
                          key={item.label}
                          className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
                            item.active
                              ? "border border-brand-500/30 bg-brand-500/10 text-brand-200"
                              : "border border-white/10 bg-white/5 text-white/38"
                          }`}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <SectionHeading
                  eyebrow="Experience Level"
                  title="How strong is your current foundation?"
                  copy="This helps the recommender align project scope with your current confidence."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  {skillOptions.map((option) => (
                    <SelectChip
                      key={option.value}
                      active={formData.skill === option.value}
                      label={option.label}
                      copy={option.copy}
                      onClick={() => {
                        setError("");
                        setFormData((prev) => ({ ...prev, skill: option.value }));
                      }}
                    />
                  ))}
                </div>
              </motion.section>

              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <SectionHeading
                  eyebrow="Preferred Challenge"
                  title="How difficult should the project feel?"
                  copy="Choose the level of complexity you want the engine to prioritize."
                />

                <div className="grid gap-4 md:grid-cols-3">
                  {difficultyOptions.map((option) => (
                    <SelectChip
                      key={option.value}
                      active={formData.difficulty === option.value}
                      label={option.label}
                      copy={option.copy}
                      onClick={() => {
                        setError("");
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: option.value
                        }));
                      }}
                    />
                  ))}
                </div>
              </motion.section>

              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <SectionHeading
                  eyebrow="Project Format"
                  title="What kind of project do you want to build?"
                  copy="This lets the engine narrow the recommendation shape before scoring the details."
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projectTypeOptions.map((option) => (
                    <SelectChip
                      key={option.value}
                      active={formData.projectType === option.value}
                      label={option.label}
                      copy={option.copy}
                      onClick={() => {
                        setError("");
                        setFormData((prev) => ({
                          ...prev,
                          projectType: option.value
                        }));
                      }}
                    />
                  ))}
                </div>
              </motion.section>

              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <SectionHeading
                  eyebrow="Preferred Stack"
                  title="Which languages or technologies should appear?"
                  copy="Select the technologies you want reflected in the recommended projects."
                  count={formData.languages.length}
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {languageOptions.map((language) => (
                    <ToggleCard
                      key={language}
                      active={formData.languages.includes(language)}
                      label={language}
                      onClick={() => handleCheckboxToggle("languages", language)}
                    />
                  ))}
                </div>
              </motion.section>

              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <SectionHeading
                  eyebrow="Interest Areas"
                  title="What themes should the ideas revolve around?"
                  copy="These interest signals strongly influence the final recommendation ranking."
                  count={formData.interests.length}
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {interestOptions.map((interest) => (
                    <ToggleCard
                      key={interest}
                      active={formData.interests.includes(interest)}
                      label={interest}
                      onClick={() => handleCheckboxToggle("interests", interest)}
                    />
                  ))}
                </div>
              </motion.section>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200"
                >
                  {error}
                </motion.div>
              )}

              <motion.section
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-brand-400">
                      Finalize & Generate
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                      Ready to see your recommendations?
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
                      Submit your profile and the engine will score and return the
                      strongest project matches for your current direction.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`cursor-target inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition duration-300 ${
                        loading
                          ? "cursor-not-allowed bg-brand-700/70 opacity-70"
                          : "bg-brand-500 hover:scale-[1.03] hover:bg-brand-400 hover:shadow-glow"
                      }`}
                    >
                      {loading ? "Generating..." : "Generate Recommendations"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setFormData({
                          skill: "beginner",
                          difficulty: "easy",
                          projectType: "web",
                          languages: [],
                          interests: []
                        });
                      }}
                      className="cursor-target btn-secondary"
                    >
                      Reset Form
                    </button>
                  </div>
                </div>
              </motion.section>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default QuestionnairePage;
