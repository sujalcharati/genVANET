import { useState, useEffect } from "react";
import { fetchOptions, runSimulation, fetchPrediction } from "./api";

// Simulation tab components
import ScenarioForm from "./components/ScenarioForm";
import Summary from "./components/Summary";
import StepSlider from "./components/StepSlider";
import VehicleTable from "./components/VehicleTable";
import EdgeTable from "./components/EdgeTable";

// AI Prediction tab components
import PredictForm from "./components/PredictForm";
import PredictionPanel from "./components/PredictionPanel";
import RouteCard from "./components/RouteCard";
import NetworkMap from "./components/NetworkMap";

const TABS = [
  { id: "predict", label: "AI Prediction", icon: "🤖" },
  { id: "simulate", label: "Simulation", icon: "🚦" },
];

export default function App() {
  const [tab, setTab] = useState("predict");

  // ── Simulation state ──
  const [options, setOptions] = useState({});
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  // ── Prediction state ──
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);
  const [predResult, setPredResult] = useState(null);

  useEffect(() => {
    fetchOptions().then(setOptions).catch(() => {});
  }, []);

  // ── Simulation handler ──
  const handleSimulate = async (params) => {
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    try {
      const data = await runSimulation(params);
      setSimResult(data);
      setStepIndex(0);
    } catch (err) {
      setSimError(err.message);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Prediction handler ──
  const handlePredict = async (params) => {
    setPredLoading(true);
    setPredError(null);
    setPredResult(null);
    try {
      const data = await fetchPrediction(params);
      setPredResult(data);
    } catch (err) {
      setPredError(err.message);
    } finally {
      setPredLoading(false);
    }
  };

  const currentStep = simResult?.steps?.[stepIndex];
  const aiPred = predResult?.ai_prediction;
  const routeStats = aiPred?.route_stats;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              genVANET
            </h1>
            <p className="text-xs text-gray-500">Generative AI for Vehicular Network Decision Support</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  tab === t.id
                    ? "bg-gray-800 text-white shadow"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══════════════════════ AI PREDICTION TAB ═══════════════════════ */}
        {tab === "predict" && (
          <div className="space-y-8">
            <PredictForm onSubmit={handlePredict} loading={predLoading} />

            {predError && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
                {predError}
              </div>
            )}

            {predLoading && (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-gray-400">Running SUMO simulation + AI analysis...</p>
                <p className="text-xs text-gray-600 mt-1">This may take a moment</p>
              </div>
            )}

            {predResult && (
              <>
                {/* Scenario badge */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(predResult.scenario).map(([key, val]) => (
                    <span
                      key={key}
                      className="px-3 py-1 rounded-full text-xs bg-gray-800 border border-gray-700 text-gray-400"
                    >
                      <span className="text-gray-500">{key.replace("_", " ")}:</span>{" "}
                      <span className="text-gray-300">{val}</span>
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    {predResult.traffic_snapshot.active_vehicles} active vehicles
                  </span>
                </div>

                {/* Main grid: Map + Prediction */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NetworkMap
                    recommendedRoute={aiPred.recommended_route}
                    routeStats={routeStats}
                  />
                  <PredictionPanel
                    prediction={aiPred}
                    validation={predResult.validation}
                  />
                </div>

                {/* Route comparison cards */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Route Comparison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {routeStats &&
                      Object.entries(routeStats).map(([label, stats]) => (
                        <RouteCard
                          key={label}
                          label={label}
                          stats={stats}
                          isRecommended={aiPred.recommended_route === label}
                          allStats={routeStats}
                        />
                      ))}
                  </div>
                </div>

                {/* Raw AI response (collapsible) */}
                <details className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition">
                    View Raw AI Response
                  </summary>
                  <pre className="mt-3 text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {aiPred.raw_response}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════ SIMULATION TAB ═══════════════════════ */}
        {tab === "simulate" && (
          <div className="space-y-6">
            <ScenarioForm options={options} onSubmit={handleSimulate} loading={simLoading} />

            {simError && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
                {simError}
              </div>
            )}

            {simLoading && (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-3 text-gray-400">Running SUMO simulation...</p>
              </div>
            )}

            {simResult && (
              <>
                <Summary summary={simResult.summary} scenario={simResult.scenario} />

                <StepSlider
                  stepIndex={stepIndex}
                  totalSteps={simResult.steps.length}
                  currentTime={currentStep?.time || 0}
                  onChange={setStepIndex}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VehicleTable vehicles={currentStep?.vehicles || []} />
                  <EdgeTable edges={currentStep?.edges || []} />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 mt-16 py-6 text-center text-xs text-gray-600">
        genVANET &mdash; Generative AI Platform for Vehicular Network Decision Support
      </footer>
    </div>
  );
}
