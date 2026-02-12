export default function StepSlider({ stepIndex, totalSteps, currentTime, onChange }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
      <span className="text-sm text-gray-400 w-24">
        t = {currentTime.toFixed(1)}s
      </span>
      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={stepIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />
      <span className="text-sm text-gray-400 w-28 text-right">
        Step {stepIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}
