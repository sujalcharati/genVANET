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
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">Scenario Configuration</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Traffic Density</label>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {options.density?.map((d) => (
              <option key={d} value={d}>{LABELS[d] || d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Vehicle Mix</label>
          <select
            value={vehicleMix}
            onChange={(e) => setVehicleMix(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {options.vehicle_mix?.map((v) => (
              <option key={v} value={v}>{LABELS[v] || v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Departure Pattern</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {options.pattern?.map((p) => (
              <option key={p} value={p}>{LABELS[p] || p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Running Simulation..." : "Run Simulation"}
      </button>
    </form>
  );
}
