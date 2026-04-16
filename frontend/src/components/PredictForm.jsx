import { useState } from "react";

const DENSITY_OPTIONS = ["low", "medium", "high", "rush_hour"];
const MIX_OPTIONS = ["cars_only", "mixed", "heavy_commercial"];
const PATTERN_OPTIONS = ["uniform", "rush_hour", "random"];

export default function PredictForm({ onSubmit, loading }) {
  const [params, setParams] = useState({
    density: "medium",
    vehicle_mix: "mixed",
    pattern: "uniform",
    seed: 42,
    vehicle_type: "car",
    objective: "fast",
  });

  const set = (key, val) => setParams((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5">
        Configure Scenario
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Density */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Traffic Density</label>
          <select
            value={params.density}
            onChange={(e) => set("density", e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {DENSITY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Vehicle Mix */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Vehicle Mix</label>
          <select
            value={params.vehicle_mix}
            onChange={(e) => set("vehicle_mix", e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {MIX_OPTIONS.map((m) => (
              <option key={m} value={m}>{m.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Pattern */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Departure Pattern</label>
          <select
            value={params.pattern}
            onChange={(e) => set("pattern", e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {PATTERN_OPTIONS.map((p) => (
              <option key={p} value={p}>{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle type and objective */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-text-muted mb-2 font-medium">Vehicle Type</label>
          <div className="flex gap-2">
            {[
              { value: "car", label: "Car", icon: "🚗" },
              { value: "ambulance", label: "Ambulance", icon: "🚑" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => set("vehicle_type", opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  params.vehicle_type === opt.value
                    ? "bg-blue-50 border-2 border-blue-400 text-blue-600"
                    : "bg-surface border border-border text-text-secondary hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-2 font-medium">Optimization Goal</label>
          <div className="flex gap-2">
            {[
              { value: "fast", label: "Fastest", icon: "⚡" },
              { value: "safe", label: "Safest", icon: "🛡️" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => set("objective", opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  params.objective === opt.value
                    ? "bg-brand-50 border-2 border-brand-400 text-brand-600"
                    : "bg-surface border border-border text-text-secondary hover:border-gray-300"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Running SUMO + AI...
          </span>
        ) : (
          "Get AI Prediction"
        )}
      </button>
    </form>
  );
}
