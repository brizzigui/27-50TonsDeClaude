// ==========================================
// Mock Data — PastureAI MVP
// ==========================================

export const piquetes = [
  {
    id: "PIQ-01",
    nome: "Piquete 01 - Baixada",
    tamanhoHectares: 12,
    statusSaude: "green",
    ultimaAvaliacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 35,
      categoria: "Garrotes",
      pesoMedioKg: 300,
    },
    massaVerdePct: 78,
  },
  {
    id: "PIQ-02",
    nome: "Piquete 02 - Morro",
    tamanhoHectares: 8,
    statusSaude: "yellow",
    ultimaAvaliacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 22,
      categoria: "Novilhas",
      pesoMedioKg: 250,
    },
    massaVerdePct: 45,
  },
  {
    id: "PIQ-03",
    nome: "Piquete 03 - Córrego",
    tamanhoHectares: 15,
    statusSaude: "red",
    ultimaAvaliacao: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 0,
      categoria: null,
      pesoMedioKg: null,
    },
    massaVerdePct: 12,
  },
  {
    id: "PIQ-04",
    nome: "Piquete 04 - Chapada",
    tamanhoHectares: 10,
    statusSaude: "green",
    ultimaAvaliacao: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 40,
      categoria: "Bois",
      pesoMedioKg: 450,
    },
    massaVerdePct: 91,
  },
  {
    id: "PIQ-05",
    nome: "Piquete 05 - Várzea",
    tamanhoHectares: 18,
    statusSaude: "green",
    ultimaAvaliacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 28,
      categoria: "Garrotes",
      pesoMedioKg: 320,
    },
    massaVerdePct: 65,
  },
  {
    id: "PIQ-06",
    nome: "Piquete 06 - Serra",
    tamanhoHectares: 6,
    statusSaude: "yellow",
    ultimaAvaliacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ocupacao: {
      quantidade: 15,
      categoria: "Novilhas",
      pesoMedioKg: 220,
    },
    massaVerdePct: 38,
  },
];

export const eventos = [
  {
    id: "EVT-01",
    data: new Date().toISOString(),
    labelData: "HOJE",
    acao: "mover",
    instrucao: "Mover rebanho do Piquete 01 para o Piquete 04",
    motivo: "Piquete 01 atingiu limite de massa seca",
  },
  {
    id: "EVT-02",
    data: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    labelData: "Amanhã",
    acao: "descansar",
    instrucao: "Manter Piquete 03 em descanso",
    motivo: "Recuperação de biomassa em andamento (12% → meta 60%)",
  },
  {
    id: "EVT-03",
    data: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    labelData: "Em 5 dias",
    acao: "mover",
    instrucao: "Rebanho está pronto para venda",
    motivo: "Lote atingiu peso de abate projetado (480kg)",
  },
  {
    id: "EVT-04",
    data: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    labelData: "Em 7 dias",
    acao: "mover",
    instrucao: "Mover rebanho do Piquete 05 para o Piquete 03",
    motivo: "Piquete 03 recuperou biomassa suficiente (60%+)",
  },
];

export const projecoes = [
  { piquete: "PIQ-01", nome: "Baixada", kgGanhos: 450, meta: 500 },
  { piquete: "PIQ-02", nome: "Morro", kgGanhos: 280, meta: 350 },
  { piquete: "PIQ-04", nome: "Chapada", kgGanhos: 620, meta: 600 },
  { piquete: "PIQ-05", nome: "Várzea", kgGanhos: 390, meta: 420 },
  { piquete: "PIQ-06", nome: "Serra", kgGanhos: 150, meta: 280 },
];
