import type { KnowledgeDocument } from '../types/rag';

// Base de conhecimento fictícia de uma universidade inventada.
// Nenhuma informação aqui corresponde a uma instituição real.
export const UNIVERSITY_NAME = 'Centro Universitário Horizonte Azul';

export const documents: KnowledgeDocument[] = [
  {
    id: '001',
    filename: 'matricula.md',
    title: 'Matrícula',
    category: 'acadêmico',
    tags: ['matrícula', 'renovação', 'calouros'],
    content:
      'A matrícula no Horizonte Azul é feita a cada semestre pelo Portal do Aluno, entre os dias 10 e 20 do mês anterior ao início das aulas. Calouros realizam a matrícula presencialmente na Central de Atendimento, mediante apresentação de RG, CPF e histórico escolar do ensino médio ou de instituição anterior. Alunos veteranos renovam automaticamente a matrícula se não houver pendências financeiras ou acadêmicas registradas até o dia 5 do mês da matrícula. Veteranos com pendência financeira podem regularizar o débito até o último dia do prazo de matrícula sem perder a renovação automática, desde que quitado em parcela única. Em caso de esquecimento do prazo, é possível solicitar matrícula extemporânea mediante justificativa e pagamento de taxa administrativa, em até 10 dias corridos após o encerramento do prazo regular. Alunos com pendência acadêmica, como disciplinas em dependência, devem procurar a coordenação antes da matrícula para ajuste do plano de estudos do semestre.',
  },
  {
    id: '002',
    filename: 'tcc.md',
    title: 'Trabalho de Conclusão de Curso (TCC)',
    category: 'acadêmico',
    tags: ['tcc', 'monografia', 'orientador'],
    content:
      'O Trabalho de Conclusão de Curso deve ser iniciado mediante a definição de um orientador e a aprovação do tema junto à coordenação do curso, no início do penúltimo semestre. O aluno deve entregar um pré-projeto até a sexta semana letiva, participar de duas bancas de acompanhamento (qualificação e defesa final) e formatar o documento de acordo com as normas da ABNT disponíveis no Portal Acadêmico. A escolha do orientador deve respeitar a área de pesquisa do docente, listada no catálogo de linhas de pesquisa, e só pode ser trocada uma vez, mediante justificativa por escrito às duas partes. Quem perder o prazo do pré-projeto pode pedir uma única prorrogação de até duas semanas à coordenação, mas fica de fora da janela de qualificação antecipada do calendário regular. A nota mínima para aprovação na defesa final é 6,0, calculada pela média dos dois membros da banca examinadora, sem contar o voto do orientador. Trabalhos reprovados na defesa podem ser reapresentados uma única vez, no semestre seguinte, sem repetir a etapa de qualificação.',
  },
  {
    id: '003',
    filename: 'biblioteca.md',
    title: 'Biblioteca',
    category: 'infraestrutura',
    tags: ['biblioteca', 'empréstimo', 'acervo'],
    content:
      'A Biblioteca Central funciona de segunda a sábado, das 7h às 22h, e permite o empréstimo de até 5 livros por até 14 dias, renováveis pelo Portal do Aluno caso não haja reservas pendentes. O acervo digital reúne mais de 40 mil títulos acessíveis remotamente com login institucional, sem limite de empréstimos simultâneos para esse formato. Atrasos na devolução geram bloqueio temporário de novos empréstimos, calculado em um dia de bloqueio para cada dia de atraso, por livro. Livros com reserva feita por outro aluno não podem ser renovados e devem ser devolvidos na data original, mesmo sem uso do limite de 14 dias. Alunos de pós-graduação e docentes têm limite estendido de 10 livros por até 21 dias, mediante cadastro específico junto ao balcão de atendimento. Materiais de acervo raro ou de referência, como dicionários, enciclopédias e normas técnicas, são de consulta local e não podem ser retirados em nenhuma hipótese.',
  },
  {
    id: '004',
    filename: 'provas.md',
    title: 'Provas e avaliações',
    category: 'acadêmico',
    tags: ['provas', 'avaliação', 'substitutiva'],
    content:
      'Cada disciplina possui ao menos duas avaliações regulares por semestre, cujas datas são divulgadas no plano de ensino nas primeiras duas semanas de aula. O aluno que faltar a uma avaliação por motivo justificado (atestado médico, óbito familiar ou convocação legal) pode solicitar prova substitutiva em até 5 dias úteis após a data original, mediante protocolo na Central de Atendimento. A prova substitutiva é única e abrange todo o conteúdo do semestre até a data da aplicação, podendo ser mais abrangente do que a avaliação original perdida. Faltas por motivos não previstos na lista oficial, como viagem, problemas de transporte ou compromissos pessoais, não dão direito à substitutiva, apenas a eventual abono de frequência quando aplicável. Caso o aluno perca mais de uma avaliação no mesmo semestre por motivos justificados, a mesma prova substitutiva cobre todas as datas perdidas, sem necessidade de solicitações separadas. O resultado da substitutiva substitui diretamente a nota da avaliação original perdida, sem possibilidade de manter a menor das duas notas.',
  },
  {
    id: '005',
    filename: 'faltas.md',
    title: 'Frequência e faltas',
    category: 'acadêmico',
    tags: ['faltas', 'frequência', 'reprovação'],
    content:
      'A frequência mínima exigida para aprovação em qualquer disciplina do Horizonte Azul é de 75% das aulas ministradas no semestre. Isso significa que, em uma disciplina com carga horária de 80 horas, o aluno pode ter no máximo 20 horas de faltas, justificadas ou não. Faltas em dias de avaliação podem ser abonadas mediante atestado médico entregue em até 5 dias úteis, mas mesmo abonadas elas continuam contando para o limite de frequência. Disciplinas com carga horária diferente de 80 horas seguem a mesma proporção de 25% de faltas permitidas, arredondada para baixo em número de horas. Alunos que ultrapassarem o limite são automaticamente reprovados por frequência, independentemente das notas obtidas, e devem cursar a disciplina novamente em oferta futura. Não há possibilidade de compensar faltas excedentes com trabalhos extras ou frequência superior em outra disciplina do mesmo semestre.',
  },
  {
    id: '006',
    filename: 'estagio.md',
    title: 'Estágio obrigatório',
    category: 'estágio',
    tags: ['estágio', 'estágio obrigatório', 'convênio'],
    content:
      'O estágio obrigatório pode ser iniciado a partir do 5º período, em empresas conveniadas ou mediante convênio individual firmado com o setor de Relações Empresariais. É necessário indicar um professor orientador de estágio, entregar relatórios parciais bimestrais e um relatório final ao término da carga horária mínima exigida pela matriz curricular do curso. O contrato de estágio deve ser assinado antes do início das atividades, sob pena de as horas não serem validadas retroativamente. Estágios não obrigatórios, embora não contem para a carga horária mínima, seguem as mesmas regras de contrato e orientação e podem ser convertidos em horas de atividades complementares, até o limite de 60 horas. Caso o aluno mude de local de estágio, é necessário aviso prévio ao orientador e assinatura de um novo contrato, sem reiniciar a contagem de horas já cumpridas. O não cumprimento do relatório bimestral por dois períodos consecutivos cancela automaticamente o convênio vigente, exigindo nova solicitação.',
  },
  {
    id: '007',
    filename: 'bolsas.md',
    title: 'Bolsas e financiamento estudantil',
    category: 'financeiro',
    tags: ['bolsa', 'financiamento', 'desconto'],
    content:
      'O Horizonte Azul oferece bolsas de mérito acadêmico (para os melhores coeficientes de rendimento de cada curso), bolsas socioeconômicas mediante análise de renda familiar, e bolsas de iniciação científica vinculadas a projetos de pesquisa com professores orientadores. As inscrições para bolsas socioeconômicas abrem no início de cada semestre no setor de Assistência Estudantil, e exigem comprovação de renda per capita de até 1,5 salário mínimo e documentação do grupo familiar. A bolsa de mérito é renovada automaticamente enquanto o aluno mantiver coeficiente de rendimento entre os três melhores do curso, sem necessidade de nova inscrição. Bolsas de iniciação científica dependem de aprovação prévia de um projeto pelo Comitê de Pesquisa e têm duração vinculada ao cronograma do projeto, podendo ser renovadas anualmente. É permitido acumular bolsa socioeconômica com bolsa de iniciação científica, mas não é permitido acumular duas bolsas socioeconômicas de fontes diferentes, institucional e externa. Também há parceria com programas de financiamento estudantil externo, que não são administrados pela Assistência Estudantil e possuem regras e prazos próprios do agente financeiro.',
  },
  {
    id: '008',
    filename: 'notas.md',
    title: 'Notas e médias',
    category: 'acadêmico',
    tags: ['notas', 'média', 'aprovação'],
    content:
      'A aprovação em uma disciplina exige média final igual ou superior a 7,0, calculada pela média aritmética simples das avaliações do semestre. Alunos com média entre 4,0 e 6,9 têm direito a exame final, cuja nota é somada à média parcial em proporção definida no regimento acadêmico. Notas ficam disponíveis no Portal do Aluno em até 5 dias úteis após o lançamento pelo professor, e podem ser contestadas via recurso de revisão em até 3 dias após a divulgação. Alunos reprovados por nota, mas com frequência regular, podem solicitar segunda chamada do exame final em caso de impedimento justificado, seguindo o mesmo prazo de 5 dias úteis usado para revisão de notas.',
  },
  {
    id: '009',
    filename: 'disciplinas.md',
    title: 'Disciplinas e ementas',
    category: 'acadêmico',
    tags: ['disciplinas', 'ementa', 'grade curricular'],
    content:
      'As ementas de todas as disciplinas estão disponíveis no Portal Acadêmico, organizadas por curso e período. Cada ementa descreve objetivos, conteúdo programático, bibliografia básica e complementar. Alunos podem cursar disciplinas eletivas de outros cursos, respeitando o limite de créditos do semestre e a disponibilidade de vagas, mediante inscrição no período de ajuste de matrícula. O período de ajuste, usado para trocar disciplinas eletivas, ocorre na primeira semana letiva e não deve ser confundido com o prazo regular de matrícula do semestre. A bibliografia complementar de cada ementa costuma incluir títulos disponíveis apenas no acervo digital, sem exemplares físicos na Biblioteca Central.',
  },
  {
    id: '010',
    filename: 'calendario.md',
    title: 'Calendário acadêmico',
    category: 'acadêmico',
    tags: ['calendário', 'datas', 'semestre'],
    content:
      'O calendário acadêmico do Horizonte Azul é publicado anualmente e contempla datas de matrícula, início e fim das aulas, períodos de avaliação, feriados institucionais e prazos de solicitações administrativas. O ano letivo é dividido em dois semestres regulares, com possibilidade de módulos de férias no recesso de julho para disciplinas de dependência. As datas de matrícula de calouros e veteranos, incluindo períodos de ajuste e matrícula extemporânea, são publicadas com pelo menos 30 dias de antecedência no site institucional. Períodos de avaliação regular e de provas substitutivas aparecem no calendário apenas como janelas gerais, sem detalhar prazos individuais de solicitação, que ficam a cargo do regimento de cada processo.',
  },
  {
    id: '011',
    filename: 'orientacao.md',
    title: 'Orientação acadêmica',
    category: 'acadêmico',
    tags: ['orientação', 'coordenação', 'atendimento'],
    content:
      'Cada curso possui um coordenador acadêmico responsável por orientar os alunos sobre grade curricular, aproveitamento de disciplinas, trancamentos e dúvidas gerais sobre o curso. O atendimento é feito mediante agendamento pelo Portal do Aluno, com horários disponíveis semanalmente. Casos de dificuldade de aprendizagem ou adaptação podem ser encaminhados ao Núcleo de Apoio Pedagógico.',
  },
  {
    id: '012',
    filename: 'trabalhos.md',
    title: 'Trabalhos acadêmicos e projetos de extensão',
    category: 'acadêmico',
    tags: ['trabalhos', 'projetos', 'extensão'],
    content:
      'Trabalhos acadêmicos em grupo e projetos de extensão fazem parte da matriz curricular de diversos cursos, com o objetivo de aplicar conhecimento teórico em problemas reais da comunidade. Os projetos de extensão são cadastrados junto à Pró-Reitoria de Extensão e podem gerar horas de atividades complementares. A entrega segue normas de formatação semelhantes às do TCC, mas com escopo e prazo reduzidos, definidos pelo professor da disciplina. Alunos podem reaproveitar parte da pesquisa bibliográfica de um projeto de extensão no pré-projeto do TCC, desde que citada a autoria original e ampliada a revisão teórica. A avaliação de trabalhos de extensão, quando houver banca, é definida pelo próprio professor da disciplina e não segue o mesmo rito das bancas de qualificação e defesa do TCC.',
  },
  {
    id: '013',
    filename: 'monitoria.md',
    title: 'Monitoria',
    category: 'acadêmico',
    tags: ['monitoria', 'bolsa monitoria', 'seleção'],
    content:
      'O Programa de Monitoria seleciona alunos com bom desempenho acadêmico para auxiliar professores em disciplinas nas quais já foram aprovados com média igual ou superior a 8,0. A seleção ocorre por edital semestral, com prova escrita e entrevista. Monitores recebem bolsa de auxílio e certificado, além de horas válidas como atividade complementar. O valor da bolsa de monitoria é fixo, definido em edital, e não pode ser acumulado com bolsa de mérito acadêmico, embora possa ser somado à bolsa socioeconômica mediante análise do setor de Assistência Estudantil. Em alguns cursos, a monitoria pode incluir apoio no balcão da Biblioteca Central em horários de pico, mas essa atividade não substitui as funções administrativas dos bibliotecários.',
  },
  {
    id: '014',
    filename: 'eventos.md',
    title: 'Eventos acadêmicos',
    category: 'eventos',
    tags: ['eventos', 'semana acadêmica', 'palestras'],
    content:
      'O Horizonte Azul promove semestralmente a Semana Acadêmica de cada curso, com palestras, minicursos e workshops ministrados por profissionais convidados. A presença em eventos institucionais pode ser convertida em horas de atividades complementares, mediante apresentação de certificado emitido pela organização do evento na Central de Atendimento.',
  },
  {
    id: '015',
    filename: 'atividades_complementares.md',
    title: 'Atividades complementares',
    category: 'acadêmico',
    tags: ['atividades complementares', 'horas', 'certificado'],
    content:
      'Todos os cursos exigem uma carga horária mínima de atividades complementares para a colação de grau, que pode ser cumprida com participação em eventos, monitorias, iniciação científica, cursos de extensão e trabalho voluntário. Os certificados devem ser cadastrados no Portal do Aluno na aba de Atividades Complementares, e são validados pela coordenação do curso ao final de cada semestre. A participação como ouvinte em bancas de qualificação ou defesa de colegas também conta como hora complementar, mediante lista de presença assinada pelo orientador responsável. Estágios que ultrapassarem a carga mínima exigida pelo curso geram horas complementares proporcionais ao excedente, desde que comprovadas junto à coordenação.',
  },
  {
    id: '016',
    filename: 'laboratorios.md',
    title: 'Laboratórios e reserva de equipamentos',
    category: 'infraestrutura',
    tags: ['laboratório', 'reserva', 'equipamentos'],
    content:
      'Os laboratórios de informática, eletrônica e ciências funcionam mediante agendamento prévio pelo Portal do Aluno, com prioridade para aulas regulares. Fora do horário de aula, alunos podem reservar bancadas e equipamentos específicos, como osciloscópios e kits de robótica, por até 3 horas diárias, respeitando a disponibilidade e as normas de uso do laboratório. A reserva de equipamentos segue lista de espera única para todos os laboratórios, gerenciada pelo mesmo sistema usado para reserva de salas de estudo da Biblioteca Central. Alunos de iniciação científica têm prioridade de uso fora do horário de aula, mediante comprovação do vínculo com um projeto de pesquisa ativo.',
  },
  {
    id: '017',
    filename: 'transferencia.md',
    title: 'Transferência e trancamento de matrícula',
    category: 'acadêmico',
    tags: ['transferência', 'trancamento', 'cancelamento'],
    content:
      'O trancamento de matrícula pode ser solicitado a qualquer momento do semestre pelo Portal do Aluno, preservando a vaga do estudante por até 4 semestres consecutivos. Transferências externas, tanto de saída quanto de entrada, exigem análise de histórico escolar e aproveitamento de disciplinas cursadas, realizada pela coordenação do curso em até 15 dias úteis após o protocolo do pedido. O pedido de trancamento não exige justificativa formal, mas impede a participação em atividades acadêmicas do curso, incluindo provas, durante o período de afastamento. Alunos que não solicitarem a renovação da matrícula até o prazo do semestre seguinte ao trancamento perdem automaticamente a vaga reservada, sendo necessário novo processo seletivo para retornar ao curso.',
  },
  {
    id: '018',
    filename: 'ouvidoria.md',
    title: 'Ouvidoria e suporte ao estudante',
    category: 'suporte',
    tags: ['ouvidoria', 'suporte', 'reclamação'],
    content:
      'A Ouvidoria do Horizonte Azul recebe sugestões, dúvidas e reclamações de alunos, docentes e comunidade externa por meio de formulário no site institucional, com resposta em até 10 dias úteis. Questões urgentes relacionadas a bem-estar do estudante são encaminhadas prioritariamente ao Núcleo de Apoio Psicopedagógico, que oferece acolhimento e orientação confidencial.',
  },
];

export function getDocumentByFilename(filename: string): KnowledgeDocument | undefined {
  return documents.find((d) => d.filename === filename);
}
