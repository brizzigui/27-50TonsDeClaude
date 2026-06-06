import { useState, useRef } from "react";
import axios from "axios";
import {
  MapPin, Leaf, Clock, Users, Camera, Upload,
  CheckCircle, AlertCircle, XCircle, RefreshCw, X, Ruler, ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";

interface Piquete {
  id: number;
  name: string;
  subtitle: string;
  area: number;
  status: "green" | "yellow" | "red";
  lastEval: string;
  cattle: number;
  category: string;
  biomass: number;
  capacity: number;
}

const PIQUETES: Piquete[] = [
  { id: 1, name: "Área 01", subtitle: "Baixada", area: 12, status: "green", lastEval: "há 3 dias", cattle: 35, category: "Garrotes 300kg", biomass: 78, capacity: 45 },
  { id: 2, name: "Área 02", subtitle: "Cerrado", area: 8, status: "yellow", lastEval: "há 1 dia", cattle: 28, category: "Vacas 450kg", biomass: 45, capacity: 30 },
  { id: 3, name: "Área 03", subtitle: "Alto", area: 15, status: "green", lastEval: "há 5 dias", cattle: 42, category: "Novilhos 350kg", biomass: 92, capacity: 55 },
  { id: 4, name: "Área 04", subtitle: "Várzea", area: 10, status: "red", lastEval: "há 7 dias", cattle: 18, category: "Garrotes 280kg", biomass: 22, capacity: 38 },
  { id: 5, name: "Área 05", subtitle: "Serra", area: 20, status: "green", lastEval: "há 2 dias", cattle: 55, category: "Touros 600kg", biomass: 65, capacity: 70 },
  { id: 6, name: "Área 06", subtitle: "Brejo", area: 6, status: "yellow", lastEval: "há 4 dias", cattle: 15, category: "Bezerros 150kg", biomass: 38, capacity: 22 },
  { id: 7, name: "Área 07", subtitle: "Manga", area: 18, status: "green", lastEval: "há 1 dia", cattle: 48, category: "Novilhas 320kg", biomass: 85, capacity: 60 },
  { id: 8, name: "Área 08", subtitle: "Fundo", area: 11, status: "red", lastEval: "há 10 dias", cattle: 22, category: "Garrotes 290kg", biomass: 15, capacity: 40 },
  { id: 9, name: "Área 09", subtitle: "Norte", area: 14, status: "green", lastEval: "há 2 dias", cattle: 38, category: "Vacas 400kg", biomass: 72, capacity: 50 },
];

const statusConfig = {
  green: { label: "Saudável", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  yellow: { label: "Atenção", color: "bg-amber-400", textColor: "text-amber-700", bgLight: "bg-amber-50", border: "border-amber-200", icon: AlertCircle },
  red: { label: "Crítico", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", border: "border-red-200", icon: XCircle },
};

function biomassColor(v: number) {
  if (v >= 70) return "bg-emerald-500";
  if (v >= 40) return "bg-amber-400";
  return "bg-red-500";
}

export function Dashboard() {
  const [selected, setSelected] = useState<Piquete>(PIQUETES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [height, setHeight] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "details">("map");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!height) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("piqueteId", String(selected.id));
      formData.append("altura", height);
      if (photo) formData.append("imagem", photo);

      // POST para /api/update — endpoint real a ser conectado ao backend
      await axios.post("/api/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).catch(() => {
        // Simula sucesso em ambiente de desenvolvimento (sem backend)
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setModalOpen(false);
        setHeight("");
        setPhoto(null);
        setPhotoPreview(null);
      }, 1800);
    } finally {
      setSubmitting(false);
    }
  }

  function openModal() {
    setModalOpen(true);
    setSubmitSuccess(false);
    setHeight("");
    setPhoto(null);
    setPhotoPreview(null);
  }

  function selectArea(p: Piquete) {
    setSelected(p);
    setMobileTab("details");
  }

  const cfg = statusConfig[selected.status];
  const StatusIcon = cfg.icon;
  const occupancyPct = Math.round((selected.cattle / selected.capacity) * 100);

  /* ── Map Panel (areas grid) ── */
  const mapPanel = (
    <div className="flex flex-col bg-white h-full">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-0.5">
          <MapPin size={16} className="text-green-700" />
          <span className="text-gray-500 text-sm">Propriedade: Fazenda Santa Cruz</span>
        </div>
        <h2 className="text-gray-800">Mapa de Pastagens</h2>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${val.color}`} />
            <span className="text-xs text-gray-500">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {PIQUETES.map((p) => {
            const s = statusConfig[p.status];
            const isSelected = selected.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectArea(p)}
                className={`
                  relative rounded-xl p-3 text-left transition-all border-2 cursor-pointer
                  ${isSelected
                    ? "border-green-600 bg-green-50 shadow-md shadow-green-100"
                    : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                  }
                `}
              >
                <div className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ${s.color}`} />
                <Leaf size={18} className={isSelected ? "text-green-600" : "text-gray-400"} />
                <p className={`mt-1.5 text-xs leading-tight ${isSelected ? "text-green-800" : "text-gray-700"}`}>
                  {p.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{p.subtitle}</p>
                <div className="mt-2">
                  <div className={`h-1 rounded-full w-full ${isSelected ? "bg-green-100" : "bg-gray-100"}`}>
                    <div
                      className={`h-1 rounded-full transition-all ${biomassColor(p.biomass)}`}
                      style={{ width: `${p.biomass}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{p.biomass}% biomassa</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary bar */}
      <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50 flex gap-4 sm:gap-5">
        <div className="text-center">
          <p className="text-lg text-gray-800">{PIQUETES.reduce((a, p) => a + p.cattle, 0)}</p>
          <p className="text-xs text-gray-500">Total Cabeças</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-lg text-gray-800">{PIQUETES.reduce((a, p) => a + p.area, 0)} ha</p>
          <p className="text-xs text-gray-500">Área Total</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="text-center">
          <p className="text-lg text-emerald-600">{PIQUETES.filter(p => p.status === "green").length}</p>
          <p className="text-xs text-gray-500">Saudáveis</p>
        </div>
      </div>
    </div>
  );

  /* ── Details Panel ── */
  const detailsPanel = (
    <div className="flex flex-col bg-[#f7f9f4] h-full overflow-y-auto">
      {/* Back button on mobile */}
      <button
        onClick={() => setMobileTab("map")}
        className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-sm text-green-700 bg-white border-b border-gray-100"
      >
        <ChevronDown size={14} className="rotate-90" />
        Voltar ao Mapa
      </button>

      {/* Header da área selecionada */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgLight} ${cfg.textColor} border ${cfg.border}`}>
                <StatusIcon size={11} className="inline mr-1" />
                {cfg.label}
              </span>
            </div>
            <h1 className="text-gray-900">{selected.name} — {selected.subtitle}</h1>
            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
              <MapPin size={13} />
              {selected.area} hectares
              <span className="mx-1 text-gray-300">·</span>
              <Clock size={13} />
              Avaliado {selected.lastEval}
            </p>
          </div>
          <Button
            onClick={openModal}
            className="bg-green-700 hover:bg-green-800 text-white gap-2 shrink-0 w-full sm:w-auto"
          >
            <RefreshCw size={15} />
            Atualizar Leitura
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-4">
        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ocupação Atual */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm">Ocupação Atual</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {occupancyPct}% da cap.
              </Badge>
            </div>
            <p className="text-3xl text-gray-900">{selected.cattle}</p>
            <p className="text-gray-500 text-sm mt-0.5">cabeças · {selected.category}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{selected.cattle} cabeças</span>
                <span>Cap. {selected.capacity}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${
                    occupancyPct > 85 ? "bg-red-500" : occupancyPct > 65 ? "bg-amber-400" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status de Saúde */}
          <div className={`rounded-xl p-4 sm:p-5 border shadow-sm ${cfg.bgLight} ${cfg.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center`}>
                <StatusIcon size={16} className={cfg.textColor} />
              </div>
              <p className="text-gray-600 text-sm">Saúde da Pastagem</p>
            </div>
            <p className={`text-3xl ${cfg.textColor}`}>{cfg.label}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {selected.status === "green" && "Pastagem em boas condições"}
              {selected.status === "yellow" && "Monitoramento recomendado"}
              {selected.status === "red" && "Intervenção necessária"}
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
              <p className={`text-xs ${cfg.textColor}`}>
                Última avaliação: {selected.lastEval}
              </p>
            </div>
          </div>
        </div>

        {/* Massa Verde - Biomassa */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Leaf size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-700">Massa Verde (Biomassa)</p>
                <p className="text-gray-400 text-xs">Estimativa de forragem disponível</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className={`text-2xl ${biomassColor(selected.biomass).replace("bg-", "text-")}`}>
                {selected.biomass}%
              </p>
              <p className="text-xs text-gray-400">
                {selected.biomass >= 70 ? "Disponível para pastejo" : selected.biomass >= 40 ? "Uso controlado" : "Necessita descanso"}
              </p>
            </div>
          </div>

          {/* Barra de progresso principal */}
          <div className="relative h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${biomassColor(selected.biomass)}`}
              style={{ width: `${selected.biomass}%` }}
            />
            {/* Marcadores de referência */}
            <div className="absolute top-0 left-[40%] h-full w-px bg-white/60" />
            <div className="absolute top-0 left-[70%] h-full w-px bg-white/60" />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0%</span>
            <span className="text-amber-500 hidden sm:inline">40% — Atenção</span>
            <span className="text-amber-500 sm:hidden">40%</span>
            <span className="text-emerald-600 hidden sm:inline">70% — Ideal</span>
            <span className="text-emerald-600 sm:hidden">70%</span>
            <span>100%</span>
          </div>

          {/* Estimativa em kg/ha */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Massa Atual", value: `${Math.round(selected.biomass * 42)} kg/ha`, sub: "forragem verde" },
              { label: "Ponto de Entrada", value: "2.500 kg/ha", sub: "altura 25-30cm" },
              { label: "Ponto de Saída", value: "1.200 kg/ha", sub: "altura 10-15cm" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-gray-800 text-sm mt-0.5">{item.value}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop layout: side by side */}
      <div className="hidden lg:flex h-full overflow-hidden">
        <div className="w-[42%] min-w-[320px] flex flex-col border-r border-gray-200">
          {mapPanel}
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {detailsPanel}
        </div>
      </div>

      {/* Mobile layout: tab switching */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden">
        {mobileTab === "map" ? (
          <div className="flex-1 overflow-y-auto">{mapPanel}</div>
        ) : (
          <div className="flex-1 overflow-y-auto">{detailsPanel}</div>
        )}
      </div>

      {/* Modal de Atualização */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={18} className="text-green-700" />
              Atualizar Leitura — {selected.name}
            </DialogTitle>
          </DialogHeader>

          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <p className="text-gray-700">Leitura enviada com sucesso!</p>
              <p className="text-sm text-gray-400">Os dados serão processados em breve.</p>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Altura */}
              <div className="space-y-2">
                <label className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Ruler size={15} className="text-gray-400" />
                  Altura do pasto (cm)
                </label>
                <input
                  type="number"
                  min={0}
                  max={200}
                  placeholder="Ex: 28"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 transition-all"
                />
                <p className="text-xs text-gray-400">Altura média do dossel forrageiro em centímetros</p>
              </div>

              {/* Upload de foto */}
              <div className="space-y-2">
                <label className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Camera size={15} className="text-gray-400" />
                  Foto da área
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={photoPreview} alt="Pré-visualização" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X size={14} className="text-white" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 py-2 px-3">
                      <p className="text-white text-xs truncate">{photo?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all group"
                  >
                    <Upload size={24} className="mx-auto text-gray-300 group-hover:text-green-500 mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-gray-700">
                      Clique para tirar foto ou fazer upload
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG até 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!submitSuccess && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!height || submitting}
                className="bg-green-700 hover:bg-green-800 text-white gap-2 w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Enviar Leitura
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
