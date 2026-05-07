import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import TargetCursor from "./components/TargetCursor";
import DevLabLauncher from "./components/DevLabLauncher";
import ProtectedDevRoute from "./components/ProtectedDevRoute";
import Home from "./pages/Home";
import QuestionnairePage from "./pages/QuestionnairePage";
import ResultsPage from "./pages/ResultsPage";
import ResearchInsightsPage from "./pages/ResearchInsightsPage";
import EvaluationLabPage from "./pages/EvaluationLabPage";
import DatasetAuditPage from "./pages/DatasetAuditPage";
import DatasetEditorPage from "./pages/DatasetEditorPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#05070a] text-white">
        <TargetCursor />
        <Navbar />
        <DevLabLauncher />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/results" element={<ResultsPage />} />

          <Route
            path="/research-insights"
            element={
              <ProtectedDevRoute>
                <ResearchInsightsPage />
              </ProtectedDevRoute>
            }
          />

          <Route
            path="/evaluation-lab"
            element={
              <ProtectedDevRoute>
                <EvaluationLabPage />
              </ProtectedDevRoute>
            }
          />

          <Route
            path="/dataset-audit"
            element={
              <ProtectedDevRoute>
                <DatasetAuditPage />
              </ProtectedDevRoute>
            }
          />

          <Route
            path="/dataset-editor"
            element={
              <ProtectedDevRoute>
                <DatasetEditorPage />
              </ProtectedDevRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;