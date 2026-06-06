import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin,
  Ruler,
  Clock,
  Beef,
  Weight,
  Leaf,
  ScanLine,
} from "lucide-react";
import Semaphore from "../ui/Semaphore";
import ProgressBar from "../ui/ProgressBar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import UpdateReadingModal from "./UpdateReadingModal";

const statusLabels = {
  green: { text: "Saudável", color: "green" },
  yellow: { text: "Atenção", color: "yellow" },
  red: { text: "Crítico", color: "red" },
};

export default function PiqueteDetail({ piquete }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!piquete) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500 font-medium">Selecione um piquete</p>
          <p className="text-gray-600 text-sm mt-1">
            Clique em uma área no mapa ao lado
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[piquete.statusSaude] || statusLabels.green;
  const timeAgo = formatDistanceToNow(new Date(piquete.ultimaAvaliacao), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className="h-full flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            {piquete.id}
          </span>
          <Badge text={statusInfo.text} color={statusInfo.color} />
        </div>
        <h2 className="text-xl font-bold text-white">{piquete.nome}</h2>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Tamanho */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Ruler className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Tamanho
            </span>
          </div>
          <p className="text-lg font-bold text-white">
            {piquete.tamanhoHectares}{" "}
            <span className="text-sm font-normal text-gray-400">ha</span>
          </p>
        </div>

        {/* Última Avaliação */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Avaliação
            </span>
          </div>
          <p className="text-sm font-semibold text-white capitalize">{timeAgo}</p>
        </div>

        {/* Ocupação */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Beef className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Ocupação
            </span>
          </div>
          {piquete.ocupacao.quantidade > 0 ? (
            <p className="text-lg font-bold text-white">
              {piquete.ocupacao.quantidade}{" "}
              <span className="text-sm font-normal text-gray-400">cabeças</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-500">Vazio</p>
          )}
        </div>

        {/* Categoria / Peso */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Weight className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Categoria
            </span>
          </div>
          {piquete.ocupacao.categoria ? (
            <>
              <p className="text-sm font-semibold text-white">
                {piquete.ocupacao.categoria}
              </p>
              <p className="text-xs text-gray-500">
                ~{piquete.ocupacao.pesoMedioKg}kg/cab
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-500">—</p>
          )}
        </div>
      </div>

      {/* Biomass Bar */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Massa Verde</span>
          <Semaphore status={piquete.statusSaude} size="sm" />
        </div>
        <ProgressBar
          value={piquete.massaVerdePct}
          label="Estimativa de Biomassa"
        />
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <ScanLine className="w-5 h-5" />
          Atualizar Leitura
        </Button>
      </div>

      {/* Modal */}
      <UpdateReadingModal
        piqueteId={piquete.id}
        piqueteNome={piquete.nome}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
