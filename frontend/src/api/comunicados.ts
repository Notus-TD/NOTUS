import { getJson, sendJson } from "@/api/cliente";

export type PublicoComunicado = "TODOS" | "ALUNOS" | "RESPONSAVEIS" | "PROFESSORES";

export type ComunicadoDTO = {
  id: number;
  titulo: string;
  texto: string;
  publico: PublicoComunicado;
  enviadoEm: string;
  autorEmail: string;
};

export type ComunicadoRequest = { titulo: string; texto: string; publico: PublicoComunicado };

export type RecadoProfessorRequest = { titulo: string; texto: string; turmaId: number };

export const getComunicados = () => getJson<ComunicadoDTO[]>("/comunicado");

export const getComunicadosParaMim = () => getJson<ComunicadoDTO[]>("/comunicado/me");

export const publicarComunicado = (dto: ComunicadoRequest) =>
  sendJson<ComunicadoDTO>("POST", "/comunicado", dto);

export const publicarRecado = (dto: RecadoProfessorRequest) =>
  sendJson<ComunicadoDTO>("POST", "/comunicado/recado", dto);
