import { getJson, sendJson } from "@/api/cliente";

export type ProfessorDTO = { id: number; fullName: string; email: string; acessoPendente: boolean };

export type ProfessorRequest = { fullName: string; email: string };

export const getProfessores = () => getJson<ProfessorDTO[]>("/professores");

export const cadastrarProfessor = (dto: ProfessorRequest) =>
  sendJson<ProfessorDTO>("POST", "/professores", dto);
