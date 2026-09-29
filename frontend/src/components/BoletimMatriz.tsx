import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn, media } from "@/lib/utils";

type EstadoMatriz =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string; status: number }
  | { estado: "ok"; boletins: Boletim[]; notas: Nota[] };

type DisciplinaRef = { id: number; title: string };
type CelulaSelecionada = { disciplina: DisciplinaRef; boletim: Boletim };

const NOTA_APROVACAO = 7;
const NOTA_ATENCAO = 6;

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
    return <MatrizCarregando />;
  }
  if (carga.estado === "erro") {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-6">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-base font-semibold text-destructive">
              {carga.status === 403 ? "Sem acesso para este perfil." : carga.mensagem}
            </p>
            {carga.status !== 403 && (
              <Button variant="outline" className="min-h-9 text-sm" onClick={atualizar}>
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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
    return media(notasDaCelula(disciplinaId, boletimId).map((n) => n.rate));
  }

  const dialogNovoPeriodo = editable && (
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
  );

  if (boletinsOrdenados.length === 0) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <ClipboardList className="size-10 text-muted-foreground/60" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">Nenhum boletim lançado ainda</p>
              <p className="text-base text-muted-foreground">
                {editable
                  ? "Crie o primeiro período para começar a lançar notas."
                  : "As notas aparecerão aqui assim que forem lançadas."}
              </p>
            </div>
            {editable && (
              <Button
                className="mt-2 min-h-11 text-base"
                onClick={() => setNovoPeriodoAberto(true)}
              >
                <Plus className="size-5" aria-hidden="true" />
                Novo período
              </Button>
            )}
          </CardContent>
        </Card>
        {dialogNovoPeriodo}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <LegendaNotas />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-muted text-base font-semibold text-foreground">
                  Disciplina
                </TableHead>
                {boletinsOrdenados.map((b) => (
                  <TableHead
                    key={b.id}
                    className="whitespace-nowrap text-center text-base font-semibold text-foreground"
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      {b.period}
                      {editable && <BotaoApagarPeriodo boletim={b} aoApagar={atualizar} />}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="bg-primary/5 text-center text-base font-semibold text-foreground">
                  Média
                </TableHead>
                {editable && (
                  <TableHead className="w-14 text-center">
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={boletinsOrdenados.length + (editable ? 3 : 2)}
                    className="py-8 text-center text-base text-muted-foreground"
                  >
                    Nenhuma nota lançada ainda.
                  </TableCell>
                </TableRow>
              )}
              {disciplinas.map((d) => {
                const valores = boletinsOrdenados.map((b) => mediaCelula(d.id, b.id));
                const mediaDisciplina = media(valores.filter((v): v is number => v !== null));
                return (
                  <TableRow key={d.id} className="group">
                    <TableCell className="sticky left-0 z-10 bg-card text-base font-semibold text-foreground transition-colors group-hover:bg-muted/50">
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
                    <TableCell className="bg-primary/5 text-center">
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          mediaDisciplina === null
                            ? "text-muted-foreground"
                            : corTexto(mediaDisciplina),
                        )}
                      >
                        {formatarNota(mediaDisciplina)}
                      </span>
                    </TableCell>
                    {editable && <TableCell />}
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="sticky left-0 z-10 bg-muted text-base font-bold text-foreground">
                  Média geral
                </TableCell>
                {boletinsOrdenados.map((b) => (
                  <TableCell key={b.id} className="text-center">
                    <span
                      className={cn("text-base font-bold tabular-nums", corTexto(b.finalAverage))}
                    >
                      {formatarNota(b.finalAverage)}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="bg-primary/5" />
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

      {dialogNovoPeriodo}
    </div>
  );
}

function formatarNota(valor: number | null) {
  return valor === null ? "—" : valor.toFixed(1).replace(".", ",");
}

function corFundo(valor: number) {
  if (valor >= NOTA_APROVACAO) return "bg-success text-success-foreground";
  if (valor >= NOTA_ATENCAO) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function corTexto(valor: number) {
  if (valor >= NOTA_APROVACAO) return "text-success";
  if (valor >= NOTA_ATENCAO) return "text-warning";
  return "text-destructive";
}

function MatrizCarregando() {
  return (
    <Card aria-busy="true" aria-label="Carregando boletim">
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LegendaNotas() {
  const itens = [
    { cor: "bg-success", texto: `Aprovado (≥ ${NOTA_APROVACAO})` },
    { cor: "bg-warning", texto: `Atenção (${NOTA_ATENCAO} a ${NOTA_APROVACAO})` },
    { cor: "bg-destructive", texto: `Abaixo da média (< ${NOTA_ATENCAO})` },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {itens.map((item) => (
        <li key={item.texto} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", item.cor)} aria-hidden="true" />
          {item.texto}
        </li>
      ))}
    </ul>
  );
}

function CelulaValor({
  valor,
  aoClicar,
}: {
  valor: number | null;
  aoClicar?: (() => void) | undefined;
}) {
  const classe = cn(
    "inline-flex min-w-14 items-center justify-center rounded-lg px-3 py-1.5 text-base font-semibold tabular-nums",
    valor === null ? "bg-muted text-muted-foreground" : corFundo(valor),
  );

  if (!aoClicar) {
    return <span className={classe}>{formatarNota(valor)}</span>;
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      title={valor === null ? "Lançar nota" : "Ver e editar notas"}
      className={cn(
        classe,
        "transition-all hover:scale-105 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        valor === null &&
          "border border-dashed border-muted-foreground/40 hover:border-primary hover:text-primary",
      )}
    >
      {valor === null ? <Plus className="size-4" aria-label="Lançar nota" /> : formatarNota(valor)}
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
  const mediaAtual = media(notas.map((n) => n.rate));

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
    if (!period.trim() || !rate.trim() || Number.isNaN(valor)) {
      toast.error("Informe a avaliação e uma nota válida.");
      return;
    }
    if (valor < 0 || valor > 10) {
      toast.error("A nota deve estar entre 0 e 10.");
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
      if (editandoId === id) cancelar();
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota.");
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{disciplina.title}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-2">
          <span>{boletim.period}</span>
          {mediaAtual !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Média:{" "}
                <strong className={cn("tabular-nums", corTexto(mediaAtual))}>
                  {formatarNota(mediaAtual)}
                </strong>
              </span>
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      {notas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-base text-muted-foreground">
          Nenhuma avaliação lançada ainda nesta matéria.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {notas.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 transition-colors",
                editandoId === n.id && "bg-primary/5",
              )}
            >
              <span className="flex items-center gap-3 text-base text-foreground">
                <span
                  className={cn(
                    "inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
                    corFundo(n.rate),
                  )}
                >
                  {formatarNota(n.rate)}
                </span>
                {n.period}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => editar(n)}
                  aria-label={`Editar ${n.period}`}
                  title="Editar"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Apagar ${n.period}`}
                      title="Apagar"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar esta nota?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {n.period} ({formatarNota(n.rate)}) será removida de {disciplina.title}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => apagar(n.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Apagar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={salvar} className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground">
          {editandoId ? "Editando avaliação" : "Lançar nova avaliação"}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1 space-y-1">
            <label htmlFor="celula-periodo" className="block text-sm font-medium text-foreground">
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
            <label htmlFor="celula-nota" className="block text-sm font-medium text-foreground">
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
              placeholder="0 a 10"
              className="h-11 text-base"
            />
          </div>
          <div className="flex gap-2">
            {editandoId && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-base"
                onClick={cancelar}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={salvando} className="min-h-11 text-base">
              {salvando ? "Salvando..." : editandoId ? "Salvar edição" : "Lançar nota"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
