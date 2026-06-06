import { useState, useRef } from "react";
import { Camera, Upload, Ruler, CheckCircle2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { updateLeitura } from "../../services/api";
import { usePiqueteContext } from "../../context/PiqueteContext";

export default function UpdateReadingModal({
  piqueteId,
  piqueteNome,
  isOpen,
  onClose,
}) {
  const [altura, setAltura] = useState("");
  const [imagemFile, setImagemFile] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const { updatePiquete } = usePiqueteContext();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImagemFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagemPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!altura || !imagemFile) return;

    setIsSubmitting(true);
    try {
      const result = await updateLeitura({
        piqueteId,
        altura: Number(altura),
        imagem: imagemFile,
      });
      if (result.success) {
        updatePiquete(piqueteId, {
          ultimaAvaliacao: result.novaAvaliacao,
        });
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Erro ao atualizar leitura:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setAltura("");
    setImagemFile(null);
    setImagemPreview(null);
    setSuccess(false);
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Atualizar Leitura">
      {success ? (
        <div className="text-center py-6 animate-fadeIn">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-white">Leitura Enviada!</p>
          <p className="text-sm text-gray-400 mt-1">{piqueteNome}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Piquete info */}
          <div className="text-sm text-gray-400">
            Atualizando: <span className="text-white font-medium">{piqueteNome}</span>
          </div>

          {/* Altura */}
          <div>
            <label
              htmlFor="altura-input"
              className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2"
            >
              <Ruler className="w-4 h-4 text-emerald-400" />
              Altura da Pastagem (cm)
            </label>
            <input
              id="altura-input"
              type="number"
              min="0"
              max="200"
              step="0.5"
              placeholder="Ex: 25"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/[0.05] border border-white/[0.1]
                text-white placeholder-gray-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                transition-all duration-200
                text-lg font-semibold
              "
            />
          </div>

          {/* Foto */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Foto da Pastagem
            </label>

            {imagemPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.1]">
                <img
                  src={imagemPreview}
                  alt="Preview da pastagem"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagemFile(null);
                    setImagemPreview(null);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-white text-xs hover:bg-black/70 transition-colors cursor-pointer"
                >
                  Remover
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  w-full py-8 rounded-xl
                  border-2 border-dashed border-white/[0.1]
                  bg-white/[0.02] hover:bg-white/[0.04]
                  flex flex-col items-center gap-2
                  transition-colors duration-200 cursor-pointer
                "
              >
                <Upload className="w-8 h-8 text-gray-600" />
                <span className="text-sm text-gray-500">
                  Clique para adicionar foto
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            disabled={!altura || !imagemFile}
          >
            Enviar Leitura
          </Button>
        </form>
      )}
    </Modal>
  );
}
