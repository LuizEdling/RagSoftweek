# RAG Lab

**Construindo uma IA com Memória** — aplicação web educacional criada para o
workshop universitário *"Construindo uma IA com Memória: RAG, Embeddings e
Bancos Vetoriais na Prática"*.

O RAG Lab mostra visualmente, passo a passo, como uma arquitetura RAG
(Retrieval-Augmented Generation) transforma uma pergunta em uma resposta:

```
Pergunta → Embedding → Busca Vetorial → Reranking → Contexto → LLM → Resposta
```

Todo o processamento acontece no servidor; o aluno só precisa de um
navegador.

---

## 1. Visão geral

- **Frontend**: React + TypeScript + Tailwind CSS — interface do
  laboratório, base de conhecimento, banco vetorial e página explicativa.
- **Backend**: Python + FastAPI — orquestra o pipeline RAG através de três
  camadas de serviço plugáveis (`EmbeddingService`, `RerankerService`,
  `LLMService`).
- **Banco vetorial**: Qdrant (Cloud, hospedado).
- **Modo mock**: todo o sistema funciona sem nenhuma chave configurada —
  útil para testar a interface, ensaiar a apresentação, ou como plano B
  caso alguma API externa fique indisponível durante o workshop.

O frontend, sozinho (sem backend nenhum), já roda inteiramente em modo mock
no navegador — bom para revisar rapidamente o visual e o fluxo.

---

## 2. Arquitetura

```
rag-lab/
├── frontend/                  React + TypeScript + Tailwind
│   └── src/
│       ├── pages/              Laboratório, Como funciona, Base de Conhecimento, Sobre
│       ├── components/         Pipeline, PipelineStep, SimilarityChart, DemoModeRunner...
│       ├── data/documents.ts   base de conhecimento fictícia (usada no modo mock do navegador)
│       ├── lib/mockRag.ts      simulação completa do pipeline RAG no navegador
│       └── api/client.ts       chama o backend real se VITE_API_URL estiver definida
│
├── backend/                   FastAPI
│   └── app/
│       ├── main.py             app FastAPI, CORS, tratamento global de erros
│       ├── routers/            rag.py, documents.py, health.py
│       ├── services/           embedding_service.py, reranker_service.py,
│       │                       llm_service.py, vector_store.py, rag_pipeline.py
│       ├── core/                config.py (env vars), rate_limit.py, cache.py,
│       │                        documents.py (carrega data/documents/*.md)
│       └── models/schemas.py   contratos Pydantic da API
│   ├── data/documents/         18 documentos fictícios (.md com front-matter)
│   └── scripts/ingest.py       carrega os documentos no Qdrant com embeddings reais
│
├── .env.example                todas as variáveis de ambiente, sem chaves reais
└── README.md
```

### Fluxo RAG

1. **Embedding** — `EmbeddingService.embed(pergunta)` transforma o texto em
   um vetor (768 dimensões por padrão).
2. **Busca vetorial** — `VectorStore.search()` compara esse vetor com os
   vetores armazenados no Qdrant e retorna os `TOP_K` documentos mais
   próximos (padrão: 5).
3. **Reranking** — `RerankerService.rerank()` reordena esses candidatos por
   relevância real em relação à pergunta, mantendo apenas os melhores
   (padrão: 2).
4. **Contexto** — os trechos dos documentos escolhidos são montados como
   contexto.
5. **LLM** — `LLMService.generate(pergunta, contexto)` gera a resposta final
   e retorna as fontes utilizadas.

Cada uma dessas camadas é uma classe independente, trocável por variável de
ambiente, sem espalhar chamadas a provedores externos pelo resto do código.

---

## 3. Como rodar localmente

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # opcional, mas recomendado
pip install -r requirements.txt
cp ../.env.example .env   # edite conforme necessário (ou deixe tudo "mock")
uvicorn app.main:app --reload --port 8000
```

Verifique em `http://localhost:8000/api/health`. Com o `.env` padrão
(tudo em `mock`), o backend já responde `/api/rag/query` sem nenhuma chave.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. Sem `VITE_API_URL` configurada, o frontend
roda 100% em modo mock no navegador, sem precisar do backend rodando.

Para o frontend conversar com o backend local:

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

---

## 4. Variáveis de ambiente

