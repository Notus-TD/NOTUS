import type { StatusMatricula } from "@/api/alunos";
import { getJson, sendJson } from "@/api/cliente";

export type MotivoAnonimizacao =
  "PEDIDO_DO_TITULAR" | "FIM_DO_PRAZO_DE_GUARDA" | "DETERMINACAO_LEGAL" | "OUTRO";

export type RegistroAnonimizacaoDTO = {
  id: number;
  usuarioId: number;
  perfil: "ALUNO" | "RESPONSAVEL";
  matricula: number | null;
  motivo: MotivoAnonimizacao;
  motivoDescricao: string;
  detalhe: string | null;
  executadoPor: string;
  executadoEm: string;
};

export type FilhoResumoDTO = {
  id: number;
  nome: string | null;
  matricula: number;
  matriculaStatus: StatusMatricula;
  anonimizado: boolean;
};

export type ResumoAnonimizacaoDTO = {
  id: number;
  perfil: "ALUNO" | "RESPONSAVEL";
  nome: string | null;
  email: string | null;
  matricula: number | null;
  matriculaStatus: StatusMatricula | null;
  turmaName: string | null;
  responsavelNome: string | null;
  acessoLiberado: boolean;
  motivoCancelamento: string | null;
  matriculaCanceladaEm: string | null;
  filhos: FilhoResumoDTO[];
  notasDeBimestre: number;
  faltas: number;
  entregas: number;
  avisos: number;
  anonimizadoEm: string | null;
  registro: RegistroAnonimizacaoDTO | null;
  bloqueio: string | null;
};

export type AnonimizarRequest = {
  confirmacao: string;
  motivo: MotivoAnonimizacao;
  detalhe: string | null;
};

export const getResumoAnonimizacao = (userId: number) =>
  getJson<ResumoAnonimizacaoDTO>(`/privacidade/usuarios/${userId}/resumo`);
export const anonimizarUsuario = (userId: number, dto: AnonimizarRequest) =>
  sendJson<RegistroAnonimizacaoDTO>("PUT", `/privacidade/usuarios/${userId}/anonimizar`, dto);
export const getHistoricoAnonimizacoes = () =>
  getJson<RegistroAnonimizacaoDTO[]>("/privacidade/anonimizacoes");

// Cópia dos dados pessoais de um aluno ou responsável (LGPD, art. 18), gerada pelo admin a pedido do titular.
export const getDadosDoUsuario = (userId: number) =>
  getJson<unknown>(`/privacidade/usuarios/${userId}/dados`);
