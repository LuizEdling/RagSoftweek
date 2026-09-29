// Dados autorados do Modo Prática ("você é o código"). Tudo aqui é fixo e
// determinístico: as missões rodam 100% no navegador, sem backend.
//
// O mapa 2D é uma versão didática dos embeddings: em um RAG real cada texto
// vira ~768 números; aqui vira 2 (x, y) para o aluno conseguir enxergar que
// "significado parecido" = "pontos próximos". As posições dos documentos e das
// perguntas são validadas por `scripts/validate-practice.mjs` (nos scripts do
// package.json): os 4 mais próximos de cada pergunta têm que ser exatamente os
// documentos listados em `retrieved`.

export type ClusterId = 'aulas' | 'curso' | 'trabalho' | 'dinheiro' | 'campus';

export interface Cluster {
  id: ClusterId;
  label: string;
  /** Posição do rótulo da região no mapa. */
  x: number;
  y: number;
  color: string;
}

export const CLUSTERS: Cluster[] = [
  { id: 'aulas', label: 'Provas e presença', x: 21, y: 6, color: '#f59e0b' },
  { id: 'curso', label: 'Matrícula e curso', x: 26, y: 92, color: '#38bdf8' },
  { id: 'trabalho', label: 'Trabalho e prática', x: 80, y: 6, color: '#a78bfa' },
  { id: 'dinheiro', label: 'Dinheiro', x: 84, y: 92, color: '#34d399' },
  { id: 'campus', label: 'Campus', x: 64, y: 61, color: '#f472b6' },
];

export interface MapPoint {
  file: string;
  label: string;
  x: number;
  y: number;
  cluster: ClusterId;
}

export const MAP_POINTS: MapPoint[] = [
  { file: 'provas.md', label: 'Provas', x: 16, y: 20, cluster: 'aulas' },
  { file: 'notas.md', label: 'Notas', x: 26, y: 16, cluster: 'aulas' },
  { file: 'faltas.md', label: 'Faltas', x: 12, y: 38, cluster: 'aulas' },
  { file: 'calendario.md', label: 'Calendário', x: 26, y: 52, cluster: 'curso' },
  { file: 'matricula.md', label: 'Matrícula', x: 14, y: 64, cluster: 'curso' },
  { file: 'transferencia.md', label: 'Transferência', x: 24, y: 80, cluster: 'curso' },
  { file: 'disciplinas.md', label: 'Disciplinas', x: 38, y: 66, cluster: 'curso' },
  { file: 'orientacao.md', label: 'Orientação', x: 46, y: 44, cluster: 'curso' },
  { file: 'tcc.md', label: 'TCC', x: 72, y: 16, cluster: 'trabalho' },
  { file: 'trabalhos.md', label: 'Trabalhos', x: 86, y: 26, cluster: 'trabalho' },
  { file: 'estagio.md', label: 'Estágio', x: 76, y: 38, cluster: 'trabalho' },
  { file: 'atividades_complementares.md', label: 'Ativ. compl.', x: 90, y: 12, cluster: 'trabalho' },
  { file: 'eventos.md', label: 'Eventos', x: 94, y: 50, cluster: 'trabalho' },
  { file: 'bolsas.md', label: 'Bolsas', x: 78, y: 72, cluster: 'dinheiro' },
  { file: 'monitoria.md', label: 'Monitoria', x: 66, y: 84, cluster: 'dinheiro' },
  { file: 'biblioteca.md', label: 'Biblioteca', x: 48, y: 88, cluster: 'campus' },
  { file: 'laboratorios.md', label: 'Laboratórios', x: 58, y: 70, cluster: 'campus' },
  { file: 'ouvidoria.md', label: 'Ouvidoria', x: 55, y: 48, cluster: 'campus' },
];

