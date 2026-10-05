import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  School,
  Search,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell, type SidebarItem } from "@/components/AdminShell";
import { CadastroAlunoForm } from "@/components/CadastroAlunoForm";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  associarAlunoTurma,
  createTurma,
  deleteTurma,
  getStudents,
  getTurma,
  getTurmas,
  removerAlunoTurma,
  updateTurma,
  type StudentMinDTO,
  type TurmaDetalheDTO,
  type TurmaDTO,
  type TurmaRequestDTO,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { useCarga, MensagemErro, type Carga } from "@/hooks/use-carga";

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

type SecaoId = "dashboard" | "alunos" | "turmas" | "usuarios" | "comunicados";

type ModoAlunos =
  { tipo: "lista" } | { tipo: "cadastro" } | { tipo: "ficha"; aluno: StudentMinDTO };

const itens: SidebarItem<SecaoId>[] = [
  {
    id: "dashboard",
    label: "Visão geral",
    descricao: "Turmas e matrículas",
    icon: LayoutDashboard,
    termos: "dashboard inicio resumo painel",
  },
  {
    id: "alunos",
    label: "Alunos",
    descricao: "Lista e cadastro",
    icon: Users,
    termos: "alunos lista matricula cadastro novo responsavel criar buscar",
  },
  {
    id: "turmas",
    label: "Turmas",
    descricao: "Alunos de cada turma",
    icon: School,
    termos: "turma turmas sala classe associar adicionar aluno enturmar",
  },
  {
    id: "usuarios",
    label: "Excluir usuários",
    descricao: "Anonimizar dados (LGPD)",
    icon: UserX,
    termos: "excluir remover deletar anonimizar lgpd usuario dado pessoal privacidade",
  },
  {
    id: "comunicados",
    label: "Comunicados",
    descricao: "Avisos para a escola",
    icon: Megaphone,
    termos: "comunicado aviso enviar mensagem recado",
  },
];

const cabecalhos: Record<SecaoId, { titulo: string; subtitulo: string }> = {
  dashboard: { titulo: "Visão geral", subtitulo: "Turmas, matrículas, alunos e comunicados." },
  alunos: { titulo: "Alunos", subtitulo: "Busque um aluno, abra a ficha ou cadastre um novo." },
  turmas: {
    titulo: "Turmas",
    subtitulo: "Escolha uma turma para ver os alunos e adicionar novos.",
  },
  usuarios: {
    titulo: "Excluir usuários",
    subtitulo:
      "Anonimize os dados pessoais de um aluno e do responsável para atender pedidos de exclusão (LGPD). Ação irreversível.",
  },
  comunicados: {
    titulo: "Comunicados",
    subtitulo: "Envie avisos para alunos, responsáveis e professores.",
  },
};

const cabecalhoAlunos: Record<ModoAlunos["tipo"], { titulo: string; subtitulo: string }> = {
  lista: cabecalhos.alunos,
  cadastro: {
    titulo: "Cadastrar aluno",
    subtitulo: "Os dois recebem acesso ao portal com a senha inicial igual ao e-mail.",
  },
  ficha: { titulo: "Ficha do aluno", subtitulo: "Dados do aluno e do responsável." },
};

function PainelAdmin() {
  const [secao, setSecao] = useState<SecaoId>("dashboard");
  const [modo, setModo] = useState<ModoAlunos>({ tipo: "lista" });
  const { titulo, subtitulo } = secao === "alunos" ? cabecalhoAlunos[modo.tipo] : cabecalhos[secao];

  function irParaAlunos(novoModo: ModoAlunos) {
    setModo(novoModo);
    setSecao("alunos");
  }

  function irPara(s: SecaoId) {
    setModo({ tipo: "lista" });
    setSecao(s);
  }

  return (
    <AdminShell
      itens={itens}
      ativo={secao}
      onSelecionar={irPara}
      titulo={titulo}
      subtitulo={subtitulo}
    >
      {secao === "dashboard" && <Dashboard irPara={irPara} irParaAlunos={irParaAlunos} />}
      {secao === "alunos" && <Alunos modo={modo} setModo={setModo} />}
      {secao === "turmas" && <Turmas />}
      {secao === "usuarios" && <ExcluirUsuarios />}
      {secao === "comunicados" && <Comunicados />}
    </AdminShell>
  );
}

