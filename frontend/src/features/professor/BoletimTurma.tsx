import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { Card, CardContent } from "@/components/layout/blocos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getNotasDoAluno, type Bimestre } from "@/api/nota";
import type { BoletimDisciplinaDTO, BoletimDTO } from "@/api/boletim";
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
        // REFN: busca notas do aluno e reconstrói estrutura para exibição
        const notas = await getNotasDoAluno(studentId);
        if (ultimaCarga.current[studentId] !== carga) return;

        // REFN: agrupa notas por disciplina/bimestre
        const notasDaDisciplina = notas.filter((n) => n.disciplinaId === disciplina.id);

        if (notasDaDisciplina.length === 0) {
          setBoletins((atual) => ({
            ...atual,
            [studentId]: {
              estado: "ok",
              disciplina: {
                disciplinaId: disciplina.id,
                disciplinaTitle: disciplina.title,
                bimestres: [],
                mediaFinal: null,
              },
            },
          }));
          return;
        }

        // REFN: reconstrói estrutura BoletimDisciplinaDTO com médias por bimestre
        const bimestres = ["PRIMEIRO", "SEGUNDO", "TERCEIRO", "QUARTO"] as const;
        const bimestresData: BoletimDTO[] = [];

        for (const bimestre of bimestres) {
          const notasDoB = notasDaDisciplina.filter((n) => n.bimestre === bimestre);
          if (notasDoB.length === 0) continue;

          const media =
            notasDoB.reduce((sum, n) => sum + n.rate, 0) / notasDoB.length;

          bimestresData.push({
            id: null,
            studentId,
            disciplinaId: disciplina.id,
            disciplinaTitle: disciplina.title,
            bimestre,
            mediaCalculada: media,
            notaFinal: null,
            nota: media,
            lancadoEm: null,
            pontosAtividades: null,
          });
        }

        const mediaFinal = bimestresData.length > 0
          ? bimestresData.reduce((sum, b) => sum + (b.nota ?? 0), 0) / bimestresData.length
          : null;

        setBoletins((atual) => ({
          ...atual,
          [studentId]: {
            estado: "ok",
            disciplina: {
              disciplinaId: disciplina.id,
              disciplinaTitle: disciplina.title,
              bimestres: bimestresData,
              mediaFinal,
            },
          },
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
    [disciplina.id, disciplina.title],
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
                            {/* REFN: exibe média do bimestre (calculada das notas individuais) */}
                            <CelulaMedia valor={linhaDe(a.userId, c.bimestre)?.nota ?? null} />
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

function corTexto(valor: number) {
  if (valor >= NOTA_APROVACAO) return "text-success";
  if (valor >= NOTA_ATENCAO) return "text-warning";
  return "text-destructive";
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

