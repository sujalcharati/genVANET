export default function PredictionPanel({ prediction, validation }) {
  const isValid = validation?.is_valid;

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          AI Prediction
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isValid
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}
        >
          {isValid ? "Validated" : "Corrected"}
        </span>
      </div>

      {/* Main prediction */}
      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
        <p className="text-xs text-gray-500 mb-1">Prediction</p>
        <p className="text-gray-200 leading-relaxed">{prediction.prediction}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
          <p className="text-xs text-gray-500 mb-1">Recommended Route</p>
          <p className="text-xl font-bold text-blue-400">{prediction.recommended_route}</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
          <p className="text-xs text-gray-500 mb-1">Expected Delay</p>
          <p className="text-xl font-bold text-amber-400">{prediction.expected_delay}s</p>
        </div>
      </div>

      {/* Congestion */}
      <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/30">
        <p className="text-xs text-gray-500 mb-1">Congestion Forecast</p>
        <p className="text-gray-200">{prediction.congestion}</p>
      </div>

      {/* Explanation */}
      <div className="bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <p className="text-xs text-blue-400 mb-1">AI Explanation</p>
        <p className="text-gray-200 italic">&ldquo;{prediction.explanation}&rdquo;</p>
      </div>

      {/* Validation errors if any */}
      {validation?.errors?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Validation corrections applied:</p>
          {validation.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
              <span className="mt-0.5">&#9888;</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
