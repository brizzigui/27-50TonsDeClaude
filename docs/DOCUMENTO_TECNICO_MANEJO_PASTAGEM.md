# Documento Técnico: Manejo de Pastagens para o Sistema 50TonsDeClaude

## 1. Objetivo do documento

Este documento organiza os conceitos técnicos necessários para modelar um sistema de apoio ao manejo de pastagens, com foco inicial em pastagens plantadas e bovinos de corte em fase de engorda.

O MVP deve ser simples: o produtor cadastra áreas de pastagem, cadastra um único rebanho/lote e o sistema recomenda a rotação desse rebanho entre as áreas disponíveis. A lógica inicial não divide o rebanho entre várias áreas; ela trabalha com uma área ocupada por vez, áreas em descanso e uma próxima área sugerida.

Mesmo tratando inicialmente apenas o manejo rotacionado com rebanho único, a modelagem deve permitir a inclusão futura de pastejo contínuo, Voisin, diferido, divisão de rebanho e outras estratégias.

## 2. Conceitos básicos

### 2.1 Pastejo

Pastejo é o ato dos animais consumirem a pastagem. No manejo, o pastejo não é apenas "deixar o gado comer"; ele funciona como uma ferramenta de regulação da planta. Se a pastagem fica alta demais, pode passar do ponto ideal, perder qualidade e ficar mais fibrosa. Se é consumida demais, pode perder capacidade de rebrote, reduzir cobertura do solo e entrar em degradação.

### 2.2 Pastagem plantada

Pastagem plantada é uma área cultivada com espécie forrageira escolhida para alimentar o rebanho. Exemplos comuns incluem aveia, azevém, braquiárias e panicuns, dependendo da região, estação do ano e objetivo produtivo.

Para o sistema, o cadastro da pastagem deve considerar que cada espécie tem comportamento diferente:

- ciclo produtivo;
- velocidade de crescimento;
- altura ideal de entrada e saída;
- época do ano;
- resposta à chuva, frio, calor e fertilidade;
- qualidade nutricional ao longo do tempo.

### 2.3 Biomassa ou massa de forragem

Biomassa é a quantidade de pasto disponível em uma área. No contexto do sistema, ela pode ser estimada por:

- altura medida manualmente;
- imagem/foto da pastagem;
- espécie forrageira;
- área em hectares;
- histórico de medições;
- heurística ou modelo de visão computacional.

No MVP, a estimativa não deve ser apresentada como verdade absoluta. O ideal é informar que o sistema gera uma estimativa operacional para tomada de decisão, com necessidade de novas medições ao longo do tempo.

### 2.4 Capacidade de suporte

Capacidade de suporte é a quantidade de animais ou peso vivo que uma pastagem consegue sustentar por determinado período sem prejudicar o desempenho animal nem degradar a pastagem.

Ela depende de:

- quantidade de forragem disponível;
- qualidade da forragem;
- espécie da pastagem;
- área total;
- peso dos animais;
- consumo esperado;
- objetivo do produtor;
- clima;
- solo;
- estação do ano;
- tempo restante de uso da pastagem.

No sistema, a capacidade de suporte deve ser calculada principalmente em peso vivo total suportado ou número aproximado de cabeças, pois o produtor normalmente pensa em "quantas cabeças" e "peso médio do lote".

### 2.5 Lotação

Lotação é a quantidade de animais colocada em uma área. Pode ser representada como:

- cabeças por hectare;
- quilos de peso vivo por hectare;
- unidade animal por hectare;
- peso vivo total alocado em uma área.

Para o MVP, a entrada mais amigável é:

- número de cabeças;
- peso médio por cabeça;
- ou peso vivo total do lote.

Exemplo:

```text
200 cabeças x 300 kg médios = 60.000 kg de peso vivo
```

### 2.6 Objetivo produtivo

O objetivo produtivo altera a recomendação. Para o hackathon, o primeiro objetivo será engorda.

No caso de engorda, o sistema deve priorizar:

