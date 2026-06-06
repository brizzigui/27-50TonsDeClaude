-- 1. Users Table
-- Stores authentication, credentials, and basic user profile metadata.
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    api_token TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cattle Groups Table (Lotes de Gado - Categoria, Quantidade e Peso)
-- Represents a specific herd/batch of cattle moving together.
CREATE TABLE cattle_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    head_count INT NOT NULL,
    average_weight_kg REAL NOT NULL, 
    animal_category TEXT, -- e.g., 'Garrotes', 'Vacas'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Zones Table (Piquetes - Status de Saúde e Biomassa atual)
-- Represents the physical divisions of the pasture.
CREATE TABLE zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- e.g., 'Piquete 01 - Baixada'
    area_hectares REAL NOT NULL, 
    health_status TEXT DEFAULT 'VERDE', -- 'VERDE' (Excelente), 'AMARELO' (Atenção), 'VERMELHO' (Crítico)
    biomass_percentage REAL DEFAULT 0.00, -- e.g., 78.0 (Barra de progresso de Massa Verde)
    occupation_status TEXT DEFAULT 'LIVRE', -- 'LIVRE' ou 'OCUPADO'
    grass_type TEXT, 
    last_measured_at TEXT, -- Atualizado via trigger ou backend ao receber nova avaliação
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Evaluations Table (Histórico de Fotos e Análises do Backend/LLM)
-- Alimenta o Gráfico A (Evolução da Saúde do Solo) e a 'Última Avaliação'.
CREATE TABLE evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL,
    image_ref TEXT, -- URL, path ou hash da foto enviada para a API
    biomass_percentage REAL NOT NULL, -- % de massa verde identificada na foto
    health_status_result TEXT NOT NULL, -- Cor do semáforo no momento da leitura
    recommended_capacity_au REAL, -- Lotação ideal calculada pela fórmula
    evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- 5. Grazing Allocations Table (Distribuição Atual do Gado)
-- Maps which cattle group is currently in which zone.
CREATE TABLE grazing_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cattle_group_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    estimated_exit_date TEXT NOT NULL, -- Calculado pela fórmula de rotação
    actual_exit_date TEXT, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cattle_group_id) REFERENCES cattle_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- 6. Management Actions Table (Timeline de Manejo - O "Cérebro Operacional")
-- Alimenta a Tela 2 com os Cards de histórico e próximas ações cronológicas.
CREATE TABLE management_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    cattle_group_id INTEGER, -- Pode ser NULL se a ação for apenas de descanso no piquete
    execution_date TEXT NOT NULL, -- Data para a qual a ação está agendada ("HOJE", "Amanhã")
    action_type TEXT NOT NULL, -- 'MOVER' ou 'DESCANSAR'
    instruction_text TEXT NOT NULL, -- Frase principal (Ex: "Mover 35 Garrotes do Piquete 01 para o Piquete 04")
    reason_text TEXT, -- Motivo para o Pitch (Ex: "Piquete 01 atingiu limite de massa seca (amarelo)")
    is_completed INTEGER DEFAULT 0, -- 0 (Pendente), 1 (Concluído)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY (cattle_group_id) REFERENCES cattle_groups(id) ON DELETE CASCADE
);

-- 7. Weight Gain Projections Table (O "Gráfico do Dinheiro" - Gráfico B)
-- Cruzamento do pasto disponível com o potencial de ganho animal.
CREATE TABLE weight_gain_projections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL,
    cattle_group_id INTEGER NOT NULL,
    reference_week_start TEXT NOT NULL, -- Data de início da semana projetada
    projected_gain_kg_per_animal REAL NOT NULL, -- Ganho de peso individual projetado na semana
    projected_gain_kg_per_hectare REAL NOT NULL, -- Ganho de peso total por hectare projetado
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY (cattle_group_id) REFERENCES cattle_groups(id) ON DELETE CASCADE
);