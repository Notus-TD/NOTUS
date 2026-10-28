import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, ClipboardList, Plus, Search } from "lucide-react";
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
  getBoletimDoAluno,
  getEntregasDoAluno,
  lancarNotaFinal,
  removerNotaFinal,
  type Bimestre,
  type BoletimDisciplinaDTO,
  type BoletimDTO,
  type DisciplinaDTO,
  type EntregaDTO,
} from "@/lib/api";
import { nomeBimestre } from "@/lib/bimestres";
import { normalizar } from "@/lib/busca";
import { formatarData } from "@/lib/datas";
import { STATUS_ENTREGA } from "@/lib/entregas";
import { cn } from "@/lib/utils";

type EstadoMatriz =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string; status: number }
  | { estado: "ok"; boletim: BoletimDisciplinaDTO[]; entregas: EntregaDTO[] };

type DisciplinaRef = { id: number; title: string };
type CelulaSelecionada = { disciplina: DisciplinaRef; bimestre: Bimestre };
type CampoMedia = "mediaFinal" | "mediaSala";
type Coluna =
  | { tipo: "bimestre"; bimestre: Bimestre; label: string }
  | { tipo: "media"; campo: CampoMedia; label: string };

const COLUNAS: Coluna[] = [
  { tipo: "bimestre", bimestre: "PRIMEIRO", label: nomeBimestre("PRIMEIRO") },
  { tipo: "bimestre", bimestre: "SEGUNDO", label: nomeBimestre("SEGUNDO") },
  { tipo: "bimestre", bimestre: "TERCEIRO", label: nomeBimestre("TERCEIRO") },
  { tipo: "bimestre", bimestre: "QUARTO", label: nomeBimestre("QUARTO") },
  { tipo: "media", campo: "mediaFinal", label: "Média final" },
];

