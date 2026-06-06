import { useState, useEffect, useRef } from "react";
import api from "../api";
import {
  ArrowLeftRight, ShoppingCart, TrendingUp, Leaf,
  Calendar, AlertCircle, CheckCircle, ChevronRight, ChevronDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  AreaChart, Area
} from "recharts";
import { Badge } from "./ui/badge";

type ActionType = "mover" | "venda" | "alerta";

interface TimelineEvent {
  id: number;
  date: string;
  dateLabel: string;
  urgent: boolean;
  action: ActionType;
  title: string;
  detail: string;
  reason: string;
  piquete?: string;
  destino?: string;
}

const actionConfig: Record<ActionType, { Icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  mover: {
    Icon: ArrowLeftRight,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Movimentação",
  },

  venda: {
    Icon: ShoppingCart,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Venda",
  },
  alerta: {
    Icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Alerta Crítico",
  },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-gray-600 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">Peso projetado:</span>
          <span className="text-gray-800">{p.value.toLocaleString("pt-BR")} kg</span>
        </div>
      ))}
    </div>
  );
}

interface AreaOption {
  id: number;
  name: string;
}

interface BiomassPoint {
  week: number;
  semana: string;
  biomass_kg_ha: number;
  occupied: boolean;
}

type PanelType = "weight" | "pasture";

interface PlanningProps {
  updateTrigger?: number;
}

