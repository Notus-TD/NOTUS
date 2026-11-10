import { StatusMatricula, StudentMinDTO } from "@/api/alunos";
import { getJson, sendJson } from "@/api/cliente";

export type PerfilUsuario = "ALUNO" | "RESPONSAVEL";

export type UsuarioDTO = {
  id: number;
  perfil: PerfilUsuario;
  nome: string | null;
  matricula: number | null;
  anonimizado: boolean;
  acessoPendente: boolean;
  matriculaStatus: StatusMatricula | null;
};

export const getUsuarios = () => getJson<UsuarioDTO[]>("/users");

export const redefinirMfa = (userId: number) =>
  sendJson<void>("PUT", `/users/${userId}/mfa/redefinir`);

export const reenviarConvite = (userId: number) =>
  sendJson<void>("POST", `/users/${userId}/reenviar-convite`);

export const cancelarMatricula = (userId: number, motivo: string) =>
  sendJson<StudentMinDTO>("PUT", `/students/${userId}/matricula/cancelar`, { motivo });

export const reativarMatricula = (userId: number) =>
  sendJson<StudentMinDTO>("PUT", `/students/${userId}/matricula/reativar`);