Veja `.env.example` na raiz do projeto para a lista completa e comentada.
Resumo:

| Variável | Descrição | Padrão |
|---|---|---|
| `QDRANT_URL` / `QDRANT_API_KEY` | Cluster do Qdrant Cloud | vazio (modo mock) |
| `QDRANT_COLLECTION` | Nome da collection | `rag_lab_documents` |
| `EMBEDDING_PROVIDER` | `mock` \| `openai` \| `cohere` | `mock` |
| `EMBEDDING_API_KEY` / `EMBEDDING_MODEL` | Credenciais do provedor de embeddings | vazio |
| `EMBEDDING_DIMENSIONS` | Dimensão do vetor | `768` |
| `LLM_PROVIDER` | `mock` \| `groq` \| `openai` | `mock` |
| `LLM_API_KEY` / `LLM_MODEL` | Credenciais do provedor de LLM | vazio |
| `RERANKER_MODE` | `heuristic` \| `external` | `heuristic` |
| `RATE_LIMIT_PER_MINUTE` | Limite de requisições por IP | `10` |
| `MAX_QUESTION_LENGTH` | Tamanho máximo da pergunta | `500` |
| `CORS_ORIGINS` | Domínios permitidos, separados por vírgula | `*` |
| `VITE_API_URL` (frontend) | URL do backend real | vazio (modo mock no navegador) |

**Nunca** coloque chaves reais em código ou no `.env.example` — apenas no
`.env` local (ignorado pelo git) e nas variáveis de ambiente do serviço de
deploy.

---

## 5. Configurando o Qdrant

**Padrão do projeto — Qdrant local/embarcado (`QDRANT_URL=local`):** o
pacote `qdrant-client` inclui um modo local que roda o mesmo motor de
busca do Qdrant em processo, sem precisar de servidor nem Docker,
persistindo os dados em `backend/.qdrant_local/`. O backend popula essa
collection **automaticamente no primeiro startup** (evento `startup` em
`app/main.py`) — não é preciso rodar a ingestão manualmente para
desenvolver localmente.

Esse modo já foi testado de ponta a ponta neste projeto: a busca por
similaridade roda com o algoritmo real do Qdrant (cosseno), não é mais o
fallback por palavra-chave usado quando `QDRANT_URL` fica vazio. A única
limitação é que, como o provedor de embeddings padrão (`mock`) não é
semanticamente real, os *resultados* da busca não fazem sentido semântico
ainda — útil para validar a integração, não a qualidade das respostas
(para isso, configure um provedor de embeddings real, seção 6). Esse modo
também não é recomendado para o dia do workshop com várias pessoas
acessando ao mesmo tempo — para isso, use a opção abaixo.

**Para o workshop (Qdrant Cloud, com alunos acessando pela internet):**

