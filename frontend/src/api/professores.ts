import { getJson, sendJson } from "@/api/cliente";

export type ProfessorDTO = {
  id: number;
  fullName: string;
  email: string;
  acessoPendente: boolean;
  desligado: boolean;
};

export type ProfessorRequest = { fullName: string; email: string };

export const getProfessores = () => getJson<ProfessorDTO[]>("/professores");

export const cadastrarProfessor = (dto: ProfessorRequest) =>
  sendJson<ProfessorDTO>("POST", "/professores", dto);

// Bloqueia o acesso, remove os vínculos com turmas e zera o MFA. Os registros que ele lançou continuam no histórico.
export const desligarProfessor = (id: number) =>
  sendJson<ProfessorDTO>("PUT", `/professores/${id}/desligar`);
