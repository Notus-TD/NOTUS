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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  createNota,
  deleteNota,
  getBoletimDoAluno,
  getEntregasDoAluno,
  getNotasDoAluno,
  lancarNotaFinal,
  removerNotaFinal,
  updateNota,
  type Bimestre,
  type BoletimDTO,
  type DisciplinaDTO,
  type EntregaDTO,
  type NotaDTO,
} from "@/lib/api";
import { BIMESTRES, nomeBimestre } from "@/lib/bimestres";
import { formatarData } from "@/lib/datas";
import { STATUS_ENTREGA } from "@/lib/entregas";
import { cn, media } from "@/lib/utils";

type EstadoMatriz =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string; status: number }
  | { estado: "ok"; linhas: BoletimDTO[]; notas: NotaDTO[]; entregas: EntregaDTO[] };

type DisciplinaRef = { id: number; title: string };
type CelulaSelecionada = { disciplina: DisciplinaRef; bimestre: Bimestre };

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

  useEffect(() => {
    let ativo = true;
    setCarga((atual) => (atual.estado === "ok" ? atual : { estado: "carregando" }));
    (async () => {
      try {
        const [linhas, notas, entregas] = await Promise.all([
          getBoletimDoAluno(studentId),
          editable ? getNotasDoAluno(studentId) : Promise.resolve<NotaDTO[]>([]),
          editable
            ? getEntregasDoAluno(studentId).catch((): EntregaDTO[] => [])
            : Promise.resolve<EntregaDTO[]>([]),
        ]);
        if (!ativo) return;
        setCarga({ estado: "ok", linhas, notas, entregas });
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
  }, [studentId, editable, versao]);

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

  const { linhas, notas, entregas } = carga;

  const disciplinas: DisciplinaRef[] = editable
    ? [...(disciplinasDisponiveis ?? [])].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
    : Object.values(
        linhas.reduce<Record<number, DisciplinaRef>>((acc, l) => {
          acc[l.disciplinaId] ??= { id: l.disciplinaId, title: l.disciplinaTitle };
          return acc;
        }, {}),
      ).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  function linhaDaCelula(disciplinaId: number, bimestre: Bimestre) {
    return linhas.find((l) => l.disciplinaId === disciplinaId && l.bimestre === bimestre) ?? null;
  }

  if (disciplinas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <ClipboardList className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">Nenhuma nota lançada ainda</p>
            <p className="text-base text-muted-foreground">
              As notas aparecerão aqui assim que forem lançadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <LegendaNotas editable={editable} />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-muted text-base font-semibold text-foreground">
                  Disciplina
                </TableHead>
                {BIMESTRES.map((b) => (
                  <TableHead
                    key={b.id}
                    className="whitespace-nowrap text-center text-base font-semibold text-foreground"
                  >
                    {b.label}
                  </TableHead>
                ))}
                <TableHead className="bg-primary/5 text-center text-base font-semibold text-foreground">
                  Média final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinas.map((d) => {
                const celulas = BIMESTRES.map((b) => linhaDaCelula(d.id, b.id));
                const mediaFinal = media(
                  celulas
                    .map((l) => l?.notaFinal ?? null)
                    .filter((v): v is number => v !== null),
                );
                return (
                  <TableRow key={d.id} className="group">
                    <TableCell className="sticky left-0 z-10 bg-card text-base font-semibold text-foreground transition-colors group-hover:bg-muted/50">
                      {d.title}
                    </TableCell>
                    {BIMESTRES.map((b, i) => (
                      <TableCell key={b.id} className="text-center">
                        <CelulaValor
                          linha={celulas[i] ?? null}
                          editable={editable}
                          aoClicar={
                            editable ? () => setCelula({ disciplina: d, bimestre: b.id }) : undefined
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell className="bg-primary/5 text-center">
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          mediaFinal === null ? "text-muted-foreground" : corTexto(mediaFinal),
                        )}
                      >
                        {formatarNota(mediaFinal)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={celula !== null}
        onOpenChange={(open) => {
          if (!open) setCelula(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {celula && (
            <CelulaEditor
              studentId={studentId}
              disciplina={celula.disciplina}
              bimestre={celula.bimestre}
              linha={linhaDaCelula(celula.disciplina.id, celula.bimestre)}
              notas={notas.filter(
                (n) => n.disciplinaId === celula.disciplina.id && n.bimestre === celula.bimestre,
              )}
              entregas={entregas.filter(
                (e) => e.disciplinaId === celula.disciplina.id && e.bimestre === celula.bimestre,
              )}
              aoMudar={atualizar}
            />
          )}
        </DialogContent>
      </Dialog>
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

function LegendaNotas({ editable }: { editable: boolean }) {
  const itens = [
    { cor: "bg-success", texto: `Aprovado (≥ ${NOTA_APROVACAO})` },
    { cor: "bg-warning", texto: `Atenção (${NOTA_ATENCAO} a ${NOTA_APROVACAO})` },
    { cor: "bg-destructive", texto: `Abaixo da média (< ${NOTA_ATENCAO})` },
  ];
  return (
    <div className="space-y-1">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {itens.map((item) => (
          <li key={item.texto} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", item.cor)} aria-hidden="true" />
            {item.texto}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {editable
          ? "Valor tracejado é a média sugerida das avaliações. A nota final é você quem lança."
          : "Cada bimestre mostra a nota final lançada pelo professor."}
      </p>
    </div>
  );
}

const CLASSE_CELULA =
  "inline-flex min-w-14 items-center justify-center rounded-lg px-3 py-1.5 text-base font-semibold tabular-nums";

function conteudoCelula(linha: BoletimDTO | null, editable: boolean) {
  const notaFinal = linha?.notaFinal ?? null;
  const sugerida = linha?.mediaSugerida ?? null;
  if (notaFinal !== null) {
    return <span className={cn(CLASSE_CELULA, corFundo(notaFinal))}>{formatarNota(notaFinal)}</span>;
  }
  if (sugerida !== null && editable) {
    return (
      <span
        className={cn(
          CLASSE_CELULA,
          "border border-dashed border-muted-foreground/50 text-muted-foreground",
        )}
        title="Média sugerida"
      >
        {formatarNota(sugerida)}
      </span>
    );
  }
  if (sugerida !== null) {
    return (
      <span className={cn(CLASSE_CELULA, "bg-muted text-sm text-muted-foreground")}>
        Em andamento
      </span>
    );
  }
  if (editable) {
    return (
      <span
        className={cn(
          CLASSE_CELULA,
          "border border-dashed border-muted-foreground/40 text-muted-foreground",
        )}
      >
        <Plus className="size-4" aria-label="Lançar nota" />
      </span>
    );
  }
  return <span className={cn(CLASSE_CELULA, "bg-muted text-muted-foreground")}>—</span>;
}

function CelulaValor({
  linha,
  editable,
  aoClicar,
}: {
  linha: BoletimDTO | null;
  editable: boolean;
  aoClicar?: (() => void) | undefined;
}) {
  if (!aoClicar) {
    return conteudoCelula(linha, editable);
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      title="Avaliações e nota final"
      className="rounded-lg transition-all hover:scale-105 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {conteudoCelula(linha, editable)}
    </button>
  );
}

function CelulaEditor({
  studentId,
  disciplina,
  bimestre,
  linha,
  notas,
  entregas,
  aoMudar,
}: {
  studentId: number;
  disciplina: DisciplinaRef;
  bimestre: Bimestre;
  linha: BoletimDTO | null;
  notas: NotaDTO[];
  entregas: EntregaDTO[];
  aoMudar: () => void;
}) {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [descricao, setDescricao] = useState("");
  const [rate, setRate] = useState("");
  const [salvando, setSalvando] = useState(false);
  const mediaSugerida = media(notas.map((n) => n.rate));

  function editar(n: NotaDTO) {
    setEditandoId(n.id);
    setDescricao(n.descricao);
    setRate(String(n.rate));
  }

  function cancelar() {
    setEditandoId(null);
    setDescricao("");
    setRate("");
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(rate.replace(",", "."));
    if (!descricao.trim() || !rate.trim() || Number.isNaN(valor)) {
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
        descricao: descricao.trim(),
        rate: valor,
        bimestre,
        studentId,
        disciplinaId: disciplina.id,
      };
      if (editandoId) {
        await updateNota(editandoId, dto);
        toast.success("Avaliação atualizada.");
      }
      if (!editandoId) {
        await createNota(dto);
        toast.success("Avaliação lançada.");
      }
      cancelar();
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: number) {
    try {
      await deleteNota(id);
      toast.success("Avaliação removida.");
      if (editandoId === id) cancelar();
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a avaliação.");
    }
  }

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>{disciplina.title}</DialogTitle>
        <DialogDescription>{nomeBimestre(bimestre)}</DialogDescription>
      </DialogHeader>

      <section className="space-y-3">
        <h4 className="text-base font-semibold text-foreground">Avaliações</h4>
        {notas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-base text-muted-foreground">
            Nenhuma avaliação lançada ainda neste bimestre.
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
                  {n.descricao}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => editar(n)}
                    aria-label={`Editar ${n.descricao}`}
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
                        aria-label={`Apagar ${n.descricao}`}
                        title="Apagar"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apagar esta avaliação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {n.descricao} ({formatarNota(n.rate)}) será removida de {disciplina.title}.
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

        <form onSubmit={salvar} className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {editandoId ? "Editando avaliação" : "Lançar nova avaliação"}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1 space-y-1">
              <label
                htmlFor="celula-descricao"
                className="block text-sm font-medium text-foreground"
              >
                Avaliação
              </label>
              <Input
                id="celula-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: Prova 1"
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
                {salvando ? "Salvando..." : editandoId ? "Salvar edição" : "Lançar avaliação"}
              </Button>
            </div>
          </div>
        </form>
      </section>

      <ResumoEntregas entregas={entregas} />

      <NotaFinalForm
        key={`${linha?.notaFinal ?? ""}-${mediaSugerida ?? ""}`}
        studentId={studentId}
        disciplina={disciplina}
        bimestre={bimestre}
        linha={linha}
        mediaSugerida={mediaSugerida}
        aoMudar={aoMudar}
      />
    </div>
  );
}

function ResumoEntregas({ entregas }: { entregas: EntregaDTO[] }) {
  return (
    <section className="space-y-2">
      <h4 className="text-base font-semibold text-foreground">Atividades do bimestre</h4>
      {entregas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma entrega marcada nesta disciplina e bimestre.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {entregas.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-foreground">{e.atividadeTitle}</span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold",
                  STATUS_ENTREGA[e.status].classe,
                )}
              >
                {STATUS_ENTREGA[e.status].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NotaFinalForm({
  studentId,
  disciplina,
  bimestre,
  linha,
  mediaSugerida,
  aoMudar,
}: {
  studentId: number;
  disciplina: DisciplinaRef;
  bimestre: Bimestre;
  linha: BoletimDTO | null;
  mediaSugerida: number | null;
  aoMudar: () => void;
}) {
  const notaFinal = linha?.notaFinal ?? null;
  const inicial = notaFinal ?? mediaSugerida;
  const [valor, setValor] = useState(inicial === null ? "" : inicial.toFixed(1));
  const [salvando, setSalvando] = useState(false);

  async function lancar(e: FormEvent) {
    e.preventDefault();
    const numero = Number(valor.replace(",", "."));
    if (!valor.trim() || Number.isNaN(numero)) {
      toast.error("Informe uma nota final válida.");
      return;
    }
    if (numero < 0 || numero > 10) {
      toast.error("A nota final deve estar entre 0 e 10.");
      return;
    }
    setSalvando(true);
    try {
      await lancarNotaFinal({ studentId, disciplinaId: disciplina.id, bimestre, notaFinal: numero });
      toast.success("Nota final lançada. O responsável recebe o aviso por e-mail.");
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao lançar a nota final.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!linha?.id) return;
    try {
      await removerNotaFinal(linha.id);
      toast.success("Nota final removida.");
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota final.");
    }
  }

  return (
    <form onSubmit={lancar} className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base font-semibold text-foreground">Nota final</h4>
        <p className="text-sm text-muted-foreground">
          Média sugerida: <strong className="tabular-nums">{formatarNota(mediaSugerida)}</strong>
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Some os pontos das atividades ou um ponto extra, se quiser. Só a nota final aparece para o
        aluno e o responsável.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28 space-y-1">
          <label htmlFor="nota-final" className="block text-sm font-medium text-foreground">
            Nota final
          </label>
          <Input
            id="nota-final"
            type="number"
            min={0}
            max={10}
            step={0.1}
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0 a 10"
            className="h-11 text-base"
          />
        </div>
        <Button type="submit" disabled={salvando} className="min-h-11 text-base">
          {salvando
            ? "Lançando..."
            : notaFinal !== null
              ? "Atualizar nota final"
              : "Lançar nota final"}
        </Button>
        {notaFinal !== null && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Remover
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover a nota final?</AlertDialogTitle>
                <AlertDialogDescription>
                  {disciplina.title} no {nomeBimestre(bimestre)} volta a aparecer como em andamento
                  para o aluno e o responsável.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={remover}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {linha?.lancadoEm && (
        <p className="text-sm text-muted-foreground">
          Lançada em {formatarData(linha.lancadoEm.slice(0, 10))}.
        </p>
      )}
    </form>
  );
}
