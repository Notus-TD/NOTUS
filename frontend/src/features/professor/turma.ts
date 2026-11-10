import { getStudentsByTurma } from "@/api/alunos";

export type DisciplinaRef = { id: number; title: string };

export async function alunosAtivosDaTurma(turmaId: number) {
  const alunos = await getStudentsByTurma(turmaId, "nome");
  return alunos
    .filter((a) => a.matriculaStatus === "ATIVA")
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR"));
}
