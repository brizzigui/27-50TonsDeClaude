import { usePiqueteContext } from "../context/PiqueteContext";
import ManagementTimeline from "../components/planning/ManagementTimeline";
import WeightProjectionChart from "../components/planning/WeightProjectionChart";

export default function PlanningPage() {
  const { eventos, projecoes, loading } = usePiqueteContext();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Carregando planejamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-8">
      {/* Timeline Section */}
      <section>
        <ManagementTimeline events={eventos} />
      </section>

      {/* Chart Section */}
      <section>
        <WeightProjectionChart projections={projecoes} />
      </section>
    </div>
  );
}
