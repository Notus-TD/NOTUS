import { AppShell } from "@/components/layout/AppShell";
import {
  CabecalhoPagina,
  classeBotaoFaixa,
  classeBotaoFaixaSecundario,
  MenuHorizontal,
  type GrupoMenu,
} from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Alunos, ModoAlunos } from "@/features/admin/alunos/Alunos";
import { ExcluirUsuarios } from "@/features/admin/anonimizacao/Anonimizacao";
import { CalendarioLetivo } from "@/features/admin/CalendarioLetivo";
import { Comunicados } from "@/features/admin/comunicados/Comunicados";
import { FormComunicado } from "@/features/admin/comunicados/FormComunicado";
import { DashboardAdmin } from "@/features/admin/DashboardAdmin";
import { Disciplinas } from "@/features/admin/disciplinas/Disciplinas";
import { Notificacoes } from "@/features/admin/notificacoes/Notificacoes";
import { Professores } from "@/features/admin/professores/Professores";
import { Turmas } from "@/features/admin/turmas/Turmas";
import { VisaoGeralAdmin } from "@/features/admin/VisaoGeralAdmin";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Mail,
  School,
  Settings,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useState } from "react";

type SecaoId =
  | "dashboard"
  | "graficos"
  | "alunos"
  | "professores"
  | "turmas"
  | "disciplinas"
  | "usuarios"
  | "calendario"
  | "comunicados"
  | "notificacoes";

const grupos: GrupoMenu<SecaoId>[] = [
  {
    label: "Início",
    icon: LayoutDashboard,
    itens: [{ id: "dashboard", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    label: "Gerenciamento",
    icon: ClipboardList,
    itens: [
      { id: "alunos", label: "Alunos", icon: Users },
      { id: "professores", label: "Professores", icon: BookOpen },
      { id: "turmas", label: "Turmas", icon: School },
      { id: "disciplinas", label: "Disciplinas", icon: BookOpen },
    ],
  },
  {
    label: "Comunicados",
    icon: Mail,
    itens: [
      { id: "comunicados", label: "Comunicados", icon: Mail },
      { id: "notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Sistema",
    icon: Settings,
    itens: [
      { id: "graficos", label: "Dashboard", icon: BarChart3 },
      { id: "calendario", label: "Calendário letivo", icon: CalendarDays },
      { id: "usuarios", label: "Anonimização (LGPD)", icon: UserX },
    ],
  },
];

const titulos: Record<SecaoId, string> = {
  dashboard: "Visão geral",
  graficos: "Dashboard",
  alunos: "Alunos",
  professores: "Professores",
  turmas: "Turmas",
  disciplinas: "Disciplinas",
  usuarios: "Anonimização (LGPD)",
  calendario: "Calendário letivo",
  comunicados: "Comunicados",
  notificacoes: "Notificações",
};

const descricoes: Record<SecaoId, string> = {
  dashboard: "Resumo da escola e atalhos do dia a dia.",
  graficos: "Indicadores de alunos, turmas, professores e avisos.",
  alunos: "Alunos matriculados, turma atual e situação da matrícula.",
  professores: "Professores cadastrados e as turmas em que lecionam.",
  turmas: "Turmas do ano letivo, com alunos e professores.",
  disciplinas: "Disciplinas oferecidas pela escola.",
  usuarios: "Pedidos dos titulares e anonimização de dados pessoais (LGPD).",
  calendario: "Início e fim de cada bimestre. Bimestre encerrado fica fechado para lançamentos.",
  comunicados: "Avisos publicados para a escola.",
  notificacoes: "E-mails automáticos enviados aos responsáveis.",
};

const descricoesAlunos: Record<ModoAlunos["tipo"], string> = {
  lista: "Encontre um aluno pelo nome ou pela matrícula, ou navegue pelas turmas.",
  todos: "Lista completa de alunos, com busca e filtros.",
  cadastro: "Preencha os dados do responsável e do aluno.",
  ficha: "Dados do aluno e do responsável.",
};

const titulosAlunos: Record<ModoAlunos["tipo"], string> = {
  lista: titulos.alunos,
  todos: "Todos os alunos",
  cadastro: "Cadastrar aluno",
  ficha: "Ficha do aluno",
};

export function PainelAdmin() {
  const [secao, setSecao] = useState<SecaoId>("dashboard");
  const [modo, setModo] = useState<ModoAlunos>({ tipo: "lista" });
  const titulo =
    secao !== "alunos"
      ? titulos[secao]
      : modo.tipo === "ficha" && modo.aluno.anonimizado
        ? "Aluno anonimizado"
        : titulosAlunos[modo.tipo];
  const descricao = secao !== "alunos" ? descricoes[secao] : descricoesAlunos[modo.tipo];
  const trilha =
    secao === "alunos" && modo.tipo !== "lista" ? "Administração / Alunos" : "Administração";
  const botaoCadastrar = (
    <Button className={classeBotaoFaixa} onClick={() => irParaAlunos({ tipo: "cadastro" })}>
      <UserPlus aria-hidden="true" />
      Cadastrar aluno
    </Button>
  );
  const acoes =
    secao !== "alunos" ? undefined : modo.tipo === "lista" ? (
      <>
        <Button
          variant="outline"
          className={classeBotaoFaixaSecundario}
          onClick={() => setModo({ tipo: "todos" })}
        >
          <Users aria-hidden="true" />
          Listar todos os alunos
        </Button>
        {botaoCadastrar}
      </>
    ) : modo.tipo === "todos" ? (
      <>
        <Button
          variant="outline"
          className={classeBotaoFaixaSecundario}
          onClick={() => setModo({ tipo: "lista" })}
        >
          <ArrowLeft aria-hidden="true" />
          Voltar
        </Button>
        {botaoCadastrar}
      </>
    ) : undefined;

  function irParaAlunos(novoModo: ModoAlunos) {
    setModo(novoModo);
    setSecao("alunos");
  }

  function irPara(s: SecaoId) {
    setModo({ tipo: "lista" });
    setSecao(s);
  }

  return (
    <AppShell
      role="ROLE_ADMIN"
      navegacao={<MenuHorizontal grupos={grupos} ativo={secao} aoSelecionar={irPara} />}
    >
      <div className="space-y-6">
        <CabecalhoPagina trilha={trilha} titulo={titulo} descricao={descricao} acoes={acoes} />
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
        {secao === "calendario" && <CalendarioLetivo />}
        {secao === "comunicados" && <Comunicados />}
        {secao === "notificacoes" && <Notificacoes />}
      </div>
    </AppShell>
  );
}
