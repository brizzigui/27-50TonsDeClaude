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
- qual recomendação mostrar.

## Banco mínimo

São 4 tabelas:

- `users`: login.
- `pasture_areas`: áreas/piquetes.
- `cattle_lot`: lote único do usuário.
- `pasture_readings`: leituras, fotos e recomendação gerada.

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
    rotation_order INTEGER,
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
```

## Exemplo

Usuário cadastra:

```text
Piquete 01 - 12 ha - ordem 1
Piquete 02 - 10 ha - ordem 2
Piquete 03 - 8 ha - ordem 3

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

```text
Se área atual está vermelha:
    procurar próxima área verde pela rotation_order
    se encontrou, recomendar mover
    se não encontrou, recomendar medir novamente

Se área atual está amarela:
    recomendar medir novamente em poucos dias

Se área atual está verde:
    recomendar manter
```

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
  "recommendation_action": "mover",
  "recommendation_message": "Mover o lote do Piquete 01 para o Piquete 02."
}
```

## `GET /api/evaluation`

Retorna tudo que a tela precisa, ainda a ser definido. TBD.

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
Ordem na rotação: 1
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
- status da área;
- recomendação gerada naquele momento.

Exemplo:

```text
Piquete 01
Altura: 19 cm
Verde estimado: 52%
Clima: chuva leve
Status: vermelho
Recomendação: mover lote para o Piquete 02
```

Em termos simples: `pasture_readings` é o histórico de medições e decisões do sistema.
