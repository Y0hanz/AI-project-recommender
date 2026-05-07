import { useEffect, useState } from "react";
import DevLabAccessModal from "./DevLabAccessModal";
import { verifyDevLabAccess } from "../utils/devLabAuth";

function ProtectedDevRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      const valid = await verifyDevLabAccess();

      if (!mounted) return;

      setAllowed(valid);
      setLoading(false);
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="container-shell py-16">
        <div className="glass-panel rounded-[2rem] p-8 text-center text-white/60">
          Verifying developer access...
        </div>
      </main>
    );
  }

  if (allowed) {
    return children;
  }

  return (
    <>
      <main className="container-shell py-16">
        <div className="glass-panel rounded-[2rem] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-400">
            Restricted
          </p>
          <h1 className="mt-4 text-3xl font-black text-white">
            Developer access required
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            This page is reserved for internal testing and evaluation.
          </p>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary cursor-target mt-8"
          >
            Unlock Dev Lab
          </button>
        </div>
      </main>

      <DevLabAccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default ProtectedDevRoute;