- boa disponibilidade de pasto;
- boa qualidade da forragem;
- evitar superlotação;
- evitar consumo muito baixo da planta;
- preservar desempenho individual dos animais;
- indicar nova medição em intervalos curtos.

Se o produtor tem apenas poucos dias restantes de uso da pastagem, o sistema pode sugerir uma lotação mais intensa, desde que exista suporte. Se ainda há muitos dias de uso, deve ser mais conservador para preservar o crescimento e a qualidade.

## 3. Formas de manejo de pastagem

### 3.1 Pastejo contínuo ou lotação contínua

#### Descrição

No pastejo contínuo, os animais permanecem na mesma área por um período prolongado. O manejo ocorre pelo ajuste da lotação conforme a disponibilidade do pasto.

Este método não será o foco do MVP, mas deve continuar previsto na arquitetura. Ele é uma alternativa útil caso a equipe decida simplificar a demonstração ou permitir, no futuro, produtores que não trabalham com rotação.

#### Como a decisão funciona

Nesse método, o sistema não precisa decidir "para qual área mover todo o rebanho". Em vez disso, ele avalia cada área individualmente e responde:

- quanto peso vivo essa área suporta agora;
- se a lotação atual está adequada;
- se há excesso de animais;
- se há sobra de pasto;
- se é necessário medir novamente;
- se a área está em risco de degradação ou perda de qualidade.

#### Dados necessários

Para cada área:

- nome da área;
- tamanho em hectares;
- espécie da pastagem;
- data de implantação ou início de uso;
- data prevista de término do ciclo;
- altura atual do pasto;
- foto da pastagem;
- biomassa estimada;
- status atual: excelente, atenção, crítico ou em descanso.

Para o lote de animais:

- número de cabeças;
- peso médio;
- peso vivo total;
- categoria animal, por exemplo garrote, novilha, vaca ou boi;
- objetivo: engorda no MVP.

Para a recomendação:

- capacidade suportada pela área;
- lotação atual;
- diferença entre capacidade e lotação;
- data da próxima medição;
- justificativa simples.

#### Regras de negócio iniciais

O sistema deve gerar recomendações como:

- "Lotação adequada para a disponibilidade atual."
- "Reduzir lotação: o peso vivo atual está acima da capacidade estimada."
- "Pode aumentar lotação, se houver animais disponíveis."
- "Realizar nova medição em X dias."
- "Atenção: pastagem próxima do limite mínimo."
- "Atenção: pastagem pode passar do ponto ideal se não for pastejada."

#### Por que manter na modelagem

- Serve como estratégia alternativa.
- Reaproveita as mesmas tabelas de área, rebanho, medição e recomendação.
- Ajuda a manter o sistema extensível.
- Pode ser implementado depois sem refazer o banco.

### 3.2 Pastejo rotacionado ou lotação rotacionada

#### Descrição

No pastejo rotacionado, a pastagem é dividida em piquetes. Os animais ocupam um piquete por um período e depois são movidos para outro, permitindo descanso e rebrote da área anterior.

No MVP, a versão adotada será o pastejo rotacionado com rebanho único. Isso significa que o sistema sempre considera um lote inteiro se movendo junto. Não haverá divisão automática do gado entre duas ou mais áreas.

É mais complexo porque exige planejar:

- período de ocupação;
- período de descanso;
- número de piquetes;
- ordem de entrada;
- altura de entrada;
- altura de saída;
- crescimento esperado da pastagem;
- carga animal instantânea;
- infraestrutura de cerca, água e acesso.

Para o hackathon, a palavra "piquete" pode ser tratada de forma prática como qualquer unidade de pastejo cadastrada no sistema: um campo, uma área de pastagem ou uma subdivisão menor. O importante é que cada unidade tenha área, espécie, medição e status próprio.

#### Como a decisão funciona

O sistema precisa responder:

- qual piquete está pronto para receber animais;
- qual piquete deve descansar;
- quando mover o rebanho;
- para onde mover;
- se o rebanho inteiro deve permanecer ou sair;
- se alguma área está passando do ponto;
- se alguma área ainda não recuperou.

