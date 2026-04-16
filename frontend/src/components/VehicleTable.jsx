const TYPE_COLORS = {
  car: "text-amber-500",
  bus: "text-blue-500",
  truck: "text-red-500",
};

export default function VehicleTable({ vehicles }) {
  if (!vehicles.length) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 text-text-muted text-center shadow-sm">
        No active vehicles at this step
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          Vehicles ({vehicles.length})
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-text-muted text-left text-xs font-medium">
              <th className="px-5 py-2.5">ID</th>
              <th className="px-5 py-2.5">Type</th>
              <th className="px-5 py-2.5">Speed (m/s)</th>
              <th className="px-5 py-2.5">Road</th>
              <th className="px-5 py-2.5">Position</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t border-border-light text-text-primary hover:bg-surface/60 transition-colors">
                <td className="px-5 py-2.5 font-mono text-xs">{v.id}</td>
                <td className={`px-5 py-2.5 font-semibold text-xs ${TYPE_COLORS[v.type] || "text-text-primary"}`}>
                  {v.type}
                </td>
                <td className="px-5 py-2.5 text-xs">{v.speed}</td>
                <td className="px-5 py-2.5 font-mono text-xs">{v.road}</td>
                <td className="px-5 py-2.5 text-xs">
                  ({v.position.x}, {v.position.y})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