export function pointFor(file: string): MapPoint {
  const p = MAP_POINTS.find((m) => m.file === file);
  if (!p) throw new Error(`Documento sem posição no mapa: ${file}`);
  return p;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Os `k` documentos mais próximos de um ponto do mapa, do mais perto ao mais longe. */
export function nearest(pin: { x: number; y: number }, k: number): (MapPoint & { dist: number })[] {
  return MAP_POINTS.map((p) => ({ ...p, dist: distance(pin, p) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k);
}

/** Quantos documentos a busca vetorial devolve nas missões (o "K"). */
export const SEARCH_K = 4;
/** Raio (em unidades do mapa) em que o aluno acerta a posição da pergunta. */
export const EMBED_HIT_RADIUS = 16;

/** answers = responde a pergunta; helps = complementa; noise = só parece parecido. */
export type Verdict = 'answers' | 'helps' | 'noise';

export interface RetrievedDoc {
  file: string;
  verdict: Verdict;
  why: string;
}

export interface LlmOption {
  text: string;
  correct: boolean;
}

export interface Scenario {
  /** Igual a um item de SUGGESTED_QUESTIONS (validado pelo script). */
  question: string;
  /** Onde o embedding da pergunta cai no mapa. */
  pin: { x: number; y: number };
  /** Os 4 documentos mais próximos (como a busca vetorial os devolveria). */
  retrieved: RetrievedDoc[];
  /** Documento que responde à pergunta (fonte do contexto e da auditoria). */
  answerFile: string;
  /** Índices (das frases do documento) que valem a pena no contexto. */
  contextKeep: [number, number];
  /** Por que cada frase (na ordem do documento) é essencial ou dispensável. */
  contextWhy: string[];
  /** Três respostas possíveis da LLM, na ordem de exibição. */
  llmOptions: LlmOption[];
  /** Frase inventada, inserida na resposta da auditoria. */
  invented: { text: string; why: string };
}

export const SCENARIOS: Scenario[] = [
  {
    question: 'Como faço meu TCC?',
    pin: { x: 76, y: 20 },
    retrieved: [
      { file: 'tcc.md', verdict: 'answers', why: 'Explica orientador, pré-projeto, bancas e normas da ABNT — é exatamente o processo do TCC.' },
      { file: 'trabalhos.md', verdict: 'helps', why: 'Complementa: diz que a formatação dos trabalhos segue normas parecidas com as do TCC.' },
      { file: 'atividades_complementares.md', verdict: 'noise', why: 'Fala de horas para a colação de grau, não de como fazer o TCC.' },
      { file: 'estagio.md', verdict: 'noise', why: 'Também tem orientador e relatórios, mas é outro assunto: estágio.' },
    ],
    answerFile: 'tcc.md',
    contextKeep: [0, 1],
    contextWhy: [
      'Essencial: diz como o TCC começa (orientador e aprovação do tema).',
      'Essencial: traz prazo do pré-projeto, as duas bancas e a formatação.',
      'Pode ficar de fora: detalhe sobre como escolher o orientador, não muda o passo a passo.',
    ],
    llmOptions: [
      {
        text: 'O TCC começa no último semestre: o aluno escolhe um tema livremente e entrega uma monografia de 30 páginas até a oitava semana letiva, apresentada a uma banca única de três professores.',
        correct: false,
      },
      {
        text: 'Para iniciar o TCC, você precisa definir um orientador e ter o tema aprovado pela coordenação do curso, no início do penúltimo semestre. É necessário entregar um pré-projeto até a sexta semana letiva e passar por duas bancas: qualificação e defesa final.',
        correct: true,
      },
      {
        text: 'O TCC é opcional e pode ser substituído por provas extras. O aluno escolhe o orientador livremente, sem aprovação da coordenação, e entrega o trabalho no último dia do semestre.',
        correct: false,
      },
    ],
    invented: {
      text: 'A banca de defesa final é composta obrigatoriamente por três professores externos à instituição.',
      why: 'Os documentos falam de duas bancas (qualificação e defesa final), mas nada sobre três professores externos.',
    },
  },
  {
    question: 'Quantas faltas posso ter?',
    pin: { x: 20, y: 32 },
    retrieved: [
      { file: 'faltas.md', verdict: 'answers', why: 'Traz o limite exato: 75% de frequência, ou 20 horas de falta numa disciplina de 80 horas.' },
      { file: 'provas.md', verdict: 'helps', why: 'Complementa: explica o que fazer quando a falta foi numa avaliação e é justificada.' },
      { file: 'calendario.md', verdict: 'noise', why: 'Só cita datas e períodos do semestre; não fala de presença.' },
      { file: 'notas.md', verdict: 'noise', why: 'Fala de média para aprovação, não de frequência.' },
    ],
    answerFile: 'faltas.md',
    contextKeep: [0, 1],
    contextWhy: [
      'Essencial: define a frequência mínima (75%) para aprovação.',
      'Essencial: converte a regra em horas — o número que o aluno quer saber.',
      'Pode ficar de fora: a consequência (reprovação) é útil, mas não responde "quantas faltas".',
    ],
    llmOptions: [
      {
        text: 'A frequência mínima exigida é de 70% das aulas. Em uma disciplina de 80 horas, você pode faltar no máximo 24 horas, mas faltas justificadas por atestado não contam. Ultrapassar esse limite leva à reprovação por frequência.',
        correct: false,
      },
      {
        text: 'A frequência mínima exigida é de 80% das aulas. Em uma disciplina de 60 horas, você pode faltar no máximo 12 horas, e cada falta acima disso reduz a nota final em meio ponto em vez de reprovar.',
        correct: false,
      },
      {
        text: 'A frequência mínima exigida é de 75% das aulas. Em uma disciplina de 80 horas, você pode faltar no máximo 20 horas, justificadas ou não. Ultrapassar esse limite leva à reprovação por frequência.',
        correct: true,
      },
    ],
    invented: {
      text: 'Faltas justificadas por atestado médico não entram na contagem do limite.',
      why: 'A fonte diz o contrário: o limite vale para faltas justificadas ou não.',
    },
  },
  {
    question: 'Como funciona o estágio?',
    pin: { x: 77, y: 30 },
    retrieved: [
      { file: 'estagio.md', verdict: 'answers', why: 'Tem tudo: quando começar, orientador, relatórios e contrato.' },
      { file: 'trabalhos.md', verdict: 'noise', why: 'Trata de projetos de extensão e trabalhos de disciplina, não de estágio.' },
      { file: 'atividades_complementares.md', verdict: 'noise', why: 'Fala de horas complementares para a formatura, não de estágio.' },
      { file: 'tcc.md', verdict: 'noise', why: 'Também tem orientador e prazos, mas é sobre o TCC.' },
    ],
    answerFile: 'estagio.md',
    contextKeep: [0, 1],
    contextWhy: [
      'Essencial: diz quando o estágio pode começar e com quem.',
      'Essencial: lista o orientador e os relatórios obrigatórios.',
      'Pode ficar de fora aqui: o contrato é importante, mas a pergunta é "como funciona", e as outras frases já dão o quadro geral.',
    ],
    llmOptions: [
      {
        text: 'O estágio obrigatório só pode começar no último ano e não exige professor orientador, apenas a assinatura do supervisor da empresa e um relatório final de duas páginas.',
        correct: false,
      },
      {
        text: 'O estágio obrigatório pode começar a partir do 3º período, apenas em empresas conveniadas. É preciso ter um supervisor da empresa, entregar um relatório semestral e assinar o contrato até 30 dias depois de começar.',
        correct: false,
      },
      {
        text: 'O estágio obrigatório pode começar a partir do 5º período, em empresas conveniadas ou por convênio individual. É preciso ter um professor orientador, entregar relatórios bimestrais e um relatório final, e assinar o contrato antes de começar.',
        correct: true,
      },
    ],
    invented: {
      text: 'O estágio remunerado dispensa a entrega do relatório final.',
      why: 'A fonte exige o relatório final ao término da carga horária, sem exceção para estágio remunerado.',
    },
  },
  {
    question: 'Como faço minha matrícula?',
    pin: { x: 22, y: 62 },
    retrieved: [
      { file: 'matricula.md', verdict: 'answers', why: 'Descreve o processo completo: Portal do Aluno, prazos, calouros e veteranos.' },
      { file: 'calendario.md', verdict: 'helps', why: 'Complementa: o calendário publica as datas de matrícula de cada ano.' },
      { file: 'transferencia.md', verdict: 'noise', why: 'Parece por causa da palavra "matrícula", mas trata de trancamento e transferência.' },
      { file: 'disciplinas.md', verdict: 'noise', why: 'Cita o ajuste de matrícula, mas só para escolher disciplinas eletivas.' },
    ],
    answerFile: 'matricula.md',
    contextKeep: [0, 1],
    contextWhy: [
      'Essencial: diz onde e quando se faz a matrícula (Portal do Aluno, dias 10 a 20).',
      'Essencial: explica o caso dos calouros e os documentos exigidos.',
      'Pode ficar de fora: a renovação automática dos veteranos é útil, mas a pergunta mais comum é a do calouro.',
      'Pode ficar de fora: matrícula extemporânea é um caso à parte.',
    ],
    llmOptions: [
      {
        text: 'A matrícula é feita pelo Portal do Aluno entre os dias 1 e 10 do mês anterior ao início do semestre. Calouros também usam o portal, enviando RG, CPF e comprovante de residência em PDF.',
        correct: false,
      },
      {
        text: 'A matrícula é feita pelo Portal do Aluno entre os dias 10 e 20 do mês anterior ao início do semestre. Calouros fazem a matrícula presencialmente na Central de Atendimento, com RG, CPF e histórico escolar.',
        correct: true,
      },
      {
        text: 'A matrícula é feita presencialmente na Central de Atendimento, no primeiro dia de aula. Calouros e veteranos levam RG, CPF e histórico escolar, e pagam uma taxa de inscrição.',
        correct: false,
      },
    ],
    invented: {
      text: 'Quem perder o prazo perde a vaga automaticamente.',
      why: 'A fonte prevê matrícula extemporânea, com justificativa e taxa administrativa; a vaga não é perdida automaticamente.',
    },
  },
  {
    question: 'Como posso conseguir uma bolsa?',
    pin: { x: 74, y: 76 },
    retrieved: [
      { file: 'bolsas.md', verdict: 'answers', why: 'Lista os tipos de bolsa, quando abrem as inscrições e o que comprovar.' },
      { file: 'monitoria.md', verdict: 'helps', why: 'Complementa: monitores recebem bolsa de auxílio — outro caminho para uma bolsa.' },
      { file: 'laboratorios.md', verdict: 'noise', why: 'Fala de reserva de equipamentos, sem relação com bolsas.' },
      { file: 'biblioteca.md', verdict: 'noise', why: 'Fala de acervo e empréstimo de livros, não de bolsas.' },
    ],
    answerFile: 'bolsas.md',
    contextKeep: [0, 1],
    contextWhy: [
      'Essencial: apresenta os três tipos de bolsa.',
      'Essencial: diz quando e onde se inscrever e o que comprovar.',
      'Pode ficar de fora: financiamento externo é um caminho à parte.',
    ],
    llmOptions: [
      {
        text: 'A única bolsa disponível é a de mérito, concedida automaticamente ao aluno com maior média de cada turma, sem necessidade de inscrição nem de comprovar renda.',
        correct: false,
      },
      {
        text: 'Existem bolsas de mérito e bolsas esportivas, concedidas por sorteio. As inscrições abrem uma vez por ano, em janeiro, na reitoria, e exigem apenas o histórico escolar do último ano.',
        correct: false,
      },
      {
        text: 'Existem bolsas de mérito acadêmico, bolsas socioeconômicas (com análise de renda) e bolsas de iniciação científica. As inscrições das socioeconômicas abrem no início de cada semestre na Assistência Estudantil, com comprovação de renda e documentação familiar.',
        correct: true,
      },
    ],
    invented: {
      text: 'A bolsa de mérito cobre 100% da mensalidade.',
      why: 'Nenhum documento informa o percentual coberto pelas bolsas.',
    },
  },
  {
    question: 'Como funciona a biblioteca?',
    pin: { x: 50, y: 84 },
    retrieved: [
      { file: 'biblioteca.md', verdict: 'answers', why: 'Traz horário, regras de empréstimo, acervo digital e atrasos.' },
      { file: 'laboratorios.md', verdict: 'noise', why: 'Também é sobre reservar um espaço do campus, mas de laboratórios.' },
      { file: 'monitoria.md', verdict: 'noise', why: 'Fala do programa de monitoria, sem relação com o acervo.' },
      { file: 'disciplinas.md', verdict: 'noise', why: 'Cita a bibliografia das ementas, mas não o funcionamento da biblioteca.' },
    ],
    answerFile: 'biblioteca.md',
    contextKeep: [0, 2],
    contextWhy: [
      'Essencial: horário de funcionamento e regras de empréstimo.',
      'Pode ficar de fora: o acervo digital é um extra; a pergunta é sobre o funcionamento.',
      'Essencial: a regra de atrasos e bloqueio é a que mais gera dúvida.',
    ],
    llmOptions: [
      {
        text: 'A Biblioteca Central funciona todos os dias, das 6h à meia-noite. É possível pegar até 10 livros por até 30 dias, sem renovação. Atrasos não geram nenhuma penalidade.',
        correct: false,
      },
      {
        text: 'A Biblioteca Central funciona de segunda a sexta, das 8h às 20h. É possível pegar até 3 livros por até 7 dias, renováveis uma única vez no balcão. Atrasos geram multa de R$ 1 por dia e por livro.',
        correct: false,
      },
      {
        text: 'A Biblioteca Central funciona de segunda a sábado, das 7h às 22h. É possível pegar até 5 livros por até 14 dias, renováveis pelo Portal do Aluno. Atrasos geram bloqueio de novos empréstimos proporcional aos dias de atraso.',
        correct: true,
      },
    ],
    invented: {
      text: 'Aos domingos a biblioteca abre das 9h às 13h.',
      why: 'A fonte diz que ela funciona de segunda a sábado; não há funcionamento aos domingos.',
    },
  },
  {
    question: 'Quando posso fazer uma prova substitutiva?',
    pin: { x: 20, y: 26 },
    retrieved: [
      { file: 'provas.md', verdict: 'answers', why: 'Diz o prazo (5 dias úteis), os motivos aceitos e como pedir a substitutiva.' },
      { file: 'notas.md', verdict: 'noise', why: 'Fala de média e exame final, não de substitutiva.' },
      { file: 'faltas.md', verdict: 'noise', why: 'Trata de presença mínima, não de reposição de prova.' },
      { file: 'calendario.md', verdict: 'noise', why: 'Só lista datas e períodos do semestre; não explica a substitutiva.' },
    ],
    answerFile: 'provas.md',
    contextKeep: [1, 2],
    contextWhy: [
      'Pode ficar de fora: descreve as avaliações regulares, não a substitutiva.',
      'Essencial: prazo, motivos aceitos e onde protocolar o pedido.',
      'Essencial: diz que a substitutiva é única e o que ela cobre.',
    ],
    llmOptions: [
      {
        text: 'A prova substitutiva pode ser solicitada em até 10 dias corridos após a avaliação original, por qualquer motivo. Ela substitui a menor nota e cobre apenas o conteúdo da prova perdida.',
        correct: false,
      },
      {
        text: 'A prova substitutiva é aplicada sempre na última semana do semestre, sem necessidade de pedido, e vale para todos os alunos que ficaram abaixo da média, independentemente de terem faltado.',
        correct: false,
      },
      {
        text: 'A prova substitutiva pode ser solicitada em até 5 dias úteis após a avaliação original, se a falta foi justificada (atestado médico, óbito familiar ou convocação legal). Ela é única e cobre todo o conteúdo do semestre até a data de aplicação.',
        correct: true,
      },
    ],
    invented: {
      text: 'O pedido da substitutiva tem uma taxa de R$ 50.',
      why: 'A fonte só pede protocolo na Central de Atendimento; não cita nenhuma taxa.',
    },
  },
];

export function scenarioFor(question: string): Scenario {
  const s = SCENARIOS.find((sc) => sc.question === question);
  if (!s) throw new Error(`Pergunta sem cenário de prática: ${question}`);
  return s;
}

/** Documentos que a LLM realmente precisa (responde + complementa). */
export function keepFiles(s: Scenario): string[] {
  return s.retrieved.filter((r) => r.verdict !== 'noise').map((r) => r.file);
}

// --- Duelo: você x robô de palavras -------------------------------------

export interface DuelRound {
  question: string;
  /** Documento que responde pelo significado. */
  target: string;
  /** Três documentos que parecem plausíveis, mas não respondem. */
  distractors: [string, string, string];
}

export const DUEL_ROUNDS: DuelRound[] = [
  {
    question: 'quero dar uma pausa nos estudos por alguns meses',
    target: 'transferencia.md',
    distractors: ['calendario.md', 'disciplinas.md', 'orientacao.md'],
  },
  {
    question: 'onde posso pegar obras para ler em casa',
    target: 'biblioteca.md',
    distractors: ['laboratorios.md', 'disciplinas.md', 'eventos.md'],
  },
  {
    question: 'qual o mínimo de presença para passar de ano',
    target: 'faltas.md',
    distractors: ['notas.md', 'calendario.md', 'provas.md'],
  },
  {
    question: 'posso trabalhar numa empresa durante a graduação',
    target: 'estagio.md',
    distractors: ['atividades_complementares.md', 'trabalhos.md', 'orientacao.md'],
  },
];
