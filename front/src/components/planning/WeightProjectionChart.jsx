import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

const barColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentOfMeta = Math.round((data.kgGanhos / data.meta) * 100);
    return (
      <div className="bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-bold text-white mb-1">{data.nome}</p>
        <p className="text-xs text-gray-400">
          Ganho projetado:{" "}
          <span className="text-emerald-400 font-semibold">
            +{data.kgGanhos} kg
          </span>
        </p>
        <p className="text-xs text-gray-400">
          Meta:{" "}
          <span className="text-white font-semibold">{data.meta} kg</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {percentOfMeta}% da meta atingida
        </p>
      </div>
    );
  }
  return null;
}

export default function WeightProjectionChart({ projections }) {
  const totalKg = projections.reduce((sum, p) => sum + p.kgGanhos, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Projeção de Ganho de Peso
            </h2>
            <p className="text-xs text-gray-500">Estimativa semanal por lote</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">+{totalKg}</p>
          <p className="text-xs text-gray-500">kg total projetado</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={projections}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="nome"
              tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}kg`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar
              dataKey="kgGanhos"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {projections.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