#### Dados necessários

Além dos dados do pastejo contínuo, o rotacionado exige:

- cadastro das unidades de pastejo que participam da rotação;
- ordem ou sequência de uso;
- área atualmente ocupada pelo rebanho;
- data de entrada dos animais na área atual;
- data prevista ou real de saída;
- altura de entrada recomendada;
- altura de saída recomendada;
- dias mínimos de descanso;
- dias máximos de ocupação;
- crescimento esperado por espécie e estação;
- condição climática recente;
- disponibilidade de água e cerca;
- histórico de movimentos.

#### Regras futuras

Recomendações típicas:

- "Mover rebanho do Piquete 01 para o Piquete 04."
- "Manter Piquete 02 em descanso por mais X dias."
- "Piquete 03 está pronto para entrada."
- "Piquete 01 atingiu altura de saída."
- "Não dividir o rebanho; mover o lote inteiro para a próxima área pronta."
- "Ajustar o tempo de ocupação para consumir o piquete dentro do período previsto."

#### Complexidade para o sistema

O rotacionado exige uma camada de agenda e previsão. Não basta calcular quanto cabe em cada área; é preciso coordenar tempo, crescimento da planta e movimentação do rebanho.

No MVP, a forma de reduzir a complexidade é fixar uma regra: existe apenas um rebanho ativo no plano, e ele ocupa uma única unidade de pastejo por vez. Com isso, o sistema não precisa resolver distribuição ótima de animais; precisa apenas decidir permanecer, mover ou medir novamente.

### 3.3 Pastoreio Racional Voisin

#### Descrição

O Pastoreio Racional Voisin é uma forma intensiva de pastejo rotacionado. Ele busca equilibrar solo, planta e animal por meio de ocupações curtas e períodos de repouso ajustados conforme a recuperação da pastagem.

Na prática, costuma exigir mais piquetes, mais controle e maior atenção ao ponto fisiológico da planta.

#### O que o sistema precisaria

Além do rotacionado comum, o Voisin exige:

- controle mais rigoroso do tempo de ocupação;
- observação da recuperação da planta;
- descanso variável, não apenas fixo;
- maior número de subdivisões;
- controle de água e sombra por piquete;
- histórico detalhado de entrada e saída;
- acompanhamento mais frequente.

#### Como modelar para o futuro

O Voisin pode ser tratado como um tipo especializado de `grazing_method`, usando as mesmas tabelas de piquetes e eventos de movimentação, mas com regras próprias em uma estratégia separada.

### 3.4 Pastejo diferido ou vedação de pastagem

#### Descrição

No pastejo diferido, uma área é retirada do pastejo por um período para acumular forragem e ser usada em momento futuro, geralmente em época de menor produção.

É uma estratégia de reserva. O produtor "fecha" uma área, deixa crescer e só libera depois.

#### Como a decisão funciona

O sistema precisa controlar:

- data de início da vedação;
- data prevista de liberação;
- objetivo da reserva;
- biomassa acumulada;
- risco de perda de qualidade por maturação;
- prioridade de uso.

#### Dados necessários

- área vedada;
- data de vedação;
- data planejada de uso;
- espécie forrageira;
- crescimento esperado;
- medições intermediárias;
- lote que deve consumir a área;
- status: vedada, pronta, atrasada ou consumida.

#### Recomendações futuras

- "Manter área em descanso."
- "Área pronta para uso."
- "Risco de passar do ponto: avaliar entrada dos animais."
- "Reservar esta área para período de menor disponibilidade."

### 3.5 Manejo alternado simplificado

#### Descrição

É uma forma intermediária entre o contínuo e o rotacionado. O produtor pode alternar o uso entre duas ou poucas áreas, mas sem um planejamento técnico completo de piquetes, ocupação e descanso.

Para o sistema, este método pode ser implementado futuramente como uma versão simplificada do rotacionado.

#### Dados necessários

- áreas disponíveis;
- área atualmente ocupada;
- áreas em descanso;
- data da última troca;
- medição de cada área;
- recomendação de próxima troca.

