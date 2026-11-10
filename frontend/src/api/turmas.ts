import { StudentMinDTO } from "@/api/alunos";
import { getJson, sendJson } from "@/api/cliente";

export type TurmaDTO = {
  id: number;
  name: string;
  schoolYear: string;
  totalAlunos: number;
};

export type TurmaRequestDTO = { name: string; schoolYear: string };

export type LecionamentoDTO = {
  id: number;
  turmaId: number;
  turmaName: string;
  disciplinaId: number;
  disciplinaTitle: string;
  professorId: number;
  professorName: string | null;
  professorEmail: string;
};

export type LecionamentoRequestDTO = { turmaId: number; disciplinaId: number; professorId: number };

export type TurmaDetalheDTO = {
  id: number;
  name: string;
  schoolYear: string;
  alunos: StudentMinDTO[];
  lecionamentos: LecionamentoDTO[];
};

export const getTurmas = () => getJson<TurmaDTO[]>("/turma");

export const getTurma = (turmaId: number) => getJson<TurmaDetalheDTO>(`/turma/${turmaId}`);

export const createTurma = (dto: TurmaRequestDTO) => sendJson<TurmaDTO>("POST", "/turma", dto);

export const updateTurma = (turmaId: number, dto: TurmaRequestDTO) =>
  sendJson<TurmaDTO>("PUT", `/turma/${turmaId}`, dto);

export const deleteTurma = (turmaId: number) => sendJson<void>("DELETE", `/turma/${turmaId}`);

export const getLecionamentos = () => getJson<LecionamentoDTO[]>("/lecionamento");

export const createLecionamento = (dto: LecionamentoRequestDTO) =>
  sendJson<LecionamentoDTO>("POST", "/lecionamento", dto);

export const deleteLecionamento = (id: number) => sendJson<void>("DELETE", `/lecionamento/${id}`);

export type TurmaAlunoResponseDTO = {
  turmaId: number;
  turmaName: string;
  studentId: number;
  studentName: string;
  matricula: number;
};

export const associarAlunoTurma = (turmaId: number, studentId: number) =>
  sendJson<TurmaAlunoResponseDTO>("POST", `/turma/${turmaId}/alunos`, { studentId });

export const associarAlunosTurmaLote = (turmaId: number, studentIds: number[]) =>
  sendJson<TurmaAlunoResponseDTO[]>("POST", `/turma/${turmaId}/alunos/lote`, { studentIds });

export const removerAlunoTurma = (turmaId: number, studentId: number) =>
  sendJson<void>("DELETE", `/turma/${turmaId}/alunos/${studentId}`);

export type TurmaComDisciplinasDTO = {
  turmaId: number;
  turmaName: string;
  schoolYear: string;
  disciplinas: { id: number; title: string }[];
};

export const getMinhasTurmas = () => getJson<TurmaComDisciplinasDTO[]>("/turma/me");
