const JUNCTIONS = {
  J1: { x: 100, y: 80 },
  J2: { x: 280, y: 80 },
  J3: { x: 460, y: 80 },
  J4: { x: 100, y: 200 },
  J5: { x: 280, y: 200 },
  J6: { x: 460, y: 200 },
  J7: { x: 100, y: 320 },
  J8: { x: 280, y: 320 },
  J9: { x: 460, y: 320 },
  S1: { x: 10, y: 80 },
  D1: { x: 550, y: 80 },
  D2: { x: 550, y: 320 },
};

const ROUTE_PATHS = {
  "Route A": ["S1", "J1", "J2", "J3", "D1"],
  "Route B": ["S1", "J1", "J4", "J5", "J6", "J3", "D1"],
  "Route C": ["S1", "J1", "J4", "J7", "J8", "J9", "J6", "J3", "D1"],
};

const ROUTE_COLORS = {
  "Route A": "#3B82F6",
  "Route B": "#F59E0B",
  "Route C": "#10B981",
};

const ALL_EDGES = [
  ["J1", "J2"], ["J2", "J3"],
  ["J4", "J5"], ["J5", "J6"],
  ["J7", "J8"], ["J8", "J9"],
  ["J1", "J4"], ["J4", "J7"],
  ["J2", "J5"], ["J5", "J8"],
  ["J3", "J6"], ["J6", "J9"],
  ["S1", "J1"], ["J3", "D1"], ["J9", "D2"],
];

export default function NetworkMap({ recommendedRoute, routeStats, title }) {
  const buildPath = (nodes) => {
    return nodes
      .map((n, i) => {
        const p = JUNCTIONS[n];
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ");
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
        {title || "Network Map"}
      </h3>
      <svg viewBox="0 0 560 400" className="w-full">
        {/* Background grid dots */}
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="#E5E7EB" />
          </pattern>
        </defs>
        <rect width="560" height="400" fill="url(#dots)" rx="8" />

        {/* Grid edges */}
        {ALL_EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={JUNCTIONS[a].x} y1={JUNCTIONS[a].y}
            x2={JUNCTIONS[b].x} y2={JUNCTIONS[b].y}
            stroke="#D1D5DB"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}

        {/* Route paths */}
        {Object.entries(ROUTE_PATHS).map(([label, nodes]) => {
          const isRecommended = recommendedRoute === label;
          return (
            <path
              key={label}
              d={buildPath(nodes)}
              fill="none"
              stroke={ROUTE_COLORS[label]}
              strokeWidth={isRecommended ? 5 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isRecommended ? "none" : "8 4"}
              opacity={isRecommended ? 1 : 0.35}
              className={isRecommended ? "animate-pulse" : ""}
            />
          );
        })}

        {/* Junction nodes */}
        {Object.entries(JUNCTIONS).map(([id, pos]) => {
          const isEntry = id === "S1";
          const isExit = id === "D1" || id === "D2";
          const isSpecial = isEntry || isExit;
          return (
            <g key={id}>
              <circle
                cx={pos.x} cy={pos.y}
                r={isSpecial ? 14 : 10}
                fill={isEntry ? "#3B82F6" : isExit ? "#EF4444" : "#F9FAFB"}
                stroke={isEntry ? "#93C5FD" : isExit ? "#FCA5A5" : "#D1D5DB"}
                strokeWidth="2"
              />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-bold"
                fill={isSpecial ? "#FFFFFF" : "#4B5563"}
              >
                {id}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {Object.entries(ROUTE_COLORS).map(([label, color], i) => {
          const stats = routeStats?.[label];
          const isRec = recommendedRoute === label;
          return (
            <g key={label} transform={`translate(10, ${360 + i * 18})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke={color} strokeWidth="3" />
              <text x="28" y="4" className="text-[11px]" fill="#6B7280">
                {label}
                {stats ? ` — ${stats.avg_speed}m/s, ${stats.vehicles} cars` : ""}
                {isRec ? " (recommended)" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