## 4. Decisão de escopo para o MVP

O MVP deve implementar manejo rotacionado simplificado com rebanho único.

A decisão central do sistema será: o rebanho permanece na área atual, deve ser movido para a próxima área pronta ou deve aguardar nova medição. O sistema não deve dividir automaticamente o rebanho entre áreas diferentes no MVP.

### O que entra agora

- Cadastro de usuário.
- Cadastro de propriedades.
- Cadastro de áreas/unidades de pastejo plantadas.
- Cadastro de um lote/rebanho principal.
- Criação de um plano de rotação.
- Definição da sequência de áreas da rotação.
- Registro da área atualmente ocupada.
- Registro de entrada e saída do rebanho em cada área.
- Registro de medição com altura e foto.
- Registro de condição climática recente: seco, chuva leve ou chuva intensa.
- Estimativa de biomassa.
- Cálculo de capacidade por área.
- Semáforo de status.
- Recomendação de permanecer, mover ou medir novamente.
- Timeline de ações de manejo.
- Dashboard com projeção de ganho de peso.
- Estimativa de data de venda ou ponto de saída do lote, quando houver dados suficientes.
- Próxima data de medição.

### O que fica preparado para depois

- Pastejo contínuo.
- Divisão do rebanho em múltiplos lotes.
- Piquetes dentro de áreas maiores.
- Manejo Voisin.
- Pastejo diferido.
- Simulação de crescimento por clima e estação.
- Recomendações de plantio em momentos distintos.
- Dados georreferenciados ou desenho de área no mapa.

## 5. Fluxo operacional do MVP

1. O produtor cria uma conta.
2. O produtor cadastra a propriedade.
3. O produtor cadastra as áreas ou piquetes que podem receber o rebanho.
4. Para cada área, informa tamanho, espécie, data inicial e data estimada de término do ciclo.
5. O produtor cadastra um único lote de animais.
6. O sistema permite informar o lote como cabeças e peso médio ou como peso vivo total.
7. O produtor cria um plano de rotação e escolhe quais áreas entram na sequência.
8. O produtor informa em qual área o rebanho está hoje.
9. O produtor registra medição da área atual e, quando possível, das próximas áreas.
10. O sistema estima biomassa disponível em cada área medida.
11. O sistema cruza biomassa, altura, clima recente, peso do lote e regras do plano.
12. O sistema calcula se a área atual ainda suporta o rebanho.
13. O sistema identifica a próxima área pronta para entrada.
14. O sistema recomenda permanecer, mover o rebanho inteiro ou medir novamente.
15. O sistema atualiza a timeline, o dashboard e as projeções do lote.
16. Quando o produtor executa a movimentação, o sistema registra saída da área anterior e entrada na nova área.
17. O produtor repete medições ao longo do tempo, pois clima, geada, chuva, barro e crescimento real alteram a disponibilidade.

## 6. Modelo conceitual do banco SQLite

O banco deve ser simples para o hackathon, mas extensível. A recomendação é evitar colocar regras específicas de cada manejo diretamente na tabela de pastagem. O ideal é separar áreas, lotes, medições, métodos e planos.

SQLite trabalha bem com os tipos `INTEGER`, `REAL` e `TEXT`. Datas devem ser salvas como `TEXT` no formato ISO 8601, por exemplo `2026-06-05T23:30:00-03:00`.

Para o MVP rotacionado, a regra de modelagem é:

- `pasture_areas` representa a unidade que pode receber o rebanho, seja campo inteiro, área plantada ou piquete.
- `grazing_plans` pertence a uma propriedade, a um rebanho e a um método de manejo.
- `grazing_plan_areas` define quais áreas entram no plano e em qual sequência.
- `herd_allocations` registra onde o rebanho está ou esteve; no MVP deve existir apenas uma alocação ativa por rebanho.
- `rotation_schedule` guarda a agenda planejada e executada da rotação.
- `recommendations` guarda a decisão calculada pelo motor de manejo.