/** No boletim de um aluno também aparece a média da turma, para comparação. */
const COLUNAS_ALUNO: Coluna[] = [
  ...COLUNAS,
  { tipo: "media", campo: "mediaSala", label: "Média da sala" },
];

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
        const [boletim, entregas] = await Promise.all([
          getBoletimDoAluno(studentId),
          editable
            ? getEntregasDoAluno(studentId).catch((): EntregaDTO[] => [])
            : Promise.resolve<EntregaDTO[]>([]),
        ]);
        if (!ativo) return;
        setCarga({ estado: "ok", boletim, entregas });
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

  const { boletim, entregas } = carga;
  const linhas = boletim.flatMap((d) => d.bimestres);

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
      <LegendaNotas />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-muted text-base font-semibold text-foreground">
                  Disciplina
                </TableHead>
                {COLUNAS_ALUNO.map((c) => (
                  <TableHead
                    key={c.label}
                    className={cn(
                      "whitespace-nowrap text-center text-base font-semibold text-foreground",
                      c.tipo === "media" && "bg-primary/5",
                    )}
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinas.map((d) => {
                const medias = boletim.find((b) => b.disciplinaId === d.id) ?? null;
                return (
                  <TableRow key={d.id} className="group">
                    <TableCell className="sticky left-0 z-10 bg-card text-base font-semibold text-foreground transition-colors group-hover:bg-muted/50">
                      {d.title}
                    </TableCell>
                    {COLUNAS_ALUNO.map((c) =>
                      c.tipo === "bimestre" ? (
                        <TableCell key={c.label} className="text-center">
                          <CelulaValor
                            linha={linhaDaCelula(d.id, c.bimestre)}
                            editable={editable}
                            aoClicar={
                              editable
                                ? () => setCelula({ disciplina: d, bimestre: c.bimestre })
                                : undefined
                            }
                          />
                        </TableCell>
                      ) : (
                        <TableCell key={c.label} className="bg-primary/5 text-center">
                          <CelulaMedia valor={medias?.[c.campo] ?? null} />
                        </TableCell>
                      ),
                    )}
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

type AlunoRef = { userId: number; studentName: string; matricula: number };
type BoletimDoAluno =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string }
  | { estado: "ok"; disciplina: BoletimDisciplinaDTO | null };

/** Notas de uma disciplina para todos os alunos da turma, uma linha por aluno. */
export function BoletimTurma({
  alunos,
  disciplina,
}: {
  alunos: AlunoRef[];
  disciplina: DisciplinaRef;
}) {
  const [boletins, setBoletins] = useState<Record<number, BoletimDoAluno>>({});
  const [filtro, setFiltro] = useState("");
  const [celula, setCelula] = useState<{ aluno: AlunoRef; bimestre: Bimestre } | null>(null);
  const [entregas, setEntregas] = useState<EntregaDTO[] | null>(null);

  const carregarAluno = useCallback(
    async (studentId: number) => {
      try {
        const boletim = await getBoletimDoAluno(studentId);
        const daDisciplina = boletim.find((b) => b.disciplinaId === disciplina.id) ?? null;
        setBoletins((atual) => ({
          ...atual,
          [studentId]: { estado: "ok", disciplina: daDisciplina },
        }));
      } catch (e) {
        setBoletins((atual) => ({
          ...atual,
          [studentId]: {
            estado: "erro",
            mensagem: e instanceof ApiError ? e.message : "Erro ao carregar o boletim.",
          },
        }));
      }
    },
    [disciplina.id],
  );

  useEffect(() => {
    setBoletins(Object.fromEntries(alunos.map((a) => [a.userId, { estado: "carregando" }])));
    alunos.forEach((a) => void carregarAluno(a.userId));
  }, [alunos, carregarAluno]);

  function abrir(aluno: AlunoRef, bimestre: Bimestre) {
    setCelula({ aluno, bimestre });
    setEntregas(null);
    getEntregasDoAluno(aluno.userId)
      .then((lista) =>
        setEntregas(
          lista.filter((e) => e.disciplinaId === disciplina.id && e.bimestre === bimestre),
        ),
      )
      .catch(() => setEntregas([]));
  }

  function linhaDe(studentId: number, bimestre: Bimestre) {
    const boletim = boletins[studentId];
    if (boletim?.estado !== "ok") return null;
    return boletim.disciplina?.bimestres.find((b) => b.bimestre === bimestre) ?? null;
  }

  const termo = normalizar(filtro.trim());
  const visiveis = alunos.filter(
    (a) =>
      !termo || normalizar(a.studentName).includes(termo) || String(a.matricula).includes(termo),
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nome ou matrícula…"
          aria-label="Filtrar alunos da turma"
          className="h-12 pl-10 text-lg"
        />
      </div>

      <LegendaNotas />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-muted text-base font-semibold text-foreground">
                  Aluno
                </TableHead>
                {COLUNAS.map((c) => (
                  <TableHead
                    key={c.label}
                    className={cn(
                      "whitespace-nowrap text-center text-base font-semibold text-foreground",
                      c.tipo === "media" && "bg-primary/5",
                    )}
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((a) => {
                const boletim = boletins[a.userId];
                return (
                  <TableRow key={a.userId} className="group">
                    <TableCell className="sticky left-0 z-10 bg-card transition-colors group-hover:bg-muted/50">
                      <span className="block whitespace-nowrap text-base font-semibold text-foreground">
                        {a.studentName}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Matrícula {a.matricula}
                      </span>
                    </TableCell>
                    {boletim?.estado === "erro" ? (
                      <TableCell
                        colSpan={COLUNAS.length}
                        className="text-sm font-semibold text-destructive"
                      >
                        {boletim.mensagem}
                      </TableCell>
                    ) : boletim?.estado !== "ok" ? (
                      <TableCell colSpan={COLUNAS.length}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    ) : (
                      COLUNAS.map((c) =>
                        c.tipo === "bimestre" ? (
                          <TableCell key={c.label} className="text-center">
                            <CelulaValor
                              linha={linhaDe(a.userId, c.bimestre)}
                              editable
                              aoClicar={() => abrir(a, c.bimestre)}
                            />
                          </TableCell>
                        ) : (
                          <TableCell key={c.label} className="bg-primary/5 text-center">
                            <CelulaMedia valor={boletim.disciplina?.[c.campo] ?? null} />
                          </TableCell>
                        ),
                      )
                    )}
                  </TableRow>
                );
              })}
              {visiveis.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={COLUNAS.length + 1}
                    className="py-6 text-center text-base text-muted-foreground"
                  >
                    {alunos.length === 0
                      ? "Nenhum aluno ativo nesta turma."
                      : "Nenhum aluno encontrado."}
                  </TableCell>
                </TableRow>
              )}
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
            <>
              <p className="text-sm font-semibold text-primary">{celula.aluno.studentName}</p>
              {entregas === null ? (
                <p className="text-base text-muted-foreground">Carregando…</p>
              ) : (
                <CelulaEditor
                  studentId={celula.aluno.userId}
                  disciplina={disciplina}
                  bimestre={celula.bimestre}
                  linha={linhaDe(celula.aluno.userId, celula.bimestre)}
                  entregas={entregas}
                  aoMudar={() => void carregarAluno(celula.aluno.userId)}
                />
              )}
            </>
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

function corBorda(valor: number) {
  if (valor >= NOTA_APROVACAO) return "border-success text-success";
  if (valor >= NOTA_ATENCAO) return "border-warning text-warning";
  return "border-destructive text-destructive";
}

function CelulaMedia({ valor }: { valor: number | null }) {
  return (
    <span
      className={cn(
        "text-lg font-bold tabular-nums",
        valor === null ? "text-muted-foreground" : corTexto(valor),
      )}
    >
      {formatarNota(valor)}
    </span>
  );
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
        A nota do bimestre é a nota lançada pelo professor mais os pontos das atividades, limitada a
        10. Só contorno: bimestre ainda sem nota lançada. A média final é a média das notas dos
        bimestres, e a média da sala é a média final da turma na disciplina.
      </p>
    </div>
  );
}

const CLASSE_CELULA =
  "inline-flex min-w-14 items-center justify-center rounded-lg px-3 py-1.5 text-base font-semibold tabular-nums";

function detalheNota(linha: BoletimDTO) {
  const base = linha.notaFinal ?? linha.mediaCalculada;
  const partes = [];
  if (base !== null) partes.push(`Nota do bimestre ${formatarNota(base)}`);
  if (linha.pontosAtividades !== null)
    partes.push(`atividades ${formatarNota(linha.pontosAtividades)}`);
  return partes.join(" + ");
}

function conteudoCelula(linha: BoletimDTO | null, editable: boolean) {
  const nota = linha?.nota ?? null;
  if (linha && nota !== null) {
    const pontos = linha.pontosAtividades;
    return (
      <span className="inline-flex flex-col items-center gap-0.5" title={detalheNota(linha)}>
        <span
          className={cn(
            CLASSE_CELULA,
            linha.notaFinal !== null ? corFundo(nota) : cn("border-2 bg-card", corBorda(nota)),
          )}
        >
          {formatarNota(nota)}
        </span>
        {pontos !== null && pontos > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            +{formatarNota(pontos)} ativ.
          </span>
        )}
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
      title="Nota do bimestre e atividades"
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
  entregas,
  aoMudar,
}: {
  studentId: number;
  disciplina: DisciplinaRef;
  bimestre: Bimestre;
  linha: BoletimDTO | null;
  entregas: EntregaDTO[];
  aoMudar: () => void;
}) {
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>{disciplina.title}</DialogTitle>
        <DialogDescription>{nomeBimestre(bimestre)}</DialogDescription>
      </DialogHeader>

      <NotaBimestreForm
        key={`${linha?.notaFinal ?? ""}`}
        studentId={studentId}
        disciplina={disciplina}
        bimestre={bimestre}
        linha={linha}
        aoMudar={aoMudar}
      />

      <ResumoEntregas entregas={entregas} />

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border p-4">
        <span className="text-base font-semibold text-foreground">Nota do bimestre no boletim</span>
        <span className="text-sm text-muted-foreground">
          {linha ? detalheNota(linha) || "—" : "—"} ={" "}
          <strong className="text-lg tabular-nums text-foreground">
            {formatarNota(linha?.nota ?? null)}
          </strong>
        </span>
      </div>
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
              <span className="flex items-center gap-2">
                {e.pontos !== null && (
                  <span className="tabular-nums text-muted-foreground">
                    {e.pontosObtidos === null ? "—" : formatarNota(e.pontosObtidos)} /{" "}
                    {formatarNota(e.pontos)} pts
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-semibold",
                    STATUS_ENTREGA[e.status].classe,
                  )}
                >
                  {STATUS_ENTREGA[e.status].label}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Os pontos são lançados em Atividades → Marcar entregas.
      </p>
    </section>
  );
}

function NotaBimestreForm({
  studentId,
  disciplina,
  bimestre,
  linha,
  aoMudar,
}: {
  studentId: number;
  disciplina: DisciplinaRef;
  bimestre: Bimestre;
  linha: BoletimDTO | null;
  aoMudar: () => void;
}) {
  const notaFinal = linha?.notaFinal ?? null;
  const [valor, setValor] = useState(notaFinal === null ? "" : notaFinal.toFixed(1));
  const [salvando, setSalvando] = useState(false);

  async function lancar(e: FormEvent) {
    e.preventDefault();
    const numero = Number(valor.replace(",", "."));
    if (!valor.trim() || Number.isNaN(numero)) {
      toast.error("Informe uma nota válida.");
      return;
    }
    if (numero < 0 || numero > 10) {
      toast.error("A nota do bimestre deve estar entre 0 e 10.");
      return;
    }
    setSalvando(true);
    try {
      await lancarNotaFinal({
        studentId,
        disciplinaId: disciplina.id,
        bimestre,
        notaFinal: numero,
      });
      toast.success("Nota do bimestre lançada. O responsável recebe o aviso por e-mail.");
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao lançar a nota do bimestre.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!linha?.id) return;
    try {
      await removerNotaFinal(linha.id);
      toast.success("Nota do bimestre removida.");
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota do bimestre.");
    }
  }

  return (
    <form
      onSubmit={lancar}
      className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
    >
      <h4 className="text-base font-semibold text-foreground">Nota do bimestre</h4>
      <p className="text-sm text-muted-foreground">
        Digite a nota já calculada por você (provas, trabalhos e pesos). Os pontos das atividades
        são somados a ela automaticamente, até o limite de 10.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28 space-y-1">
          <label htmlFor="nota-bimestre" className="block text-sm font-medium text-foreground">
            Nota
          </label>
          <Input
            id="nota-bimestre"
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
          {salvando ? "Lançando..." : notaFinal !== null ? "Atualizar nota" : "Lançar nota"}
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
                <AlertDialogTitle>Remover a nota do bimestre?</AlertDialogTitle>
                <AlertDialogDescription>
                  {disciplina.title} no {nomeBimestre(bimestre)} fica só com os pontos das
                  atividades para o aluno e o responsável.
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
