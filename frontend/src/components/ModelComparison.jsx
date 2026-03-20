function MetricRow({ label, valA, valB, winCondition }) {
  // winCondition: "higher" means higher is better, "lower" means lower is better
  let winA = false;
  let winB = false;

  if (winCondition === "higher") {
    if (valA > valB) winA = true;
    else if (valB > valA) winB = true;
  } else if (winCondition === "lower") {
    if (valA < valB) winA = true;
    else if (valB < valA) winB = true;
  } else if (winCondition === "bool") {
    winA = !!valA;
    winB = !!valB;
  }

  const fmt = (v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : v);

  return (
    <tr className="border-t border-gray-700/40">
      <td className="py-3 px-4 text-sm text-gray-400">{label}</td>
      <td
        className={`py-3 px-4 text-sm text-center font-mono ${
          winA ? "text-emerald-400 font-semibold" : "text-gray-300"
        }`}
      >
        {fmt(valA)} {winA && !winB ? " *" : ""}
      </td>
      <td
        className={`py-3 px-4 text-sm text-center font-mono ${
          winB ? "text-emerald-400 font-semibold" : "text-gray-300"
        }`}
      >
        {fmt(valB)} {winB && !winA ? " *" : ""}
      </td>
    </tr>
  );
}

export default function ModelComparison({ comparison }) {
  if (!comparison) return null;

  const { model_a, model_b, analytical_best, route_agreement } = comparison;

  // Determine overall winner
  let scoreA = 0;
  let scoreB = 0;
  if (model_a.accurate) scoreA++;
  if (model_b.accurate) scoreB++;
  if (model_a.response_time < model_b.response_time) scoreA++;
  else if (model_b.response_time < model_a.response_time) scoreB++;

  const winner =
    scoreA > scoreB ? model_a.name : scoreB > scoreA ? model_b.name : "Tie";

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Model Comparison
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {route_agreement ? "Both agree" : "Different routes"}
        </span>
      </div>

      {/* Model headers */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/60">
              <th className="py-3 px-4 text-left text-xs text-gray-500 font-medium w-1/3">
                Metric
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium w-1/3">
                <div className="text-blue-400">{model_a.name}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">
                  {model_a.type}
                </div>
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium w-1/3">
                <div className="text-purple-400">{model_b.name}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">
                  {model_b.type}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Recommended Route"
              valA={model_a.route}
              valB={model_b.route}
              winCondition="none"
            />
            <MetricRow
              label="Route Accuracy"
              valA={model_a.accurate}
              valB={model_b.accurate}
              winCondition="bool"
            />
            <MetricRow
              label="Expected Delay"
              valA={`${model_a.delay}s`}
              valB={`${model_b.delay}s`}
              winCondition="none"
            />
            <MetricRow
              label="Response Time"
              valA={`${model_a.response_time}s`}
              valB={`${model_b.response_time}s`}
              winCondition="lower"
            />
          </tbody>
        </table>
      </div>

      {/* Analytical ground truth */}
      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            Analytical Best Route (Ground Truth)
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Based on real SUMO simulation data (speed, vehicles, wait time)
          </p>
        </div>
        <span className="text-lg font-bold text-emerald-400">
          {analytical_best}
        </span>
      </div>

      {/* Winner banner */}
      <div
        className={`rounded-xl p-4 border text-center ${
          winner === "Tie"
            ? "bg-gray-900/60 border-gray-700/30"
            : "bg-emerald-500/10 border-emerald-500/30"
        }`}
      >
        <p className="text-xs text-gray-500 mb-1">Better Model for This Scenario</p>
        <p
          className={`text-lg font-bold ${
            winner === "Tie" ? "text-gray-400" : "text-emerald-400"
          }`}
        >
          {winner === "Tie"
            ? "It's a tie - both models performed equally"
            : winner}
        </p>
        {winner !== "Tie" && (
          <p className="text-xs text-gray-500 mt-1">
            Based on route accuracy and response speed
          </p>
        )}
      </div>
    </div>
  );
}
