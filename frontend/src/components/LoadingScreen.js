import { AnimatePresence, motion } from "framer-motion";

function LoadingScreen({
  show,
  title = "Loading...",
  subtitle = "Please wait while we process your request."
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/86 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <motion.div
              className="mx-auto mb-6 h-16 w-16 rounded-full border-2 border-white/10 border-t-brand-500"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />

            <p className="text-[11px] uppercase tracking-[0.34em] text-white/35">
              Recommendation Engine
            </p>

            <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              {title}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/55">
              {subtitle}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingScreen;
