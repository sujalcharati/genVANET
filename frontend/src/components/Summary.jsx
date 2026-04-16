export default function Summary({ summary, scenario }) {
  const cards = [
    { label: "Total Vehicles", value: summary.total_vehicles, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Simulation Steps", value: summary.total_steps, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Density", value: scenario.density, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5 text-center shadow-sm`}>
          <p className="text-xs text-text-muted font-medium">{card.label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
