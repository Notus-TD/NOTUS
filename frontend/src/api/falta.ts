import { API_URL, ApiError, getJson, sendJson } from "@/api/cliente";
import { getToken } from "@/lib/sessao";

export type FaltaDTO = {
  id: number;
  data: string;
  quantidade: number;
  registradoEm: string;
  studentId: number;
  disciplinaId: number;
  registradoPorId: number;
};

export async function getFaltas(): Promise<FaltaDTO[]> {
  const token = getToken();
  if (!token) throw new ApiError(401, "É preciso fazer login antes de buscar as faltas.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}/falta`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, "Sem permissão para ver as faltas.");
  if (!res.ok) throw new ApiError(res.status, `Falha ao buscar faltas: ${res.status}`);
  return res.json();
}

export type ChamadaAlunoDTO = {
  studentId: number;
  studentName: string;
  matricula: number;
  faltasNoDia: number;
  totalFaltas: number;
};

export type ChamadaDTO = {
  turmaId: number;
  disciplinaId: number;
  data: string;
  aulas: number | null;
  alunos: ChamadaAlunoDTO[];
  bloqueio: string | null;
};

export type ChamadaRequest = {
  turmaId: number;
  disciplinaId: number;
  data: string;
  aulas: number;
  faltas: { studentId: number; faltas: number }[];
};

export async function deleteFalta(id: number): Promise<void> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/falta/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (!res.ok) throw new ApiError(res.status, `Falha ao excluir a falta: ${res.status}`);
}

export type FrequenciaDTO = {
  studentId: number;
  studentName: string;
  disciplinaId: number;
  disciplinaTitle: string;
  totalAulas: number;
  totalFaltas: number;
  percentualPresenca: number;
};

export const getMinhasFaltas = () => getJson<FaltaDTO[]>("/falta/me");

export const getMinhaFrequencia = () => getJson<FrequenciaDTO[]>("/falta/me/frequencia");

export const getFaltasByStudent = (studentId: number) =>
  getJson<FaltaDTO[]>(`/falta/student/${studentId}`);

export const getChamada = (turmaId: number, disciplinaId: number, data: string) =>
  getJson<ChamadaDTO>(
    `/falta/chamada?turmaId=${turmaId}&disciplinaId=${disciplinaId}&data=${data}`,
  );

export const salvarChamada = (dto: ChamadaRequest) =>
  sendJson<ChamadaDTO>("PUT", "/falta/chamada", dto);
