import TimelineCard from "./TimelineCard";
import { CalendarClock } from "lucide-react";

export default function ManagementTimeline({ events }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <CalendarClock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Timeline de Manejo</h2>
          <p className="text-xs text-gray-500">
            Próximas ações programadas
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {events.map((event) => (
          <TimelineCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
