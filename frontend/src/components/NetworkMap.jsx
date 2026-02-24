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
  "Route A": "#3b82f6",
  "Route B": "#f59e0b",
  "Route C": "#10b981",
};

// All edges in the network grid
const ALL_EDGES = [
  ["J1", "J2"], ["J2", "J3"],
  ["J4", "J5"], ["J5", "J6"],
  ["J7", "J8"], ["J8", "J9"],
  ["J1", "J4"], ["J4", "J7"],
  ["J2", "J5"], ["J5", "J8"],
  ["J3", "J6"], ["J6", "J9"],
  ["S1", "J1"], ["J3", "D1"], ["J9", "D2"],
];

export default function NetworkMap({ recommendedRoute, routeStats }) {
  const buildPath = (nodes) => {
    return nodes
      .map((n, i) => {
        const p = JUNCTIONS[n];
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ");
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Network Map
      </h3>
      <svg viewBox="0 0 560 400" className="w-full">
        {/* Grid edges */}
        {ALL_EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={JUNCTIONS[a].x} y1={JUNCTIONS[a].y}
            x2={JUNCTIONS[b].x} y2={JUNCTIONS[b].y}
            stroke="#374151"
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
              opacity={isRecommended ? 1 : 0.4}
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
                fill={isEntry ? "#3b82f6" : isExit ? "#ef4444" : "#1f2937"}
                stroke={isEntry ? "#60a5fa" : isExit ? "#f87171" : "#6b7280"}
                strokeWidth="2"
              />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[9px] font-bold fill-white"
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
              <text x="28" y="4" className="text-[11px] fill-gray-300">
                {label}
                {stats ? ` — ${stats.avg_speed}m/s, ${stats.vehicles} cars` : ""}
                {isRec ? " ★" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
