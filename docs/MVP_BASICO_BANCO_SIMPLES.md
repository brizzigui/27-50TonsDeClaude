# MVP Básico: Banco Mais Simples

## Decisão

Para o MVP, eu faria **um único lote de gado por usuário**.

As cabeças andam sempre juntas. Então não precisamos modelar vários rebanhos, vários planos ou divisão de animais agora.

O sistema só precisa saber:

- quem é o usuário;
- quais áreas/piquetes ele tem;
- qual é o lote único;
- onde o lote está agora;
- qual foi a última leitura das áreas;
- qual recomendação geral mostrar.

## Banco mínimo

São 5 tabelas:

- `users`: login.
- `pasture_areas`: áreas/piquetes.
- `cattle_lot`: lote único do usuário.
- `pasture_readings`: leituras e fotos de uma área específica.
- `movement_recommendations`: decisão geral sobre o lote.

`cattle_lot.user_id` usa `UNIQUE` para garantir que cada usuário tenha só um lote.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pasture_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL NOT NULL,
    grass_type TEXT,
    status TEXT NOT NULL DEFAULT 'descanso',
    last_health_status TEXT NOT NULL DEFAULT 'sem_dados',
    last_biomass_percent REAL,
    last_measured_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cattle_lot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    current_area_id INTEGER,
    animal_category TEXT,
    head_count INTEGER NOT NULL,
    average_weight_kg REAL NOT NULL,
    target_weight_kg REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_area_id) REFERENCES pasture_areas(id)
);

CREATE TABLE pasture_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pasture_area_id INTEGER NOT NULL,
    height_cm REAL,
    image_path TEXT,
    green_percent REAL,
    biomass_percent REAL,
    recent_weather_condition TEXT,
    health_status TEXT NOT NULL,
    measured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pasture_area_id) REFERENCES pasture_areas(id) ON DELETE CASCADE
);

CREATE TABLE movement_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cattle_lot_id INTEGER NOT NULL,
    from_area_id INTEGER,
    to_area_id INTEGER,
    action_type TEXT NOT NULL,
    message TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cattle_lot_id) REFERENCES cattle_lot(id) ON DELETE CASCADE,
    FOREIGN KEY (from_area_id) REFERENCES pasture_areas(id),
    FOREIGN KEY (to_area_id) REFERENCES pasture_areas(id)
);
```

## Exemplo

Usuário cadastra:

```text
Piquete 01 - 12 ha
Piquete 02 - 10 ha
Piquete 03 - 8 ha

Lote único:
35 garrotes
320 kg de peso médio
Área atual: Piquete 01
```

O peso vivo total não precisa ser salvo:

```text
35 x 320 = 11.200 kg
```

O backend calcula quando precisar.

## Regra simples

Ao receber uma nova leitura, o backend deve:

```text
1. Salvar a leitura daquela área em pasture_readings.
2. Atualizar o resumo da área em pasture_areas.
3. Buscar o lote único do usuário em cattle_lot.
4. Buscar a área atual do lote.
5. Buscar a última leitura de cada área.
6. Decidir se o lote deve ficar, mover ou aguardar nova medição.
7. Salvar a decisão em movement_recommendations.
```

```text
Se área atual está vermelha:
    procurar a melhor área disponível para receber o lote
    se encontrou, recomendar mover
    se não encontrou, recomendar medir novamente

Se área atual está amarela:
    recomendar medir novamente em poucos dias

Se área atual está verde:
    recomendar manter
```

A leitura (`pasture_readings`) classifica uma área. A recomendação (`movement_recommendations`) olha o conjunto: área atual, próximas áreas e lote de gado.

## Sugestão de cálculo para o MVP

### Campo de biomassa

No MVP, use apenas:

```text
biomass_percent
```

```text
biomass_percent = biomassa estimada na amostra da foto/leitura
```

### Dados usados

Para decidir o movimento, o backend usa:

```text
Lote:
- head_count
- average_weight_kg
- current_area_id

Área:
- area_hectares
- status

Última leitura de cada área:
- height_cm
- biomass_percent
- green_percent
- health_status
```

### Peso vivo total

```text
total_live_weight_kg = head_count * average_weight_kg
```

Exemplo:

```text
35 cabeças * 320 kg = 11.200 kg de peso vivo
```

### A área atual ainda aguenta?

Regra inicial:

```text
Se height_cm < 20:
    precisa sair

Se biomass_percent < 40:
    precisa sair

Se health_status = vermelho:
    precisa sair

Caso contrário:
    pode permanecer
```

### Para onde mover?

O usuário não precisa cadastrar ordem de rotação.

O sistema escolhe a melhor área disponível com base nas últimas leituras.

Uma área pode receber o lote se:

```text
height_cm >= 30
biomass_percent >= 60
health_status = verde
status = descanso
```

Se houver mais de uma área pronta, o sistema pode calcular uma pontuação simples:

```text
area_score = biomass_percent + height_cm
```

Exemplo:

```text
Piquete 02:
Biomassa: 72%
Altura: 33 cm
Score: 105