export function Planning({ updateTrigger = 0 }: PlanningProps) {
  const [mobileTab, setMobileTab] = useState<"timeline" | "analytics">("timeline");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [economics, setEconomics] = useState<any>(null);

  // Pasture panel state
  const [activePanel, setActivePanel] = useState<PanelType>("weight");
  const [panelDropdownOpen, setPanelDropdownOpen] = useState(false);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [areaBiomassData, setAreaBiomassData] = useState<Record<number, BiomassPoint[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPanelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get("/api/evaluation");
        if (data.timeline) {
          const mapped = data.timeline.map((item: any) => {
            const days = item.day_offset;
            let dateLabel = `EM ${days} DIAS`;
            if (days === 0) dateLabel = "HOJE";
            else if (days === 1) dateLabel = "AMANHÃ";

            let title = "Evento de Manejo";
            if (item.action === "mover") title = "Mover rebanho";
            if (item.action === "venda") title = "Rebanho pronto para venda";
            if (item.action === "alerta") title = "Atenção Crítica";

            return {
              id: item.id,
              date: item.date,
              dateLabel,
              urgent: days <= 2,
              action: item.action as ActionType,
              title,
              detail: item.message,
              reason: item.reason,
              piquete: item.from_area_name,
              destino: item.to_area_name,
            };
          });
          setTimeline(mapped);
        }

        if (data.weight_projection && data.lot) {
          const headCount = data.lot.head_count;
          const mappedWeights = data.weight_projection.map((w: any) => {
            const totalKg = w.average_weight_kg * headCount;
            return {
              semana: w.week === 0 ? "Hoje" : `Sem ${w.week}`,
              projetado: totalKg,
            };
          });
          setWeightData(mappedWeights);
        }

        if (data.summary && data.summary.economics) {
          setEconomics({
            ...data.summary.economics,
            simulationDays: data.summary.simulation_days,
            totalMoves: data.summary.total_moves,
            estimatedFinalWeightKg: data.summary.estimated_final_weight_kg,
            daysToSale: data.summary.days_to_sale,
            saleReached: data.summary.sale_reached,
          });
        }

        // Pasture biomass data
        if (data.areas) {
          const options: AreaOption[] = data.areas.map((a: any) => ({
            id: a.id,
            name: a.name,
          }));
          setAreaOptions(options);
          if (options.length > 0 && selectedAreaId === null) {
            setSelectedAreaId(options[0].id);
          }
        }

        if (data.area_biomass_history) {
          const mapped: Record<number, BiomassPoint[]> = {};
          for (const [areaIdStr, points] of Object.entries(data.area_biomass_history)) {
            const areaId = parseInt(areaIdStr);
            mapped[areaId] = (points as any[]).map((p: any) => ({
              week: p.week,
              semana: p.week === 0 ? "Hoje" : `Sem ${p.week}`,
              biomass_kg_ha: p.biomass_kg_ha,
              occupied: p.occupied,
            }));
          }
          setAreaBiomassData(mapped);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do planning", err);
      }
    }
    fetchData();
  }, [updateTrigger]);

  const totalProjetado = weightData.length > 0 ? weightData[weightData.length - 1].projetado : 0;
  const nextWeekGain = weightData.length > 1 ? weightData[1].projetado - weightData[0].projetado : 0;

  /* ── Timeline Panel ── */
  const timelinePanel = (
    <div className="flex flex-col bg-white h-full">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-0.5">
          <Calendar size={16} className="text-green-700" />
          <span className="text-gray-500 text-sm">Próximas ações</span>
        </div>
        <h2 className="text-gray-800">Cronograma de Manejo</h2>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto">
        {Object.entries(actionConfig).map(([key, val]) => (
          <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${val.bg} ${val.color} border ${val.border} whitespace-nowrap`}>
            <val.Icon size={11} />
            {val.label}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[42px] top-4 bottom-4 w-px bg-gray-100" />

          {timeline.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">Nenhuma ação planejada para os próximos dias.</div>
          )}
          {timeline.map((event, i) => {
            const cfg = actionConfig[event.action];
            return (
              <div key={event.id} className="flex gap-0 px-3 sm:px-4 py-2 group">
                {/* Left: date + icon */}
                <div className="flex flex-col items-center w-[52px] shrink-0 relative z-10">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                    ${event.urgent
                      ? `${cfg.bg} ${cfg.border} shadow-md`
                      : `bg-white border-gray-200 group-hover:${cfg.bg} group-hover:${cfg.border}`
                    }
                  `}>
                    <cfg.Icon size={14} className={event.urgent ? cfg.color : "text-gray-400"} />
                  </div>
                  {i < timeline.length - 1 && <div className="flex-1 w-px bg-gray-100 mt-1" />}
                </div>

                {/* Right: card */}
                <div className={`
                  flex-1 rounded-xl border p-3 sm:p-3.5 mb-1 ml-2 transition-all cursor-pointer
                  ${event.urgent
                    ? `${cfg.bg} ${cfg.border} shadow-sm`
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }
                `}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          event.dateLabel === "HOJE"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : event.dateLabel === "AMANHÃ"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          {event.dateLabel}
                        </span>
                        {event.urgent && (
                          <AlertCircle size={13} className="text-red-500" />
                        )}
                      </div>
                      <p className={`text-sm ${event.urgent ? cfg.color : "text-gray-700"}`}>
                        {event.title}
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 shrink-0 mt-0.5" />
                  </div>

                  {/* Detail */}
                  <div className={`flex items-center gap-1.5 mb-2 text-sm flex-wrap ${event.urgent ? "text-gray-700" : "text-gray-600"}`}>
                    {event.action === "mover" && event.destino ? (
                      <span>
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-gray-200 text-xs">{event.piquete}</span>
                        <ArrowLeftRight size={12} className="inline mx-1 text-gray-400" />
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-gray-200 text-xs">{event.destino}</span>
                      </span>
                    ) : (
                      <span className="bg-white/80 px-1.5 py-0.5 rounded border border-gray-200 text-xs">{event.detail}</span>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="flex items-start gap-1.5">
                    <CheckCircle size={12} className="text-gray-300 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400">{event.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ── Pasture Biomass Tooltip ── */
  function BiomassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: any }>; label?: string }) {
    if (!active || !payload?.length) return null;
    const point = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="text-gray-600 mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${point.payload.occupied ? "bg-amber-500" : "bg-emerald-500"}`} />
          <span className="text-gray-500">Biomassa:</span>
          <span className="text-gray-800">{point.value.toLocaleString("pt-BR")} kg/ha</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {point.payload.occupied ? "🐄 Piquete ocupado" : "🌱 Em descanso"}
        </p>
      </div>
    );
  }

  /* ── Pasture Panel Content ── */
  const selectedBiomassData = selectedAreaId !== null ? (areaBiomassData[selectedAreaId] || []) : [];
  const selectedAreaName = areaOptions.find(a => a.id === selectedAreaId)?.name || "";

  // KPIs for selected area
  const currentBiomass = selectedBiomassData.length > 0 ? selectedBiomassData[0].biomass_kg_ha : 0;
  const finalBiomass = selectedBiomassData.length > 0 ? selectedBiomassData[selectedBiomassData.length - 1].biomass_kg_ha : 0;
  const occupiedWeeks = selectedBiomassData.filter(p => p.occupied).length;
  const restingWeeks = selectedBiomassData.filter(p => !p.occupied).length;
  const minBiomass = selectedBiomassData.length > 0 ? Math.min(...selectedBiomassData.map(p => p.biomass_kg_ha)) : 0;

  const pasturePanel = (
    <div className="flex-1 p-4 sm:p-6 space-y-5">
      {/* Paddock selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {areaOptions.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedAreaId(area.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all border ${
              selectedAreaId === area.id
                ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
            }`}
          >
            <Leaf size={13} />
            {area.name}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Biomassa Atual",
            value: `${currentBiomass.toLocaleString("pt-BR")} kg/ha`,
            sub: currentBiomass >= 2500 ? "pronto para entrada" : currentBiomass >= 1200 ? "uso controlado" : "necessita descanso",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
          },
          {
            label: "Semanas Ocupado",
            value: `${occupiedWeeks}`,
            sub: `de ${occupiedWeeks + restingWeeks} semanas simuladas`,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
          },
          {
            label: "Biomassa Mínima",
            value: `${minBiomass.toLocaleString("pt-BR")} kg/ha`,
            sub: minBiomass < 800 ? "⚠️ abaixo do crítico" : minBiomass < 1200 ? "próximo da saída" : "dentro do ideal",
            color: minBiomass < 800 ? "text-red-600" : "text-blue-600",
            bg: minBiomass < 800 ? "bg-red-50" : "bg-blue-50",
            border: minBiomass < 800 ? "border-red-200" : "border-blue-200",
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl p-4 border ${kpi.bg} ${kpi.border}`}>
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Biomass Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-gray-800 text-sm sm:text-base">Massa Verde ao Longo do Tempo</h3>
            <p className="text-xs text-gray-400 mt-0.5">{selectedAreaName} · biomassa (kg/ha) por semana</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500">Descanso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-500">Ocupado</span>
            </div>
          </div>
        </div>

        {selectedBiomassData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={selectedBiomassData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorBiomass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 4500]}
                tickFormatter={(v) => `${v.toLocaleString("pt-BR")}`}
                width={50}
              />
              <Tooltip content={<BiomassTooltip />} />

              {/* Reference lines */}
              <ReferenceLine
                y={2500}
                stroke="#10b981"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{ value: "Entrada (2.500)", position: "right", fontSize: 10, fill: "#10b981" }}
              />
              <ReferenceLine
                y={1200}
                stroke="#f59e0b"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{ value: "Saída (1.200)", position: "right", fontSize: 10, fill: "#f59e0b" }}
              />
              <ReferenceLine
                y={800}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{ value: "Crítico (800)", position: "right", fontSize: 10, fill: "#ef4444" }}
              />
              <ReferenceLine
                x="Hoje"
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={{ value: "Hoje", position: "top", fontSize: 11, fill: "#9ca3af" }}
              />

              <Area
                type="monotone"
                dataKey="biomass_kg_ha"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorBiomass)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      key={`dot-${payload.week}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={payload.occupied ? "#f59e0b" : "#10b981"}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: "#10b981", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-gray-500 text-center py-12">Sem dados de biomassa para este piquete.</div>
        )}
      </div>

      {/* Reference info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h3 className="text-gray-800 mb-4">Referências de Biomassa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Biomassa de Entrada",
              value: "2.500 kg/ha",
              sub: "piquete pronto para receber o lote",
              color: "bg-emerald-500",
            },
            {
              label: "Biomassa de Saída",
              value: "1.200 kg/ha",
              sub: "sinal de saída programada",
              color: "bg-amber-400",
            },
            {
              label: "Biomassa Crítica",
              value: "800 kg/ha",
              sub: "abaixo disso, animal perde peso",
              color: "bg-red-500",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.color}`} />
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg mt-0.5 text-gray-800">{item.value}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Analytics Panel ── */
  const analyticsPanel = (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Back button on mobile */}
      <button
        onClick={() => setMobileTab("timeline")}
        className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-sm text-green-700 bg-white border-b border-gray-100"
      >
        <ChevronDown size={14} className="rotate-90" />
        Voltar ao Cronograma
      </button>

      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 mb-0.5">
          {activePanel === "weight" ? (
            <TrendingUp size={16} className="text-green-700" />
          ) : (
            <Leaf size={16} className="text-green-700" />
          )}
          <span className="text-gray-500 text-sm">
            {activePanel === "weight" ? "Projeção financeira" : "Análise de pastagem"}
          </span>
        </div>

        {/* Panel selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setPanelDropdownOpen(!panelDropdownOpen)}
            className="flex items-center gap-2 text-gray-800 hover:text-green-700 transition-colors cursor-pointer group"
          >
            <h2 className="text-gray-800 group-hover:text-green-700 transition-colors">
              {activePanel === "weight" ? "Painel de Ganho de Peso" : "Painel de Piquetes"}
            </h2>
            <ChevronDown
              size={16}
              className={`text-gray-400 group-hover:text-green-600 transition-transform ${
                panelDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {panelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
              <button
                onClick={() => { setActivePanel("weight"); setPanelDropdownOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activePanel === "weight" ? "bg-green-50 text-green-700" : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <TrendingUp size={16} />
                <div>
                  <p className="text-sm font-medium">Painel de Ganho de Peso</p>
                  <p className="text-xs text-gray-400">Projeção de peso e economia</p>
                </div>
                {activePanel === "weight" && <CheckCircle size={14} className="ml-auto text-green-600" />}
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => { setActivePanel("pasture"); setPanelDropdownOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activePanel === "pasture" ? "bg-green-50 text-green-700" : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <Leaf size={16} />
                <div>
                  <p className="text-sm font-medium">Painel de Piquetes</p>
                  <p className="text-xs text-gray-400">Biomassa e análise por área</p>
                </div>
                {activePanel === "pasture" && <CheckCircle size={14} className="ml-auto text-green-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {activePanel === "weight" ? (
      <div className="flex-1 p-4 sm:p-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Peso Total Projetado",
              value: `${totalProjetado.toLocaleString("pt-BR")} kg`,
              sub: economics ? `em ${Math.round(economics.simulationDays / 7)} semanas` : "",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-200",
            },
            {
              label: "Movimentações Previstas",
              value: economics ? `${economics.totalMoves}` : "\u2014",
              sub: "trocas de piquete estimadas",
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-200",
            },
            {
              label: "Ganho Semanal Estimado",
              value: `+${nextWeekGain.toLocaleString("pt-BR")} kg`,
              sub: "por semana (total do rebanho)",
              color: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-200",
            },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-xl p-4 border ${kpi.bg} ${kpi.border}`}>
              <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
              <p className={`text-2xl ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Gráfico de Linhas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-gray-800 text-sm sm:text-base">Projeção de Ganho de Peso Acumulado</h3>
              <p className="text-xs text-gray-400 mt-0.5">Total do rebanho · kg acumulados por semana</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                <span className="text-xs text-gray-500">Projetado</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="semana"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}t`}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x="Hoje"
                stroke="#d1d5db"
                strokeDasharray="4 4"
                label={{ value: "Hoje", position: "top", fontSize: 11, fill: "#9ca3af" }}
              />
              <Line
                type="monotone"
                dataKey="projetado"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 5, fill: "#10b981" }}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Impacto econômico */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-gray-800 mb-4">Impacto Econômico Projetado</h3>
          {economics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { 
                  label: `Receita Projetada (${Math.round(economics.simulationDays / 7)} sem)`, 
                  value: `R$ ${economics.receita_projetada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
                  sub: `@ R$ ${economics.preco_kg_vivo.toFixed(2).replace('.', ',')}/kg vivo`, 
                  positive: true 
                },
                { 
                  label: "Ganho vs. Saída Antecipada", 
                  value: `+R$ ${economics.ganho_vs_atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
                  sub: "benefício de esperar o ponto ideal", 
                  positive: true 
                },
                { 
                  label: "Custo de Suplementação", 
                  value: `R$ ${economics.custo_suplementacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
                  sub: `estimado para ${Math.round(economics.simulationDays / 7)} semanas`, 
                  positive: false 
                },
                { 
                  label: "Margem Líquida Estimada", 
                  value: `R$ ${economics.margem_liquida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
                  sub: "após custos variáveis", 
                  positive: true 
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.positive ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className={`text-lg mt-0.5 ${item.positive ? "text-gray-800" : "text-amber-600"}`}>{item.value}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">Carregando dados econômicos...</div>
          )}
        </div>
      </div>
      ) : (
        pasturePanel
      )}
    </div>
  );

  return (
    <>
      {/* Desktop layout: side by side */}
      <div className="hidden lg:flex h-full overflow-hidden bg-[#f7f9f4]">
        <div className="w-[42%] min-w-[320px] flex flex-col border-r border-gray-200">
          {timelinePanel}
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {analyticsPanel}
        </div>
      </div>

      {/* Mobile layout: tab switching */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden bg-[#f7f9f4]">
        {/* Mobile tab bar */}
        <div className="flex bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setMobileTab("timeline")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              mobileTab === "timeline"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-500"
            }`}
          >
            <Calendar size={14} className="inline mr-1.5" />
            Cronograma
          </button>
          <button
            onClick={() => setMobileTab("analytics")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              mobileTab === "analytics"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-500"
            }`}
          >
            <TrendingUp size={14} className="inline mr-1.5" />
            Análises
          </button>
        </div>

        {mobileTab === "timeline" ? (
          <div className="flex-1 overflow-y-auto">{timelinePanel}</div>
        ) : (
          <div className="flex-1 overflow-y-auto">{analyticsPanel}</div>
        )}
      </div>
    </>
  );
}
