import { useState } from "react";

const LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  rush_hour: "Rush Hour",
  cars_only: "Cars Only",
  mixed: "Mixed",
  heavy_commercial: "Heavy Commercial",
  uniform: "Uniform",
  random: "Random",
};

export default function ScenarioForm({ options, onSubmit, loading }) {
  const [density, setDensity] = useState("medium");
  const [vehicleMix, setVehicleMix] = useState("mixed");
  const [pattern, setPattern] = useState("uniform");
  const [seed, setSeed] = useState(42);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ density, vehicle_mix: vehicleMix, pattern, seed });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary">Scenario Configuration</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Traffic Density</label>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="w-full bg-surface border border-border text-text-primary rounded-xl px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {options.density?.map((d) => (
              <option key={d} value={d}>{LABELS[d] || d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Vehicle Mix</label>
          <select
            value={vehicleMix}
            onChange={(e) => setVehicleMix(e.target.value)}
            className="w-full bg-surface border border-border text-text-primary rounded-xl px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {options.vehicle_mix?.map((v) => (
              <option key={v} value={v}>{LABELS[v] || v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Departure Pattern</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full bg-surface border border-border text-text-primary rounded-xl px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          >
            {options.pattern?.map((p) => (
              <option key={p} value={p}>{LABELS[p] || p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-medium">Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-full bg-surface border border-border text-text-primary rounded-xl px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
      >
        {loading ? "Running Simulation..." : "Run Simulation"}
      </button>
    </form>
  );
}
