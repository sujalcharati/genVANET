const TYPE_COLORS = {
  car: "text-yellow-400",
  bus: "text-blue-400",
  truck: "text-red-400",
};

export default function VehicleTable({ vehicles }) {
  if (!vehicles.length) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-gray-500 text-center">
        No active vehicles at this step
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Vehicles ({vehicles.length})
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-750 sticky top-0 bg-gray-900">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Speed (m/s)</th>
              <th className="px-4 py-2">Road</th>
              <th className="px-4 py-2">Position</th>
              <th className="px-4 py-2">CO2 (mg/s)</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-gray-700 text-gray-300 hover:bg-gray-700/50">
                <td className="px-4 py-2 font-mono">{v.id}</td>
                <td className={`px-4 py-2 font-semibold ${TYPE_COLORS[v.type] || "text-white"}`}>
                  {v.type}
                </td>
                <td className="px-4 py-2">{v.speed}</td>
                <td className="px-4 py-2 font-mono">{v.road}</td>
                <td className="px-4 py-2">
                  ({v.position.x}, {v.position.y})
                </td>
                <td className="px-4 py-2">{v.co2_emission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
