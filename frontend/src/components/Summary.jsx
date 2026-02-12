export default function Summary({ summary, scenario }) {
  const cards = [
    { label: "Total Vehicles", value: summary.total_vehicles, color: "text-yellow-400" },
    { label: "Simulation Steps", value: summary.total_steps, color: "text-blue-400" },
    { label: "Total CO2", value: `${(summary.total_co2_mg / 1000).toFixed(1)} g`, color: "text-red-400" },
    { label: "Density", value: scenario.density, color: "text-green-400" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
