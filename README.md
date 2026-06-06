# 🌿 PastoCerto

**Manejo inteligente de pastagens com visão computacional e simulação de rotação.**

No Brasil, mais de 100 milhões de hectares de pastagens apresentam algum grau de degradação (Embrapa, 2021). A causa mais frequente não é falta de capim — é falta de informação no momento da decisão. O produtor olha o pasto, estima "de olho" se aguenta mais uns dias, e muitas vezes erra. Erra para mais, degrada o solo. Erra para menos, desperdiça forragem. O PastoCerto transforma uma foto de celular e uma régua de capim em uma recomendação objetiva: **ficar, mover ou medir de novo**.

> Projeto desenvolvido em 10 horas para o **Code Race 2026** — competição de hackathon da Antonio Meneghetti Faculdade (AMF), realizada em 05–06 de junho de 2026.

---

## 👥 Equipe

| Nome | Função |
|------|--------|
| [TODO: preencher] | [TODO: preencher] |
| [TODO: preencher] | [TODO: preencher] |
| [TODO: preencher] | [TODO: preencher] |
| [TODO: preencher] | [TODO: preencher] |

**Nome da equipe:** 50TonsDeClaude

---

## 📋 Escopo

### O Problema

O pecuarista que trabalha com pastejo rotacionado precisa decidir **diariamente** se o rebanho permanece no piquete atual ou deve ser movido para o próximo. Essa decisão depende de variáveis que ele raramente mede com precisão:

- Biomassa disponível na área ocupada (quanto capim ainda tem?)
- Biomassa acumulada nas áreas em descanso (a próxima área já está pronta?)
- Consumo real do lote (quanto os animais estão comendo por dia?)
- Projeção de ganho de peso (o gado vai bater o peso de abate quando?)

Sem ferramentas, a decisão vira chute. O resultado é superpastejo (degrada o solo e reduz rebrote), subpastejo (capim passa do ponto e perde qualidade) ou movimentação tardia (animais perdem peso por falta de forragem).

### A Solução

O produtor cadastra seus piquetes e seu lote de gado. Periodicamente, atualiza a leitura de cada área fornecendo a **altura do capim** e, opcionalmente, uma **foto da pastagem**. A foto é analisada por um modelo de visão (GPT-4o mini) que estima a qualidade/percentual verde da forragem.

Com esses dados, o sistema:

1. **Estima a biomassa** de cada piquete (em kg de matéria seca).
2. **Simula o rotacionamento** dia a dia — consumo, crescimento, movimentações.
3. **Projeta o ganho de peso** do rebanho ao longo de semanas.
4. **Gera uma timeline de manejo** com ações concretas: "mover do Piquete A para o Piquete B no dia X, motivo: biomassa abaixo do limite de saída".
5. **Estima data e valor de venda** quando o lote atinge o peso-alvo.

O produtor abre o painel, vê o semáforo de cada área, e sabe exatamente o que fazer.

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **React** | 18.3.1 | Componentização e reatividade para a interface do dashboard em tempo real. |
| **Vite** | 6.x | Build rápido e hot-reload — essencial para produtividade em hackathon. |
| **Tailwind CSS** | 4.1.12 | Estilização utilitária para prototipagem rápida sem sair do JSX. |
| **Recharts** | 2.15.2 | Gráficos de projeção de peso e biomassa diretamente integrados ao React. |
| **MUI (Material UI)** | 7.3.5 | Componentes prontos (ícones, inputs) para acelerar a construção de formulários. |
| **Radix UI** | vários | Primitivos acessíveis (modais, tabs, selects) com shadcn/ui. |
| **Axios** | 1.17.0 | Cliente HTTP com interceptors para autenticação JWT automática. |
| **React Router** | 7.17.0 | Navegação SPA entre telas de login, painel e planejamento. |
| **Lucide React** | 0.487.0 | Ícones consistentes e leves para a interface. |

### Backend

| Tecnologia | Justificativa |
|------------|---------------|
| **Python / Flask** | Framework minimalista — permite levantar a API REST rapidamente com poucos arquivos. |
| **Flask-SQLAlchemy** | ORM sobre SQLite que elimina SQL manual e acelera a modelagem de tabelas. |
| **Flask-JWT-Extended** | Autenticação stateless por token JWT, integrada ao interceptor do frontend. |
| **Flask-CORS** | Habilita chamadas cross-origin entre o Vite dev server e a API Flask. |

### Banco de Dados

| Tecnologia | Justificativa |
|------------|---------------|
| **SQLite** | Banco de arquivo único, sem instalação — ideal para prototipagem e deploy simples. |

### APIs Externas

