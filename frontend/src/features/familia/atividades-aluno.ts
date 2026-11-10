import type { AtividadeDTO } from "@/api/atividades";
import { diasEntre, formatarData } from "@/lib/datas";

export const situacaoInfo = {
  hoje: { texto: "Entregar hoje", classe: "text-warning" },
  atrasada: { texto: "Atrasada", classe: "text-destructive" },
  proxima: { texto: "Próxima", classe: "text-muted-foreground" },
  entregue: { texto: "Entregue", classe: "text-success" },
} as const;

export type Situacao = keyof typeof situacaoInfo;

export type AtividadeAluno = {
  id: number;
  titulo: string;
  disciplina: string;
  prazo: string;
  prazoData: string;
  situacao: Situacao;
  descricao: string;
  pontos: number | null;
};

export function paraAtividadeAluno(a: AtividadeDTO, hoje: string): AtividadeAluno {
  const dias = diasEntre(hoje, a.prazo);
  let situacao: Situacao;
  let prazo: string;
  if (a.entregue) {
    situacao = "entregue";
    prazo = `Prazo ${formatarData(a.prazo)}`;
  } else if (dias < 0) {
    situacao = "atrasada";
    prazo = dias === -1 ? "Prazo venceu ontem" : `Prazo venceu em ${formatarData(a.prazo)}`;
  } else if (dias === 0) {
    situacao = "hoje";
    prazo = "Entregar hoje";
  } else {
    situacao = "proxima";
    prazo =
      dias === 1 ? "Entregar amanhã" : `Entregar até ${formatarData(a.prazo)} (em ${dias} dias)`;
  }
  return {
    id: a.id,
    titulo: a.title,
    disciplina: a.disciplinaTitle,
    prazo,
    prazoData: a.prazo,
    situacao,
    descricao: a.content,
    pontos: a.pontos,
  };
}
