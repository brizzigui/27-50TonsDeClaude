import { useState, useEffect } from "react";
import api from "../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle, Save, MapPin, Grid, Plus, Trash2, Beef, RefreshCw } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void; // call to refresh parent components
}

interface Area {
  id: number;
  name: string;
  area_hectares: number;
  grass_type: string;
}

interface Lote {
  id?: number;
  current_area_id?: number | null;
  animal_category: string;
  head_count: number;
  average_weight_kg: number;
  target_weight_kg: number | null;
}

export function SettingsModal({ open, onOpenChange, onUpdate }: SettingsModalProps) {
  const [tab, setTab] = useState<"lote" | "areas">("lote");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Areas state
  const [areas, setAreas] = useState<Area[]>([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaHa, setNewAreaHa] = useState("");
  const [newAreaGrass, setNewAreaGrass] = useState("");

  // Lote state
  const [lote, setLote] = useState<Lote>({
    animal_category: "Garrotes",
    head_count: 0,
    average_weight_kg: 0,
    target_weight_kg: 0,
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const areasRes = await api.get("/api/areas");
      setAreas(areasRes.data);

      try {
        const loteRes = await api.get("/api/lote");
        if (loteRes.data) {
          setLote(loteRes.data);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Erro ao carregar lote", err);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar configurações", err);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName || !newAreaHa) return;
    setSaving(true);
    try {
      await api.post("/api/areas", {
        name: newAreaName,
        area_hectares: parseFloat(newAreaHa),
        grass_type: newAreaGrass || "Misto"
      });
      setNewAreaName("");
      setNewAreaHa("");
      setNewAreaGrass("");
      await loadData();
      onUpdate();
    } catch (err) {
      console.error("Erro ao adicionar área", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLote = async () => {
    setSaving(true);
    try {
      await api.post("/api/lote", {
        ...lote,
        head_count: parseInt(lote.head_count as any) || 0,
        average_weight_kg: parseFloat(lote.average_weight_kg as any) || 0,
        target_weight_kg: lote.target_weight_kg ? parseFloat(lote.target_weight_kg as any) : null,
      });
      setSaved(true);
      onUpdate();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Erro ao salvar lote", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurações da Propriedade</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 shrink-0 mb-2">
          <button
            onClick={() => setTab("lote")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${
              tab === "lote" ? "bg-white text-green-700 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Beef size={16} /> Lote de Gado
          </button>
          <button
            onClick={() => setTab("areas")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${
              tab === "areas" ? "bg-white text-green-700 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapPin size={16} /> Áreas (Piquetes)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {tab === "lote" && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-2">
                <p className="text-sm text-blue-800">
                  O sistema gerencia <strong>um lote único</strong> que se movimenta em conjunto entre as áreas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Categoria Animal</label>
                  <select
                    value={lote.animal_category}
                    onChange={(e) => setLote({ ...lote, animal_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Garrotes">Garrotes</option>
                    <option value="Novilhas">Novilhas</option>
                    <option value="Vacas">Vacas</option>
                    <option value="Bois">Bois</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantidade (Cabeças)</label>
                  <input
                    type="number"
                    min="1"
                    value={lote.head_count || ""}
                    onChange={(e) => setLote({ ...lote, head_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Peso Médio Atual (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={lote.average_weight_kg || ""}
                    onChange={(e) => setLote({ ...lote, average_weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Meta de Peso / Venda (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Opcional"
                    value={lote.target_weight_kg || ""}
                    onChange={(e) => setLote({ ...lote, target_weight_kg: Number(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {areas.length > 0 && (
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700">Piquete Atual</label>
                    <select
                      value={lote.current_area_id || ""}
                      onChange={(e) => setLote({ ...lote, current_area_id: Number(e.target.value) || null })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione o piquete onde o lote está hoje</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "areas" && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-green-600" /> Cadastrar Novo Piquete
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nome (ex: Piquete 04)"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Área (ha)"
                    value={newAreaHa}
                    onChange={e => setNewAreaHa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="Capim (ex: Braquiária)"
                    value={newAreaGrass}
                    onChange={e => setNewAreaGrass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <Button 
                  onClick={handleAddArea} 
                  disabled={!newAreaName || !newAreaHa || saving}
                  className="mt-3 w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white h-9"
                >
                  Adicionar Piquete
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-2 mt-4 px-1">Piquetes Cadastrados</h3>
                {areas.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-white border border-gray-100 rounded-lg">
                    Nenhum piquete cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {areas.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.area_hectares} ha • {a.grass_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2">
          {saved && (
             <div className="flex items-center gap-1.5 text-emerald-600 text-sm mr-auto font-medium">
               <CheckCircle size={16} /> Salvo com sucesso!
             </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
          {tab === "lote" && (
            <Button
              onClick={handleSaveLote}
              disabled={saving || lote.head_count <= 0 || lote.average_weight_kg <= 0}
              className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"
            >
              {saving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Salvar Lote
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
