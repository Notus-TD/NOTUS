import { type LecionamentoDTO } from "@/api/turmas";

export const nomeProfessor = (l: LecionamentoDTO) => l.professorName ?? l.professorEmail;

export const MAX_PROFESSORES_POR_DISCIPLINA = 2;

export function agruparPorProfessor(
  lecionamentos: LecionamentoDTO[],
): { professorId: number; nome: string; disciplinas: string[] }[] {
  const grupos = new Map<number, { professorId: number; nome: string; disciplinas: string[] }>();
  for (const l of lecionamentos) {
    const grupo = grupos.get(l.professorId);
    if (grupo) grupo.disciplinas.push(l.disciplinaTitle);
    else
      grupos.set(l.professorId, {
        professorId: l.professorId,
        nome: nomeProfessor(l),
        disciplinas: [l.disciplinaTitle],
      });
  }
  return [...grupos.values()]
    .map((g) => ({
      ...g,
      disciplinas: [...g.disciplinas].sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
