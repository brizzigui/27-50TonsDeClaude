const statusConfig = {
  green: {
    color: "bg-emerald-500",
    glow: "shadow-emerald-500/50",
    ring: "ring-emerald-500/30",
    label: "Saudável",
  },
  yellow: {
    color: "bg-amber-500",
    glow: "shadow-amber-500/50",
    ring: "ring-amber-500/30",
    label: "Atenção",
  },
  red: {
    color: "bg-red-500",
    glow: "shadow-red-500/50",
    ring: "ring-red-500/30",
    label: "Crítico",
  },
};

export default function Semaphore({ status = "green", showLabel = false, size = "md" }) {
  const config = statusConfig[status] || statusConfig.green;
  const sizeClass = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-40 animate-ping`}
        />
        <span
          className={`relative inline-flex ${sizeClass} rounded-full ${config.color} shadow-lg ${config.glow} ring-2 ${config.ring}`}
        />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-gray-400">{config.label}</span>
      )}
    </div>
  );
}
