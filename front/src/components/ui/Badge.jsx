const colorMap = {
  green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  yellow: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function Badge({ text, color = "gray", className = "" }) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5 rounded-full
        text-xs font-semibold
        border
        ${colorMap[color] || colorMap.gray}
        ${className}
      `}
    >
      {text}
    </span>
  );
}
