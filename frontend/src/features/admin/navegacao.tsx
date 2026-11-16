import { createContext, useContext } from "react";
import type { StudentMinDTO } from "@/api/alunos";

export type SecaoAdmin =
  | "dashboard"
  | "graficos"
  | "alunos"
  | "professores"
  | "turmas"
  | "disciplinas"
  | "usuarios"
  | "calendario"
  | "comunicados"
  | "notificacoes";

// Atalhos entre as seções do painel do admin: uma ação leva ao próximo passo (cadastrou o aluno → coloca na
// turma; abriu a turma → abre a ficha do aluno; criou a disciplina → vincula um professor).
type NavegacaoAdmin = {
  irPara: (secao: SecaoAdmin) => void;
  abrirAluno: (aluno: StudentMinDTO) => void;
};

const Contexto = createContext<NavegacaoAdmin | null>(null);

export const NavegacaoAdminProvider = Contexto.Provider;

// Fora do painel do admin os atalhos simplesmente não aparecem.
export const useNavegacaoAdmin = () => useContext(Contexto);
