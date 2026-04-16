export default function EdgeTable({ edges }) {
  const activeEdges = edges.filter((e) => e.vehicle_count > 0);

  if (!activeEdges.length) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 text-text-muted text-center shadow-sm">
        No traffic on any edge at this step
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          Road Traffic ({activeEdges.length} active roads)
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-text-muted text-left text-xs font-medium">
              <th className="px-5 py-2.5">Road</th>
              <th className="px-5 py-2.5">Vehicles</th>
              <th className="px-5 py-2.5">Avg Speed (m/s)</th>
              <th className="px-5 py-2.5">Occupancy (%)</th>
              <th className="px-5 py-2.5">Wait Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {activeEdges.map((e) => (
              <tr key={e.id} className="border-t border-border-light text-text-primary hover:bg-surface/60 transition-colors">
                <td className="px-5 py-2.5 font-mono text-xs">{e.id}</td>
                <td className="px-5 py-2.5 font-semibold text-amber-500 text-xs">{e.vehicle_count}</td>
                <td className="px-5 py-2.5 text-xs">{e.mean_speed}</td>
                <td className="px-5 py-2.5 text-xs">{e.occupancy}</td>
                <td className="px-5 py-2.5 text-xs">{e.waiting_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
