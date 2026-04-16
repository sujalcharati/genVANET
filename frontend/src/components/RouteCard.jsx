const ROUTE_META = {
  "Route A": { name: "Highway Direct", icon: "🛣️", color: "blue", edges: "S1→J1→J2→J3→D1" },
  "Route B": { name: "City Road", icon: "🏙️", color: "amber", edges: "S1→J1→J4→J5→J6→J3→D1" },
  "Route C": { name: "Local Street", icon: "🏘️", color: "emerald", edges: "S1→J1→J4→J7→J8→J9→J6→J3→D1" },
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    glow: "border-blue-400",
    text: "text-blue-600",
    bar: "bg-blue-400",
    badge: "bg-blue-100 text-blue-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    glow: "border-amber-400",
    text: "text-amber-600",
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    glow: "border-emerald-400",
    text: "text-emerald-600",
    bar: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-600",
  },
};

function StatBar({ label, value, max, colorClass }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RouteCard({ label, stats, isRecommended, allStats }) {
  const meta = ROUTE_META[label];
  const colors = COLOR_MAP[meta.color];

  const maxSpeed = Math.max(...Object.values(allStats).map((s) => s.avg_speed), 1);
  const maxVehicles = Math.max(...Object.values(allStats).map((s) => s.vehicles), 1);
  const maxWait = Math.max(...Object.values(allStats).map((s) => s.waiting_time), 1);

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 shadow-sm ${
        isRecommended
          ? `${colors.bg} ${colors.glow} border-2`
          : `bg-card ${colors.border}`
      }`}
    >
      {isRecommended && (
        <div className={`inline-block mb-3 px-3 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
          AI Recommended
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{meta.icon}</span>
        <div>
          <h3 className={`font-bold ${colors.text}`}>{label}</h3>
          <p className="text-xs text-text-muted">{meta.name}</p>
        </div>
      </div>

      <p className="text-[10px] font-mono text-text-muted mb-4 tracking-wide">{meta.edges}</p>

      <div className="space-y-3">
        <StatBar label="Avg Speed (m/s)" value={stats.avg_speed} max={maxSpeed} colorClass={colors.bar} />
        <StatBar label="Vehicles" value={stats.vehicles} max={maxVehicles} colorClass={colors.bar} />
        <StatBar label="Wait Time (s)" value={stats.waiting_time} max={maxWait} colorClass={colors.bar} />
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-text-muted">
        <span>{stats.edge_count} edges</span>
        <span>~{Math.round((stats.edge_count * 150) / Math.max(stats.avg_speed, 1))}s travel</span>
      </div>
    </div>
  );
}
