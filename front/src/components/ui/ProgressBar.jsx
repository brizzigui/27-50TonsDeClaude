const colorMap = {
  green: { bar: "bg-emerald-500", glow: "shadow-emerald-500/30" },
  yellow: { bar: "bg-amber-500", glow: "shadow-amber-500/30" },
  red: { bar: "bg-red-500", glow: "shadow-red-500/30" },
  default: { bar: "bg-emerald-500", glow: "shadow-emerald-500/30" },
};

function getColor(value) {
  if (value >= 60) return "green";
  if (value >= 30) return "yellow";
  return "red";
}

export default function ProgressBar({ value = 0, label = "", showPercent = true }) {
  const clamped = Math.min(100, Math.max(0, value));
  const colorKey = getColor(clamped);
  const colors = colorMap[colorKey];

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-xs font-medium text-gray-400">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-bold text-gray-300">{clamped}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar} shadow-lg ${colors.glow}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
