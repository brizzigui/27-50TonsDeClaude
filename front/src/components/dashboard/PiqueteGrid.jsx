import PiqueteCard from "./PiqueteCard";
import { Grid3X3 } from "lucide-react";

export default function PiqueteGrid({ piquetes, selectedId, onSelect }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Grid3X3 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Mapa de Piquetes</h2>
          <p className="text-xs text-gray-500">{piquetes.length} áreas cadastradas</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-min">
        {piquetes.map((piquete) => (
          <PiqueteCard
            key={piquete.id}
            piquete={piquete}
            isSelected={selectedId === piquete.id}
            onClick={() => onSelect(piquete.id)}
          />
        ))}
      </div>
    </div>
  );
}
