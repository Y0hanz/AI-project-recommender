import { AnimatePresence, motion } from "framer-motion";

function LoadingScreen({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-md"
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
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Scoring project matches
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Building your recommendations...
            </h3>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingScreen;