### 6.1 Tabelas principais

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pasture_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    parent_area_id INTEGER,
    name TEXT NOT NULL,
    area_type TEXT NOT NULL DEFAULT 'rotation_unit',
    area_hectares REAL NOT NULL,
    geo_json TEXT,
    forage_species TEXT,
    planted_at TEXT,
    available_until TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (parent_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE grazing_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE herds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    animal_category TEXT,
    head_count INTEGER,
    average_weight_kg REAL,
    total_live_weight_kg REAL,
    production_goal TEXT NOT NULL DEFAULT 'engorda',
    created_at TEXT NOT NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id)
);

CREATE TABLE herd_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    herd_id INTEGER NOT NULL,
    pasture_area_id INTEGER NOT NULL,
    head_count INTEGER,
    live_weight_kg REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY (herd_id) REFERENCES herds(id),
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE grazing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    herd_id INTEGER NOT NULL,
    grazing_method_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (herd_id) REFERENCES herds(id),
    FOREIGN KEY (grazing_method_id) REFERENCES grazing_methods(id)
);

CREATE TABLE grazing_plan_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grazing_plan_id INTEGER NOT NULL,
    pasture_area_id INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'rotation',
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TEXT NOT NULL,
    FOREIGN KEY (grazing_plan_id) REFERENCES grazing_plans(id),
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id),
    UNIQUE (grazing_plan_id, pasture_area_id),
    UNIQUE (grazing_plan_id, sequence_order)
);

CREATE TABLE pasture_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pasture_area_id INTEGER NOT NULL,
    measured_at TEXT NOT NULL,
    height_cm REAL,
    image_path TEXT,
    recent_weather_condition TEXT,
    green_mass_percent REAL,
    estimated_biomass_kg_per_ha REAL,
    estimated_total_biomass_kg REAL,
    confidence_score REAL,
    vision_model_json TEXT,
    notes TEXT,
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE rotation_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grazing_plan_id INTEGER NOT NULL,
    pasture_area_id INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    planned_start_at TEXT,
    planned_end_at TEXT,
    actual_start_at TEXT,
    actual_end_at TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    reason TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (grazing_plan_id) REFERENCES grazing_plans(id),
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pasture_area_id INTEGER,
    grazing_plan_id INTEGER,
    herd_allocation_id INTEGER,
    rotation_schedule_id INTEGER,
    generated_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    next_measurement_at TEXT,
    calculation_snapshot_json TEXT,
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id),
    FOREIGN KEY (grazing_plan_id) REFERENCES grazing_plans(id),
    FOREIGN KEY (herd_allocation_id) REFERENCES herd_allocations(id),
    FOREIGN KEY (rotation_schedule_id) REFERENCES rotation_schedule(id)
);

