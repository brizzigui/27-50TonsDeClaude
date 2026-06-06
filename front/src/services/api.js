// ==========================================
// API Service — PastureAI MVP
// Simulated API calls using mock data
// Replace with real Axios calls when backend is ready
// ==========================================

import { piquetes, eventos, projecoes } from "../data/mockData";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPiquetes() {
  await delay(500);
  return [...piquetes];
}

export async function getEventos() {
  await delay(400);
  return [...eventos];
}

export async function getProjecoes() {
  await delay(400);
  return [...projecoes];
}

export async function updateLeitura({ piqueteId, altura, imagem }) {
  await delay(1000);
  console.log("[API Mock] POST /api/update", { piqueteId, altura, imagem });
  // Simulate a successful response
  return {
    success: true,
    message: "Leitura atualizada com sucesso",
    piqueteId,
    novaAvaliacao: new Date().toISOString(),
  };
}
