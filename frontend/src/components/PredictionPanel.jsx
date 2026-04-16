export default function PredictionPanel({ prediction, validation, title }) {
  const isValid = validation?.is_valid;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {title || "AI Prediction"}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isValid
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-amber-50 text-amber-600 border border-amber-200"
          }`}
        >
          {isValid ? "Validated" : "Corrected"}
        </span>
      </div>

      {/* Main prediction */}
      <div className="bg-surface rounded-xl p-4 border border-border">
        <p className="text-xs text-text-muted mb-1 font-medium">Prediction</p>
        <p className="text-text-primary leading-relaxed text-sm">{prediction.prediction}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-400 mb-1 font-medium">Recommended Route</p>
          <p className="text-xl font-bold text-blue-600">{prediction.recommended_route}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-xs text-amber-400 mb-1 font-medium">Expected Delay</p>
          <p className="text-xl font-bold text-amber-600">{prediction.expected_delay}s</p>
        </div>
      </div>

      {/* Congestion */}
      <div className="bg-surface rounded-xl p-4 border border-border">
        <p className="text-xs text-text-muted mb-1 font-medium">Congestion Forecast</p>
        <p className="text-text-primary text-sm">{prediction.congestion}</p>
      </div>

      {/* Explanation */}
      <div className="bg-brand-50 rounded-xl p-4 border border-brand-200">
        <p className="text-xs text-brand-500 mb-1 font-medium">AI Explanation</p>
        <p className="text-text-primary italic text-sm">&ldquo;{prediction.explanation}&rdquo;</p>
      </div>

      {/* Validation errors */}
      {validation?.errors?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-medium">Validation corrections applied:</p>
          {validation.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
              <span className="mt-0.5">&#9888;</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