CREATE TABLE evaluation_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grazing_plan_id INTEGER NOT NULL,
    generated_at TEXT NOT NULL,
    projected_weight_gain_kg REAL,
    estimated_sale_ready_at TEXT,
    timeline_json TEXT,
    dashboard_json TEXT,
    payload_json TEXT NOT NULL,
    FOREIGN KEY (grazing_plan_id) REFERENCES grazing_plans(id)
);
```

### 6.2 Tabelas preparadas para detalhamento futuro

A rotação do MVP pode usar `pasture_areas` diretamente como unidades de pastejo. Se futuramente a equipe quiser representar uma área maior dividida em piquetes internos, a tabela `paddocks` pode ser adicionada sem alterar a lógica principal do plano.

```sql
CREATE TABLE paddocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pasture_area_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL NOT NULL,
    has_water INTEGER NOT NULL DEFAULT 0,
    has_shade INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TEXT NOT NULL,
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE grazing_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grazing_plan_id INTEGER NOT NULL,
    herd_id INTEGER NOT NULL,
    from_pasture_area_id INTEGER,
    to_pasture_area_id INTEGER,
    paddock_id INTEGER,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    head_count INTEGER,
    live_weight_kg REAL,
    notes TEXT,
    FOREIGN KEY (grazing_plan_id) REFERENCES grazing_plans(id),
    FOREIGN KEY (herd_id) REFERENCES herds(id),
    FOREIGN KEY (from_pasture_area_id) REFERENCES pasture_areas(id),
    FOREIGN KEY (to_pasture_area_id) REFERENCES pasture_areas(id),
    FOREIGN KEY (paddock_id) REFERENCES paddocks(id)
);
```

### 6.3 Seeds iniciais

```sql
INSERT INTO grazing_methods (code, name, description) VALUES
('rotational_single_herd', 'Pastejo rotacionado com rebanho único', 'Um único rebanho é movimentado inteiro entre áreas em sequência.'),
('continuous', 'Pastejo contínuo monitorado', 'Animais permanecem na área e a lotação é ajustada por medições periódicas.'),
('rotational_split_herd', 'Pastejo rotacionado com divisão de rebanho', 'Lotes ou partes do rebanho podem ocupar áreas diferentes.'),
('voisin', 'Pastoreio Racional Voisin', 'Rotação intensiva com descanso variável conforme recuperação da pastagem.'),
('deferred', 'Pastejo diferido', 'Área é vedada para acumular forragem e usada posteriormente.');
```

## 7. Configurações por método

O campo `config_json` de `grazing_plans` permite que cada método tenha parâmetros próprios sem mudar o banco toda vez.

### 7.1 Configuração do MVP: rotacionado com rebanho único

```json
{
  "target_use": "engorda",
  "measurement_interval_days": 7,
  "entry_height_cm": 35,
  "exit_height_cm": 20,
  "min_rest_days": 25,
  "max_occupation_days": 3,
  "allow_split_herd": false,
  "rotation_mode": "single_herd",
  "next_area_policy": "first_ready_in_sequence"
}
```

### 7.2 Configuração futura: pastejo contínuo

```json
{
  "target_use": "engorda",
  "measurement_interval_days": 7,
  "min_height_cm": 20,
  "target_height_cm": 30,
  "max_height_cm": 45,
  "conservative_mode": true
}
```

### 7.3 Configuração futura: pastejo diferido

```json
{
  "defer_start_date": "2026-04-01",
  "planned_use_date": "2026-07-01",
  "target_reserved_biomass_kg_per_ha": 3000,
  "priority": "seca"
}
```

## 8. Estratégia de cálculo e arquitetura

O backend deve tratar cada método como uma estratégia. Assim, o sistema implementa apenas uma estratégia agora e adiciona outras depois.

```text
GrazingStrategy
├── SingleHerdRotationalStrategy
├── ContinuousGrazingStrategy
├── SplitHerdRotationalStrategy
├── VoisinGrazingStrategy
└── DeferredGrazingStrategy
```

Cada estratégia deve implementar:

- validação dos dados necessários;
- cálculo de biomassa ou leitura da estimativa;
- cálculo de capacidade de suporte;
- comparação com lotação atual;
- geração de recomendações;
- definição da próxima medição;
- geração de eventos futuros, quando aplicável.

No MVP, `SingleHerdRotationalStrategy` deve respeitar três restrições:

- existe apenas um rebanho principal no plano;
- o rebanho ocupa uma única área por vez;
- a recomendação pode mover o rebanho inteiro, mas nunca dividir animais entre áreas.

Essa separação permite trocar o método depois sem alterar telas principais, tabelas de medição ou cadastro de área. A mudança fica concentrada em qual estratégia lê o `config_json` e gera recomendações.

## 9. Endpoints sugeridos

```text
POST /api/auth/register
POST /api/auth/login

GET  /api/farms
POST /api/farms

GET  /api/pasture-areas
POST /api/pasture-areas
GET  /api/pasture-areas/:id

POST /api/herds
GET  /api/herds

POST /api/grazing-plans
GET  /api/grazing-plans/:id
POST /api/grazing-plans/:id/areas
GET  /api/grazing-plans/:id/timeline

POST /api/pasture-areas/:id/measurements
GET  /api/pasture-areas/:id/measurements

POST /api/grazing-plans/:id/evaluate-rotation
POST /api/grazing-plans/:id/move
GET  /api/grazing-plans/:id/recommendations

