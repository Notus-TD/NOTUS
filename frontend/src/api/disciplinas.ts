import { getJson, sendJson } from "@/api/cliente";

export type DisciplinaDTO = { id: number; title: string; description?: string };

export const getDisciplinas = () => getJson<DisciplinaDTO[]>("/disciplina");

export const criarDisciplina = (dto: { title: string; description: string }) =>
  sendJson<DisciplinaDTO>("POST", "/disciplina", dto);

export const atualizarDisciplina = (id: number, dto: { title: string; description: string }) =>
  sendJson<DisciplinaDTO>("PUT", `/disciplina/${id}`, dto);

export const deletarDisciplina = (id: number) => sendJson<void>("DELETE", `/disciplina/${id}`);