Piquete 03:
Biomassa: 65%
Altura: 31 cm
Score: 96

Melhor área: Piquete 02
```

Se encontrar uma área pronta:

```text
Recomendar mover o lote inteiro para essa área.
```

Se não encontrar:

```text
Recomendar manter em atenção ou fazer nova leitura.
```

### Exemplo de decisão

```text
Lote:
35 cabeças x 320 kg = 11.200 kg

Área atual: Piquete 01
Altura: 18 cm
Biomassa: 35%
Status: vermelho

Próxima área: Piquete 02
Altura: 33 cm
Biomassa: 72%
Status: verde

Decisão:
Mover lote inteiro do Piquete 01 para o Piquete 02.
```

### Versão futura com biomassa em kg

Se depois o sistema estimar biomassa em `kg/ha`, a decisão pode ficar melhor:

```text
forragem_total_kg = biomass_kg_per_ha * area_hectares
forragem_utilizavel_kg = forragem_total_kg * 0.45
consumo_diario_kg = total_live_weight_kg * 0.025
dias_suportados = forragem_utilizavel_kg / consumo_diario_kg
```

Nesse caso, uma área estaria pronta se:

```text
dias_suportados >= 2 ou 3 dias
height_cm >= altura mínima de entrada
```

Para o hackathon, a regra com `height_cm`, `biomass_percent` e `health_status` já é suficiente.

## Endpoints mínimos

```text
POST /api/auth/register
POST /api/auth/login

POST /api/areas
GET  /api/areas

POST /api/lote
GET  /api/lote

POST /api/area/update
GET  /api/evaluation
```

## `POST /api/area/update`

Entrada:

```json
{
  "area_id": 1,
  "height_cm": 19,
  "green_percent": 52,
  "recent_weather_condition": "chuva_leve",
  "image_base64": "data:image/jpeg;base64,..."
}
```

Saída:

```json
{
  "health_status": "vermelho",
  "saved_reading_id": 12,
  "generated_recommendation": {
    "action_type": "mover",
    "from_area_id": 1,
    "to_area_id": 2,
    "message": "Mover o lote do Piquete 01 para o Piquete 02."
  }
}
```

## `GET /api/evaluation`

Retorna tudo que a tela precisa:

```json
{
  "lot": {
    "animal_category": "Garrotes",
    "head_count": 35,
    "average_weight_kg": 320,
    "total_live_weight_kg": 11200,
    "current_area_id": 1
  },
  "areas": [],
  "latest_recommendation": {
    "action_type": "mover",
    "from_area_id": 1,
    "to_area_id": 2,
    "message": "Mover o lote do Piquete 01 para o Piquete 02."
  }
}
```

## Quando complicar depois

Só adicionar mais tabelas se o MVP precisar de:

- mais de um lote;
- histórico completo de timeline;
- várias fazendas por usuário;
- múltiplos métodos de manejo;
- agenda futura de rotação.

Até lá, esse banco é suficiente.

## Glossário das tabelas

### `users`

É a conta do produtor no sistema.

Guarda dados de login, como nome, email e senha criptografada.

### `pasture_areas`

São as áreas de pastagem ou piquetes cadastrados pelo produtor.

Exemplo:

```text
Piquete 01 - Baixada
12 hectares
Azevém
```

Cada área pode estar em descanso, ocupada ou sem dados suficientes.

### `cattle_lot`

É o lote único de gado do usuário.

No MVP, todas as cabeças andam juntas. Por isso, cada usuário tem só um `cattle_lot`.

Exemplo:

```text
35 garrotes
320 kg de peso médio
Área atual: Piquete 01
```

### `pasture_readings`

É uma leitura/avaliação feita em uma área de pastagem.

Sempre que o produtor clica em "Atualizar Leitura", o sistema cria uma nova `pasture_reading`.

Ela guarda:

- altura do pasto;
- foto enviada;
- percentual de verde/biomassa estimado;
- condição climática recente;
- status da área.

Exemplo:

```text
Piquete 01
Altura: 19 cm
Verde estimado: 52%
Clima: chuva leve
Status: vermelho
```

Em termos simples: `pasture_readings` é o histórico de medições das áreas.

### `movement_recommendations`

É a recomendação geral do sistema sobre o lote.

Ela não pertence a uma única leitura, porque a decisão de mover depende de várias coisas ao mesmo tempo:

- área onde o lote está;
- últimas leituras de todas as áreas;
- quantidade de cabeças;
- peso médio do lote;
- biomassa/altura disponível nas áreas.

Exemplo:

```text
Ação: mover
De: Piquete 01
Para: Piquete 02
Motivo: Piquete 01 está vermelho e Piquete 02 está verde.
```

Em termos simples: `movement_recommendations` é o histórico das decisões do sistema.
