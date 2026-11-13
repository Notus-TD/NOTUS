import { getJson, sendJson } from "@/api/cliente";

export type Bimestre = "PRIMEIRO" | "SEGUNDO" | "TERCEIRO" | "QUARTO";

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

// REFN: buscar notas do aluno
export const getNotasDoAluno = (studentId: number) =>
  getJson<NotaDTO[]>(`/nota/student/${studentId}`);

// REFN: criar nova nota
export const createNota = (dto: NotaRequest) => sendJson<NotaDTO>("POST", "/nota", dto);

// REFN: atualizar nota
export const updateNota = (id: number, dto: NotaRequest) =>
  sendJson<NotaDTO>("PUT", `/nota/${id}`, dto);

// REFN: deletar nota
export const deleteNota = (id: number) => sendJson<void>("DELETE", `/nota/${id}`);
