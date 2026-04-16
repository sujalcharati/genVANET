import { useState } from "react";
import { fetchPrediction } from "./api";

// AI Prediction tab components
import PredictForm from "./components/PredictForm";
import PredictionPanel from "./components/PredictionPanel";
import RouteCard from "./components/RouteCard";
import NetworkMap from "./components/NetworkMap";
import ModelComparison from "./components/ModelComparison";

function PredictIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5v1.5h-4v-1.5A4 4 0 0 1 12 2z" />
      <path d="M10 11h4v2a2 2 0 0 1-4 0v-2z" />
      <path d="M8 17h8" /><path d="M9 21h6" /><path d="M10 17v4" /><path d="M14 17v4" />
    </svg>
  );
}

export default function App() {
  // -- Prediction state --
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);
  const [predResult, setPredResult] = useState(null);

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

  const aiPred = predResult?.ai_prediction;
  const groqPred = predResult?.groq_prediction;
  const routeStats = aiPred?.route_stats;

  return (
    <div className="min-h-screen bg-surface flex text-text-primary">
      {/* ---- Sidebar ---- */}
      <aside className="w-60 bg-sidebar border-r border-border flex flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border">
          <h1 className="text-lg font-bold text-brand-600 tracking-tight">genVANET</h1>
          <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
            Vehicular Network Decision Support
          </p>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-50 text-brand-600 shadow-sm"
          >
            <PredictIcon className="w-5 h-5 text-brand-500" />
            AI Prediction
            <svg className="w-4 h-4 ml-auto text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      </aside>

      {/* ---- Main Content ---- */}
      <div className="flex-1 ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">AI Prediction</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Run SUMO simulation and get AI-powered route analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 w-56 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-8 py-8">
          <div className="space-y-8">
            <PredictForm onSubmit={handlePredict} loading={predLoading} />

            {predError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                {predError}
              </div>
            )}

            {predLoading && (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                <p className="mt-4 text-text-secondary text-sm">Running SUMO simulation + AI analysis...</p>
                <p className="text-xs text-text-muted mt-1">This may take a moment</p>
              </div>
            )}

            {predResult && (
              <>
                {/* Scenario badges */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(predResult.scenario).map(([key, val]) => (
                    <span
                      key={key}
                      className="px-3 py-1 rounded-full text-xs bg-gray-100 border border-border text-text-secondary"
                    >
                      <span className="text-text-muted">{key.replace("_", " ")}:</span>{" "}
                      <span className="text-text-primary font-medium">{val}</span>
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded-full text-xs bg-brand-50 border border-brand-200 text-brand-600 font-medium">
                    {predResult.traffic_snapshot.active_vehicles} active vehicles
                  </span>
                </div>

                {/* Model Comparison Dashboard */}
                <ModelComparison comparison={predResult.comparison} />

                {/* Side-by-side predictions */}
                {groqPred && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <PredictionPanel
                        prediction={aiPred}
                        validation={predResult.validation}
                        title="Qwen3 32B (Groq API)"
                      />
                      <NetworkMap
                        recommendedRoute={aiPred.recommended_route}
                        routeStats={routeStats}
                        title="Qwen3 Network Map"
                      />
                    </div>
                    <div className="space-y-4">
                      <PredictionPanel
                        prediction={groqPred}
                        validation={predResult.groq_validation}
                        title="Llama 3.1 8B (Groq API)"
                      />
                      <NetworkMap
                        recommendedRoute={groqPred.recommended_route}
                        routeStats={routeStats}
                        title="Groq Network Map"
                      />
                    </div>
                  </div>
                )}

                {!groqPred && (
                  <NetworkMap
                    recommendedRoute={aiPred.recommended_route}
                    routeStats={routeStats}
                  />
                )}

                {/* Route comparison cards */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
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

                {/* Raw AI responses */}
                <details className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition font-medium">
                    View Raw AI Responses
                  </summary>
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-brand-500 mb-2 font-semibold">Qwen3 32B (Groq)</p>
                      <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed bg-surface rounded-xl p-4 border border-border">
                        {aiPred.raw_response}
                      </pre>
                    </div>
                    {groqPred && (
                      <div>
                        <p className="text-xs text-purple-500 mb-2 font-semibold">Llama 3.1 8B (Groq)</p>
                        <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed bg-surface rounded-xl p-4 border border-border">
                          {groqPred.raw_response}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-8 py-6 text-center text-xs text-text-muted">
          genVANET &mdash; Generative AI Platform for Vehicular Network Decision Support
        </footer>
      </div>
    </div>
  );
}
