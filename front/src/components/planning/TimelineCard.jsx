import { ArrowLeftRight, Pause, ShoppingCart } from "lucide-react";

const actionConfig = {
  mover: {
    icon: ArrowLeftRight,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Movimentação",
  },
  descansar: {
    icon: Pause,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    label: "Descanso",
  },
  venda: {
    icon: ShoppingCart,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    label: "Venda",
  },
};

export default function TimelineCard({ event }) {
  const config = actionConfig[event.acao] || actionConfig.mover;
  const Icon = config.icon;
  const isToday = event.labelData === "HOJE";

  return (
    <div
      className={`
        relative flex gap-4 animate-fadeIn
      `}
    >
      {/* Timeline line & dot */}
      <div className="flex flex-col items-center">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${config.bgColor} border ${config.borderColor}
            ${isToday ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500/30" : ""}
          `}
        >
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        {/* Connector line */}
        <div className="w-px flex-1 bg-white/[0.06] mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        {/* Date badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`
              text-xs font-bold uppercase tracking-wider
              ${isToday ? "text-blue-400" : "text-gray-500"}
            `}
          >
            {event.labelData}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} font-medium`}>
            {config.label}
          </span>
        </div>

        {/* Card body */}
        <div
          className={`
            p-4 rounded-xl border
            bg-white/[0.03] border-white/[0.06]
            hover:bg-white/[0.05] transition-colors duration-200
            ${isToday ? "border-blue-500/20 bg-blue-500/[0.03]" : ""}
          `}
        >
          <p className="text-sm font-semibold text-white mb-1.5">
            {event.instrucao}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {event.motivo}
          </p>
        </div>
      </div>
    </div>
  );
}
