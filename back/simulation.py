"""
simulation.py
─────────────
Simulação de rotacionamento de pastagem para rebanhos bovinos.

Exporta:
    simular_rotacao(lot, areas_db) → (timeline, weight_projection, summary, area_biomass_history)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional


# ─────────────────────────────────────────────
# Constantes agronômicas
# ─────────────────────────────────────────────

GDP_POR_CATEGORIA: dict[str, float] = {
    "garrotes": 1.60,
    "novilhas": 1.40,
    "vacas":    1.20,
}
GDP_DEFAULT = 1.40

CONSUMO_PERCENT_PV     = 0.025   # 2.5 % do peso vivo/dia
EFICIENCIA_PASTEJO     = 0.50    # 50 % da biomassa é utilizável pelo animal

# Biomassa (kg MS / ha)
BIOMASSA_ENTRADA       = 2500.0  # piquete pronto para receber o lote
BIOMASSA_SAIDA         = 1200.0  # sinal de saída programada
BIOMASSA_CRITICA       =  800.0  # saída forçada — abaixo disso o animal perde peso
BIOMASSA_MAX_HA        = 4000.0  # teto de acúmulo

# Crescimento diário (kg MS / ha / dia)
CRESCIMENTO_EM_DESCANSO  = 40.0
CRESCIMENTO_OCUPADO      = 12.0  # supressão pelo pastejo

# Ganho de peso
BIOMASSA_PLENO_GDP     = 2000.0  # acima disso o GDP é integral
# abaixo de BIOMASSA_CRITICA o GDP se torna negativo

# Movimentação
MARGEM_OPORTUNIDADE    = 500.0   # diferença mínima para troca por oportunidade
ESTADIA_MINIMA_DIAS    = 3       # dias mínimos no piquete antes de trocar por oportunidade

# Limites de simulação
LIMITE_DIAS_COM_ALVO   = 3650
LIMITE_DIAS_SEM_ALVO   = 180

# Econômicos (defaults — idealmente viriam do banco)
PRECO_KG_VIVO          = 18.0
CUSTO_SUPLEM_DIA_CAB   =  1.5


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _gdp_base(categoria: Optional[str]) -> float:
    if not categoria:
        return GDP_DEFAULT
    return GDP_POR_CATEGORIA.get(categoria.lower().strip(), GDP_DEFAULT)


def _gdp_efetivo(gdp_base: float, biomassa_kg_ha: float) -> float:
    """
    Ganho de peso linear e simplificado, focado em acelerar o ganho e facilitar a compreensão:
    - Acima da BIOMASSA_SAIDA: 100% do ganho base.
    - Entre a Crítica e a Saída: cai linearmente de 100% até 0%.
    - Abaixo da Crítica: perda fixa de -0.2 kg.
    """
    if biomassa_kg_ha >= BIOMASSA_SAIDA:
        return gdp_base

    if biomassa_kg_ha > BIOMASSA_CRITICA:
        fator = (biomassa_kg_ha - BIOMASSA_CRITICA) / (BIOMASSA_SAIDA - BIOMASSA_CRITICA)
        return gdp_base * fator

    return -0.20


def _biomassa_ha(area_info: dict) -> float:
    ha = area_info["area_hectares"]
    if ha <= 0:
        return 0.0
    return area_info["biomassa_restante"] / ha


# ─────────────────────────────────────────────
# Estado interno da simulação
# ─────────────────────────────────────────────

@dataclass
class _AreaState:
    id: int
    name: str
    area_hectares: float
    biomassa_restante: float

    @property
    def biomassa_ha(self) -> float:
        if self.area_hectares <= 0:
            return 0.0
        return self.biomassa_restante / self.area_hectares

    def crescer(self, ocupada: bool) -> None:
        taxa = CRESCIMENTO_OCUPADO if ocupada else CRESCIMENTO_EM_DESCANSO
        self.biomassa_restante = min(
            self.biomassa_restante + taxa * self.area_hectares,
            BIOMASSA_MAX_HA * self.area_hectares,
        )

    def consumir(self, kg: float) -> None:
        self.biomassa_restante = max(0.0, self.biomassa_restante - kg)


@dataclass
class _SimState:
    today: date
    peso_medio: float
    head_count: int
    current_area_id: int
    target_weight: Optional[float]
    gdp_base: float
    areas: dict[int, _AreaState]       # id → _AreaState
    dias_no_piquete: int = 0
    event_id: int = 0
    timeline: list[dict] = field(default_factory=list)
    weight_projection: list[dict] = field(default_factory=list)
    area_biomass_history: dict[int, list[dict]] = field(default_factory=dict)

    @property
    def current_area(self) -> Optional[_AreaState]:
        return self.areas.get(self.current_area_id)

    def next_event_id(self) -> int:
        self.event_id += 1
        return self.event_id

    def mover_para(self, destino_id: int, dia: int, motivo: str) -> None:
        origem = self.current_area
        destino = self.areas[destino_id]
        data = (self.today + timedelta(days=dia)).isoformat()

        self.timeline.append({
            "id":             self.next_event_id(),
            "date":           data,
            "day_offset":     dia,
            "action":         "mover",
            "from_area_id":   self.current_area_id,
            "from_area_name": origem.name if origem else "Desconhecido",
            "to_area_id":     destino_id,
            "to_area_name":   destino.name,
            "message":        (
                f"Mover para {destino.name} "
                f"(~{int(destino.biomassa_ha)} kg/ha disponíveis)."
            ),
            "reason": motivo,
        })
        self.current_area_id = destino_id
        self.dias_no_piquete = 0

    def registrar_alerta(self, dia: int, mensagem: str) -> None:
        # Throttle: no máximo 1 alerta a cada 7 dias
        for ev in reversed(self.timeline):
            if ev["action"] == "alerta":
                if dia - ev["day_offset"] < 7:
                    return
                break

        area = self.current_area
        self.timeline.append({
            "id":             self.next_event_id(),
            "date":           (self.today + timedelta(days=dia)).isoformat(),
            "day_offset":     dia,
            "action":         "alerta",
            "from_area_id":   self.current_area_id,
            "from_area_name": area.name if area else "Desconhecido",
            "to_area_id":     None,
            "to_area_name":   None,
            "message":        mensagem,
            "reason":         "Nível crítico de biomassa sem áreas disponíveis.",
        })

    def registrar_venda(self, dia: int) -> None:
        area = self.current_area
        self.timeline.append({
            "id":             self.next_event_id(),
            "date":           (self.today + timedelta(days=dia)).isoformat(),
            "day_offset":     dia,
            "action":         "venda",
            "from_area_id":   self.current_area_id,
            "from_area_name": area.name if area else None,
            "to_area_id":     None,
            "to_area_name":   None,
            "message":        (
                f"Rebanho atingiu peso alvo de {self.target_weight} kg "
                f"({self.head_count} cabeças)."
            ),
            "reason": f"Peso médio projetado: {round(self.peso_medio, 1)} kg/cabeça.",
        })

    def registrar_peso(self, dia: int) -> None:
        self.weight_projection.append({
            "date":               (self.today + timedelta(days=dia)).isoformat(),
            "day_offset":         dia,
            "week":               dia // 7,
            "average_weight_kg":  round(self.peso_medio, 1),
        })

    def registrar_biomassa_areas(self, dia: int) -> None:
        """Registra a biomassa (kg/ha) de cada piquete no dia dado."""
        for area_id, area in self.areas.items():
            if area_id not in self.area_biomass_history:
                self.area_biomass_history[area_id] = []
            self.area_biomass_history[area_id].append({
                "day":           dia,
                "date":          (self.today + timedelta(days=dia)).isoformat(),
                "week":          dia // 7,
                "biomass_kg_ha": round(area.biomassa_ha, 1),
                "occupied":      area_id == self.current_area_id,
            })


# ─────────────────────────────────────────────
# Decisão de movimentação
# ─────────────────────────────────────────────

def _escolher_destino(
    state: _SimState,
) -> tuple[Optional[int], str]:
    """
    Retorna (area_id_destino, motivo) ou (None, "") se não há destino viável.

    Prioridade dos gatilhos:
        P1. Saída crítica  — biomassa atual < BIOMASSA_CRITICA
        P2. Saída normal   — biomassa atual < BIOMASSA_SAIDA
                              E existe piquete com biomassa > BIOMASSA_ENTRADA
        P3. Oportunidade   — piquete destino tem biomassa muito superior
                              E estadia mínima cumprida
    """
    atual = state.current_area
    if not atual:
        return None, ""

    b_atual_ha = atual.biomassa_ha

    # Candidatos (toda área diferente da atual)
    candidatos = [
        a for a in state.areas.values()
        if a.id != state.current_area_id and a.area_hectares > 0
    ]

    # Melhor candidato: maior biomassa/ha, com preferência por descanso longo
    def score(a: _AreaState) -> float:
        return a.biomassa_ha

    candidatos.sort(key=score, reverse=True)
    melhor = candidatos[0] if candidatos else None

    # P1 — Saída crítica (aceita qualquer área com mais pasto que a atual)
    if b_atual_ha < BIOMASSA_CRITICA:
        if melhor and melhor.biomassa_ha > b_atual_ha:
            return melhor.id, (
                f"Saída crítica: piquete atual com {int(b_atual_ha)} kg/ha."
            )
        return None, ""  # sem destino → alerta será gerado

    # P2 — Saída programada
    if b_atual_ha < BIOMASSA_SAIDA:
        if melhor and melhor.biomassa_ha >= BIOMASSA_ENTRADA:
            return melhor.id, (
                f"Saída programada: {int(b_atual_ha)} kg/ha → "
                f"destino com {int(melhor.biomassa_ha)} kg/ha."
            )

    # P3 — Oportunidade (só após estadia mínima)
    if state.dias_no_piquete >= ESTADIA_MINIMA_DIAS:
        if melhor and melhor.biomassa_ha >= (b_atual_ha + MARGEM_OPORTUNIDADE):
            return melhor.id, (
                f"Troca por oportunidade: destino com "
                f"{int(melhor.biomassa_ha)} kg/ha vs {int(b_atual_ha)} kg/ha atual."
            )

    return None, ""


# ─────────────────────────────────────────────
# Loop principal
# ─────────────────────────────────────────────

def simular_rotacao(lot, areas_db) -> tuple[list, list, dict]:
    """
    Simula o rotacionamento do rebanho pelos piquetes dia a dia.

    Parâmetros
    ----------
    lot       : ORM CattleLot (precisa de: average_weight_kg, head_count,
                current_area_id, target_weight_kg, animal_category)
    areas_db  : lista de ORM PastureArea (precisa de: id, name,
                area_hectares, last_estimated_biomass_kg)

    Retorna
    -------
    timeline          : list[dict]  — eventos (mover | alerta | venda)
    weight_projection : list[dict]  — pontos semanais de peso médio
    summary           : dict        — resumo econômico e agronômico
    """
    today = datetime.utcnow().date()

    areas: dict[int, _AreaState] = {
        a.id: _AreaState(
            id=a.id,
            name=a.name,
            area_hectares=float(a.area_hectares or 0),
            biomassa_restante=float(a.last_estimated_biomass_kg or 0),
        )
        for a in areas_db
    }

    state = _SimState(
        today=today,
        peso_medio=float(lot.average_weight_kg),
        head_count=int(lot.head_count),
        current_area_id=lot.current_area_id,
        target_weight=float(lot.target_weight_kg) if lot.target_weight_kg else None,
        gdp_base=_gdp_base(lot.animal_category),
        areas=areas,
    )

    max_dias = LIMITE_DIAS_COM_ALVO if state.target_weight else LIMITE_DIAS_SEM_ALVO
    sale_reached = False

    # Ponto inicial
    state.registrar_peso(0)
    state.registrar_biomassa_areas(0)

    for dia in range(1, max_dias + 1):

        # 1. Crescimento da pastagem
        for area in state.areas.values():
            area.crescer(ocupada=(area.id == state.current_area_id))

        # 2. Consumo (uma única vez — sem bug de duplicação)
        area_atual = state.current_area
        if area_atual:
            consumo_diario = state.head_count * state.peso_medio * CONSUMO_PERCENT_PV
            area_atual.consumir(consumo_diario)

        # 3. Decisão de movimentação
        destino_id, motivo = _escolher_destino(state)

        if destino_id:
            state.mover_para(destino_id, dia, motivo)
            area_atual = state.current_area  # atualiza referência após mover
        elif area_atual and area_atual.biomassa_ha < BIOMASSA_CRITICA:
            state.registrar_alerta(
                dia,
                f"Falta generalizada de pasto! Todos os piquetes abaixo de "
                f"{int(BIOMASSA_CRITICA)} kg/ha. Considere suplementação.",
            )

        # 4. Ganho de peso
        b_ha = area_atual.biomassa_ha if area_atual else 0.0
        state.peso_medio += _gdp_efetivo(state.gdp_base, b_ha)
        state.dias_no_piquete += 1

        print(dia, state.target_weight, state.peso_medio)

        # 5. Verificar peso alvo
        if state.target_weight and state.peso_medio >= state.target_weight:
            state.registrar_venda(dia)
            state.registrar_peso(dia)
            sale_reached = True
            break

        # 6. Ponto semanal
        if dia % 7 == 0:
            state.registrar_peso(dia)
            state.registrar_biomassa_areas(dia)


    # ─── Summary ───────────────────────────────
    sim_end_day: int
    if sale_reached:
        # Último evento é sempre a venda quando sale_reached=True
        sim_end_day = state.timeline[-1]["day_offset"]
    elif state.weight_projection:
        sim_end_day = state.weight_projection[-1]["day_offset"]
    else:
        sim_end_day = 0

    total_moves = sum(1 for e in state.timeline if e["action"] == "mover")

    peso_inicial   = float(lot.average_weight_kg)
    peso_final     = round(state.peso_medio, 1)
    head_count     = state.head_count

    receita_inicial      = peso_inicial * head_count * PRECO_KG_VIVO
    receita_projetada    = peso_final   * head_count * PRECO_KG_VIVO
    custo_suplementacao  = sim_end_day  * head_count * CUSTO_SUPLEM_DIA_CAB
    margem_liquida       = receita_projetada - custo_suplementacao

    summary = {
        "estimated_sale_date": (
            (today + timedelta(days=sim_end_day)).isoformat() if sale_reached else None
        ),
        "days_to_sale":            sim_end_day if sale_reached else None,
        "estimated_final_weight_kg": peso_final,
        "total_moves":             total_moves,
        "sale_reached":            sale_reached,
        "simulation_days":         sim_end_day,
        "economics": {
            "preco_kg_vivo":        PRECO_KG_VIVO,
            "receita_inicial":      round(receita_inicial,     2),
            "receita_projetada":    round(receita_projetada,   2),
            "ganho_vs_atual":       round(receita_projetada - receita_inicial, 2),
            "custo_suplementacao":  round(custo_suplementacao, 2),
            "margem_liquida":       round(margem_liquida,      2),
        },
    }

    return state.timeline, state.weight_projection, summary, state.area_biomass_history