| Serviço | Justificativa |
|---------|---------------|
| **OpenAI API (GPT-4o mini)** | Análise visual da foto do pasto — retorna um score de 0 a 100 representando a qualidade/percentual verde da forragem. Usado no endpoint de atualização de leitura. |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (SPA)                              │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Login   │  │Dashboard │  │Planning  │  │  Settings/Profile  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │             │                  │              │
│       └──────────────┴─────────────┴──────────────────┘              │
│                              │                                      │
│                         Axios + JWT                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP/JSON
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FLASK API (localhost:5000)                      │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │   Auth     │  │   Áreas    │  │    Lote    │  │  Avaliação   │   │
│  │ /register  │  │  /areas    │  │   /lote    │  │ /evaluation  │   │
│  │  /login    │  │/area/update│  │            │  │              │   │
│  └────────────┘  └─────┬──────┘  └────────────┘  └──────┬───────┘   │
│                        │                                 │           │
│                        ▼                                 ▼           │
│               ┌─────────────────┐              ┌─────────────────┐  │
│               │  OpenAI API     │              │  simulation.py  │  │
│               │  (GPT-4o mini)  │              │  Rotação + GDP  │  │
│               │  Análise visual │              │  Timeline+Econ  │  │
│               └─────────────────┘              └─────────────────┘  │
│                                                                      │
│                         SQLAlchemy ORM                                │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   SQLite         │
                    │   database.db    │
                    │                  │
                    │  users           │
                    │  pasture_areas   │
                    │  cattle_lot      │
                    │  pasture_readings│
                    │  movement_recs   │
                    └──────────────────┘
