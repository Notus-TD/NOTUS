import { Bimestre } from "@/api/boletim";
import { getJson, sendJson } from "@/api/cliente";

export type AtividadeDTO = {
  id: number;
  title: string;
  content: string;
  bimestre: Bimestre;
  prazo: string;
  turmaId: number;
  disciplinaId: number;
  turmaName: string;
  disciplinaTitle: string;
  publicadaEm: string;
  entregue: boolean | null;
  pontos: number | null;
};

export type NovaAtividade = {
  title: string;
  content: string;
  bimestre: Bimestre;
  prazo: string;
  turmaId: number;
  disciplinaId?: number;
  pontos?: number | null;
};

export type StatusEntrega = "ENTREGUE" | "ATRASADA" | "NAO_ENTREGUE";

export type EntregaDTO = {
  id: number;
  status: StatusEntrega;
  atividadeId: number;
  atividadeTitle: string;
  disciplinaId: number;
  bimestre: Bimestre;
  studentId: number;
  pontos: number | null;
  pontosObtidos: number | null;
};

export type EntregaRequest = {
  atividadeId: number;
  studentId: number;
  status: StatusEntrega;
  pontosObtidos?: number | null;
};

export const getAtividades = () => getJson<AtividadeDTO[]>("/atividade");

export const getAtividadesDaTurma = (turmaId: number) =>
  getJson<AtividadeDTO[]>(`/atividade/turma/${turmaId}`);

export const getMinhasAtividades = () => getJson<AtividadeDTO[]>("/atividade/me");

export const publicarAtividade = (dto: NovaAtividade) =>
  sendJson<AtividadeDTO>("POST", "/atividade", dto);

export const deleteAtividade = (id: number) => sendJson<void>("DELETE", `/atividade/${id}`);

export const atualizarAtividade = (id: number, dto: NovaAtividade) =>
  sendJson<AtividadeDTO>("PUT", `/atividade/${id}`, dto);

export const getEntregasDaAtividade = (atividadeId: number) =>
  getJson<EntregaDTO[]>(`/entrega/atividade/${atividadeId}`);

export const getEntregasDoAluno = (studentId: number) =>
  getJson<EntregaDTO[]>(`/entrega/student/${studentId}`);

export const marcarEntrega = (dto: EntregaRequest) => sendJson<EntregaDTO>("PUT", "/entrega", dto);

export const getAtividadesDoAluno = (studentId: number) =>
  getJson<AtividadeDTO[]>(`/atividade/student/${studentId}`);
