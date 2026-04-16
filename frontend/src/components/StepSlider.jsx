export default function StepSlider({ stepIndex, totalSteps, currentTime, onChange }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 shadow-sm">
      <span className="text-sm text-text-secondary w-24 font-mono">
        t = {currentTime.toFixed(1)}s
      </span>
      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={stepIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-sm text-text-secondary w-28 text-right">
        Step {stepIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}
