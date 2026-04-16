function MetricRow({ label, valA, valB, winCondition }) {
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
    <tr className="border-t border-border">
      <td className="py-3 px-4 text-sm text-text-secondary">{label}</td>
      <td
        className={`py-3 px-4 text-sm text-center font-mono ${
          winA ? "text-emerald-600 font-semibold" : "text-text-primary"
        }`}
      >
        {fmt(valA)} {winA && !winB ? " *" : ""}
      </td>
      <td
        className={`py-3 px-4 text-sm text-center font-mono ${
          winB ? "text-emerald-600 font-semibold" : "text-text-primary"
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

  let scoreA = 0;
  let scoreB = 0;
  if (model_a.accurate) scoreA++;
  if (model_b.accurate) scoreB++;
  if (model_a.response_time < model_b.response_time) scoreA++;
  else if (model_b.response_time < model_a.response_time) scoreB++;

  const winner =
    scoreA > scoreB ? model_a.name : scoreB > scoreA ? model_b.name : "Tie";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Model Comparison
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          route_agreement
            ? "bg-brand-50 text-brand-600 border border-brand-200"
            : "bg-orange-50 text-orange-600 border border-orange-200"
        }`}>
          {route_agreement ? "Both agree" : "Different routes"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 text-left text-xs text-text-muted font-medium w-1/3">
                Metric
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium w-1/3">
                <div className="text-blue-500">{model_a.name}</div>
                <div className="text-text-muted text-[10px] mt-0.5">{model_a.type}</div>
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium w-1/3">
                <div className="text-purple-500">{model_b.name}</div>
                <div className="text-text-muted text-[10px] mt-0.5">{model_b.type}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <MetricRow label="Recommended Route" valA={model_a.route} valB={model_b.route} winCondition="none" />
            <MetricRow label="Route Accuracy" valA={model_a.accurate} valB={model_b.accurate} winCondition="bool" />
            <MetricRow label="Expected Delay" valA={`${model_a.delay}s`} valB={`${model_b.delay}s`} winCondition="none" />
            <MetricRow label="Response Time" valA={`${model_a.response_time}s`} valB={`${model_b.response_time}s`} winCondition="lower" />
          </tbody>
        </table>
      </div>

      {/* Analytical ground truth */}
      <div className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium">Analytical Best Route (Ground Truth)</p>
          <p className="text-sm text-text-secondary mt-1">Based on real SUMO simulation data (speed, vehicles, wait time)</p>
        </div>
        <span className="text-lg font-bold text-emerald-500">{analytical_best}</span>
      </div>

      {/* Winner banner */}
      <div className={`rounded-xl p-4 border text-center ${
        winner === "Tie"
          ? "bg-surface border-border"
          : "bg-emerald-50 border-emerald-200"
      }`}>
        <p className="text-xs text-text-muted mb-1">Better Model for This Scenario</p>
        <p className={`text-lg font-bold ${
          winner === "Tie" ? "text-text-secondary" : "text-emerald-600"
        }`}>
          {winner === "Tie" ? "It's a tie - both models performed equally" : winner}
        </p>
        {winner !== "Tie" && (
          <p className="text-xs text-text-muted mt-1">Based on route accuracy and response speed</p>
        )}
      </div>
    </div>
  );
}
