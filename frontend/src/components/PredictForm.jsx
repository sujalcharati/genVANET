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
    <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
        Configure Scenario
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Density */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Traffic Density</label>
          <select
            value={params.density}
            onChange={(e) => set("density", e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition"
          >
            {DENSITY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Vehicle Mix */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Vehicle Mix</label>
          <select
            value={params.vehicle_mix}
            onChange={(e) => set("vehicle_mix", e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition"
          >
            {MIX_OPTIONS.map((m) => (
              <option key={m} value={m}>{m.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Pattern */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Departure Pattern</label>
          <select
            value={params.pattern}
            onChange={(e) => set("pattern", e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition"
          >
            {PATTERN_OPTIONS.map((p) => (
              <option key={p} value={p}>{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle type and objective - the main choices */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Vehicle Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Vehicle Type</label>
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
                    ? "bg-blue-500/20 border-2 border-blue-500 text-blue-300"
                    : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objective */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Optimization Goal</label>
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
                    ? "bg-purple-500/20 border-2 border-purple-500 text-purple-300"
                    : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"
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
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
