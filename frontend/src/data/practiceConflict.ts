// Cenário fixo para o "Desafio de confiabilidade" dentro do exercício
// "Seja o reranker" do Modo Prática. Documento fictício (post de fórum)
// misturado com documentos reais da base (data/documents.ts), para forçar
// a decisão: reranking é só sobre similaridade textual, ou também sobre
// confiabilidade da fonte?

export type ConflictSourceType = 'oficial' | 'forum';

export interface ConflictDoc {
  documentId: string;
  filename: string;
  title: string;
  content: string;
  sourceType: ConflictSourceType;
  sourceLabel: string;
  /** Score autorado, representando o que a busca vetorial (Etapa 03)
   * encontraria por similaridade textual pura. */
  vectorScore: number;
  /** Só para orientar o texto de feedback — não é exposto como "gabarito". */
  trustScore: number;
}

export const CONFLICT_QUESTION = 'Posso trancar minha matrícula por motivo de saúde?';

export const CONFLICT_DOCS: ConflictDoc[] = [
  {
    documentId: 'forum-trancamento',
    filename: 'forum-alunos-2019.md',
    title: 'Post no fórum de alunos: "trancamento por saúde, alguém sabe?"',
    sourceType: 'forum',
    sourceLabel: 'Post de fórum de alunos, 2019 · não oficial',
    vectorScore: 0.93,
    trustScore: 0.2,
    content:
      'gente socorro, uma amiga minha trancou a matrícula por motivo de saúde ano passado e falou que dá muito trabalho: tem que ir PESSOALMENTE na secretaria com atestado médico original (cópia não vale), esperar umas 3 semanas pra aprovar o trancamento, e ainda corre risco de perder a vaga se não pedir renovação no semestre seguinte. o processo de trancar por saúde aqui é bem confuso, ninguém explica direito. se alguém souber um jeito mais rápido de trancar a matrícula por motivo de saúde, manda aqui pfvr 🙏',
  },
  {
    // Documento real (data/documents.ts, id 017) — fonte oficial.
    documentId: '017',
    filename: 'transferencia.md',
    title: 'Transferência e trancamento de matrícula',
    sourceType: 'oficial',
    sourceLabel: 'Documento oficial da secretaria acadêmica',
    vectorScore: 0.71,
    trustScore: 0.95,
    content:
      'O trancamento de matrícula pode ser solicitado a qualquer momento do semestre pelo Portal do Aluno, preservando a vaga do estudante por até 4 semestres consecutivos. Transferências externas, tanto de saída quanto de entrada, exigem análise de histórico escolar e aproveitamento de disciplinas cursadas, realizada pela coordenação do curso em até 15 dias úteis após o protocolo do pedido.',
  },
  {
    // Documento real (id 015) — menciona trancamentos, mas de forma genérica.
    documentId: '015',
    filename: 'orientacao.md',
    title: 'Orientação acadêmica',
    sourceType: 'oficial',
    sourceLabel: 'Documento oficial da secretaria acadêmica',
    vectorScore: 0.52,
    trustScore: 0.9,
    content:
      'Cada curso possui um coordenador acadêmico responsável por orientar os alunos sobre grade curricular, aproveitamento de disciplinas, trancamentos e dúvidas gerais sobre o curso. O atendimento é feito mediante agendamento pelo Portal do Aluno, com horários disponíveis semanalmente. Casos de dificuldade de aprendizagem ou adaptação podem ser encaminhados ao Núcleo de Apoio Pedagógico.',
  },
  {
    // Documento real (id 001) — fala de matrícula, mas não de trancamento.
    documentId: '001',
    filename: 'matricula.md',
    title: 'Matrícula',
    sourceType: 'oficial',
    sourceLabel: 'Documento oficial da secretaria acadêmica',
    vectorScore: 0.45,
    trustScore: 0.9,
    content:
      'A matrícula no Horizonte Azul é feita a cada semestre pelo Portal do Aluno, entre os dias 10 e 20 do mês anterior ao início das aulas. Calouros realizam a matrícula presencialmente na Central de Atendimento, mediante apresentação de RG, CPF e histórico escolar. Alunos veteranos renovam automaticamente a matrícula se não houver pendências financeiras ou acadêmicas. Em caso de esquecimento do prazo, é possível solicitar matrícula extemporânea mediante justificativa e pagamento de taxa administrativa.',
  },
  {
    // Documento real (id 003) — irrelevante, preenchimento de baixa similaridade.
    documentId: '003',
    filename: 'biblioteca.md',
    title: 'Biblioteca',
    sourceType: 'oficial',
    sourceLabel: 'Documento oficial da secretaria acadêmica',
    vectorScore: 0.18,
    trustScore: 0.9,
    content:
      'A Biblioteca Central funciona de segunda a sábado, das 7h às 22h, e permite o empréstimo de até 5 livros por até 14 dias, renováveis pelo Portal do Aluno caso não haja reservas pendentes. O acervo digital reúne mais de 40 mil títulos acessíveis remotamente com login institucional. Atrasos na devolução geram bloqueio temporário de novos empréstimos, calculado em um dia de bloqueio para cada dia de atraso.',
  },
];

export function conflictVectorOrder(): ConflictDoc[] {
  return [...CONFLICT_DOCS].sort((a, b) => b.vectorScore - a.vectorScore);
}
