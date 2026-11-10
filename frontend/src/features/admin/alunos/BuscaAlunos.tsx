import { getStudents, type StudentMinDTO } from "@/api/alunos";
import { getTurmas, type TurmaDTO } from "@/api/turmas";
import { classeCabecalhoTabela, Iniciais, Painel } from "@/components/layout/LayoutAdmin";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { normalizar } from "@/lib/busca";
import { ChevronRight, School, Search } from "lucide-react";
import { useState } from "react";

const MAX_RESULTADOS_BUSCA = 8;

export function BuscaAlunos({
  abrir,
  verTurma,
}: {
  abrir: (a: StudentMinDTO) => void;
  verTurma: (turma: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const alunos = useCarga<StudentMinDTO[]>(getStudents, 0);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, 0);

  const termo = normalizar(busca.trim());
  const resultados =
    alunos.estado === "ok" && termo
      ? alunos.dados.filter(
          (s) =>
            normalizar(s.studentName ?? "").includes(termo) || String(s.matricula).includes(termo),
        )
      : [];
  const ordenadas =
    turmas.estado === "ok"
      ? [...turmas.dados].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      : [];

  return (
    <div className="space-y-6">
      <Painel>
        <div className="mx-auto max-w-2xl py-4 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="size-6" aria-hidden="true" />
          </span>
          <label
            htmlFor="busca-aluno"
            className="mt-3 block font-display text-lg font-semibold text-foreground"
          >
            Encontrar aluno
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite o nome ou a matrícula para abrir a ficha do aluno.
          </p>
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="busca-aluno"
            type="search"
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome ou a matrícula do aluno"
            className="h-12 pl-12 text-base"
          />
        </div>
        {termo && (
          <div className="mx-auto mt-3 max-w-2xl overflow-hidden rounded-md border border-border text-left">
            {alunos.estado === "carregando" && (
              <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
            )}
            {alunos.estado === "erro" && (
              <div className="p-4">
                <MensagemErro carga={alunos} />
              </div>
            )}
            {alunos.estado === "ok" && resultados.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum aluno encontrado para "{busca.trim()}".
              </p>
            )}
            {resultados.length > 0 && (
              <ul className="divide-y divide-border">
                {resultados.slice(0, MAX_RESULTADOS_BUSCA).map((s) => (
                  <li key={s.userId}>
                    <button
                      type="button"
                      onClick={() => abrir(s)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <Iniciais nome={s.anonimizado ? "" : (s.studentName ?? "")} />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {s.anonimizado ? "Aluno anonimizado" : s.studentName}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{s.matricula}</span>
                      <span className="hidden w-28 text-muted-foreground sm:block">
                        {s.turmaName ?? "Sem turma"}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {resultados.length > MAX_RESULTADOS_BUSCA && (
              <p className="border-t border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                Mais {resultados.length - MAX_RESULTADOS_BUSCA} aluno(s). Refine a busca ou use
                "Listar todos os alunos".
              </p>
            )}
          </div>
        )}
      </Painel>

      <Painel titulo="Turmas" icone={School} semEspaco>
        {turmas.estado === "carregando" && (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        )}
        {turmas.estado === "erro" && (
          <div className="p-4">
            <MensagemErro carga={turmas} />
          </div>
        )}
        {turmas.estado === "ok" && ordenadas.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma turma cadastrada ainda.
          </p>
        )}
        {ordenadas.length > 0 && (
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Turma</TableHead>
                <TableHead>Ano letivo</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Ver alunos</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenadas.map((t) => (
                <TableRow key={t.id} onClick={() => verTurma(t.name)} className="cursor-pointer">
                  <TableCell className="py-2.5 pl-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        verTurma(t.name);
                      }}
                      className="rounded font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.schoolYear}</TableCell>
                  <TableCell className="tabular-nums">{t.totalAlunos}</TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Painel>
    </div>
  );
}
