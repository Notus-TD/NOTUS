import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  createBoletim,
  createNota,
  deleteBoletim,
  deleteNota,
  getBoletinsByStudent,
  getNotasByBoletim,
  updateNota,
  type Boletim,
  type DisciplinaDTO,
  type Nota,
} from "@/lib/api";
import { media } from "@/lib/utils";

type EstadoMatriz =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string; status: number }
  | { estado: "ok"; boletins: Boletim[]; notas: Nota[] };

type DisciplinaRef = { id: number; title: string };
type CelulaSelecionada = { disciplina: DisciplinaRef; boletim: Boletim };

export function BoletimMatriz({
  studentId,
  editable = false,
  disciplinasDisponiveis,
}: {
  studentId: number;
  editable?: boolean;
  disciplinasDisponiveis?: DisciplinaDTO[];
}) {
  const [versao, setVersao] = useState(0);
  const [carga, setCarga] = useState<EstadoMatriz>({ estado: "carregando" });
  const [celula, setCelula] = useState<CelulaSelecionada | null>(null);
  const [novoPeriodoAberto, setNovoPeriodoAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarga({ estado: "carregando" });
    (async () => {
      try {
        const boletins = await getBoletinsByStudent(studentId);
        const listas = await Promise.all(boletins.map((b) => getNotasByBoletim(b.id)));
        if (!ativo) return;
        setCarga({ estado: "ok", boletins, notas: listas.flat() });
      } catch (e) {
        if (!ativo) return;
        setCarga({
          estado: "erro",
          mensagem: e instanceof ApiError ? e.message : "Erro ao carregar o boletim.",
          status: e instanceof ApiError ? e.status : 0,
        });
      }
    })();
    return () => {
      ativo = false;
    };
  }, [studentId, versao]);

  function atualizar() {
    setVersao((v) => v + 1);
  }

  if (carga.estado === "carregando") {
    return <p className="text-base text-muted-foreground">Carregando boletim…</p>;
  }
  if (carga.estado === "erro") {
    return (
      <p className="text-base font-semibold text-destructive">
        {carga.status === 403 ? "Sem acesso para este perfil." : carga.mensagem}
      </p>
    );
  }

  const { boletins, notas } = carga;
  const boletinsOrdenados = [...boletins].sort((a, b) => a.id - b.id);

  const disciplinas: DisciplinaRef[] = editable
    ? [...(disciplinasDisponiveis ?? [])].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
    : Object.values(
        notas.reduce<Record<number, DisciplinaRef>>((acc, n) => {
          acc[n.disciplina.id] ??= n.disciplina;
          return acc;
        }, {}),
      ).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  function notasDaCelula(disciplinaId: number, boletimId: number) {
    return notas.filter((n) => n.disciplina.id === disciplinaId && n.boletim.id === boletimId);
  }

  function mediaCelula(disciplinaId: number, boletimId: number) {
    const itens = notasDaCelula(disciplinaId, boletimId);
    return itens.length ? media(itens.map((n) => n.rate)) : null;
  }

  if (boletinsOrdenados.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-base text-muted-foreground">
            Nenhum boletim lançado ainda.
          </CardContent>
        </Card>
        {editable && (
          <Button className="min-h-11 text-base" onClick={() => setNovoPeriodoAberto(true)}>
            <Plus className="size-5" aria-hidden="true" />
            Novo período
          </Button>
        )}
        <Dialog open={novoPeriodoAberto} onOpenChange={setNovoPeriodoAberto}>
          <DialogContent>
            <NovoPeriodoForm
              studentId={studentId}
              aoCriar={() => {
                setNovoPeriodoAberto(false);
                atualizar();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card text-base font-semibold text-foreground">
                  Disciplina
                </TableHead>
                {boletinsOrdenados.map((b) => (
                  <TableHead
                    key={b.id}
                    className="text-center text-base font-semibold text-foreground"
                  >
                    <span className="flex items-center justify-center gap-1">
                      {b.period}
                      {editable && <BotaoApagarPeriodo boletim={b} aoApagar={atualizar} />}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-center text-base font-semibold text-foreground">
                  Média
                </TableHead>
                {editable && (
                  <TableHead className="text-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      onClick={() => setNovoPeriodoAberto(true)}
                      aria-label="Novo período"
                      title="Novo período"
                    >
                      <Plus className="size-5" aria-hidden="true" />
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={boletinsOrdenados.length + (editable ? 3 : 2)}
                    className="py-6 text-center text-base text-muted-foreground"
                  >
                    Nenhuma nota lançada ainda.
                  </TableCell>
                </TableRow>
              )}
              {disciplinas.map((d) => {
                const valores = boletinsOrdenados.map((b) => mediaCelula(d.id, b.id));
                const validos = valores.filter((v): v is number => v !== null);
                const mediaDisciplina = validos.length ? media(validos) : null;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="sticky left-0 z-10 bg-card text-lg font-semibold text-foreground">
                      {d.title}
                    </TableCell>
                    {boletinsOrdenados.map((b, i) => (
                      <TableCell key={b.id} className="text-center">
                        <CelulaValor
                          valor={valores[i] ?? null}
                          aoClicar={
                            editable ? () => setCelula({ disciplina: d, boletim: b }) : undefined
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <span className="text-lg font-bold text-foreground">
                        {mediaDisciplina !== null ? mediaDisciplina.toFixed(1) : "—"}
                      </span>
                    </TableCell>
                    {editable && <TableCell />}
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="sticky left-0 z-10 bg-muted/50 text-base font-bold text-foreground">
                  Média geral
                </TableCell>
                {boletinsOrdenados.map((b) => (
                  <TableCell key={b.id} className="text-center text-base font-bold text-foreground">
                    {b.finalAverage.toFixed(1)}
                  </TableCell>
                ))}
                <TableCell />
                {editable && <TableCell />}
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={celula !== null}
        onOpenChange={(open) => {
          if (!open) setCelula(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {celula && (
            <CelulaNotasEditor
              disciplina={celula.disciplina}
              boletim={celula.boletim}
              notas={notasDaCelula(celula.disciplina.id, celula.boletim.id)}
              aoMudar={atualizar}
            />
          )}
        </DialogContent>
      </Dialog>

      {editable && (
        <Dialog open={novoPeriodoAberto} onOpenChange={setNovoPeriodoAberto}>
          <DialogContent>
            <NovoPeriodoForm
              studentId={studentId}
              aoCriar={() => {
                setNovoPeriodoAberto(false);
                atualizar();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function corNota(valor: number) {
  if (valor >= 7) return "bg-success text-success-foreground";
  if (valor >= 6) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function CelulaValor({
  valor,
  aoClicar,
}: {
  valor: number | null;
  aoClicar?: (() => void) | undefined;
}) {
  const conteudo = valor === null ? "—" : valor.toFixed(1);
  const classe = valor === null ? "bg-muted text-muted-foreground" : corNota(valor);

  if (!aoClicar) {
    return (
      <span
        className={`inline-flex min-w-14 items-center justify-center rounded-lg px-3 py-1.5 text-base font-semibold ${classe}`}
      >
        {conteudo}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      title={valor === null ? "Lançar nota" : "Ver e editar notas"}
      className={`inline-flex min-w-14 items-center justify-center rounded-lg px-3 py-1.5 text-base font-semibold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${classe}`}
    >
      {conteudo}
    </button>
  );
}

function BotaoApagarPeriodo({ boletim, aoApagar }: { boletim: Boletim; aoApagar: () => void }) {
  const [apagando, setApagando] = useState(false);

  async function confirmar() {
    setApagando(true);
    try {
      await deleteBoletim(boletim.id);
      toast.success("Período removido.");
      aoApagar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover o período.");
    } finally {
      setApagando(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Apagar período ${boletim.period}`}
          title="Apagar período"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar {boletim.period}?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso remove o período inteiro e todas as notas lançadas nele. Essa ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={apagando}
            onClick={confirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {apagando ? "Apagando..." : "Apagar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NovoPeriodoForm({ studentId, aoCriar }: { studentId: number; aoCriar: () => void }) {
  const [periodo, setPeriodo] = useState("");
  const [status, setStatus] = useState("EM ANDAMENTO");
  const [criando, setCriando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!periodo.trim()) {
      toast.error("Informe o período do boletim.");
      return;
    }
    setCriando(true);
    try {
      await createBoletim({
        period: periodo.trim(),
        finalAverage: 0,
        status: status.trim() || "EM ANDAMENTO",
        studentId,
      });
      toast.success("Período criado.");
      aoCriar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar o período.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Novo período</DialogTitle>
        <DialogDescription>
          Cria uma nova coluna no boletim, como um bimestre ou trimestre.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <label
          htmlFor="novo-periodo-nome"
          className="block text-base font-semibold text-foreground"
        >
          Período
        </label>
        <Input
          id="novo-periodo-nome"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder="Ex.: 2º Bimestre"
          className="h-11 text-base"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="novo-periodo-status"
          className="block text-base font-semibold text-foreground"
        >
          Status
        </label>
        <Input
          id="novo-periodo-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 text-base"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={criando} className="min-h-11 text-base">
          {criando ? "Criando..." : "Criar período"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CelulaNotasEditor({
  disciplina,
  boletim,
  notas,
  aoMudar,
}: {
  disciplina: DisciplinaRef;
  boletim: Boletim;
  notas: Nota[];
  aoMudar: () => void;
}) {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [rate, setRate] = useState("");
  const [period, setPeriod] = useState("");
  const [salvando, setSalvando] = useState(false);

  function editar(n: Nota) {
    setEditandoId(n.id);
    setRate(String(n.rate));
    setPeriod(n.period);
  }

  function cancelar() {
    setEditandoId(null);
    setRate("");
    setPeriod("");
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(rate.replace(",", "."));
    if (!period.trim() || Number.isNaN(valor)) {
      toast.error("Informe a avaliação e uma nota válida.");
      return;
    }
    setSalvando(true);
    try {
      const dto = {
        rate: valor,
        period: period.trim(),
        boletimId: boletim.id,
        disciplinaId: disciplina.id,
      };
      if (editandoId) {
        await updateNota(editandoId, dto);
        toast.success("Nota atualizada.");
      } else {
        await createNota(dto);
        toast.success("Nota lançada.");
      }
      cancelar();
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a nota.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: number) {
    try {
      await deleteNota(id);
      toast.success("Nota removida.");
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota.");
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{disciplina.title}</DialogTitle>
        <DialogDescription>{boletim.period}</DialogDescription>
      </DialogHeader>

      {notas.length === 0 ? (
        <p className="text-base text-muted-foreground">
          Nenhuma avaliação lançada ainda nesta matéria.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {notas.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="text-base text-foreground">
                {n.period}: <strong>{n.rate}</strong>
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 text-sm"
                  onClick={() => editar(n)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 text-sm text-destructive hover:text-destructive"
                  onClick={() => apagar(n.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Apagar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={salvar}
        className="flex flex-wrap items-end gap-3 border-t border-border pt-4"
      >
        <div className="min-w-40 flex-1 space-y-1">
          <label htmlFor="celula-periodo" className="block text-sm font-semibold text-foreground">
            Avaliação
          </label>
          <Input
            id="celula-periodo"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Ex.: Prova bimestral"
            className="h-11 text-base"
          />
        </div>
        <div className="w-24 space-y-1">
          <label htmlFor="celula-nota" className="block text-sm font-semibold text-foreground">
            Nota
          </label>
          <Input
            id="celula-nota"
            type="number"
            min={0}
            max={10}
            step={0.1}
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="h-11 text-base"
          />
        </div>
        <Button type="submit" disabled={salvando} className="min-h-11 text-base">
          {editandoId ? "Salvar edição" : "Lançar nota"}
        </Button>
        {editandoId && (
          <Button type="button" variant="outline" className="min-h-11 text-base" onClick={cancelar}>
            Cancelar
          </Button>
        )}
      </form>
    </div>
  );
}