1. Crie uma conta gratuita em [cloud.qdrant.io](https://cloud.qdrant.io).
2. Crie um cluster free tier e copie a URL e a API key.
3. Preencha `QDRANT_URL` (com a URL do cluster, substituindo `local`) e
   `QDRANT_API_KEY` no `.env` do backend.
4. Rode `python scripts/ingest.py` uma vez (a ingestão automática do
   startup só se aplica ao modo local, de propósito — nunca grava em um
   cluster remoto sem você pedir explicitamente).

Outras variações do modo local: `QDRANT_URL=local:/caminho` (persiste em
um caminho customizado) ou `QDRANT_URL=:memory:` (efêmero, os dados somem
ao reiniciar o processo). Deixar `QDRANT_URL` vazio volta ao modo mock
(busca por palavra-chave, sem nenhum banco vetorial real).

## 6. Configurando embeddings

Escolha um provedor e preencha `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY` e,
se necessário, `EMBEDDING_MODEL`:

- **OpenAI**: `EMBEDDING_PROVIDER=openai`, modelo padrão
  `text-embedding-3-small`.
- **Cohere**: `EMBEDDING_PROVIDER=cohere`, modelo padrão
  `embed-multilingual-v3.0` (bom suporte a português).

Ajuste `EMBEDDING_DIMENSIONS` para bater com o modelo escolhido antes de
rodar a ingestão pela primeira vez (a collection do Qdrant é criada com essa
dimensão).

## 7. Configurando o LLM

Escolha um provedor e preencha `LLM_PROVIDER`, `LLM_API_KEY` e
`LLM_MODEL`:

- **Groq** (recomendado — rápido e com free tier generoso):
  `LLM_PROVIDER=groq`, modelo padrão `llama-3.1-8b-instant`.
- **OpenAI**: `LLM_PROVIDER=openai`, modelo padrão `gpt-4o-mini`.

## 8. Rodando a ingestão dos documentos

Com `QDRANT_URL` e o provedor de embeddings configurados:

```bash
cd backend
python scripts/ingest.py
```

O script lê todos os arquivos de `backend/data/documents/*.md`, gera um
embedding para cada um e envia para a collection do Qdrant, criando-a se
não existir. Rode novamente sempre que adicionar ou editar documentos.

---

## 9. Deploy

Sugestão de arquitetura de deploy, simples e com free tier em todos os
serviços:

| Componente | Serviço sugerido |
|---|---|
| Frontend | Vercel |
| Backend | Render ou Railway |
| Banco vetorial | Qdrant Cloud |

### Passo a passo

1. **Backend (Render/Railway)**: crie um novo serviço apontando para a
   pasta `backend/`. O `render.yaml` já descreve o serviço para o Render
   (New → Blueprint); no Railway, o `Procfile` e o `runtime.txt` já bastam
   para o auto-deploy detectar tudo. Preencha as variáveis de ambiente do
   `.env.example` nas configurações do serviço (nunca no código).
2. **Ingestão**: rode `python scripts/ingest.py` uma vez (localmente,
   apontando para o Qdrant de produção, ou via shell do próprio serviço).
3. **Frontend (Vercel)**: aponte para a pasta `frontend/`, defina a
   variável de ambiente `VITE_API_URL` com a URL pública do backend. O
   `vercel.json` já inclui o rewrite necessário para as rotas do React
   Router funcionarem em acesso direto (ex.: `/sobre`).
4. **CORS**: defina `CORS_ORIGINS` no backend com o domínio do frontend
   publicado pela Vercel.
5. Teste tudo de ponta a ponta pelo menos um dia antes do workshop —
   serviços em free tier podem ter "cold start" (primeira requisição
   demorada). Rode `backend/scripts/warmup.sh <url-do-backend>` minutos
   antes da aula para aquecer a instância.

O **Modo Demonstração** e o modo mock (ativado automaticamente quando
`VITE_API_URL` não está definida, ou quando os provedores ficam como
`mock`) servem como plano B caso alguma API externa fique instável durante
a apresentação ao vivo.

---

## 10. Segurança e limites já implementados

- Chaves de API somente no backend, lidas de variáveis de ambiente.
- Rate limiting básico por IP (`RATE_LIMIT_PER_MINUTE`, padrão 10/min).
- Validação de tamanho da pergunta (`MAX_QUESTION_LENGTH`, padrão 500
  caracteres) via Pydantic.
- Cache em memória com TTL para evitar chamadas duplicadas em perguntas
  repetidas.
- Apenas os `top-k` reduzidos pelo reranker são enviados à LLM (nunca a
  base inteira).
- O frontend nunca recebe o vetor de embedding completo — apenas uma
  amostra para fins didáticos.
- Tratamento de erros global: nenhuma stack trace é exposta ao usuário;
  falhas da LLM ou do Qdrant retornam mensagens amigáveis, preservando o
  restante do pipeline quando possível (ex.: mostrar a busca vetorial
  mesmo se a LLM falhar).
- Não há edição do banco vetorial pelo usuário final — os endpoints
  públicos são somente leitura.

---

## 11. Estrutura de pastas (detalhe)

Veja a árvore completa na seção 2. Os arquivos de documentos em
`backend/data/documents/*.md` seguem este formato:

```markdown
---
id: "002"
title: "Trabalho de Conclusão de Curso (TCC)"
category: "acadêmico"
tags: [tcc, monografia, orientador]
source: "tcc.md"
---

Conteúdo do documento em texto corrido...
```

---

## 12. O que este projeto propositalmente não tem

Para manter o escopo de um MVP educacional: autenticação, painel
administrativo, sistema de usuários e permissões, microserviços, filas ou
Kubernetes. Nenhum aluno precisa de login — o acesso é direto pelo link.
# RagSoftweek
