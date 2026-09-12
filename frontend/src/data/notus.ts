export type Situacao = "atrasada" | "hoje" | "proxima" | "entregue";

export const aluno = {
  nome: "Beatriz Camargo",
  turma: "7º ano B",
  escola: "Colégio Notus",
  responsavel: "Sr. Antônio Camargo",
};

export const atividades: {
  titulo: string;
  disciplina: string;
  prazo: string;
  situacao: Situacao;
  descricao: string;
}[] = [
  {
    titulo: "Lista de frações e porcentagem",
    disciplina: "Matemática",
    prazo: "Entregar hoje, até 23h59",
    situacao: "hoje",
    descricao: "Exercícios 1 a 12 do capítulo 4. Envie pelo portal ou entregue impresso.",
  },
  {
    titulo: "Resumo do livro 'O Menino do Dedo Verde'",
    disciplina: "Português",
    prazo: "Prazo venceu ontem",
    situacao: "atrasada",
    descricao: "Uma página escrita à mão. Fale com a professora Helena para reenviar.",
  },
  {
    titulo: "Maquete do sistema solar",
    disciplina: "Ciências",
    prazo: "Entregar em 4 dias",
    situacao: "proxima",
    descricao: "Trabalho em grupo de até 4 pessoas. Traga o material na quinta-feira.",
  },
  {
    titulo: "Mapa das regiões do Brasil",
    disciplina: "Geografia",
    prazo: "Entregue no dia 8",
    situacao: "entregue",
    descricao: "Recebido pela professora. Aguardando correção.",
  },
];

export const notasRecentes = [
  { disciplina: "Matemática", avaliacao: "Prova bimestral", nota: 8.5 },
  { disciplina: "Português", avaliacao: "Produção de texto", nota: 9.0 },
  { disciplina: "Ciências", avaliacao: "Trabalho em grupo", nota: 7.0 },
  { disciplina: "História", avaliacao: "Seminário", nota: 6.0 },
];

export const horarios = {
  dias: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
  aulas: [
    { hora: "07h30", grade: ["Matemática", "Português", "Ciências", "Matemática", "Ed. Física"] },
    { hora: "08h20", grade: ["Matemática", "Português", "Ciências", "História", "Ed. Física"] },
    { hora: "09h30", grade: ["Geografia", "Inglês", "Artes", "Português", "Matemática"] },
    { hora: "10h20", grade: ["História", "Inglês", "Artes", "Geografia", "Português"] },
    { hora: "11h10", grade: ["Ciências", "Matemática", "História", "Inglês", "Projeto de vida"] },
  ],
};

export const presenca = [
  { disciplina: "Matemática", aulas: 40, faltas: 2 },
  { disciplina: "Português", aulas: 40, faltas: 0 },
  { disciplina: "Ciências", aulas: 32, faltas: 5 },
  { disciplina: "História", aulas: 24, faltas: 1 },
  { disciplina: "Geografia", aulas: 24, faltas: 3 },
  { disciplina: "Inglês", aulas: 24, faltas: 0 },
];

export const avisos = [
  {
    titulo: "Reunião de pais e mestres",
    data: "Sábado, 19 de setembro, às 9h",
    origem: "Coordenação pedagógica",
    texto:
      "A reunião do 7º ano acontece no auditório. Entrega dos boletins do 3º bimestre e conversa com os professores.",
    naoLido: true,
  },
  {
    titulo: "Excursão ao Museu da Ciência",
    data: "Autorização até 16 de setembro",
    origem: "Secretaria",
    texto: "A autorização assinada deve ser entregue na secretaria. Valor já incluso na mensalidade.",
    naoLido: true,
  },
  {
    titulo: "Faltas em Ciências",
    data: "Registrado em 10 de setembro",
    origem: "Professor Rafael",
    texto: "Beatriz acumulou 5 faltas em Ciências. Pedimos atenção para a frequência nas próximas semanas.",
    naoLido: false,
  },
  {
    titulo: "Campanha do agasalho",
    data: "Durante todo o mês",
    origem: "Grêmio estudantil",
    texto: "Roupas em bom estado podem ser entregues na portaria, das 7h às 18h.",
    naoLido: false,
  },
];

export const boletim = [
  { disciplina: "Matemática", b1: 7.5, b2: 8.0, b3: 8.5 },
  { disciplina: "Português", b1: 9.0, b2: 8.5, b3: 9.0 },
  { disciplina: "Ciências", b1: 6.0, b2: 5.5, b3: 7.0 },
  { disciplina: "História", b1: 6.5, b2: 6.0, b3: 6.0 },
  { disciplina: "Geografia", b1: 8.0, b2: 7.5, b3: 8.0 },
  { disciplina: "Inglês", b1: 9.5, b2: 9.0, b3: 9.5 },
];

export const conversas = [
  {
    de: "Coordenação pedagógica",
    quando: "Ontem, 14h20",
    texto:
      "Boa tarde, Sr. Antônio. Confirmando a presença na reunião de sábado. Podemos conversar sobre o desempenho em Ciências.",
    meu: false,
  },
  {
    de: "Você",
    quando: "Ontem, 18h05",
    texto: "Boa tarde. Estarei presente, sim. Obrigado pelo aviso.",
    meu: true,
  },
  {
    de: "Professora Helena (Português)",
    quando: "Hoje, 09h10",
    texto: "Bom dia! A Beatriz evoluiu muito na produção de texto. Parabéns pelo acompanhamento em casa.",
    meu: false,
  },
];

export const turmas = ["7º ano B", "8º ano A", "9º ano C"];

export const alunosPorTurma: Record<string, string[]> = {
  "7º ano B": [
    "Ana Clara Souza",
    "Beatriz Camargo",
    "Caio Ferreira",
    "Davi Nogueira",
    "Elisa Martins",
    "Felipe Andrade",
    "Gabriela Pinto",
    "Heitor Ramos",
  ],
  "8º ano A": [
    "Isabela Cardoso",
    "João Vitor Lima",
    "Larissa Duarte",
    "Marcelo Teixeira",
    "Natália Braga",
    "Otávio Mendes",
  ],
  "9º ano C": [
    "Paula Vasconcelos",
    "Rafael Coutinho",
    "Sofia Almeida",
    "Thiago Barbosa",
    "Vitória Nunes",
  ],
};

export const recadosPublicados = [
  {
    titulo: "Prova de Matemática",
    turma: "7º ano B",
    quando: "Publicado em 10 de setembro",
    texto: "A prova do 3º bimestre será na próxima terça-feira. Conteúdo: frações, porcentagem e razão.",
  },
  {
    titulo: "Traga material de desenho",
    turma: "8º ano A",
    quando: "Publicado em 9 de setembro",
    texto: "Régua, compasso e lápis de cor para a aula de geometria.",
  },
];

export function media(n: number[]) {
  return n.reduce((a, b) => a + b, 0) / n.length;
}
