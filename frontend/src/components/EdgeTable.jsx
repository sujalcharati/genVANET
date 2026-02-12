export default function EdgeTable({ edges }) {
  // Only show edges that have traffic
  const activeEdges = edges.filter((e) => e.vehicle_count > 0);

  if (!activeEdges.length) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-gray-500 text-center">
        No traffic on any edge at this step
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Road Traffic ({activeEdges.length} active roads)
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-2">Road</th>
              <th className="px-4 py-2">Vehicles</th>
              <th className="px-4 py-2">Avg Speed (m/s)</th>
              <th className="px-4 py-2">Occupancy (%)</th>
              <th className="px-4 py-2">Wait Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {activeEdges.map((e) => (
              <tr key={e.id} className="border-t border-gray-700 text-gray-300 hover:bg-gray-700/50">
                <td className="px-4 py-2 font-mono">{e.id}</td>
                <td className="px-4 py-2 font-semibold text-yellow-400">{e.vehicle_count}</td>
                <td className="px-4 py-2">{e.mean_speed}</td>
                <td className="px-4 py-2">{e.occupancy}</td>
                <td className="px-4 py-2">{e.waiting_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
