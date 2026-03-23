import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingScreen from "../components/LoadingScreen";
import {
  fetchRecommendations,
  savePreferences,
  saveRecommendations
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
  "web",
  "mobile",
  "fullstack",
  "ai",
  "data",
  "desktop"
];

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

  const completedCount = useMemo(() => {
    let count = 0;
    if (formData.skill) count += 1;
    if (formData.difficulty) count += 1;
    if (formData.projectType) count += 1;
    if (formData.languages.length) count += 1;
    if (formData.interests.length) count += 1;
    return count;
  }, [formData]);

  const progress = `${(completedCount / 5) * 100}%`;

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.interests.length) {
      setError("Please select at least one interest.");
      return;
    }

    if (!formData.difficulty) {
      setError("Please choose a difficulty.");
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
      <LoadingScreen show={loading} />
      <main className="relative min-h-screen py-16">
        <div className="container-shell">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-5xl"
          >
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 text-sm uppercase tracking-[0.22em] text-brand-400">
                  Questionnaire
                </p>
                <h1 className="text-4xl font-black text-white sm:text-5xl">
                  Shape your next build.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
                  Tell the engine how you want to work — your skill level,
                  preferred challenge, project type, stack, and interests.
                </p>
              </div>

              <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-white/60">Completion</span>
                  <span className="font-semibold text-white">
                    {completedCount}/5
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: progress }}
                    transition={{ duration: 0.5 }}
                    className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-orange-300"
                  />
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="glass-panel rounded-[2rem] p-6 shadow-soft sm:p-8"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <label className="mb-3 block text-sm font-medium text-white/80">
                    Skill Level
                  </label>
                  <select
                    name="skill"
                    value={formData.skill}
                    onChange={handleSelectChange}
                    className="input-dark"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <label className="mb-3 block text-sm font-medium text-white/80">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleSelectChange}
                    className="input-dark"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 md:col-span-2">
                  <label className="mb-3 block text-sm font-medium text-white/80">
                    Project Type
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {projectTypeOptions.map((type) => {
                      const active = formData.projectType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              projectType: type
                            }))
                          }
                          className={`rounded-2xl border px-4 py-4 text-left text-sm capitalize transition ${
                            active
                              ? "border-brand-500/60 bg-brand-500/10 text-white shadow-glow"
                              : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 md:col-span-2">
                  <label className="mb-4 block text-sm font-medium text-white/80">
                    Preferred Languages / Technologies
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {languageOptions.map((language) => {
                      const checked = formData.languages.includes(language);
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() =>
                            handleCheckboxToggle("languages", language)
                          }
                          className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                            checked
                              ? "border-brand-500/60 bg-brand-500/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {language}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 md:col-span-2">
                  <label className="mb-4 block text-sm font-medium text-white/80">
                    Interests
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {interestOptions.map((interest) => {
                      const checked = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() =>
                            handleCheckboxToggle("interests", interest)
                          }
                          className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                            checked
                              ? "border-brand-500/60 bg-brand-500/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button type="submit" className="btn-primary">
                  Generate Recommendations
                </button>
                <p className="text-sm text-white/45">
                  Results will be saved locally for quick reload and regeneration.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default QuestionnairePage;
