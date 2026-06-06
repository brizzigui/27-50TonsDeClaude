import Semaphore from "../ui/Semaphore";
import { Beef, MapPin } from "lucide-react";

export default function PiqueteCard({ piquete, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full text-left
        p-4 rounded-xl border
        transition-all duration-200 ease-out
        cursor-pointer
        ${
          isSelected
            ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10 scale-[1.02]"
            : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-md hover:shadow-black/20"
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl" />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {piquete.id}
          </span>
        </div>
        <Semaphore status={piquete.statusSaude} size="sm" />
      </div>

      <h3 className="text-sm font-semibold text-white mb-2 leading-tight">
        {piquete.nome.replace(/^Piquete \d+ - /, "")}
      </h3>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{piquete.tamanhoHectares} ha</span>
        {piquete.ocupacao.quantidade > 0 && (
          <div className="flex items-center gap-1">
            <Beef className="w-3 h-3" />
            <span>{piquete.ocupacao.quantidade}</span>
          </div>
        )}
      </div>

      {/* Biomass mini bar */}
      <div className="mt-3 w-full h-1 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            piquete.massaVerdePct >= 60
              ? "bg-emerald-500"
              : piquete.massaVerdePct >= 30
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
          style={{ width: `${piquete.massaVerdePct}%` }}
        />
      </div>
    </button>
  );
}
