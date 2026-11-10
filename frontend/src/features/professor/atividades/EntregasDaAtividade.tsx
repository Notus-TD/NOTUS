import { type StudentMinDTO } from "@/api/alunos";
import { getEntregasDaAtividade, marcarEntrega, type StatusEntrega } from "@/api/atividades";
import { ApiError } from "@/api/cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { alunosAtivosDaTurma } from "@/features/professor/turma";
import { formatarPontos, ORDEM_STATUS_ENTREGA, STATUS_ENTREGA } from "@/lib/entregas";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EntregaAluno = { status: StatusEntrega; pontosObtidos: number | null };

export function EntregasDaAtividade({
  atividadeId,
  turmaId,
  pontos,
}: {
  atividadeId: number;
  turmaId: number;
  pontos: number | null;
}) {
  const [alunos, setAlunos] = useState<StudentMinDTO[] | null>(null);
  const [entregas, setEntregas] = useState<Record<number, EntregaAluno>>({});
  const [pontosDigitados, setPontosDigitados] = useState<Record<number, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([alunosAtivosDaTurma(turmaId), getEntregasDaAtividade(atividadeId)])
      .then(([lista, doServidor]) => {
        if (!ativo) return;
        setAlunos(lista);
        setEntregas(
          Object.fromEntries(
            doServidor.map((e) => [
              e.studentId,
              { status: e.status, pontosObtidos: e.pontosObtidos },
            ]),
          ),
        );
        setPontosDigitados(
          Object.fromEntries(doServidor.map((e) => [e.studentId, formatarPontos(e.pontosObtidos)])),
        );
      })
      .catch(
        (e) =>
          ativo && setErro(e instanceof ApiError ? e.message : "Erro ao carregar as entregas."),
      );
    return () => {
      ativo = false;
    };
  }, [atividadeId, turmaId]);

  async function salvar(studentId: number, status: StatusEntrega, pontosObtidos: number | null) {
    setSalvandoId(studentId);
    try {
      const salva = await marcarEntrega({ atividadeId, studentId, status, pontosObtidos });
      setEntregas((atual) => ({
        ...atual,
        [studentId]: { status: salva.status, pontosObtidos: salva.pontosObtidos },
      }));
      setPontosDigitados((atual) => ({
        ...atual,
        [studentId]: formatarPontos(salva.pontosObtidos),
      }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao marcar a entrega.");
    } finally {
      setSalvandoId(null);
    }
  }

  function marcar(studentId: number, novo: StatusEntrega) {
    const atual = entregas[studentId];
    const mantemPontos = atual && atual.status !== "NAO_ENTREGUE" ? atual.pontosObtidos : null;
    salvar(studentId, novo, mantemPontos);
  }

  function salvarPontos(studentId: number) {
    const atual = entregas[studentId];
    if (!atual || pontos === null) return;
    const texto = (pontosDigitados[studentId] ?? "").trim();
    if (texto === formatarPontos(atual.pontosObtidos)) return;
    const valor = texto ? Number(texto.replace(",", ".")) : null;
    if (valor !== null && (Number.isNaN(valor) || valor < 0 || valor > pontos)) {
      toast.error(`Os pontos devem estar entre 0 e ${formatarPontos(pontos)}.`);
      setPontosDigitados((d) => ({ ...d, [studentId]: formatarPontos(atual.pontosObtidos) }));
      return;
    }
    salvar(studentId, atual.status, valor);
  }

  const marcados = (alunos ?? []).filter((a) => entregas[a.userId] !== undefined).length;
  const [lancando, setLancando] = useState(false);

  async function lancarNotas() {
    setLancando(true);
    try {
      toast.success("Notas lançadas! Alunos e responsáveis foram notificados.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao lançar as notas.");
    } finally {
      setLancando(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {erro && <p className="text-base font-semibold text-destructive">{erro}</p>}
      {!erro && alunos === null && <p className="text-base">Carregando alunos…</p>}
      {alunos?.length === 0 && <p className="text-base">Nenhum aluno ativo nesta turma.</p>}
      {alunos && alunos.length > 0 && (
        <>
          <p className="text-sm">
            {marcados} de {alunos.length} aluno(s) com nota lançada.
            {pontos !== null &&
              ` Marque a entrega e lance a nota da atividade (0 a ${formatarPontos(pontos)}); "Não entregue" zera a nota.`}
          </p>
          <ul className="divide-y divide-border">
            {alunos.map((a) => {
              const entrega = entregas[a.userId];
              const semPontos = !entrega || entrega.status === "NAO_ENTREGUE";
              return (
                <li
                  key={a.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <span className="text-base text-foreground">{a.studentName}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={`Entrega de ${a.studentName}`}
                    >
                      {ORDEM_STATUS_ENTREGA.map((s) => {
                        const selecionado = entrega?.status === s;
                        return (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            className={cn(
                              "min-h-9 text-sm",
                              selecionado && STATUS_ENTREGA[s].classe,
                            )}
                            aria-pressed={selecionado}
                            disabled={salvandoId === a.userId}
                            onClick={() => marcar(a.userId, s)}
                          >
                            {STATUS_ENTREGA[s].label}
                          </Button>
                        );
                      })}
                    </div>
                    {pontos !== null && (
                      <Input
                        inputMode="decimal"
                        aria-label={`Nota de ${a.studentName}`}
                        title={
                          !entrega
                            ? "Marque a entrega antes de lançar a nota"
                            : `Nota da atividade (0 a ${formatarPontos(pontos)})`
                        }
                        placeholder="Nota"
                        value={pontosDigitados[a.userId] ?? ""}
                        disabled={semPontos || salvandoId === a.userId}
                        onChange={(e) =>
                          setPontosDigitados((d) => ({ ...d, [a.userId]: e.target.value }))
                        }
                        onBlur={() => salvarPontos(a.userId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") salvarPontos(a.userId);
                        }}
                        className="h-9 w-24 text-sm"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            onClick={lancarNotas}
            disabled={lancando || marcados === 0}
            className="min-h-11 px-6 text-base"
          >
            {lancando ? "Lançando..." : "Lançar notas"}
          </Button>
        </>
      )}
    </div>
  );
}
