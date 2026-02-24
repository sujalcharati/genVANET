const API_BASE = "http://localhost:8000";

export async function fetchOptions() {
  const res = await fetch(`${API_BASE}/simulate/options`);
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
}

export async function runSimulation({ density, vehicle_mix, pattern, seed }) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ density, vehicle_mix, pattern, seed }),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return res.json();
}

export async function fetchPrediction({ density, vehicle_mix, pattern, seed, vehicle_type, objective }) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ density, vehicle_mix, pattern, seed, vehicle_type, objective }),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}
