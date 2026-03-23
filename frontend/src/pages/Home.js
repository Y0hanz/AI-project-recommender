import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const dots = Array.from({ length: 28 }, (_, i) => i);

function Home() {
  return (
    <main className="relative overflow-hidden">
      <section className="noise-overlay relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid hero-grid opacity-[0.08]" />
        <div className="absolute inset-0 bg-radial-brand opacity-80" />

        {dots.map((dot) => (
          <motion.div
            key={dot}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/40"
            initial={{
              x: `${(dot * 13) % 100}%`,
              y: `${(dot * 17) % 100}%`,
              opacity: 0.15 + (dot % 5) * 0.08
            }}
            animate={{
              y: [
                `${(dot * 17) % 100}%`,
                `${((dot * 17) % 100) + ((dot % 3) + 2)}%`,
                `${(dot * 17) % 100}%`
              ],
              x: [
                `${(dot * 13) % 100}%`,
                `${((dot * 13) % 100) + ((dot % 4) + 1)}%`,
                `${(dot * 13) % 100}%`
              ]
            }}
            transition={{
              duration: 5 + (dot % 6),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        <div className="container-shell relative z-10 flex min-h-[92vh] items-center py-20">
          <div className="grid w-full items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-4xl">
              <motion.p
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mb-6 inline-flex rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-brand-300"
              >
                Intelligent Thesis Showcase
              </motion.p>

              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="max-w-5xl text-5xl font-black leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]"
              >
                AI Project
                <br />
                Recommender —
                <br />
                <span className="text-brand-500">Projects That Move You</span>
              </motion.h1>

              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-8 max-w-2xl text-base leading-8 text-white/65 sm:text-lg"
              >
                A premium interactive recommender for students and creators.
                Match your skills, interests, preferred tech stack, and project
                type with curated ideas scored by your backend recommendation
                engine.
              </motion.p>

              <motion.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-10 flex flex-col gap-4 sm:flex-row"
              >
                <Link to="/questionnaire" className="btn-primary">
                  Start Recommending
                </Link>
                <a href="#about" className="btn-secondary">
                  About the Project
                </a>
              </motion.div>

              <motion.div
                custom={4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-12 flex flex-wrap gap-3"
              >
                {["Node + Express", "MongoDB", "Framer Motion", "Tailwind UI"].map(
                  (item) => (
                    <span key={item} className="tag-pill">
                      {item}
                    </span>
                  )
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6 shadow-soft">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-white/5" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                        Recommendation Engine
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        Live Preference Mapping
                      </h3>
                    </div>
                    <div className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
                      Active
                    </div>
                  </div>

                  {[
                    {
                      label: "Skill Match",
                      value: "Advanced",
                      width: "86%"
                    },
                    {
                      label: "Tech Alignment",
                      value: "React / JS / Python",
                      width: "92%"
                    },
                    {
                      label: "Interest Fit",
                      value: "AI / Web / Analytics",
                      width: "78%"
                    }
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/65">{item.label}</span>
                        <span className="text-white">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: item.width }}
                          transition={{ duration: 1.1, delay: 0.25 }}
                          className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-orange-300"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Top Score
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">9.6</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Results
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">10</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="about" className="relative py-24">
        <div className="container-shell">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7 }}
            >
              <p className="mb-3 text-sm uppercase tracking-[0.24em] text-brand-400">
                About the Project
              </p>
              <h2 className="section-title">
                Built for discovery, clarity, and momentum.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="space-y-6"
            >
              <p className="section-copy">
                This thesis project transforms a traditional recommendation flow
                into an immersive product experience. Instead of browsing random
                ideas, users submit a focused profile of their skill level,
                desired challenge, preferred technologies, and interests.
              </p>
              <p className="section-copy">
                The backend scores each project using your MongoDB dataset and
                returns the strongest matches. The interface then presents those
                results through motion, hierarchy, and premium visual feedback
                that feels crafted for live demo presentations.
              </p>
              <Link to="/questionnaire" className="btn-primary mt-2">
                Launch Questionnaire
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
