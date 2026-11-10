import { getStudents, type StatusMatricula, type StudentMinDTO } from "@/api/alunos";
import {
  classeCabecalhoTabela,
  Etiqueta,
  Iniciais,
  Paginacao,
  Painel,
} from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALUNOS_POR_PAGINA, rotuloSituacao, tomSituacao } from "@/features/admin/alunos/situacao";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { normalizar } from "@/lib/busca";
import { ChevronRight, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

export function ListaDeAlunos({
  abrir,
  turmaInicial,
}: {
  abrir: (a: StudentMinDTO) => void;
  turmaInicial?: string | undefined;
}) {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<"TODAS" | StatusMatricula>("TODAS");
  const [turma, setTurma] = useState(turmaInicial ?? "TODAS");
  const [pagina, setPagina] = useState(1);
  const carga = useCarga<StudentMinDTO[]>(getStudents, versao);
  const carregando = carga.estado === "carregando";

  const todos = carga.estado === "ok" ? carga.dados : [];
  const turmas = [...new Set(todos.map((s) => s.turmaName).filter((t): t is string => !!t))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
  const termo = normalizar(busca.trim());
  const filtrados = [...todos]
    .reverse()
    .sort((a, b) => Number(!!a.anonimizado) - Number(!!b.anonimizado))
    .filter((s) => situacao === "TODAS" || s.matriculaStatus === situacao)
    .filter((s) =>
      turma === "TODAS" ? true : turma === "SEM_TURMA" ? !s.turmaName : s.turmaName === turma,
    )
    .filter(
      (s) =>
        !termo ||
        normalizar(s.studentName ?? "").includes(termo) ||
        String(s.matricula).includes(termo),
    );
  const ultimaPagina = Math.max(1, Math.ceil(filtrados.length / ALUNOS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, ultimaPagina);
  const visiveis = filtrados.slice(
    (paginaAtual - 1) * ALUNOS_POR_PAGINA,
    paginaAtual * ALUNOS_POR_PAGINA,
  );
  const filtroAtivo = !!termo || situacao !== "TODAS" || turma !== "TODAS";

  return (
    <Painel
      semEspaco
      ferramentas={
        <>
          <div className="relative mr-auto w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome ou matrícula"
              aria-label="Buscar aluno"
              className="h-9 pl-9 text-sm"
            />
          </div>
          <Select
            value={situacao}
            onValueChange={(v) => {
              setSituacao(v as "TODAS" | StatusMatricula);
              setPagina(1);
            }}
          >
            <SelectTrigger className="h-9 w-40 text-sm" aria-label="Filtrar por situação">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as situações</SelectItem>
              <SelectItem value="ATIVA">Ativa</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={turma}
            onValueChange={(v) => {
              setTurma(v);
              setPagina(1);
            }}
          >
            <SelectTrigger className="h-9 w-44 text-sm" aria-label="Filtrar por turma">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as turmas</SelectItem>
              <SelectItem value="SEM_TURMA">Sem turma</SelectItem>
              {turmas.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setVersao((v) => v + 1)}
            disabled={carregando}
            aria-label="Atualizar lista"
            title="Atualizar lista"
          >
            <RefreshCw className={carregando ? "animate-spin" : ""} aria-hidden="true" />
          </Button>
        </>
      }
      rodape={
        carga.estado === "ok" && filtrados.length > 0 ? (
          <Paginacao
            pagina={paginaAtual}
            porPagina={ALUNOS_POR_PAGINA}
            total={filtrados.length}
            aoMudar={setPagina}
          />
        ) : undefined
      }
    >
      {carregando && <p className="p-6 text-sm text-muted-foreground">Carregando…</p>}
      {carga.estado === "erro" && (
        <div className="p-4">
          <MensagemErro carga={carga} />
        </div>
      )}
      {carga.estado === "ok" && filtrados.length === 0 && (
        <p className="p-10 text-center text-sm text-muted-foreground">
          {filtroAtivo
            ? "Nenhum aluno encontrado com esses filtros."
            : "Nenhum aluno cadastrado ainda."}
        </p>
      )}
      {carga.estado === "ok" && filtrados.length > 0 && (
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Aluno</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Abrir</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((s) => (
              <TableRow key={s.userId} onClick={() => abrir(s)} className="cursor-pointer">
                <TableCell className="py-2.5 pl-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrir(s);
                    }}
                    className="flex items-center gap-3 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Iniciais nome={s.anonimizado ? "" : (s.studentName ?? "")} />
                    <span
                      className={`font-medium ${s.anonimizado ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      {s.anonimizado ? "Aluno anonimizado" : s.studentName}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{s.matricula}</TableCell>
                <TableCell>
                  {s.turmaName ?? <span className="text-muted-foreground">Sem turma</span>}
                </TableCell>
                <TableCell>
                  {s.anonimizado ? (
                    <Etiqueta tom="neutro">Anonimizado</Etiqueta>
                  ) : (
                    <Etiqueta tom={tomSituacao[s.matriculaStatus]}>
                      {rotuloSituacao[s.matriculaStatus]}
                    </Etiqueta>
                  )}
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Painel>
  );
}