```

### Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Cria conta do produtor (nome, email, senha). |
| `POST` | `/api/auth/login` | Autentica e retorna JWT. |
| `GET` | `/api/profile` | Retorna nome, email, telefone e nome da fazenda. |
| `PUT` | `/api/profile` | Atualiza dados do perfil do produtor. |
| `POST` | `/api/areas` | Cadastra novo piquete (nome, hectares, tipo de capim). |
| `GET` | `/api/areas` | Lista todos os piquetes do usuário autenticado. |
| `POST` | `/api/lote` | Cria ou atualiza o lote único (cabeças, peso, categoria, área atual). |
| `GET` | `/api/lote` | Retorna dados do lote e peso vivo total calculado. |
| `POST` | `/api/area/update` | Registra leitura (altura, clima, foto), estima biomassa com IA, salva reading. |
| `GET` | `/api/evaluation` | Retorna dados agregados: lote, áreas, timeline de rotação, projeção de peso e resumo econômico. |

> Todos os endpoints exceto `/auth/*` exigem header `Authorization: Bearer <token>`.

---

## 🧠 Algoritmo Central: Simulação de Rotacionamento

O coração do PastoCerto é o módulo `simulation.py` — uma simulação determinística dia-a-dia que projeta consumo, crescimento da pastagem, movimentações do rebanho e ganho de peso.

### Estimativa de Biomassa (no update de leitura)

Quando o produtor atualiza uma área, a biomassa é estimada por:

```
biomassa_kg = área_ha × altura_cm × 180 × (green_percent / 100)
```

O fator `180` é um coeficiente de conversão empírico (kg MS/ha por cm de altura). O `green_percent` vem da análise visual da IA (GPT-4o mini avalia a foto e retorna um score 0–100). Se não houver foto ou a API falhar, o sistema assume 50% como fallback conservador.

### Constantes Agronômicas

```python
CONSUMO_PERCENT_PV     = 0.025    # Animal come 2,5% do peso vivo/dia
EFICIENCIA_PASTEJO     = 0.50     # 50% da biomassa é utilizável

BIOMASSA_ENTRADA       = 2500     # kg MS/ha — piquete pronto para receber
BIOMASSA_SAIDA         = 1200     # kg MS/ha — sinal de saída programada
BIOMASSA_CRITICA       =  800     # kg MS/ha — saída forçada

CRESCIMENTO_EM_DESCANSO = 40      # kg MS/ha/dia (sem pastejo)
CRESCIMENTO_OCUPADO     = 12      # kg MS/ha/dia (com pastejo)
```

### Ganho de Peso Diário (GDP)

O GDP efetivo depende da biomassa disponível no piquete:

```
Se biomassa/ha ≥ 1200 (saída):
    GDP = GDP_base da categoria (ex: 1,60 kg/dia para garrotes)

Se 800 < biomassa/ha < 1200:
    fator = (biomassa - 800) / (1200 - 800)
    GDP = GDP_base × fator        ← queda linear

Se biomassa/ha ≤ 800 (crítica):
    GDP = -0,20 kg/dia            ← animal perde peso
```

### Lógica de Decisão de Movimentação

A cada dia simulado, o sistema avalia três gatilhos em ordem de prioridade:

```
P1. SAÍDA CRÍTICA
    biomassa/ha < 800 → mover para qualquer área com mais pasto

P2. SAÍDA PROGRAMADA
    biomassa/ha < 1200 E existe área com biomassa ≥ 2500
    → mover para a área com maior biomassa/ha

P3. OPORTUNIDADE
    dias no piquete ≥ 3 E existe área com biomassa
    500 kg/ha acima da atual
    → trocar para aproveitar melhor recurso
```

Se nenhum destino viável existe durante saída crítica, o sistema gera um **alerta de suplementação**.

### Saídas da Simulação

A função `simular_rotacao()` retorna três estruturas:

- **Timeline**: lista de eventos (mover, alerta, venda) com data, origem, destino e motivo.
- **Weight Projection**: pontos semanais de peso médio projetado.
- **Summary**: dias até venda, peso final estimado, total de movimentações, e projeção econômica (receita inicial, receita projetada, custo de suplementação, margem líquida).

---

## 📊 Situação do Projeto

| Funcionalidade | Planejado | Implementado |
|----------------|-----------|--------------|
| Cadastro e autenticação de usuário (JWT) | Sim | ✅ |
| Perfil do produtor (nome, fazenda, telefone) | Sim | ✅ |
| Cadastro de piquetes (nome, hectares, tipo de capim) | Sim | ✅ |
| Cadastro de lote único (cabeças, peso, categoria, peso-alvo) | Sim | ✅ |
| Atualização de leitura com altura e condição climática | Sim | ✅ |
| Análise visual de foto via GPT-4o mini | Sim | ✅ |
| Estimativa de biomassa por piquete | Sim | ✅ |
| Simulação de rotacionamento dia-a-dia | Sim | ✅ |
| Projeção de ganho de peso (gráfico semanal) | Sim | ✅ |
| Timeline de manejo com ações e motivos | Sim | ✅ |
| Projeção econômica (receita, custo, margem) | Sim | ✅ |
| Dashboard com cards de áreas e semáforo | Sim | ✅ |
| Tela de planejamento (timeline + gráficos) | Sim | ✅ |
| Configurações (editar lote e áreas) | Sim | ✅ |
| Upload de foto na leitura | Sim | ✅ |
| Múltiplos lotes por usuário | Não | ❌ |
| Múltiplas fazendas por usuário | Não | ❌ |
| Pastejo contínuo / Voisin / diferido | Não | ⏳ Arquitetura preparada |
| Georreferenciamento / mapa de áreas | Não | ⏳ Futuro |
| Notificações push de movimentação | Não | ⏳ Futuro |
| Histórico de movimentações executadas | Parcial | ⚠️ Modelo existe, sem CRUD dedicado |
| Simulação com variação climática/estacional | Não | ⏳ Futuro |

---

## 🚀 Instalação e Execução

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.x |

Uma chave de API da OpenAI é **necessária** para a funcionalidade de análise visual de foto. Sem ela, o sistema assume `green_percent = 50` como fallback.

### 1. Clonar o repositório

```bash
git clone https://github.com/[TODO: preencher]/27-50TonsDeClaude.git
cd 27-50TonsDeClaude
```

### 2. Backend (Flask)

```bash
cd back

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
# source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env e preencher OPENAI_API_KEY

# Rodar o servidor
python app.py
```

O backend estará disponível em `http://localhost:5000`.

> O banco `database.db` é criado automaticamente na primeira execução.

### 3. Frontend (React + Vite)

```bash
cd front

# Instalar dependências
npm install

# Rodar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (porta padrão do Vite).

### Variáveis de Ambiente

Crie um arquivo `.env` dentro da pasta `back/`:

```env
# back/.env
OPENAI_API_KEY=sk-sua-chave-aqui
```

> **Sem essa variável**, a análise de foto não funciona e o score de verde será sempre 50%.

### Estrutura de Pastas

```
27-50TonsDeClaude/
├── back/                          # API Flask
│   ├── app.py                     # Servidor, modelos ORM, endpoints
│   ├── simulation.py              # Motor de simulação de rotacionamento
│   ├── requirements.txt           # Dependências Python
│   └── database.db                # SQLite (gerado automaticamente)
├── front/                         # SPA React
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx            # Layout principal, navegação, auth
│   │   │   ├── api.ts             # Cliente Axios com interceptors JWT
│   │   │   └── components/
│   │   │       ├── Dashboard.tsx  # Painel com cards de áreas e resumo
│   │   │       ├── Planning.tsx   # Timeline + gráficos de projeção
│   │   │       ├── Login.tsx      # Tela de login e registro
│   │   │       ├── SettingsModal.tsx  # Config de lote e áreas
│   │   │       └── UserProfile.tsx    # Modal de perfil
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/                          # Documentação técnica de domínio
│   ├── DOCUMENTO_TECNICO_MANEJO_PASTAGEM.md
│   └── MVP_BASICO_BANCO_SIMPLES.md
├── pastures_images/               # Imagens de amostra de pastagens
└── README.md
```

---

## 🌱 Impacto Socioambiental

O superpastejo é a principal causa de degradação de pastagens no Brasil. Pastagens degradadas emitem mais gases de efeito estufa, reduzem a infiltração de água no solo e diminuem a produtividade por hectare — forçando a abertura de novas áreas. Ao dar ao produtor informação objetiva sobre quando mover o rebanho, o PastoCerto reduz o risco de superpastejo, preserva a capacidade de rebrote do solo e contribui para a intensificação sustentável da pecuária — produzir mais carne na mesma área, sem degradar.

---

## 📄 Licença

[TODO: preencher]