POST /api/area/create
POST /api/area/update
POST /api/area/delete
GET  /api/evaluation
```

Os endpoints em português conceitual do documento da ideia podem ser implementados como aliases simples para as rotas REST internas:

- `POST /api/area/create`: cria uma unidade de pastejo em `pasture_areas`.
- `POST /api/area/update`: registra medição, foto, clima recente e dados atuais do lote; depois recalcula rotação.
- `POST /api/area/delete`: remove ou desativa uma área.
- `GET /api/evaluation`: retorna um JSON agregado para reconstruir dashboard, timeline, gráficos e recomendações.

### Endpoint principal do MVP

```text
POST /api/grazing-plans/:id/evaluate-rotation
```

Entrada:

```json
{
  "current_pasture_area_id": 1,
  "latest_measurements": [
    {
      "pasture_area_id": 1,
      "height_cm": 21,
      "green_mass_percent": 52,
      "recent_weather_condition": "chuva_leve",
      "image_path": "uploads/piquete-001.jpg"
    },
    {
      "pasture_area_id": 2,
      "height_cm": 36,
      "green_mass_percent": 81,
      "recent_weather_condition": "chuva_leve",
      "image_path": "uploads/piquete-002.jpg"
    }
  ]
}
```

Saída:

```json
{
  "grazing_plan_id": 1,
  "herd_id": 1,
  "current_pasture_area_id": 1,
  "next_pasture_area_id": 2,
  "action": "move",
  "status": "attention",
  "recommendation": {
    "title": "Mover rebanho",
    "message": "A área atual atingiu a altura de saída e a próxima área está em ponto de entrada.",
    "suggested_action": "Mover o rebanho inteiro do Piquete 01 para o Piquete 02.",
    "next_measurement_at": "2026-06-12"
  }
}
```

### Endpoint compatível com o frontend do pitch

```text
POST /api/area/update
```

Entrada sugerida para o modal "Atualizar Leitura":

```json
{
  "pasture_area_id": 1,
  "grazing_plan_id": 1,
  "height_cm": 21,
  "head_count": 35,
  "average_weight_kg": 320,
  "recent_weather_condition": "chuva_leve",
  "image_base64": "data:image/jpeg;base64,..."
}
```

Processamento esperado:

1. Salvar a imagem em disco ou storage local.
2. Rodar módulo de leitura visual ou LLM para extrair parâmetros visíveis da pastagem.
3. Registrar uma linha em `pasture_measurements`.
4. Atualizar `herds` ou `herd_allocations` se quantidade/peso tiverem mudado.
5. Executar `SingleHerdRotationalStrategy`.
6. Salvar recomendação e `evaluation_snapshots`.
7. Retornar resumo da próxima ação.

Saída resumida:

```json
{
  "action": "move",
  "title": "Mover rebanho",
  "message": "Mover o rebanho inteiro do Piquete 01 para o Piquete 02.",
  "timeline_updated": true,
  "evaluation_available_at": "/api/evaluation"
}
```

### Endpoint agregado para dashboard

```text
GET /api/evaluation
```

Esse endpoint deve retornar um JSON completo para a tela principal, evitando que o frontend precise montar a lógica agronômica. Ele pode retornar:

- cards das áreas;
- semáforo de saúde;
- ocupação atual;
- biomassa visual;
- timeline de movimentação e descanso;
- gráfico de projeção de ganho de peso;
- data estimada de venda ou ponto de saída;
- justificativas das recomendações.

## 10. Interface, dashboard e pitch

O documento da ideia atualizado traz pontos importantes para a demonstração. Eles devem ser tratados como requisitos de interface do MVP.

### Card da área

Quando o usuário clicar em um piquete ou área, o painel deve responder rapidamente:

- nome/ID da área;
- tamanho em hectares;
- status por semáforo: verde, amarelo ou vermelho;
- última avaliação;
- ocupação atual: quantidade de cabeças e categoria;
- estimativa visual de biomassa ou massa verde;
- botão evidente de "Atualizar Leitura".

### Modal de atualização

O modal deve pedir poucos dados, mas todos úteis para o cálculo:

- altura média do pasto em centímetros;
- quantidade atual de animais;
- peso médio estimado;
- condição climática recente: seco, chuva leve ou chuva intensa;
- foto da pastagem.

### Timeline de manejo

A timeline deve ser o centro operacional do produtor. Cada card deve ter:

- data de execução: hoje, amanhã ou em X dias;
- tipo de ação: mover, descansar ou vender;
- instrução direta;
- motivo da recomendação.

Exemplo:

```text
Mover rebanho do Piquete 01 para o Piquete 04.
Motivo: Piquete 01 atingiu altura de saída e Piquete 04 está pronto para entrada.
```

### Dashboard analítico

Para o pitch, o gráfico mais forte é a projeção de ganho de peso, porque conecta manejo de pastagem com resultado econômico.

Métricas úteis:

- quilos projetados por animal;
- quilos projetados por hectare;
- biomassa disponível por área;
- dias restantes de descanso;
- data estimada de venda;
- nível de confiança da leitura.

### Critérios da banca

O protótipo deve deixar explícito:

- criatividade: foto de celular e análise visual de baixo custo;
- propriedade intelectual: lógica própria de conversão foto + altura + lote em recomendação;
- qualidade do protótipo: React, Flask, SQLite e fluxo simples;
- sustentabilidade: semáforo reduz risco de degradação do solo;
- apresentação: mostrar a transição entre card, atualização por foto, timeline e gráfico.

## 11. Cuidados técnicos e agronômicos

- O sistema deve apoiar a decisão, não substituir técnico, agrônomo ou zootecnista.
- Alturas ideais não devem ser fixas para todas as pastagens.
- Espécie forrageira, estação e objetivo produtivo alteram as recomendações.
- Chuva, sol, geada e barro reduzem a previsibilidade.
- Foto sozinha pode enganar; altura manual melhora a confiabilidade.
- A decisão deve ser recalculada com medições periódicas.
- Em engorda, superlotar pode aumentar produção por hectare no curto prazo, mas reduzir ganho individual e degradar a pastagem.
- O dashboard deve mostrar nível de confiança da estimativa.

## 12. Recomendação final para o hackathon

Para a apresentação, a narrativa mais forte é:

```text
O produtor cadastra um rebanho e as áreas de pastagem disponíveis.
Com foto, altura e histórico, o sistema identifica a área atual, as áreas em descanso
e recomenda quando mover o rebanho inteiro para a próxima área pronta.
```

Isso resolve um problema real sem tentar dividir automaticamente os animais entre áreas. A arquitetura, porém, já fica preparada para evoluir para pastejo contínuo, divisão de rebanho, Voisin e diferido por meio de métodos, planos, áreas de rotação e eventos.

## 13. Fontes técnicas consultadas

- Embrapa Gado de Corte: Sistemas de pastejo. Disponível em: https://old.cnpgc.embrapa.br/publicacoes/doc/doc74/sistemas.html
- Embrapa: Guia prático para implantação de sistemas de pastejo rotacionados para gado de corte. Disponível em: https://www.embrapa.br/busca-de-publicacoes/-/publicacao/47246/guia-pratico-para-a-implantacao-de-sistemas-de-pastejo-rotacionados-para-gado-de-corte
- Embrapa Gado de Corte: Capacidade de suporte das pastagens. Disponível em: https://old.cnpgc.embrapa.br/publicacoes/doc/doc70/capacidade.html
- Embrapa: Manejo de altura das pastagens ajuda a mitigar gases de efeito estufa. Disponível em: https://www.embrapa.br/en/agencia-de-noticias-embrapa/busca-de-noticias/-/noticia/59298701/manejo-de-altura-das-pastagens-ajuda-a-mitigar-gases-de-efeito-estufa
- Embrapa/Infoteca: Manejo da pastagem. Disponível em: https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1134030/1/Manejo-da-pastagem-2021.pdf
