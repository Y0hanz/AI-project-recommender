import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DevLabAccessModal from "./DevLabAccessModal";
import { clearDevLabAccess, hasDevLabToken } from "../utils/devLabAuth";

function DevLabLauncher() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const unlocked = useMemo(() => hasDevLabToken(), [refreshKey]);

  function handleLock() {
    clearDevLabAccess();
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col items-end gap-3">
        {unlocked ? (
          <>
            <Link to="/evaluation-lab" className="btn-primary cursor-target">
              Dev Lab
            </Link>

            <div className="flex flex-wrap gap-2 justify-end">
              <Link to="/research-insights" className="btn-secondary cursor-target">
                Insights
              </Link>
              <Link to="/dataset-audit" className="btn-secondary cursor-target">
                Audit
              </Link>
              <Link to="/dataset-editor" className="btn-secondary cursor-target">
                Editor
              </Link>
              <button
                type="button"
                onClick={handleLock}
                className="btn-secondary cursor-target"
              >
                Lock
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-secondary cursor-target"
          >
            Dev Lab
          </button>
        )}
      </div>

      <DevLabAccessModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </>
  );
}

export default DevLabLauncher;