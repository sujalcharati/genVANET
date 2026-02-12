import { useState, useEffect } from "react";
import { fetchOptions, runSimulation } from "./api";
import ScenarioForm from "./components/ScenarioForm";
import Summary from "./components/Summary";
import StepSlider from "./components/StepSlider";
import VehicleTable from "./components/VehicleTable";
import EdgeTable from "./components/EdgeTable";

export default function App() {
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    fetchOptions()
      .then(setOptions)
      .catch(() => setError("Cannot connect to backend. Is the server running on port 8000?"));
  }, []);

  const handleSubmit = async (params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runSimulation(params);
      setResult(data);
      setStepIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = result?.steps?.[stepIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">genVANET</h1>
        <p className="text-sm text-gray-400">VANET Traffic Simulation Dashboard</p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <ScenarioForm options={options} onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-400">Running SUMO simulation...</p>
          </div>
        )}

        {result && (
          <>
            <Summary summary={result.summary} scenario={result.scenario} />

            <StepSlider
              stepIndex={stepIndex}
              totalSteps={result.steps.length}
              currentTime={currentStep?.time || 0}
              onChange={setStepIndex}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VehicleTable vehicles={currentStep?.vehicles || []} />
              <EdgeTable edges={currentStep?.edges || []} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
