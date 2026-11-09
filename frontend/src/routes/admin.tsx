import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  EyeOff,
  Link2,
  LayoutDashboard,
  Mail,
  Pencil,
  Plus,
  MailPlus,
  RefreshCw,
  School,
  Search,
  Send,
  Trash2,
  UserRound,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PainelLateral, Secao, type SecaoPainel } from "@/components/PainelLateral";
import { CadastroAlunoForm } from "@/components/CadastroAlunoForm";
import { ReativarAlunoForm } from "@/components/ReativarAlunoForm";
import { CadastroProfessorForm } from "@/components/CadastroProfessorForm";
import { DashboardAdmin } from "@/components/DashboardAdmin";
import { VisaoGeralAdmin } from "@/components/VisaoGeralAdmin";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/blocos";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  anonymizeUser,
  reenviarConvite,
  associarAlunosTurmaLote,
  createLecionamento,
  createTurma,
  deleteLecionamento,
  deleteTurma,
  getDisciplinas,
  criarDisciplina,
  atualizarDisciplina,
  deletarDisciplina,
  getLecionamentos,
  getProfessores,
  getStudents,
  getTurma,
  getTurmas,
  getUsuarios,
  removerAlunoTurma,
  updateTurma,
  getComunicados,
  publicarComunicado,
  getNotificacoes,
  reenviarNotificacao,
  getStudentDetalhe,
  updateStudent,
  updateResponsible,
  type ComunicadoDTO,
  type PublicoComunicado,
  type DisciplinaDTO,
  type LecionamentoDTO,
  type NotificacaoDTO,
  type ProfessorDTO,
  type StatusNotificacao,
  type StudentDetalheDTO,
  type StudentMinDTO,
  type TipoNotificacao,
  type TurmaDetalheDTO,
  type TurmaDTO,
  type TurmaRequestDTO,
  type PerfilUsuario,
  type UsuarioDTO,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { normalizar } from "@/lib/busca";
import {
  emailValido,
  formatarTelefone,
  somenteDigitos,
  telefoneValido,
  validarNascimento,
  validarNome,
} from "@/lib/validacao";
import { useCarga, MensagemErro } from "@/hooks/use-carga";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração · NOTUS" },
      {
        name: "description",
        content: "Painel administrativo: turmas, alunos matriculados, alunos novos e comunicados.",
      },
    ],
  }),
  component: PainelAdmin,
});

type SecaoId =
  | "dashboard"
  | "graficos"
  | "alunos"
  | "professores"
  | "turmas"
  | "disciplinas"
  | "usuarios"
  | "comunicados"
  | "notificacoes";

type ModoAlunos =
  { tipo: "lista" } | { tipo: "cadastro" } | { tipo: "ficha"; aluno: StudentMinDTO };

const itens: SecaoPainel<SecaoId>[] = [
  {
    id: "dashboard",
    label: "Visão geral",
    icon: LayoutDashboard,
  },
  {
    id: "graficos",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    id: "alunos",
    label: "Alunos",
    icon: Users,
  },
  {
    id: "professores",
    label: "Professores",
    icon: BookOpen,
  },
  {
    id: "turmas",
    label: "Turmas",
    icon: School,
  },
  {
    id: "disciplinas",
    label: "Disciplinas",
    icon: BookOpen,
  },
  {
    id: "usuarios",
    label: "Excluir usuários",
    icon: UserX,
  },
  {
    id: "comunicados",
    label: "Comunicados",
    icon: Mail,
  },
  {
    id: "notificacoes",
    label: "Notificações",
    icon: Bell,
  },
];

const titulos: Record<SecaoId, string> = {
  dashboard: "Visão geral",
  graficos: "Dashboard",
  alunos: "Alunos",
  professores: "Professores",
  turmas: "Turmas",
  disciplinas: "Disciplinas",
  usuarios: "Excluir usuários",
  comunicados: "Comunicados",
  notificacoes: "Notificações",
};

const titulosAlunos: Record<ModoAlunos["tipo"], string> = {
  lista: titulos.alunos,
  cadastro: "Cadastrar aluno",
  ficha: "Ficha do aluno",
};

function PainelAdmin() {
  const [secao, setSecao] = useState<SecaoId>("dashboard");
  const [modo, setModo] = useState<ModoAlunos>({ tipo: "lista" });
  const titulo =
    secao !== "alunos"
      ? titulos[secao]
      : modo.tipo === "ficha" && modo.aluno.anonimizado
        ? "Reativar aluno"
        : titulosAlunos[modo.tipo];

  function irParaAlunos(novoModo: ModoAlunos) {
    setModo(novoModo);
    setSecao("alunos");
  }

  function irPara(s: SecaoId) {
    setModo({ tipo: "lista" });
    setSecao(s);
  }

  return (
    <AppShell role="ROLE_ADMIN" titulo="Administração">
      <PainelLateral secoes={itens} secaoAtiva={secao} aoSelecionarSecao={irPara}>
        <Secao titulo={titulo}>
          {secao === "dashboard" && (
            <VisaoGeralAdmin
              aoCadastrarAluno={() => irParaAlunos({ tipo: "cadastro" })}
              aoAbrirAluno={(aluno) => irParaAlunos({ tipo: "ficha", aluno })}
              aoVerAlunos={() => irPara("alunos")}
              aoVerComunicados={() => irPara("comunicados")}
              formComunicado={<FormComunicado compacto />}
            />
          )}
          {secao === "graficos" && <DashboardAdmin />}
          {secao === "alunos" && <Alunos modo={modo} setModo={setModo} />}
          {secao === "professores" && <Professores />}
          {secao === "turmas" && <Turmas />}
          {secao === "disciplinas" && <Disciplinas />}
          {secao === "usuarios" && <ExcluirUsuarios />}
          {secao === "comunicados" && <Comunicados />}
          {secao === "notificacoes" && <Notificacoes />}
        </Secao>
      </PainelLateral>
    </AppShell>
  );
}

// Situação da matrícula como texto discreto (sem selo), no estilo simples do admin.
function BadgeStatus({ status }: { status: StudentMinDTO["matriculaStatus"] }) {
  return (
    <span
      className={`text-sm font-medium ${status === "ATIVA" ? "text-success" : "text-muted-foreground"}`}
    >
      {status === "ATIVA" ? "Ativa" : "Finalizada"}
    </span>
  );
}