function Dashboard({
  irPara,
  irParaAlunos,
}: {
  irPara: (s: SecaoId) => void;
  irParaAlunos: (m: ModoAlunos) => void;
}) {
  const [versao, setVersao] = useState(0);
  const matriculas = useCarga<StudentMinDTO[]>(getStudents, versao);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const carregando = matriculas.estado === "carregando" || turmas.estado === "carregando";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          className="min-h-11 text-base"
          onClick={() => setVersao((v) => v + 1)}
          disabled={carregando}
        >
          <RefreshCw className={`size-5 ${carregando ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
        <Button className="min-h-11 text-base" onClick={() => irParaAlunos({ tipo: "cadastro" })}>
          <UserPlus className="size-5" aria-hidden="true" />
          Cadastrar aluno
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Indicador
          icon={School}
          rotulo="Turmas"
          carga={turmas}
          valor={(t) => t.length}
          detalhe={(t) => (t[0]?.schoolYear ? `Ano letivo ${t[0].schoolYear}` : "")}
        />
        <Indicador
          icon={GraduationCap}
          rotulo="Alunos matriculados"
          carga={matriculas}
          valor={(m) => m.filter((s) => s.matriculaStatus === "ATIVA").length}
          detalhe={(m) => `${m.length} no total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-xl">Alunos</CardTitle>
              <CardDescription className="text-base">Últimos cadastros</CardDescription>
            </div>
            <Button
              variant="outline"
              className="min-h-10 text-base"
              onClick={() => irPara("alunos")}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {matriculas.estado === "carregando" && (
              <p className="text-base text-muted-foreground">Carregando…</p>
            )}
            {matriculas.estado === "erro" && <MensagemErro carga={matriculas} />}
            {matriculas.estado === "ok" && (
              <ListaAlunos
                itens={[...matriculas.dados].reverse().slice(0, 5)}
                onAbrir={(a) => irParaAlunos({ tipo: "ficha", aluno: a })}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-xl">Comunicados</CardTitle>
              <CardDescription className="text-base">Envie um aviso rápido</CardDescription>
            </div>
            <Button
              variant="outline"
              className="min-h-10 text-base"
              onClick={() => irPara("comunicados")}
            >
              Ver enviados
            </Button>
          </CardHeader>
          <CardContent>
            <FormComunicado compacto />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Indicador<T>({
  icon: Icon,
  rotulo,
  carga,
  valor,
  detalhe,
}: {
  icon: LucideIcon;
  rotulo: string;
  carga: Carga<T>;
  valor: (d: T) => number;
  detalhe?: (d: T) => string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-6">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base text-muted-foreground">{rotulo}</p>
          {carga.estado === "carregando" && (
            <p className="mt-1 font-display text-4xl font-bold text-muted-foreground">…</p>
          )}
          {carga.estado === "ok" && (
            <>
              <p className="mt-1 font-display text-4xl font-bold text-foreground">
                {valor(carga.dados)}
              </p>
              {detalhe && (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {detalhe(carga.dados)}
                </p>
              )}
            </>
          )}
          {carga.estado === "erro" && (
            <>
              <p className="mt-1 font-display text-4xl font-bold text-muted-foreground">—</p>
              <p className="mt-1 text-sm font-semibold text-destructive">
                {carga.status === 403 ? "Sem acesso para este perfil" : carga.mensagem}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeStatus({ status }: { status: StudentMinDTO["matriculaStatus"] }) {
  return (
    <Badge
      className={`px-3 py-1 text-sm font-semibold ${status === "ATIVA" ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}`}
    >
      {status}
    </Badge>
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
              <p className="truncate text-lg font-semibold text-foreground">{s.studentName}</p>
              <p className="text-base text-muted-foreground">Matrícula nº {s.matricula}</p>
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
      .filter(
        (s) =>
          !termo ||
          s.studentName.toLowerCase().includes(termo) ||
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

function fichaExemplo(aluno: StudentMinDTO) {
  const partes = aluno.studentName.trim().split(/\s+/);
  const primeiro = partes[0] ?? "aluno";
  const ultimo = partes[partes.length - 1] ?? "";
  const slug = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const mes = (aluno.userId % 12) + 1;
  const dia = (aluno.userId % 27) + 1;

  return {
    email: `${slug(primeiro)}.${slug(ultimo)}@notus.com`,
    nascimento: `2013-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
    turma: `${6 + (aluno.userId % 4)}º ano ${["A", "B", "C"][aluno.userId % 3]}`,
    responsavel: {
      nome: `Responsável de ${primeiro}`,
      telefone: `(11) 9${String(aluno.userId).slice(-4)}-${String(aluno.matricula).slice(-4)}`,
      email: `resp.${slug(primeiro)}@gmail.com`,
    },
  };
}

function BotaoAnonimizar({
  userId,
  nome,
  aoConcluir,
  compacto = false,
}: {
  userId: number;
  nome: string;
  aoConcluir?: () => void;
  compacto?: boolean;
}) {
  const [anonimizando, setAnonimizando] = useState(false);

  async function confirmar() {
    setAnonimizando(true);
    try {
      await anonymizeUser(userId);
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className={compacto ? "min-h-10 text-base" : "min-h-11 text-base"}
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
            Nome, e-mail, data de nascimento e os dados do responsável serão apagados
            permanentemente e a matrícula será encerrada. Isso não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, anonimizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
                    {t.name} · {t.schoolYear} · {t.totalAlunos} aluno(s)
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
  descricao: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  children: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
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
  const [studentId, setStudentId] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const detalhe = useCarga<TurmaDetalheDTO>(() => getTurma(turma.id), 0);
  const todos = useCarga<StudentMinDTO[]>(getStudents, 0);

  const idsNaTurma = new Set(
    detalhe.estado === "ok" ? detalhe.dados.alunos.map((a) => a.userId) : [],
  );
  const disponiveis =
    todos.estado === "ok"
      ? todos.dados.filter((s) => s.matriculaStatus === "ATIVA" && !idsNaTurma.has(s.userId))
      : [];

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
    if (!studentId) return;
    executar(async () => {
      const associado = await associarAlunoTurma(turma.id, Number(studentId));
      toast.success(`${associado.studentName} adicionado(a) à turma ${associado.turmaName}.`);
      onAlterada();
    }, "Erro ao adicionar o aluno à turma.");
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
                Ano letivo {turma.schoolYear} · {turma.totalAlunos} aluno(s)
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
                <CardTitle className="text-xl">Adicionar aluno</CardTitle>
                <CardDescription className="text-base">
                  Somente alunos com matrícula ativa. Um aluno pode estar em apenas uma turma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todos.estado === "carregando" && (
                  <p className="text-base text-muted-foreground">Carregando…</p>
                )}
                {todos.estado === "erro" && <MensagemErro carga={todos} />}
                {todos.estado === "ok" && (
                  <form onSubmit={adicionar} className="space-y-4">
                    <Select value={studentId} onValueChange={setStudentId}>
                      <SelectTrigger className="h-12 text-lg" aria-label="Aluno">
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {disponiveis.map((s) => (
                          <SelectItem key={s.userId} value={String(s.userId)}>
                            {s.studentName} · Matrícula nº {s.matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {disponiveis.length === 0 && (
                      <p className="text-base text-muted-foreground">
                        Nenhum aluno ativo disponível para esta turma.
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="min-h-11 w-full text-base"
                      disabled={!studentId || ocupado}
                    >
                      <UserPlus className="size-5" aria-hidden="true" />
                      {ocupado ? "Salvando..." : `Adicionar à turma ${turma.name}`}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Professores e disciplinas</CardTitle>
                <CardDescription className="text-base">
                  Vínculos cadastrados no lecionamento desta turma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {detalhe.dados.lecionamentos.length === 0 ? (
                  <p className="text-base text-muted-foreground">
                    Nenhum professor vinculado a esta turma.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {detalhe.dados.lecionamentos.map((l) => (
                      <li key={l.id} className="py-3">
                        <p className="text-lg font-semibold text-foreground">{l.disciplinaTitle}</p>
                        <p className="truncate text-base text-muted-foreground">
                          {l.professorEmail}
                        </p>
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
              <CardDescription className="text-base">
                {detalhe.dados.alunos.length} aluno(s) em {turma.name}
              </CardDescription>
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
                        <p className="text-base text-muted-foreground">
                          Matrícula nº {s.matricula}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <BadgeStatus status={s.matriculaStatus} />
                        <ConfirmarAcao
                          titulo={`Remover ${s.studentName} da turma?`}
                          descricao={`O aluno continua cadastrado, mas fica sem turma até ser associado a outra. Professores de ${turma.name} deixam de vê-lo.`}
                          textoConfirmar="Sim, remover"
                          onConfirmar={() => remover(s)}
                        >
                          <Button
                            variant="outline"
                            className="min-h-10 text-base"
                            disabled={ocupado}
                            aria-label={`Remover ${s.studentName} da turma`}
                          >
                            <UserMinus className="size-5" aria-hidden="true" />
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

function ExcluirUsuarios() {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const carga = useCarga<StudentMinDTO[]>(getStudents, versao);

  const termo = busca.trim().toLowerCase();
  const filtrados =
    carga.estado === "ok"
      ? carga.dados.filter(
          (s) =>
            !termo ||
            s.studentName.toLowerCase().includes(termo) ||
            String(s.matricula).includes(termo),
        )
      : [];

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou matrícula…"
          aria-label="Buscar usuário"
          className="h-11 pl-10 text-base"
        />
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
                : "Nenhum aluno cadastrado ainda."}
            </p>
          )}
          {carga.estado === "ok" && filtrados.length > 0 && (
            <ul className="divide-y divide-border">
              {filtrados.map((s) => (
                <li
                  key={s.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {s.studentName}
                    </p>
                    <p className="text-base text-muted-foreground">
                      Matrícula nº {s.matricula} · Registro nº {s.userId}
                    </p>
                  </div>
                  <BotaoAnonimizar
                    userId={s.userId}
                    nome={s.studentName}
                    compacto
                    aoConcluir={() => setVersao((v) => v + 1)}
                  />
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
  const ex = fichaExemplo(aluno);
  const nascimento = new Date(`${ex.nascimento}T00:00:00`).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6">
      <Button variant="outline" className="min-h-11 text-base" onClick={voltar}>
        <ArrowLeft className="size-5" aria-hidden="true" />
        Voltar para a lista
      </Button>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="font-display text-2xl">{aluno.studentName}</CardTitle>
            <CardDescription className="text-base">
              Matrícula nº {aluno.matricula} · Registro nº {aluno.userId}
            </CardDescription>
          </div>
          <BadgeStatus status={aluno.matriculaStatus} />
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Dado rotulo="E-mail escolar" valor={ex.email} />
          <Dado rotulo="Data de nascimento" valor={nascimento} />
          <Dado rotulo="Turma" valor={ex.turma} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Responsável</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Dado rotulo="Nome" valor={ex.responsavel.nome} />
          <Dado rotulo="Telefone" valor={ex.responsavel.telefone} />
          <Dado rotulo="E-mail" valor={ex.responsavel.email} />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Dados do aluno cadastrados na escola.
      </p>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-xl text-destructive">Zona de risco</CardTitle>
          <CardDescription className="text-base">
            Substitui os dados pessoais deste aluno e do responsável por "****" e encerra a
            matrícula. Ação irreversível, usada para atender pedidos de exclusão de dados (LGPD).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BotaoAnonimizar userId={aluno.userId} nome={aluno.studentName} aoConcluir={voltar} />
        </CardContent>
      </Card>
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

type Publico = "TODOS" | "ALUNOS" | "RESPONSAVEIS" | "PROFESSORES";

type Comunicado = {
  id: string;
  titulo: string;
  texto: string;
  publico: Publico;
  enviadoEm: string;
  por: string;
};

const rotuloPublico: Record<Publico, string> = {
  TODOS: "Toda a escola",
  ALUNOS: "Alunos",
  RESPONSAVEIS: "Responsáveis",
  PROFESSORES: "Professores",
};

const CHAVE_COMUNICADOS = "notus.comunicados";

function lerComunicados(): Comunicado[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_COMUNICADOS) ?? "[]") as Comunicado[];
  } catch {
    return [];
  }
}

function salvarComunicados(lista: Comunicado[]) {
  try {
    localStorage.setItem(CHAVE_COMUNICADOS, JSON.stringify(lista));
  } catch {
    /* ignore */
  }
}

function FormComunicado({
  compacto = false,
  aoEnviar,
}: {
  compacto?: boolean;
  aoEnviar?: (c: Comunicado) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [publico, setPublico] = useState<Publico>("TODOS");

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) {
      toast.error("Preencha o título e o texto do comunicado.");
      return;
    }
    const novo: Comunicado = {
      id: `${Date.now()}`,
      titulo: titulo.trim(),
      texto: texto.trim(),
      publico,
      enviadoEm: new Date().toISOString(),
      por: getSession()?.email ?? "admin",
    };
    salvarComunicados([novo, ...lerComunicados()]);
    setTitulo("");
    setTexto("");
    toast.success(`Comunicado enviado para ${rotuloPublico[publico].toLowerCase()}.`);
    aoEnviar?.(novo);
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
      <Button type="submit" className="min-h-11 text-base">
        <Send className="size-5" aria-hidden="true" />
        Enviar comunicado
      </Button>
    </form>
  );
}

function Comunicados() {
  const [lista, setLista] = useState<Comunicado[]>([]);
  useEffect(() => setLista(lerComunicados()), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Novo comunicado</CardTitle>
          <CardDescription className="text-base">
            Os comunicados enviados ficam salvos neste dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormComunicado aoEnviar={(c) => setLista((l) => [c, ...l])} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold text-foreground">Enviados</h2>
        {lista.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-base text-muted-foreground">
              Nenhum comunicado enviado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lista.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{c.titulo}</CardTitle>
                    <Badge className="bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                      {rotuloPublico[c.publico]}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {new Date(c.enviadoEm).toLocaleString("pt-BR")} · {c.por}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-base text-muted-foreground">{c.texto}</CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
