# PastoCerto

- Equipe 50 To(ke)ns de Claude

| Integrante                | Função                   |
| ------------------------- | ------------------------ |
| **Gabriel Baggio**        | Gerente de Projeto       |
| **Gabriel Stiegemeier**   | Desenvolvedor Frontend   |
| **Guilherme Brizzi**      | Desenvolvedor Backend    |
| **João Pedro Righi**      | Desenvolvedor Full Stack |
| **Luís Gustavo Tozevich** | Analista de Qualidade    |

## Vídeo

- Link: https://youtu.be/B95AzIRW2eI

## Qual a nossa visão?

Imaginamos o agro mais forte com **manejo inteligente de pastagens com visão computacional e simulação de rotação.**

No Brasil, mais de 100 milhões de hectares de pastagens apresentam algum grau de degradação (Embrapa, 2021). A causa mais frequente não é falta de capim, é falta de informação no momento da decisão. O produtor olha o pasto, estima "de olho" se aguenta mais uns dias, e muitas vezes erra. Erra para mais, degrada o solo. Erra para menos, desperdiça forragem. O PastoCerto transforma uma foto de celular e uma régua de capim em uma recomendação objetiva: **ficar, mover ou medir de novo**.

---

## Conheça o PastoCerto

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
2. **Simula o rotacionamento** dia a dia, consumo, crescimento, movimentações.
3. **Projeta o ganho de peso** do rebanho ao longo de semanas.
4. **Gera uma timeline de manejo** com ações concretas: "mover do Piquete A para o Piquete B no dia X, motivo: biomassa abaixo do limite de saída".
5. **Estima data e valor de venda** quando o lote atinge o peso-alvo.

O produtor abre o painel, vê o semáforo de cada área, e sabe exatamente o que fazer.

---

## Stack Tecnológica

### Frontend

| Tecnologia        | Justificativa                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| React             | Componentização e reatividade para a interface do dashboard em tempo real.                       |
| Vite              | Build rápido e hot-reload, contribuindo para maior produtividade no desenvolvimento.             |
| Tailwind CSS      | Estilização utilitária para prototipagem rápida sem sair do JSX.                                 |
| Recharts          | Criação de gráficos de projeção de peso e biomassa integrados ao React.                          |
| MUI (Material UI) | Componentes prontos, como ícones e campos de entrada, para acelerar a construção de formulários. |
| Radix UI          | Primitivos acessíveis, como modais, abas e seletores, utilizados em conjunto com o shadcn/ui.    |
| Axios             | Cliente HTTP com suporte a interceptors para autenticação JWT automática.                        |
| React Router      | Navegação SPA entre telas de login, painel e planejamento.                                       |
| Lucide React      | Biblioteca de ícones leves e consistentes para a interface.                                      |


### Backend

| Tecnologia | Justificativa |
|------------|---------------|
| **Python / Flask** | Framework minimalista — permite levantar a API REST rapidamente com poucos arquivos. |
| **SQLite** | Banco de arquivo único, sem instalação — ideal para prototipagem e deploy simples. |

### APIs Externas

| Serviço | Justificativa |
|---------|---------------|
| **OpenAI API (GPT-4o mini)** | Análise visual da foto do pasto — retorna um score de 0 a 100 representando a qualidade/percentual verde da forragem. Usado no endpoint de atualização de leitura. |

---

## Arquitetura

Optou-se por uma arquitetura limpa e de fácil manutenção, baseada na separação entre frontend e backend, que se comunicam por meio de requisições. Essa abordagem promove um baixo acoplamento entre os componentes, facilitando a evolução e a escalabilidade do sistema. Além disso, o backend foi projetado seguindo uma estratégia de microsserviços, permitindo que diferentes funcionalidades sejam desenvolvidas, implantadas e escaladas de forma independente, reduzindo a dependência de uma estrutura monolítica.


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

## Algoritmo Central: Simulação de Rotacionamento

O coração do PastoCerto é o módulo `simulation.py`, nosso simulador dia-a-dia que projeta consumo, crescimento da pastagem, movimentações do rebanho e ganho de peso.

### Saídas da Simulação

Este algoritmo é capaz de gerar um planejamento de rotação para o rebanho. A saída é uma timeline de eventos que orienta o produtor sobre quando mover os animais entre os piquetes, bem como projeções de ganho de peso e indicadores econômicos.

---

## Situação do Projeto

| Funcionalidade | Planejado | Implementado |
|----------------|-----------|--------------|
| Cadastro de piquetes (nome, hectares, tipo de capim) | Sim | ✅ |
| Cadastro de rebanho (cabeças, peso, categoria, peso-alvo) | Sim | ✅ |
| Atualização de leitura com altura e condição climática | Sim | ✅ |
| Análise visual de foto via LLM | Sim | ✅ |
| Estimativa de biomassa por piquete | Sim | ✅ |
| Simulação de rotacionamento dia-a-dia | Sim | ✅ |
| Projeção de ganho de peso (gráfico semanal) | Sim | ✅ |
| Timeline de manejo com ações e motivos | Sim | ✅ |
| Projeção econômica (receita, custo, margem) | Sim | ✅ |
| Múltiplas fazendas por usuário | Não | ❌ |
| Georreferenciamento / mapa de áreas | Não | ⏳ Futuro |
| Notificações push de movimentação | Não | ⏳ Futuro |
| Histórico de movimentações executadas | Parcial | ⏳ Futuro |
| Simulação com variação climática/estacional | Não | ⏳ Futuro |

---

## Instalação e Execução

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
git clone https://github.com/brizzigui/27-50TonsDeClaude.git
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
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env e preencher OPENAI_API_KEY

# Rodar o servidor
python app.py
```

O backend estará disponível em `http://localhost:5000`, ao não ser que editado.

> O banco `database.db` é criado automaticamente na primeira execução.

### 3. Frontend (React + Vite)

```bash
cd front

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env e preencher OPENAI_API_KEY

# Rodar o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (porta padrão do Vite).

### Variáveis de Ambiente

Crie arquivos `.env` dentro da pasta `back/` e `front/`, conforme os exemplos: