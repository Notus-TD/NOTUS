import { getJson, sendJson } from "@/api/cliente";

export type Bimestre = "PRIMEIRO" | "SEGUNDO" | "TERCEIRO" | "QUARTO";

export type BoletimDTO = {
  id: number | null;
  studentId: number;
  disciplinaId: number;
  disciplinaTitle: string;
  bimestre: Bimestre;
  mediaCalculada: number | null;
  notaFinal: number | null;
  nota: number | null;
  lancadoEm: string | null;
  pontosAtividades: number | null;
};

export type BoletimDisciplinaDTO = {
  disciplinaId: number;
  disciplinaTitle: string;
  bimestres: BoletimDTO[];
  mediaFinal: number | null;
};

export type NotaFinalRequest = {
  studentId: number;
  disciplinaId: number;
  bimestre: Bimestre;
  notaFinal: number;
};

export type NotaDTO = {
  id: number;
  descricao: string;
  rate: number;
  bimestre: Bimestre;
  studentId: number;
  disciplinaId: number;
  disciplinaTitle: string;
};

export type NotaRequest = Omit<NotaDTO, "id" | "disciplinaTitle">;

export const getBoletimDoAluno = (studentId: number) =>
  getJson<BoletimDisciplinaDTO[]>(`/boletim/student/${studentId}`);

export const lancarNotaFinal = (dto: NotaFinalRequest) =>
  sendJson<BoletimDTO>("PUT", "/boletim/nota-final", dto);

export const removerNotaFinal = (id: number) => sendJson<void>("DELETE", `/boletim/${id}`);

export const getNotasDoAluno = (studentId: number) =>
  getJson<NotaDTO[]>(`/nota/student/${studentId}`);

export const createNota = (dto: NotaRequest) => sendJson<NotaDTO>("POST", "/nota", dto);

export const updateNota = (id: number, dto: NotaRequest) =>
  sendJson<NotaDTO>("PUT", `/nota/${id}`, dto);

export const deleteNota = (id: number) => sendJson<void>("DELETE", `/nota/${id}`);
