import { useState, useEffect } from "react";
import api from "../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { User, Mail, Phone, MapPin, CheckCircle, Save } from "lucide-react";

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfile({ open, onOpenChange }: UserProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [farm, setFarm] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      api.get("/api/profile")
        .then(({ data }) => {
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setFarm(data.farm_name || "");
        })
        .catch(err => console.error("Erro ao buscar perfil", err));
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/profile", {
        name,
        email,
        phone,
        farm_name: farm
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error("Erro ao salvar perfil", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Meu Perfil</DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-600" />
            </div>
            <p className="text-gray-700 font-medium">Informações atualizadas!</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center shadow-md">
                <span className="text-white text-3xl font-semibold">
                  {name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <User size={15} className="text-gray-400" />
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Mail size={15} className="text-gray-400" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Phone size={15} className="text-gray-400" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <MapPin size={15} className="text-gray-400" />
                  Propriedade
                </label>
                <input
                  type="text"
                  value={farm}
                  onChange={(e) => setFarm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {!saved && (
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name}
              className="bg-green-700 hover:bg-green-800 text-white gap-2 w-full sm:w-auto"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
