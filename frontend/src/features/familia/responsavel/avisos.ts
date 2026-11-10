import { type ComunicadoDTO } from "@/api/comunicados";
import { type AvisoDTO } from "@/api/notificacoes";
import { getSession } from "@/lib/sessao";

export type ItemAviso = {
  chave: string;
  titulo: string;
  texto: string;
  origem: string;
  quando: string;
};

export function montarAvisos(comunicados: ComunicadoDTO[], avisos: AvisoDTO[]): ItemAviso[] {
  return [
    ...comunicados.map((c) => ({
      chave: `c-${c.id}`,
      titulo: c.titulo,
      texto: c.texto,
      origem: "Secretaria da escola",
      quando: c.enviadoEm,
    })),
    ...avisos.map((a) => ({
      chave: `n-${a.id}`,
      titulo: a.titulo,
      texto: a.texto,
      origem: a.alunoNome ? `Sobre ${a.alunoNome}` : "Escola",
      quando: a.criadoEm,
    })),
  ].sort((a, b) => b.quando.localeCompare(a.quando));
}

const chaveLidos = () => `notus.avisosLidos.${getSession()?.email ?? ""}`;

export function lerLidos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(chaveLidos()) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function salvarLidos(lista: string[]) {
  try {
    localStorage.setItem(chaveLidos(), JSON.stringify(lista));
  } catch {
    return;
  }
}
