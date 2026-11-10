import { getAtividadesDaTurma, type AtividadeDTO } from "@/api/atividades";
import { ApiError } from "@/api/cliente";
import { type TurmaComDisciplinasDTO } from "@/api/turmas";
import { Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SecaoId } from "@/features/professor/PainelProfessor";
import { alunosAtivosDaTurma } from "@/features/professor/turma";
import { formatarData, hojeLocal } from "@/lib/datas";
import {
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

type ResumoTurma = { alunos: number; proximas: AtividadeDTO[] };

export function InicioProfessor({
  turmas,
  aoAbrir,
}: {
  turmas: TurmaComDisciplinasDTO[];
  aoAbrir: (turmaId: number, secao: Exclude<SecaoId, "inicio">) => void;
}) {
  const hoje = hojeLocal();
  const [resumos, setResumos] = useState<Record<number, ResumoTurma> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all(
      turmas.map(async (t) => {
        const ids = new Set(t.disciplinas.map((d) => d.id));
        const [alunos, atividades] = await Promise.all([
          alunosAtivosDaTurma(t.turmaId),
          getAtividadesDaTurma(t.turmaId),
        ]);
        const proximas = atividades
          .filter((a) => ids.has(a.disciplinaId) && a.prazo >= hoje)
          .sort((a, b) => a.prazo.localeCompare(b.prazo));
        return [t.turmaId, { alunos: alunos.length, proximas }] as const;
      }),
    )
      .then((pares) => ativo && setResumos(Object.fromEntries(pares)))
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar o resumo das turmas."),
      );
    return () => {
      ativo = false;
    };
  }, [turmas, hoje]);

  const prazos = turmas
    .flatMap((t) => (resumos?.[t.turmaId]?.proximas ?? []).map((a) => ({ turma: t, atividade: a })))
    .sort((a, b) => a.atividade.prazo.localeCompare(b.atividade.prazo))
    .slice(0, 5);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <Painel titulo="Minhas turmas" icone={Users} semEspaco className="lg:col-span-2">
        {erro && <p className="p-4 text-sm font-semibold text-destructive">{erro}</p>}
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Turma</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead className="text-right">Alunos</TableHead>
              <TableHead className="text-right">Ativ. em aberto</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turmas.map((t) => {
              const resumo = resumos?.[t.turmaId];
              return (
                <TableRow key={t.turmaId}>
                  <TableCell className="py-3 pl-4">
                    <span className="block font-medium text-foreground">{t.turmaName}</span>
                    <span className="block text-xs text-muted-foreground">{t.schoolYear}</span>
                  </TableCell>
                  <TableCell>{t.disciplinas.map((d) => d.title).join(", ")}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {resumo ? resumo.alunos : "…"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {resumo ? resumo.proximas.length : "…"}
                  </TableCell>
                  <TableCell className="pr-2">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Abrir ${t.turmaName}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => aoAbrir(t.turmaId, "chamada")}>
                          <ClipboardCheck className="size-4" aria-hidden="true" />
                          Chamada
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => aoAbrir(t.turmaId, "atividades")}>
                          <ClipboardList className="size-4" aria-hidden="true" />
                          Atividades
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => aoAbrir(t.turmaId, "notas")}>
                          <BarChart3 className="size-4" aria-hidden="true" />
                          Notas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Painel>

      <Painel titulo="Próximos prazos" icone={CalendarClock} semEspaco>
        {!erro && resumos === null && (
          <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
        )}
        {resumos && prazos.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhuma atividade com prazo em aberto nas suas turmas.
          </p>
        )}
        {prazos.length > 0 && (
          <ul className="divide-y divide-border">
            {prazos.map(({ turma, atividade }) => (
              <li key={atividade.id}>
                <button
                  type="button"
                  onClick={() => aoAbrir(turma.turmaId, "atividades")}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {atividade.prazo === hoje ? "Hoje" : formatarData(atividade.prazo).slice(0, 5)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {atividade.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {atividade.disciplinaTitle} no {turma.turmaName}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </div>
  );
}
