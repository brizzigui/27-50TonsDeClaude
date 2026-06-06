import { useState } from "react";
import { usePiqueteContext } from "../context/PiqueteContext";
import PiqueteGrid from "../components/dashboard/PiqueteGrid";
import PiqueteDetail from "../components/dashboard/PiqueteDetail";

export default function DashboardPage() {
  const { piquetes, loading } = usePiqueteContext();
  const [selectedId, setSelectedId] = useState(null);

  const selectedPiquete = piquetes.find((p) => p.id === selectedId) || null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-gray-500">Carregando piquetes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Grid */}
      <div className="overflow-y-auto pr-2">
        <PiqueteGrid
          piquetes={piquetes}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        />
      </div>

      {/* Right — Details */}
      <div className="overflow-y-auto pl-2 border-l border-white/[0.06]">
        <PiqueteDetail piquete={selectedPiquete} />
      </div>
    </div>
  );
}
