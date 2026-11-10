import type { StatusMatricula } from "@/api/alunos";
import { getJson, sendJson } from "@/api/cliente";

export type TipoSolicitacao = "ANONIMIZACAO" | "CORRECAO";

export type StatusSolicitacao = "ABERTA" | "ATENDIDA" | "RECUSADA";

export type SolicitacaoDTO = {
  id: number;
  tipo: TipoSolicitacao;
  status: StatusSolicitacao;
  solicitanteId: number;
  solicitanteNome: string;
  alunoId: number | null;
  alunoNome: string | null;
  detalhe: string | null;
  solicitadaEm: string;
  prazoEm: string;
  atrasada: boolean;
  respondidaEm: string | null;
  resposta: string | null;
};

export type SolicitacaoRequest = {
  tipo: TipoSolicitacao;
  alunoId: number | null;
  detalhe: string | null;
};

export const getMeusDados = () => getJson<unknown>("/privacidade/meus-dados");

export const solicitarPedidoTitular = (dto: SolicitacaoRequest) =>
  sendJson<SolicitacaoDTO>("POST", "/privacidade/solicitacoes", dto);

export const getMinhasSolicitacoes = () =>
  getJson<SolicitacaoDTO[]>("/privacidade/solicitacoes/me");

export const getSolicitacoes = () => getJson<SolicitacaoDTO[]>("/privacidade/solicitacoes");

export const responderSolicitacao = (
  id: number,
  dto: { status: Exclude<StatusSolicitacao, "ABERTA">; resposta: string | null },
) => sendJson<SolicitacaoDTO>("PUT", `/privacidade/solicitacoes/${id}/responder`, dto);

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
  solicitacaoId: number | null;
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
  pedidosAbertos: SolicitacaoDTO[];
  anonimizadoEm: string | null;
  registro: RegistroAnonimizacaoDTO | null;
  bloqueio: string | null;
};

export type AnonimizarRequest = {
  confirmacao: string;
  motivo: MotivoAnonimizacao;
  detalhe: string | null;
  solicitacaoId: number | null;
};

export const getResumoAnonimizacao = (userId: number) =>
  getJson<ResumoAnonimizacaoDTO>(`/privacidade/usuarios/${userId}/resumo`);
export const anonimizarUsuario = (userId: number, dto: AnonimizarRequest) =>
  sendJson<RegistroAnonimizacaoDTO>("PUT", `/privacidade/usuarios/${userId}/anonimizar`, dto);
export const getHistoricoAnonimizacoes = () =>
  getJson<RegistroAnonimizacaoDTO[]>("/privacidade/anonimizacoes");
