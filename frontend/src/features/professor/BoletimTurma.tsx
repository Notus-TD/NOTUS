import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { Card, CardContent } from "@/components/layout/blocos";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBoletimDoAluno,
  lancarNotaFinal,
  removerNotaFinal,
  type Bimestre,
  type BoletimDisciplinaDTO,
  type BoletimDTO,
} from "@/api/boletim";
import { ApiError } from "@/api/cliente";
import { nomeBimestre } from "@/lib/bimestres";
import { normalizar } from "@/lib/busca";
import { cn, media } from "@/lib/utils";

type DisciplinaRef = { id: number; title: string };
type CampoMedia = "mediaFinal";
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

const NOTA_APROVACAO = 7;
const NOTA_ATENCAO = 6;

type AlunoRef = { userId: number; studentName: string; matricula: number };
type BoletimDoAluno =
  | { estado: "carregando" }
  | { estado: "erro"; mensagem: string }
  | { estado: "ok"; disciplina: BoletimDisciplinaDTO | null };

export function BoletimTurma({
  alunos,
  disciplina,
  fechados = [],
}: {
  alunos: AlunoRef[];
  disciplina: DisciplinaRef;
  fechados?: Bimestre[];
}) {
  const [boletins, setBoletins] = useState<Record<number, BoletimDoAluno>>({});
  const [filtro, setFiltro] = useState("");
  const ultimaCarga = useRef<Record<number, number>>({});

  const carregarAluno = useCallback(
    async (studentId: number) => {
      const carga = (ultimaCarga.current[studentId] ?? 0) + 1;
      ultimaCarga.current[studentId] = carga;
      try {
        const boletim = await getBoletimDoAluno(studentId);
        if (ultimaCarga.current[studentId] !== carga) return;
        const daDisciplina = boletim.find((b) => b.disciplinaId === disciplina.id) ?? null;
        setBoletins((atual) => ({
          ...atual,
          [studentId]: { estado: "ok", disciplina: daDisciplina },
        }));
      } catch (e) {
        if (ultimaCarga.current[studentId] !== carga) return;
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

  function mediaDaSala(coluna: Coluna) {
    const valores = alunos.flatMap((a) => {
      const boletim = boletins[a.userId];
      if (boletim?.estado !== "ok") return [];
      const valor =
        coluna.tipo === "bimestre"
          ? (linhaDe(a.userId, coluna.bimestre)?.nota ?? null)
          : (boletim.disciplina?.[coluna.campo] ?? null);
      return valor === null ? [] : [valor];
    });
    return media(valores);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nome ou matrícula…"
          aria-label="Filtrar alunos da turma"
          className="h-9 pl-8 text-sm"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 bg-primary text-sm font-semibold">
                  Aluno
                </TableHead>
                {COLUNAS.map((c) => (
                  <TableHead
                    key={c.label}
                    className={cn("whitespace-nowrap text-center text-sm font-semibold")}
                  >
                    {c.label}
                    {c.tipo === "bimestre" && fechados.includes(c.bimestre) && (
                      <span className="block text-xs font-normal opacity-80">fechado</span>
                    )}
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
                      <span className="block whitespace-nowrap text-sm font-semibold text-foreground">
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
                            <NotaEditavel
                              studentId={a.userId}
                              disciplina={disciplina}
                              bimestre={c.bimestre}
                              linha={linhaDe(a.userId, c.bimestre)}
                              rotulo={`Nota de ${a.studentName} no ${c.label}`}
                              bloqueado={fechados.includes(c.bimestre)}
                              aoMudar={() => carregarAluno(a.userId)}
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
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    {alunos.length === 0
                      ? "Nenhum aluno ativo nesta turma."
                      : "Nenhum aluno encontrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {alunos.length > 0 && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="sticky left-0 z-10 bg-muted">
                    <span className="block whitespace-nowrap text-sm font-semibold text-foreground">
                      Média da sala
                    </span>
                    <span className="block text-sm font-normal text-muted-foreground">
                      {alunos.length} aluno(s)
                    </span>
                  </TableCell>
                  {COLUNAS.map((c) => (
                    <TableCell
                      key={c.label}
                      className={cn("text-center", c.tipo === "media" && "bg-primary/5")}
                    >
                      <CelulaMedia valor={mediaDaSala(c)} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
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
    return (
      <span
        className={cn(
          CLASSE_CELULA,
          linha.notaFinal !== null ? corFundo(nota) : cn("border-2 bg-card", corBorda(nota)),
        )}
      >
        {formatarNota(nota)}
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

function NotaEditavel({
  studentId,
  disciplina,
  bimestre,
  linha,
  rotulo,
  bloqueado,
  aoMudar,
}: {
  studentId: number;
  disciplina: DisciplinaRef;
  bimestre: Bimestre;
  linha: BoletimDTO | null;
  rotulo: string;
  bloqueado: boolean;
  aoMudar: () => Promise<void>;
}) {
  const notaFinal = linha?.notaFinal ?? null;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const finalizado = useRef(false);

  function iniciar() {
    finalizado.current = false;
    setValor(notaFinal === null ? "" : formatarNota(notaFinal));
    setEditando(true);
  }

  function cancelar() {
    finalizado.current = true;
    setEditando(false);
  }

  async function salvar() {
    if (finalizado.current) return;
    finalizado.current = true;

    const texto = valor.trim();
    if (!texto) {
      if (notaFinal === null) setEditando(false);
      else setConfirmandoRemocao(true);
      return;
    }
    const resultado = interpretarNota(texto);
    if ("erro" in resultado) {
      toast.error(resultado.erro);
      setEditando(false);
      return;
    }
    if (resultado.nota === notaFinal || texto === formatarNota(notaFinal)) {
      setEditando(false);
      return;
    }

    setSalvando(true);
    try {
      await lancarNotaFinal({
        studentId,
        disciplinaId: disciplina.id,
        bimestre,
        notaFinal: resultado.nota,
      });
      await aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao lançar a nota do bimestre.");
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  async function remover() {
    if (!linha?.id) return;
    setSalvando(true);
    try {
      await removerNotaFinal(linha.id);
      await aoMudar();
      toast.success("Nota do bimestre removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover a nota do bimestre.");
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  if (bloqueado) {
    return (
      <span
        title={`${nomeBimestre(bimestre)} fechado${linha ? `. ${detalheNota(linha)}` : ""}`}
        aria-label={`${rotulo}, bimestre fechado`}
        className="inline-block opacity-80"
      >
        {conteudoCelula(linha, false)}
      </span>
    );
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={iniciar}
        onFocus={iniciar}
        title={linha ? detalheNota(linha) || "Digitar nota" : "Digitar nota"}
        aria-label={rotulo}
        className="rounded-lg transition-all hover:scale-105 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {conteudoCelula(linha, true)}
      </button>
    );
  }

  return (
    <>
      <Input
        autoFocus
        inputMode="decimal"
        value={valor}
        disabled={salvando}
        onChange={(e) => setValor(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => void salvar()}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancelar();
          if (e.key === "Enter") {
            e.preventDefault();
            const texto = valor.trim();
            const resultado = texto ? interpretarNota(texto) : null;
            if (resultado && "erro" in resultado) {
              toast.error(resultado.erro);
              return;
            }
            const celulaAtual = e.currentTarget.closest("td");
            const abaixo =
              celulaAtual?.parentElement?.nextElementSibling?.children[
                celulaAtual.cellIndex
              ]?.querySelector("button");
            void salvar();
            if (texto) abaixo?.focus();
          }
        }}
        aria-label={rotulo}
        className="mx-auto h-9 w-16 px-1 text-center text-base font-semibold tabular-nums"
      />
      <AlertDialog
        open={confirmandoRemocao}
        onOpenChange={(aberto) => {
          if (aberto) return;
          setConfirmandoRemocao(false);
          setEditando(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover a nota do bimestre?</AlertDialogTitle>
            <AlertDialogDescription>
              {disciplina.title} no {nomeBimestre(bimestre)} fica só com os pontos das atividades
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
    </>
  );
}

function interpretarNota(texto: string): { nota: number } | { erro: string } {
  const numero = Number(texto.replace(",", "."));
  if (!texto.trim() || Number.isNaN(numero)) return { erro: "Informe uma nota válida." };
  if (numero < 0 || numero > 10) return { erro: "A nota do bimestre deve estar entre 0 e 10." };
  return { nota: numero };
}
