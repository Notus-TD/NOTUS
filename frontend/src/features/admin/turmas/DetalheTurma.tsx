import { getStudents, type StudentMinDTO } from "@/api/alunos";
import { ApiError } from "@/api/cliente";
import {
  associarAlunosTurmaLote,
  deleteTurma,
  getTurma,
  removerAlunoTurma,
  updateTurma,
  type TurmaDetalheDTO,
  type TurmaDTO,
  type TurmaRequestDTO,
} from "@/api/turmas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/layout/blocos";
import { Etiqueta } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rotuloSituacao, tomSituacao } from "@/features/admin/alunos/situacao";
import { ConfirmarAcao } from "@/features/admin/comum/ConfirmarAcao";
import { agruparPorProfessor } from "@/features/admin/professores/vinculos";
import { FormularioTurma } from "@/features/admin/turmas/FormularioTurma";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { normalizar } from "@/lib/busca";
import { Pencil, Search, Trash2, UserPlus, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const ORIGEM_TODAS = "todas";

const ORIGEM_SEM_TURMA = "sem-turma";

export function DetalheTurma({
  turma,
  onAlterada,
  onExcluida,
}: {
  turma: TurmaDTO;
  onAlterada: () => void;
  onExcluida: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [filtroAlunos, setFiltroAlunos] = useState("");
  const [origem, setOrigem] = useState(ORIGEM_TODAS);
  const [ocupado, setOcupado] = useState(false);
  const detalhe = useCarga<TurmaDetalheDTO>(() => getTurma(turma.id), 0);
  const todos = useCarga<StudentMinDTO[]>(getStudents, 0);

  const idsNaTurma = new Set(
    detalhe.estado === "ok" ? detalhe.dados.alunos.map((a) => a.userId) : [],
  );
  const disponiveis =
    todos.estado === "ok"
      ? todos.dados
          .filter((s) => s.matriculaStatus === "ATIVA" && !idsNaTurma.has(s.userId))
          .sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR"))
      : [];
  const turmasDeOrigem = [
    ...new Map(
      disponiveis
        .filter((s) => s.turmaId !== null)
        .map((s) => [String(s.turmaId), s.turmaName ?? ""] as const),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const termoAlunos = normalizar(filtroAlunos.trim());
  const disponiveisFiltrados = disponiveis.filter(
    (s) =>
      (origem === ORIGEM_TODAS ||
        (origem === ORIGEM_SEM_TURMA ? s.turmaId === null : String(s.turmaId) === origem)) &&
      (!termoAlunos ||
        normalizar(s.studentName).includes(termoAlunos) ||
        String(s.matricula).includes(termoAlunos)),
  );
  const transferidos = disponiveis.filter(
    (s) => selecionados.has(s.userId) && s.turmaId !== null,
  ).length;
  const todosFiltradosMarcados =
    disponiveisFiltrados.length > 0 &&
    disponiveisFiltrados.every((s) => selecionados.has(s.userId));

  function alternarAluno(id: number, marcado: boolean) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  function alternarTodos(marcado: boolean) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      for (const s of disponiveisFiltrados) {
        if (marcado) novo.add(s.userId);
        else novo.delete(s.userId);
      }
      return novo;
    });
  }

  async function executar(acao: () => Promise<void>, erroPadrao: string) {
    setOcupado(true);
    try {
      await acao();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : erroPadrao);
    } finally {
      setOcupado(false);
    }
  }

  async function salvarEdicao(dados: TurmaRequestDTO) {
    const atualizada = await updateTurma(turma.id, dados);
    toast.success(`Turma ${atualizada.name} atualizada.`);
    setEditando(false);
    onAlterada();
  }

  function excluir() {
    executar(async () => {
      await deleteTurma(turma.id);
      toast.success(`Turma ${turma.name} excluída.`);
      onExcluida();
    }, "Erro ao excluir a turma.");
  }

  function adicionar(e: FormEvent) {
    e.preventDefault();
    const ids = disponiveis.filter((s) => selecionados.has(s.userId)).map((s) => s.userId);
    if (ids.length === 0) return;
    executar(async () => {
      await associarAlunosTurmaLote(turma.id, ids);
      toast.success(
        `${ids.length} aluno(s) adicionado(s) à turma ${turma.name}` +
          (transferidos > 0 ? `, ${transferidos} vindo(s) de outra turma.` : "."),
      );
      setSelecionados(new Set());
      onAlterada();
    }, "Erro ao adicionar os alunos à turma.");
  }

  function remover(aluno: StudentMinDTO) {
    executar(async () => {
      await removerAlunoTurma(turma.id, aluno.userId);
      toast.success(`${aluno.studentName} removido(a) da turma ${turma.name}.`);
      onAlterada();
    }, "Erro ao remover o aluno da turma.");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{turma.name}</p>
              <p className="text-sm text-muted-foreground">
                Ano letivo {turma.schoolYear}, {turma.totalAlunos}{" "}
                {turma.totalAlunos === 1 ? "aluno" : "alunos"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"

                onClick={() => setEditando(true)}
                disabled={editando || ocupado}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Button>
              <ConfirmarAcao
                titulo={`Excluir a turma ${turma.name}?`}
                descricao="A turma só pode ser excluída se não tiver alunos nem professores vinculados. Essa ação não pode ser desfeita."
                textoConfirmar="Sim, excluir"
                onConfirmar={excluir}
              >
                <Button variant="destructive" disabled={ocupado}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Excluir
                </Button>
              </ConfirmarAcao>
            </div>
          </div>
          {editando && (
            <FormularioTurma
              inicial={{ name: turma.name, schoolYear: turma.schoolYear }}
              textoBotao="Salvar alterações"
              onSalvar={salvarEdicao}
              onCancelar={() => setEditando(false)}
            />
          )}
        </CardContent>
      </Card>

      {detalhe.estado === "carregando" && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}
      {detalhe.estado === "erro" && <MensagemErro carga={detalhe} />}
      {detalhe.estado === "ok" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar alunos</CardTitle>
              </CardHeader>
              <CardContent>
                {todos.estado === "carregando" && (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                )}
                {todos.estado === "erro" && <MensagemErro carga={todos} />}
                {todos.estado === "ok" && (
                  <form onSubmit={adicionar} className="space-y-4">
                    {disponiveis.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum aluno ativo disponível para esta turma.
                      </p>
                    ) : (
                      <>
                        <Select value={origem} onValueChange={setOrigem}>
                          <SelectTrigger className="h-9 text-sm" aria-label="Turma de origem">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ORIGEM_TODAS}>Todos os alunos</SelectItem>
                            <SelectItem value={ORIGEM_SEM_TURMA}>Sem turma</SelectItem>
                            {turmasDeOrigem.map(([id, nome]) => (
                              <SelectItem key={id} value={id}>
                                Alunos do {nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <Input
                            type="search"
                            value={filtroAlunos}
                            onChange={(e) => setFiltroAlunos(e.target.value)}
                            placeholder="Filtrar por nome ou matrícula…"
                            aria-label="Filtrar alunos disponíveis"
                            className="h-9 pl-8 text-sm"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 border-b border-border px-1 pb-2 text-sm font-semibold text-foreground">
                          <Checkbox
                            checked={todosFiltradosMarcados}
                            onCheckedChange={(v) => alternarTodos(v === true)}
                            disabled={disponiveisFiltrados.length === 0}
                            className="size-4"
                          />
                          Selecionar todos
                        </label>
                        <ul className="relative max-h-72 divide-y divide-border overflow-y-auto">
                          {disponiveisFiltrados.map((s) => (
                            <li key={s.userId}>
                              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-muted">
                                <Checkbox
                                  checked={selecionados.has(s.userId)}
                                  onCheckedChange={(v) => alternarAluno(s.userId, v === true)}
                                  className="size-4"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-foreground">
                                    {s.studentName}
                                  </span>
                                  <span className="block text-sm text-muted-foreground">
                                    Matrícula {s.matricula} ·{" "}
                                    {s.turmaName ? `No ${s.turmaName}` : "Sem turma"}
                                  </span>
                                </span>
                              </label>
                            </li>
                          ))}
                          {disponiveisFiltrados.length === 0 && (
                            <li className="py-3 text-sm text-muted-foreground">
                              Nenhum aluno encontrado.
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                    {transferidos > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {transferidos === 1
                          ? "1 aluno selecionado já está em outra turma e será transferido para esta."
                          : `${transferidos} alunos selecionados já estão em outra turma e serão transferidos para esta.`}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={selecionados.size === 0 || ocupado}
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      {ocupado
                        ? "Salvando..."
                        : `Adicionar ${selecionados.size || ""} aluno(s) à turma ${turma.name}`}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professores da turma</CardTitle>
              </CardHeader>
              <CardContent>
                {detalhe.dados.lecionamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum professor vinculado a esta turma.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {agruparPorProfessor(detalhe.dados.lecionamentos).map((g) => (
                      <li key={g.professorId} className="py-3">
                        <p className="truncate text-sm font-semibold text-foreground">{g.nome}</p>
                        <p className="text-sm text-muted-foreground">{g.disciplinas.join(", ")}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alunos da turma</CardTitle>
            </CardHeader>
            <CardContent>
              {detalhe.dados.alunos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno nesta turma ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {detalhe.dados.alunos.map((s) => (
                    <li
                      key={s.userId}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {s.studentName}
                        </p>
                        <p className="text-sm text-muted-foreground">Matrícula {s.matricula}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <Etiqueta tom={tomSituacao[s.matriculaStatus]}>
                          {rotuloSituacao[s.matriculaStatus]}
                        </Etiqueta>
                        <ConfirmarAcao
                          titulo={`Remover ${s.studentName} da turma?`}
                          textoConfirmar="Sim, remover"
                          onConfirmar={() => remover(s)}
                        >
                          <Button
                            variant="outline"

                            disabled={ocupado}
                            aria-label={`Remover ${s.studentName} da turma`}
                          >
                            <UserRound className="size-4" aria-hidden="true" />
                            Remover
                          </Button>
                        </ConfirmarAcao>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
