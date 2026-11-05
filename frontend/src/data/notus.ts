export const aluno = {
  nome: "Beatriz Camargo",
  turma: "7º ano B",
  escola: "Colégio Notus",
  responsavel: "Sr. Antônio Camargo",
};

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

export const boletim = [
  { disciplina: "Matemática", b1: 7.5, b2: 8.0, b3: 8.5 },
  { disciplina: "Português", b1: 9.0, b2: 8.5, b3: 9.0 },
  { disciplina: "Ciências", b1: 6.0, b2: 5.5, b3: 7.0 },
  { disciplina: "História", b1: 6.5, b2: 6.0, b3: 6.0 },
  { disciplina: "Geografia", b1: 8.0, b2: 7.5, b3: 8.0 },
  { disciplina: "Inglês", b1: 9.5, b2: 9.0, b3: 9.5 },
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

export function media(n: number[]) {
  return n.reduce((a, b) => a + b, 0) / n.length;
}