function ListaAlunos({
  itens,
  onAbrir,
  vazio = "Nenhum aluno cadastrado ainda.",
}: {
  itens: StudentMinDTO[];
  onAbrir: (a: StudentMinDTO) => void;
  vazio?: string;
}) {
  if (itens.length === 0) return <p className="text-base text-muted-foreground">{vazio}</p>;
  return (
    <ul className="divide-y divide-border">
      {itens.map((s) => (
        <li key={s.userId}>
          <button
            type="button"
            onClick={() => onAbrir(s)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="min-w-0">
              <p
                className={`truncate text-lg font-semibold ${s.anonimizado ? "text-muted-foreground" : "text-foreground"}`}
              >
                {s.anonimizado ? "Aluno anonimizado" : s.studentName}
              </p>
              <p className="text-base text-muted-foreground">Matrícula {s.matricula}</p>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <BadgeStatus status={s.matriculaStatus} />
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Alunos({ modo, setModo }: { modo: ModoAlunos; setModo: (m: ModoAlunos) => void }) {
  const voltar = () => setModo({ tipo: "lista" });

  if (modo.tipo === "ficha" && modo.aluno.anonimizado) {
    return (
      <div className="space-y-6">
        <Button variant="outline" className="min-h-11 text-base" onClick={voltar}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          Voltar para a lista
        </Button>
        <ReativarAlunoForm aluno={modo.aluno} aoConcluir={voltar} />
      </div>
    );
  }
  if (modo.tipo === "ficha") return <FichaAluno aluno={modo.aluno} voltar={voltar} />;
  if (modo.tipo === "cadastro") {
    return (
      <div className="space-y-6">
        <Button variant="outline" className="min-h-11 text-base" onClick={voltar}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          Voltar para a lista
        </Button>
        <CadastroAlunoForm />
      </div>
    );
  }
  return (
    <ListaDeAlunos
      abrir={(a) => setModo({ tipo: "ficha", aluno: a })}
      cadastrar={() => setModo({ tipo: "cadastro" })}
    />
  );
}

function ListaDeAlunos({
  abrir,
  cadastrar,
}: {
  abrir: (a: StudentMinDTO) => void;
  cadastrar: () => void;
}) {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const carga = useCarga<StudentMinDTO[]>(getStudents, versao);

  const termo = busca.trim().toLowerCase();
  const filtrar = (lista: StudentMinDTO[]) =>
    [...lista]
      .reverse()
      .sort((a, b) => Number(!!a.anonimizado) - Number(!!b.anonimizado))
      .filter(
        (s) =>
          !termo ||
          (s.studentName ?? "").toLowerCase().includes(termo) ||
          String(s.matricula).includes(termo),
      );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou matrícula…"
            aria-label="Buscar aluno"
            className="h-11 pl-10 text-base"
          />
        </div>
        <Button
          variant="outline"
          className="min-h-11 text-base"
          onClick={() => setVersao((v) => v + 1)}
          disabled={carga.estado === "carregando"}
        >
          <RefreshCw
            className={`size-5 ${carga.estado === "carregando" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
        <Button className="min-h-11 text-base" onClick={cadastrar}>
          <UserPlus className="size-5" aria-hidden="true" />
          Cadastrar aluno
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          {carga.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {carga.estado === "erro" && <MensagemErro carga={carga} />}
          {carga.estado === "ok" && (
            <ListaAlunos
              itens={filtrar(carga.dados)}
              onAbrir={abrir}
              vazio={
                termo
                  ? `Nenhum aluno encontrado para "${busca.trim()}".`
                  : "Nenhum aluno cadastrado ainda."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BotaoReenviarConvite({ userId, nome }: { userId: number; nome: string }) {
  const [enviando, setEnviando] = useState(false);

  async function reenviar() {
    setEnviando(true);
    try {
      await reenviarConvite(userId);
      toast.success(`Convite reenviado para ${nome}. O link anterior deixou de valer.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao reenviar o convite.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="min-h-10 text-base"
      onClick={() => void reenviar()}
      disabled={enviando}
      aria-busy={enviando}
    >
      <MailPlus className="size-5" aria-hidden="true" />
      {enviando ? "Enviando..." : "Reenviar convite"}
    </Button>
  );
}

function BadgeAcessoPendente() {
  return (
    <span
      className="text-sm font-medium text-warning"
      title="Ainda não abriu o link de convite para criar a senha."
    >
      Acesso pendente
    </span>
  );
}

function BotaoAnonimizar({
  userId,
  nome,
  codigo,
  rotuloCodigo,
  aoConcluir,
  compacto = false,
}: {
  userId: number;
  nome: string;
  codigo: string;
  rotuloCodigo: string;
  aoConcluir?: () => void;
  compacto?: boolean;
}) {
  const [anonimizando, setAnonimizando] = useState(false);
  const [digitado, setDigitado] = useState("");
  const campoId = useId();
  const confere = digitado.trim() === codigo;

  async function confirmar() {
    if (!confere) return;
    setAnonimizando(true);
    try {
      await anonymizeUser(userId, digitado.trim());
      toast.success(`Dados de ${nome} anonimizados.`);
      aoConcluir?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao anonimizar os dados do usuário.",
      );
    } finally {
      setAnonimizando(false);
    }
  }

  return (
    <AlertDialog
      onOpenChange={(aberto) => {
        if (!aberto) setDigitado("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          // Na lista (compacto) o botão é contornado, para a tela não ficar toda vermelha;
          // a confirmação continua no diálogo.
          variant={compacto ? "outline" : "destructive"}
          className={
            compacto
              ? "min-h-10 border-destructive/40 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "min-h-11 text-base"
          }
          disabled={anonimizando}
        >
          <EyeOff className="size-5" aria-hidden="true" />
          {anonimizando ? "Anonimizando..." : "Anonimizar dados"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anonimizar {nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Nome, e-mail, senha e dados de contato serão apagados permanentemente. Ficam só o
            registro e, no caso de aluno, a matrícula, ligados ao histórico escolar. Isso não pode
            ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor={campoId} className="block text-sm font-medium text-foreground">
            Para confirmar, digite {rotuloCodigo}:{" "}
            <strong className="tabular-nums">{codigo}</strong>
          </label>
          <Input
            id={campoId}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-base"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            disabled={!confere || anonimizando}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, anonimizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const nomeProfessor = (l: LecionamentoDTO) => l.professorName ?? l.professorEmail;

// Igual ao back: cada disciplina pode ter até dois professores na mesma turma.
const MAX_PROFESSORES_POR_DISCIPLINA = 2;

function Professores() {
  const [versao, setVersao] = useState(0);
  const [cadastrando, setCadastrando] = useState(false);
  const [busca, setBusca] = useState("");
  const professores = useCarga<ProfessorDTO[]>(getProfessores, versao);
  const lecionamentos = useCarga<LecionamentoDTO[]>(getLecionamentos, versao);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const disciplinas = useCarga<DisciplinaDTO[]>(getDisciplinas, versao);
  const cargas = [professores, lecionamentos, turmas, disciplinas];
  const carregando = cargas.some((c) => c.estado === "carregando");
  const erro = cargas.find((c) => c.estado === "erro");
  const atualizar = () => setVersao((v) => v + 1);

  async function remover(l: LecionamentoDTO) {
    try {
      await deleteLecionamento(l.id);
      toast.success(`${nomeProfessor(l)} não leciona mais ${l.disciplinaTitle} no ${l.turmaName}.`);
      atualizar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover o vínculo.");
    }
  }

  const termo = normalizar(busca.trim());
  const vinculosDe = (professorId: number) =>
    lecionamentos.estado === "ok"
      ? lecionamentos.dados
          .filter((l) => l.professorId === professorId)
          .sort(
            (a, b) =>
              a.turmaName.localeCompare(b.turmaName) ||
              a.disciplinaTitle.localeCompare(b.disciplinaTitle),
          )
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            aria-label="Buscar professor"
            className="h-11 pl-10 text-base"
          />
        </div>
        <Button
          variant="outline"
          className="min-h-11 text-base"
          onClick={atualizar}
          disabled={carregando}
        >
          <RefreshCw className={`size-5 ${carregando ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
        <Button
          className="min-h-11 text-base"
          onClick={() => setCadastrando(true)}
          disabled={cadastrando}
        >
          <UserPlus className="size-5" aria-hidden="true" />
          Cadastrar professor
        </Button>
      </div>

      {cadastrando && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Novo professor</CardTitle>
            <CardDescription className="text-base">
              O professor entra no portal com o e-mail e, no primeiro acesso, a senha igual ao
              e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CadastroProfessorForm
              onSucesso={() => {
                setCadastrando(false);
                atualizar();
              }}
              onCancelar={() => setCadastrando(false)}
            />
          </CardContent>
        </Card>
      )}

      {erro?.estado === "erro" && <MensagemErro carga={erro} />}

      {professores.estado === "ok" &&
        lecionamentos.estado === "ok" &&
        turmas.estado === "ok" &&
        disciplinas.estado === "ok" && (
          <VincularProfessor
            professores={professores.dados}
            turmas={turmas.dados}
            disciplinas={disciplinas.dados}
            lecionamentos={lecionamentos.dados}
            onVinculado={atualizar}
          />
        )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Professores cadastrados</CardTitle>
          <CardDescription className="text-base">
            Turmas e disciplinas em que cada professor leciona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {professores.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {professores.estado === "ok" &&
            (() => {
              const filtrados = professores.dados.filter(
                (p) => !termo || normalizar(`${p.fullName} ${p.email}`).includes(termo),
              );
              if (filtrados.length === 0)
                return (
                  <p className="text-base text-muted-foreground">
                    {termo
                      ? `Nenhum professor encontrado para "${busca.trim()}".`
                      : "Nenhum professor cadastrado ainda."}
                  </p>
                );
              return (
                <ul className="divide-y divide-border">
                  {filtrados.map((p) => {
                    const vinculos = vinculosDe(p.id);
                    return (
                      <li key={p.id} className="space-y-2 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                              <span className="truncate">{p.fullName}</span>
                              {p.acessoPendente && <BadgeAcessoPendente />}
                            </p>
                            <p className="truncate text-base text-muted-foreground">{p.email}</p>
                          </div>
                          {p.acessoPendente && (
                            <BotaoReenviarConvite userId={p.id} nome={p.fullName} />
                          )}
                        </div>
                        {vinculos.length === 0 ? (
                          <p className="text-base text-muted-foreground">
                            Ainda não leciona em nenhuma turma.
                          </p>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {vinculos.map((l) => (
                              <li
                                key={l.id}
                                className="flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-sm font-medium text-foreground"
                              >
                                {l.disciplinaTitle} no {l.turmaName}
                                <ConfirmarAcao
                                  titulo="Tem certeza que deseja desvincular esse professor?"
                                  textoConfirmar="Desvincular"
                                  onConfirmar={() => void remover(l)}
                                >
                                  <button
                                    type="button"
                                    aria-label={`Remover ${l.disciplinaTitle} do ${l.turmaName}`}
                                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <X className="size-4" aria-hidden="true" />
                                  </button>
                                </ConfirmarAcao>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
        </CardContent>
      </Card>
    </div>
  );
}

// Um item por professor da turma, em ordem alfabética, com as disciplinas que ele leciona nela.
function agruparPorProfessor(
  lecionamentos: LecionamentoDTO[],
): { professorId: number; nome: string; disciplinas: string[] }[] {
  const grupos = new Map<number, { professorId: number; nome: string; disciplinas: string[] }>();
  for (const l of lecionamentos) {
    const grupo = grupos.get(l.professorId);
    if (grupo) grupo.disciplinas.push(l.disciplinaTitle);
    else
      grupos.set(l.professorId, {
        professorId: l.professorId,
        nome: nomeProfessor(l),
        disciplinas: [l.disciplinaTitle],
      });
  }
  return [...grupos.values()]
    .map((g) => ({
      ...g,
      disciplinas: [...g.disciplinas].sort((a, b) => a.localeCompare(b, "pt-BR")),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function VincularProfessor({
  professores,
  turmas,
  disciplinas,
  lecionamentos,
  onVinculado,
}: {
  professores: ProfessorDTO[];
  turmas: TurmaDTO[];
  disciplinas: DisciplinaDTO[];
  lecionamentos: LecionamentoDTO[];
  onVinculado: () => void;
}) {
  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Cada disciplina tem até dois professores por turma: com dois, ou se o professor escolhido
  // já leciona nela, a disciplina aparece desabilitada.
  const professoresPorDisciplina = new Map<number, LecionamentoDTO[]>();
  for (const l of lecionamentos) {
    if (String(l.turmaId) !== turmaId) continue;
    professoresPorDisciplina.set(l.disciplinaId, [
      ...(professoresPorDisciplina.get(l.disciplinaId) ?? []),
      l,
    ]);
  }
  const indisponivel = (id: number) => {
    const atuais = professoresPorDisciplina.get(id) ?? [];
    return (
      atuais.length >= MAX_PROFESSORES_POR_DISCIPLINA ||
      atuais.some((l) => String(l.professorId) === professorId)
    );
  };
  const valido =
    professorId !== "" &&
    turmaId !== "" &&
    disciplinaId !== "" &&
    !indisponivel(Number(disciplinaId));

  async function vincular(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      const criado = await createLecionamento({
        professorId: Number(professorId),
        turmaId: Number(turmaId),
        disciplinaId: Number(disciplinaId),
      });
      toast.success(
        `${nomeProfessor(criado)} agora leciona ${criado.disciplinaTitle} no ${criado.turmaName}.`,
      );
      setDisciplinaId("");
      onVinculado();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao vincular o professor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Vincular professor a uma turma</CardTitle>
        <CardDescription className="text-base">
          Escolha o professor, a turma e a disciplina que ele vai lecionar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={vincular}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <div className="space-y-2">
            <label className="block text-base font-semibold text-foreground">Professor</label>
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger className="h-11 text-base" aria-label="Professor">
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-base font-semibold text-foreground">Turma</label>
            <Select
              value={turmaId}
              onValueChange={(v) => {
                setTurmaId(v);
                setDisciplinaId("");
              }}
            >
              <SelectTrigger className="h-11 text-base" aria-label="Turma">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}, {t.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-base font-semibold text-foreground">Disciplina</label>
            <Select value={disciplinaId} onValueChange={setDisciplinaId} disabled={turmaId === ""}>
              <SelectTrigger className="h-11 text-base" aria-label="Disciplina">
                <SelectValue
                  placeholder={
                    turmaId === "" ? "Escolha a turma primeiro" : "Selecione a disciplina"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => {
                  const atuais = professoresPorDisciplina.get(d.id) ?? [];
                  const nomes = atuais.map(nomeProfessor).join(" e ");
                  return (
                    <SelectItem key={d.id} value={String(d.id)} disabled={indisponivel(d.id)}>
                      {nomes ? `${d.title} (${nomes})` : d.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="min-h-11 text-base sm:col-span-2 lg:col-span-1"
            disabled={!valido || salvando}
          >
            <Link2 className="size-5" aria-hidden="true" />
            {salvando ? "Vinculando..." : "Vincular"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Turmas() {
  const [versao, setVersao] = useState(0);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const turmaAtual =
    turmas.estado === "ok" ? (turmas.dados.find((t) => t.id === turmaId) ?? null) : null;
  const atualizar = () => setVersao((v) => v + 1);

  async function criar(dados: TurmaRequestDTO) {
    const criada = await createTurma(dados);
    toast.success(`Turma ${criada.name} criada.`);
    setCriando(false);
    setTurmaId(criada.id);
    atualizar();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-md space-y-2">
          <label className="block text-lg font-semibold text-foreground">Turma</label>
          {turmas.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {turmas.estado === "erro" && <MensagemErro carga={turmas} />}
          {turmas.estado === "ok" && (
            <Select
              value={turmaId ? String(turmaId) : ""}
              onValueChange={(v) => setTurmaId(Number(v))}
            >
              <SelectTrigger className="h-12 text-lg" aria-label="Turma">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.dados.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} de {t.schoolYear}, {t.totalAlunos}{" "}
                    {t.totalAlunos === 1 ? "aluno" : "alunos"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          variant="outline"
          className="min-h-12 text-base"
          onClick={atualizar}
          disabled={turmas.estado === "carregando"}
        >
          <RefreshCw
            className={`size-5 ${turmas.estado === "carregando" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
        <Button className="min-h-12 text-base" onClick={() => setCriando(true)} disabled={criando}>
          <Plus className="size-5" aria-hidden="true" />
          Nova turma
        </Button>
      </div>

      {criando && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nova turma</CardTitle>
            <CardDescription className="text-base">
              Não pode existir outra turma com o mesmo nome no mesmo ano letivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioTurma
              textoBotao="Criar turma"
              onSalvar={criar}
              onCancelar={() => setCriando(false)}
            />
          </CardContent>
        </Card>
      )}

      {turmaAtual ? (
        <DetalheTurma
          key={`${turmaAtual.id}-${versao}`}
          turma={turmaAtual}
          onAlterada={atualizar}
          onExcluida={() => {
            setTurmaId(null);
            atualizar();
          }}
        />
      ) : (
        !criando && (
          <Card>
            <CardContent className="p-6">
              <p className="text-base text-muted-foreground">
                Selecione uma turma para ver os alunos e professores, ou crie uma nova.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

function FormularioTurma({
  inicial,
  textoBotao,
  onSalvar,
  onCancelar,
}: {
  inicial?: TurmaRequestDTO;
  textoBotao: string;
  onSalvar: (dados: TurmaRequestDTO) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(inicial?.name ?? "");
  const [schoolYear, setSchoolYear] = useState(
    inicial?.schoolYear ?? String(new Date().getFullYear()),
  );
  const [salvando, setSalvando] = useState(false);
  const valido = name.trim() !== "" && schoolYear.trim() !== "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      await onSalvar({ name: name.trim(), schoolYear: schoolYear.trim() });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a turma.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="grid gap-4 sm:grid-cols-[1fr_10rem] lg:grid-cols-[1fr_10rem_auto] lg:items-end"
    >
      <div className="space-y-2">
        <label htmlFor={`${id}-nome`} className="block text-base font-semibold text-foreground">
          Nome da turma
        </label>
        <Input
          id={`${id}-nome`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: 9º Ano A"
          className="h-11 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-ano`} className="block text-base font-semibold text-foreground">
          Ano letivo
        </label>
        <Input
          id={`${id}-ano`}
          value={schoolYear}
          onChange={(e) => setSchoolYear(e.target.value)}
          inputMode="numeric"
          maxLength={4}
          className="h-11 text-base"
          required
        />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="min-h-11 text-base" disabled={!valido || salvando}>
          {salvando ? "Salvando..." : textoBotao}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 text-base" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ConfirmarAcao({
  titulo,
  descricao,
  textoConfirmar,
  onConfirmar,
  children,
}: {
  titulo: string;
  descricao?: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent {...(descricao ? {} : { "aria-describedby": undefined })}>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          {descricao && <AlertDialogDescription>{descricao}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Valores do filtro de turma de origem que não são ids de turma.
const ORIGEM_TODAS = "todas";
const ORIGEM_SEM_TURMA = "sem-turma";

function DetalheTurma({
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
  // Turmas de onde vêm os alunos disponíveis, para filtrar (ex.: trazer todo o 6º ano para o 7º).
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
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-bold text-foreground">
                {turma.name}
              </p>
              <p className="text-base text-muted-foreground">
                Ano letivo {turma.schoolYear}, {turma.totalAlunos}{" "}
                {turma.totalAlunos === 1 ? "aluno" : "alunos"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-h-11 text-base"
                onClick={() => setEditando(true)}
                disabled={editando || ocupado}
              >
                <Pencil className="size-5" aria-hidden="true" />
                Editar
              </Button>
              <ConfirmarAcao
                titulo={`Excluir a turma ${turma.name}?`}
                descricao="A turma só pode ser excluída se não tiver alunos nem professores vinculados. Essa ação não pode ser desfeita."
                textoConfirmar="Sim, excluir"
                onConfirmar={excluir}
              >
                <Button variant="destructive" className="min-h-11 text-base" disabled={ocupado}>
                  <Trash2 className="size-5" aria-hidden="true" />
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
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {detalhe.estado === "erro" && <MensagemErro carga={detalhe} />}
      {detalhe.estado === "ok" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Adicionar alunos</CardTitle>
              </CardHeader>
              <CardContent>
                {todos.estado === "carregando" && (
                  <p className="text-base text-muted-foreground">Carregando…</p>
                )}
                {todos.estado === "erro" && <MensagemErro carga={todos} />}
                {todos.estado === "ok" && (
                  <form onSubmit={adicionar} className="space-y-4">
                    {disponiveis.length === 0 ? (
                      <p className="text-base text-muted-foreground">
                        Nenhum aluno ativo disponível para esta turma.
                      </p>
                    ) : (
                      <>
                        <Select value={origem} onValueChange={setOrigem}>
                          <SelectTrigger className="h-12 text-lg" aria-label="Turma de origem">
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
                            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <Input
                            type="search"
                            value={filtroAlunos}
                            onChange={(e) => setFiltroAlunos(e.target.value)}
                            placeholder="Filtrar por nome ou matrícula…"
                            aria-label="Filtrar alunos disponíveis"
                            className="h-12 pl-10 text-lg"
                          />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 border-b border-border px-1 pb-2 text-base font-semibold text-foreground">
                          <Checkbox
                            checked={todosFiltradosMarcados}
                            onCheckedChange={(v) => alternarTodos(v === true)}
                            disabled={disponiveisFiltrados.length === 0}
                            className="size-5"
                          />
                          Selecionar todos
                        </label>
                        <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                          {disponiveisFiltrados.map((s) => (
                            <li key={s.userId}>
                              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-muted">
                                <Checkbox
                                  checked={selecionados.has(s.userId)}
                                  onCheckedChange={(v) => alternarAluno(s.userId, v === true)}
                                  className="size-5"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-lg text-foreground">
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
                            <li className="py-3 text-base text-muted-foreground">
                              Nenhum aluno encontrado.
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                    {transferidos > 0 && (
                      <p className="text-base text-muted-foreground">
                        {transferidos === 1
                          ? "1 aluno selecionado já está em outra turma e será transferido para esta."
                          : `${transferidos} alunos selecionados já estão em outra turma e serão transferidos para esta.`}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="min-h-11 w-full text-base"
                      disabled={selecionados.size === 0 || ocupado}
                    >
                      <UserPlus className="size-5" aria-hidden="true" />
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
                <CardTitle className="text-xl">Professores da turma</CardTitle>
              </CardHeader>
              <CardContent>
                {detalhe.dados.lecionamentos.length === 0 ? (
                  <p className="text-base text-muted-foreground">
                    Nenhum professor vinculado a esta turma.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {agruparPorProfessor(detalhe.dados.lecionamentos).map((g) => (
                      <li key={g.professorId} className="py-3">
                        <p className="truncate text-lg font-semibold text-foreground">{g.nome}</p>
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
              <CardTitle className="text-xl">Alunos da turma</CardTitle>
            </CardHeader>
            <CardContent>
              {detalhe.dados.alunos.length === 0 ? (
                <p className="text-base text-muted-foreground">Nenhum aluno nesta turma ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {detalhe.dados.alunos.map((s) => (
                    <li
                      key={s.userId}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-foreground">
                          {s.studentName}
                        </p>
                        <p className="text-base text-muted-foreground">Matrícula {s.matricula}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <BadgeStatus status={s.matriculaStatus} />
                        <ConfirmarAcao
                          titulo={`Remover ${s.studentName} da turma?`}
                          textoConfirmar="Sim, remover"
                          onConfirmar={() => remover(s)}
                        >
                          <Button
                            variant="outline"
                            className="min-h-10 text-base"
                            disabled={ocupado}
                            aria-label={`Remover ${s.studentName} da turma`}
                          >
                            <UserRound className="size-5" aria-hidden="true" />
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

const PERFIS: Record<PerfilUsuario, string> = {
  ALUNO: "Aluno",
  RESPONSAVEL: "Responsável",
};

function descricaoUsuario(u: UsuarioDTO) {
  const matricula = u.matricula === null ? "" : `, matrícula ${u.matricula}`;
  return `${PERFIS[u.perfil]}${matricula}, registro ${u.id}`;
}

function ExcluirUsuarios() {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario | "TODOS">("TODOS");
  const carga = useCarga<UsuarioDTO[]>(getUsuarios, versao);

  const termo = busca.trim().toLowerCase();
  const filtrados =
    carga.estado === "ok"
      ? carga.dados.filter(
          (u) =>
            (perfil === "TODOS" || u.perfil === perfil) &&
            (!termo ||
              (u.nome ?? "").toLowerCase().includes(termo) ||
              String(u.matricula ?? "").includes(termo) ||
              String(u.id).includes(termo)),
        )
      : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula ou registro…"
            aria-label="Buscar usuário"
            className="h-11 pl-10 text-base"
          />
        </div>
        <Select value={perfil} onValueChange={(v) => setPerfil(v as PerfilUsuario | "TODOS")}>
          <SelectTrigger className="h-11 w-48 text-base" aria-label="Filtrar por perfil">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os perfis</SelectItem>
            {(Object.keys(PERFIS) as PerfilUsuario[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERFIS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-6">
          {carga.estado === "carregando" && (
            <p className="text-base text-muted-foreground">Carregando…</p>
          )}
          {carga.estado === "erro" && <MensagemErro carga={carga} />}
          {carga.estado === "ok" && filtrados.length === 0 && (
            <p className="text-base text-muted-foreground">
              {termo
                ? `Nenhum usuário encontrado para "${busca.trim()}".`
                : "Nenhum usuário cadastrado ainda."}
            </p>
          )}
          {carga.estado === "ok" && filtrados.length > 0 && (
            <ul className="divide-y divide-border">
              {filtrados.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p
                      className={`flex flex-wrap items-center gap-2 text-lg font-semibold ${u.anonimizado ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      <span className="truncate">
                        {u.anonimizado ? "Anonimizado" : (u.nome ?? "Sem nome")}
                      </span>
                      {!u.anonimizado && u.acessoPendente && <BadgeAcessoPendente />}
                    </p>
                    <p className="text-base text-muted-foreground">{descricaoUsuario(u)}</p>
                  </div>
                  {u.anonimizado ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      Dados apagados
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {u.acessoPendente && (
                        <BotaoReenviarConvite
                          userId={u.id}
                          nome={u.nome ?? `o registro nº ${u.id}`}
                        />
                      )}
                      <BotaoAnonimizar
                        userId={u.id}
                        nome={u.nome ?? `o registro nº ${u.id}`}
                        codigo={String(u.matricula ?? u.id)}
                        rotuloCodigo={u.matricula === null ? "o registro" : "a matrícula"}
                        compacto
                        aoConcluir={() => setVersao((v) => v + 1)}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FichaAluno({ aluno, voltar }: { aluno: StudentMinDTO; voltar: () => void }) {
  const [versao, setVersao] = useState(0);
  const [editando, setEditando] = useState(false);
  const detalhe = useCarga<StudentDetalheDTO>(() => getStudentDetalhe(aluno.userId), versao);

  function salvou() {
    setEditando(false);
    setVersao((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" className="min-h-11 text-base" onClick={voltar}>
        <ArrowLeft className="size-5" aria-hidden="true" />
        Voltar para a lista
      </Button>

      {detalhe.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {detalhe.estado === "erro" && <MensagemErro carga={detalhe} />}
      {detalhe.estado === "ok" && !editando && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="font-display text-2xl">{detalhe.dados.fullName}</CardTitle>
                <CardDescription className="text-base">
                  Matrícula {detalhe.dados.matricula}, registro {detalhe.dados.userId}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <BadgeStatus status={detalhe.dados.matriculaStatus} />
                <Button
                  variant="outline"
                  className="min-h-9 text-sm"
                  onClick={() => setEditando(true)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dado rotulo="E-mail escolar" valor={detalhe.dados.educationalEmail} />
              <Dado
                rotulo="Data de nascimento"
                valor={new Date(`${detalhe.dados.birthDate}T00:00:00`).toLocaleDateString("pt-BR")}
              />
              <Dado rotulo="Turma" valor={detalhe.dados.turmaName ?? "Sem turma"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Responsável</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dado rotulo="Nome" valor={detalhe.dados.responsibleName ?? "—"} />
              <Dado rotulo="Telefone" valor={formatarTelefone(detalhe.dados.responsiblePhone ?? "")} />
              <Dado rotulo="E-mail" valor={detalhe.dados.responsibleEmail ?? "—"} />
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">Dados do aluno cadastrados na escola.</p>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Zona de risco</CardTitle>
              <CardDescription className="text-base">
                Apaga nome, e-mail, nascimento e senha do aluno, encerra a matrícula e tira o vínculo
                com a turma e o responsável. Ficam só o registro e a matrícula, ligados ao histórico
                escolar. Ação irreversível, usada para atender pedidos de exclusão de dados (LGPD).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BotaoAnonimizar
                userId={detalhe.dados.userId}
                nome={detalhe.dados.fullName}
                codigo={String(detalhe.dados.matricula)}
                rotuloCodigo="a matrícula"
                aoConcluir={voltar}
              />
            </CardContent>
          </Card>
        </>
      )}
      {detalhe.estado === "ok" && editando && (
        <FormularioEdicaoAluno
          detalhe={detalhe.dados}
          onSalvo={salvou}
          onCancelar={() => setEditando(false)}
        />
      )}
    </div>
  );
}

/** RF01 Alterar: edita os dados cadastrais do aluno e, se houver, do responsável (só o admin acessa esta tela). */
function FormularioEdicaoAluno({
  detalhe,
  onSalvo,
  onCancelar,
}: {
  detalhe: StudentDetalheDTO;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(detalhe.fullName);
  const [email, setEmail] = useState(detalhe.educationalEmail);
  const [matricula, setMatricula] = useState(String(detalhe.matricula));
  const [nascimento, setNascimento] = useState(detalhe.birthDate);
  const [respNome, setRespNome] = useState(detalhe.responsibleName ?? "");
  const [respEmail, setRespEmail] = useState(detalhe.responsibleEmail ?? "");
  const [respTelefone, setRespTelefone] = useState(formatarTelefone(detalhe.responsiblePhone ?? ""));
  type ErrosEdicao = {
    nome?: string;
    email?: string;
    matricula?: string;
    nascimento?: string;
    respNome?: string;
    respEmail?: string;
    respTelefone?: string;
  };
  const [erros, setErros] = useState<ErrosEdicao>({});
  const [salvando, setSalvando] = useState(false);

  function validar(): ErrosEdicao {
    const novosErros: ErrosEdicao = {};
    const erroNome = validarNome(nome.trim());
    if (erroNome) novosErros.nome = erroNome;
    if (!emailValido(email)) novosErros.email = "Informe um e-mail válido (ex.: nome@dominio.com).";
    if (!/^\d+$/.test(matricula.trim())) novosErros.matricula = "Informe só números.";
    const erroNascimento = validarNascimento(nascimento);
    if (erroNascimento) novosErros.nascimento = erroNascimento;
    if (detalhe.responsibleId !== null) {
      const erroRespNome = validarNome(respNome.trim());
      if (erroRespNome) novosErros.respNome = erroRespNome;
      if (!emailValido(respEmail)) novosErros.respEmail = "Informe um e-mail válido.";
      if (!telefoneValido(respTelefone)) novosErros.respTelefone = "Informe DDD + número (10 ou 11 dígitos).";
    }
    return novosErros;
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    try {
      await updateStudent(detalhe.userId, {
        fullName: nome.trim(),
        educationalEmail: email.trim(),
        matricula: Number(matricula.trim()),
        birthDate: nascimento,
      });
      if (detalhe.responsibleId !== null) {
        await updateResponsible(detalhe.responsibleId, {
          name: respNome.trim(),
          email: respEmail.trim(),
          phone: somenteDigitos(respTelefone),
        });
      }
      toast.success("Cadastro atualizado.");
      onSalvo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dados do aluno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Nome completo" valor={nome} onChange={setNome} erro={erros.nome} />
          <CampoTexto rotulo="E-mail escolar" valor={email} onChange={setEmail} erro={erros.email} />
          <CampoTexto rotulo="Matrícula" valor={matricula} onChange={setMatricula} erro={erros.matricula} />
          <CampoTexto
            rotulo="Data de nascimento"
            tipo="date"
            valor={nascimento}
            onChange={setNascimento}
            erro={erros.nascimento}
          />
        </CardContent>
      </Card>

      {detalhe.responsibleId !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CampoTexto rotulo="Nome" valor={respNome} onChange={setRespNome} erro={erros.respNome} />
            <CampoTexto rotulo="E-mail" valor={respEmail} onChange={setRespEmail} erro={erros.respEmail} />
            <CampoTexto
              rotulo="Telefone"
              valor={respTelefone}
              onChange={(v) => setRespTelefone(formatarTelefone(v))}
              erro={erros.respTelefone}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" className="min-h-11 text-base" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 text-base" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function CampoTexto({
  rotulo,
  valor,
  onChange,
  erro,
  tipo = "text",
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string | undefined;
  tipo?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-semibold text-foreground">
        {rotulo}
      </label>
      <Input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 text-base"
        aria-invalid={!!erro}
      />
      {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="text-lg font-semibold text-foreground">{valor}</p>
    </div>
  );
}

// Comunicados agora são salvos no back-end; responsáveis recebem aviso por e-mail
// quando o público é "Toda a escola" ou "Responsáveis".
type Publico = PublicoComunicado;

const rotuloPublico: Record<Publico, string> = {
  TODOS: "Toda a escola",
  ALUNOS: "Alunos",
  RESPONSAVEIS: "Responsáveis",
  PROFESSORES: "Professores",
};

function FormComunicado({
  compacto = false,
  aoEnviar,
}: {
  compacto?: boolean;
  aoEnviar?: (c: ComunicadoDTO) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [publico, setPublico] = useState<Publico>("TODOS");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) {
      toast.error("Preencha o título e o texto do comunicado.");
      return;
    }
    setEnviando(true);
    try {
      const novo = await publicarComunicado({
        titulo: titulo.trim(),
        texto: texto.trim(),
        publico,
      });
      setTitulo("");
      setTexto("");
      toast.success(`Comunicado enviado para ${rotuloPublico[publico].toLowerCase()}.`);
      aoEnviar?.(novo);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar o comunicado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="com-titulo" className="block text-base font-semibold text-foreground">
          Título
        </label>
        <Input
          id="com-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Reunião de pais"
          className="h-11 text-base"
        />
      </div>
      <div className="space-y-2">
        <span className="block text-base font-semibold text-foreground">Para quem</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(rotuloPublico) as Publico[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === publico ? "default" : "outline"}
              className="min-h-10 text-base"
              aria-pressed={p === publico}
              onClick={() => setPublico(p)}
            >
              {rotuloPublico[p]}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="com-texto" className="block text-base font-semibold text-foreground">
          Mensagem
        </label>
        <Textarea
          id="com-texto"
          rows={compacto ? 3 : 5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva o aviso."
          className="text-base"
        />
      </div>
      <Button type="submit" className="min-h-11 text-base" disabled={enviando} aria-busy={enviando}>
        <Send className="size-5" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar comunicado"}
      </Button>
    </form>
  );
}

function Disciplinas() {
  const [versao, setVersao] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [deletando, setDeletando] = useState<number | null>(null);
  const carga = useCarga<DisciplinaDTO[]>(getDisciplinas, versao);
  const atualizar = () => setVersao((v) => v + 1);

  async function criar(dados: { title: string; description: string }) {
    const criada = await criarDisciplina(dados);
    toast.success(`Disciplina ${criada.title} criada.`);
    setCriando(false);
    atualizar();
  }

  async function atualizar_disciplina(id: number, dados: { title: string; description: string }) {
    const atualizada = await atualizarDisciplina(id, dados);
    toast.success(`Disciplina ${atualizada.title} atualizada.`);
    setEditandoId(null);
    atualizar();
  }

  async function deletar(id: number) {
    await deletarDisciplina(id);
    toast.success("Disciplina deletada.");
    setDeletando(null);
    atualizar();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Button className="min-h-12 text-base" onClick={() => setCriando(true)} disabled={criando}>
          <Plus className="size-5" aria-hidden="true" />
          Nova disciplina
        </Button>
        <Button
          variant="outline"
          className="min-h-12 text-base"
          onClick={atualizar}
          disabled={carga.estado === "carregando"}
        >
          <RefreshCw
            className={`size-5 ${carga.estado === "carregando" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
      </div>

      {criando && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nova disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioDisciplina
              textoBotao="Criar disciplina"
              onSalvar={criar}
              onCancelar={() => setCriando(false)}
            />
          </CardContent>
        </Card>
      )}

      {carga.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && <MensagemErro carga={carga} />}
      {carga.estado === "ok" && (
        <div className="space-y-3">
          {carga.dados.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-base text-muted-foreground">
                  Nenhuma disciplina cadastrada ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            carga.dados.map((disciplina) => (
              <Card key={disciplina.id}>
                <CardContent className="p-6">
                  {editandoId === disciplina.id ? (
                    <FormularioDisciplina
                      inicial={{ title: disciplina.title, description: disciplina.description || "" }}
                      textoBotao="Salvar disciplina"
                      onSalvar={(dados) => atualizar_disciplina(disciplina.id, dados)}
                      onCancelar={() => setEditandoId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-foreground">
                          {disciplina.title}
                        </p>
                        {disciplina.description && (
                          <p className="text-base text-muted-foreground">{disciplina.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditandoId(disciplina.id)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </Button>
                        <ConfirmarAcao
                          titulo="Excluir disciplina"
                          descricao={`Tem certeza que deseja excluir a disciplina "${disciplina.title}"? Esta ação não pode ser desfeita.`}
                          textoConfirmar="Excluir"
                          onConfirmar={() => deletar(disciplina.id)}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletando === disciplina.id}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Excluir
                          </Button>
                        </ConfirmarAcao>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FormularioDisciplina({
  inicial,
  textoBotao,
  onSalvar,
  onCancelar,
}: {
  inicial?: { title: string; description: string };
  textoBotao: string;
  onSalvar: (dados: { title: string; description: string }) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(inicial?.title ?? "");
  const [description, setDescription] = useState(inicial?.description ?? "");
  const [salvando, setSalvando] = useState(false);
  const valido = title.trim() !== "" && description.trim() !== "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      await onSalvar({ title: title.trim(), description: description.trim() });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a disciplina.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${id}-titulo`} className="block text-base font-semibold text-foreground">
          Nome da disciplina
        </label>
        <Input
          id={`${id}-titulo`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Matemática"
          className="h-11 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor={`${id}-descricao`}
          className="block text-base font-semibold text-foreground"
        >
          Descrição
        </label>
        <Textarea
          id={`${id}-descricao`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Disciplina de matemática"
          className="text-base"
          rows={3}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="min-h-11 text-base" disabled={!valido || salvando}>
          {salvando ? "Salvando..." : textoBotao}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 text-base" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Comunicados() {
  const [versao, setVersao] = useState(0);
  const carga = useCarga<ComunicadoDTO[]>(getComunicados, versao);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Novo comunicado</CardTitle>
          <CardDescription className="text-base">
            Publique um aviso para alunos, responsáveis, professores ou para toda a escola.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormComunicado aoEnviar={() => setVersao((v) => v + 1)} />
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 font-display text-xl font-bold text-foreground">Comunicados enviados</h3>
        {carga.estado === "carregando" && (
          <p className="text-base text-muted-foreground">Carregando…</p>
        )}
        {carga.estado === "erro" && <MensagemErro carga={carga} />}
        {carga.estado === "ok" && carga.dados.length === 0 && (
          <p className="text-base text-muted-foreground">Nenhum comunicado enviado ainda.</p>
        )}
        {carga.estado === "ok" && carga.dados.length > 0 && (
          <div className="grid gap-4">
            {carga.dados.map((c) => (
              <section
                key={c.id}
                aria-label={c.titulo}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground">{c.titulo}</h4>
                    <p className="text-sm text-muted-foreground">
                      Para <span className="font-medium">{rotuloPublico[c.publico].toLowerCase()}</span> • Enviado em {new Date(c.enviadoEm).toLocaleString("pt-BR")} por {c.autorEmail}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-base text-muted-foreground">{c.texto}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* RF12: acompanhar e reenviar notificações automáticas (falta, nota final, atividade, comunicado). */
const rotuloTipoNotificacao: Record<TipoNotificacao, string> = {
  FALTA: "Falta",
  ATIVIDADE: "Atividade",
  NOTA_FINAL: "Nota final",
  COMUNICADO: "Comunicado",
};

const rotuloStatusNotificacao: Record<StatusNotificacao, string> = {
  PENDENTE: "Pendente",
  ENVIANDO: "Enviando",
  ENVIADA: "Enviada",
  ENTREGUE: "Entregue",
  LIDA: "Lida",
  FALHA: "Falha",
  CANCELADA: "Cancelada",
};

const variantePorStatus: Record<StatusNotificacao, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "secondary",
  ENVIANDO: "secondary",
  ENVIADA: "default",
  ENTREGUE: "default",
  LIDA: "default",
  FALHA: "destructive",
  CANCELADA: "outline",
};

function Notificacoes() {
  const [versao, setVersao] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacao | "TODOS">("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<StatusNotificacao | "TODOS">("TODOS");
  const [reenviando, setReenviando] = useState<number | null>(null);
  const carga = useCarga<NotificacaoDTO[]>(
    () =>
      getNotificacoes({
        tipo: filtroTipo === "TODOS" ? undefined : filtroTipo,
        status: filtroStatus === "TODOS" ? undefined : filtroStatus,
      }),
    versao,
  );

  async function reenviar(id: number) {
    setReenviando(id);
    try {
      await reenviarNotificacao(id);
      toast.success("Notificação recolocada na fila de envio.");
      setVersao((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao reenviar a notificação.");
    } finally {
      setReenviando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-48">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">Tipo</label>
          <Select
            value={filtroTipo}
            onValueChange={(v) => {
              setFiltroTipo(v as TipoNotificacao | "TODOS");
              setVersao((n) => n + 1);
            }}
          >
            <SelectTrigger className="min-h-11 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {(Object.keys(rotuloTipoNotificacao) as TipoNotificacao[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {rotuloTipoNotificacao[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-48">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">Situação</label>
          <Select
            value={filtroStatus}
            onValueChange={(v) => {
              setFiltroStatus(v as StatusNotificacao | "TODOS");
              setVersao((n) => n + 1);
            }}
          >
            <SelectTrigger className="min-h-11 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              {(Object.keys(rotuloStatusNotificacao) as StatusNotificacao[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {rotuloStatusNotificacao[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          className="min-h-11 text-base text-muted-foreground"
          onClick={() => setVersao((v) => v + 1)}
        >
          <RefreshCw className="size-5" aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {carga.estado === "carregando" && (
        <p className="text-base text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && <MensagemErro carga={carga} />}
      {carga.estado === "ok" && carga.dados.length === 0 && (
        <p className="text-base text-muted-foreground">Nenhuma notificação encontrada.</p>
      )}
      {carga.estado === "ok" && carga.dados.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Aluno</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Tentativas</th>
                <th className="px-4 py-3 font-medium">Criada em</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {carga.dados.map((n) => (
                <tr key={n.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{rotuloTipoNotificacao[n.tipo]}</td>
                  <td className="px-4 py-3 text-foreground">{n.responsavelNome}</td>
                  <td className="px-4 py-3 text-foreground">{n.studentNome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={variantePorStatus[n.status]}>
                      {rotuloStatusNotificacao[n.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{n.tentativas}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(n.criadoEm).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {n.status === "FALHA" && (
                      <Button
                        variant="outline"
                        className="min-h-9 text-sm"
                        disabled={reenviando === n.id}
                        onClick={() => reenviar(n.id)}
                      >
                        <Send className="size-4" aria-hidden="true" />
                        Reenviar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
