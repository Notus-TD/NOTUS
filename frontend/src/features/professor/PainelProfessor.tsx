import { getMeuPerfil } from "@/api/auth";
import { type Bimestre } from "@/api/boletim";
import { getCalendario, type CalendarioDTO } from "@/api/calendario";
import { ApiError } from "@/api/cliente";
import { getMinhasTurmas, type TurmaComDisciplinasDTO } from "@/api/turmas";
import { AppShell } from "@/components/layout/AppShell";
import {
  CabecalhoPagina,
  MenuHorizontal,
  Painel,
  classeSeletorFaixa,
  type GrupoMenu,
} from "@/components/layout/LayoutAdmin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Atividades } from "@/features/professor/atividades/Atividades";
import { Chamada } from "@/features/professor/Chamada";
import { Comunicados } from "@/features/professor/Comunicados";
import { InicioProfessor } from "@/features/professor/InicioProfessor";
import { NotasDaTurma } from "@/features/professor/NotasDaTurma";
import { DisciplinaRef } from "@/features/professor/turma";
import { bimestreAtual, nomeBimestre } from "@/lib/bimestres";
import { BarChart3, BookOpen, ClipboardCheck, ClipboardList, Home, Mail } from "lucide-react";
import { useEffect, useState } from "react";

export type SecaoId = "inicio" | "chamada" | "notas" | "atividades" | "comunicados";

const grupos: GrupoMenu<SecaoId>[] = [
  { label: "Início", icon: Home, itens: [{ id: "inicio", label: "Início", icon: Home }] },
  {
    label: "Gerenciamento",
    icon: ClipboardList,
    itens: [
      { id: "chamada", label: "Chamada", icon: ClipboardCheck },
      { id: "atividades", label: "Atividades", icon: ClipboardList },
      { id: "notas", label: "Notas", icon: BarChart3 },
    ],
  },
  {
    label: "Comunicados",
    icon: Mail,
    itens: [{ id: "comunicados", label: "Comunicados", icon: Mail }],
  },
];

const titulos: Record<Exclude<SecaoId, "inicio">, string> = {
  chamada: "Chamada",
  atividades: "Atividades",
  notas: "Notas",
  comunicados: "Comunicados",
};

export function PainelProfessor() {
  const [secao, setSecao] = useState<SecaoId>("inicio");
  const [minhasTurmas, setMinhasTurmas] = useState<TurmaComDisciplinasDTO[] | null>(null);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [nomeProfessor, setNomeProfessor] = useState<string | null>(null);
  const [calendario, setCalendario] = useState<CalendarioDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    getMinhasTurmas()
      .then((lista) => {
        if (!ativo) return;
        setMinhasTurmas(lista);
        setTurmaId((atual) => atual ?? lista[0]?.turmaId ?? null);
      })
      .catch(
        (e) =>
          ativo &&
          setErroCarregamento(e instanceof ApiError ? e.message : "Erro ao carregar suas turmas."),
      );
    getMeuPerfil()
      .then((perfil) => ativo && setNomeProfessor(perfil.nome))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const turmaAtual = minhasTurmas?.find((t) => t.turmaId === turmaId) ?? null;
  const anoLetivo = /^\d{4}$/.test(turmaAtual?.schoolYear.trim() ?? "")
    ? (turmaAtual?.schoolYear.trim() ?? "")
    : String(new Date().getFullYear());

  useEffect(() => {
    let ativo = true;
    getCalendario(anoLetivo)
      .then((c) => ativo && setCalendario(c))
      .catch(() => ativo && setCalendario(null));
    return () => {
      ativo = false;
    };
  }, [anoLetivo]);

  const fechados: Bimestre[] =
    calendario?.periodos.filter((p) => !p.lancamentoAberto).map((p) => p.bimestre) ?? [];
  const bimestreDoCalendario = calendario?.bimestreAtual ?? null;
  const disciplina: DisciplinaRef | null =
    turmaAtual?.disciplinas.find((d) => d.id === disciplinaId) ??
    turmaAtual?.disciplinas[0] ??
    null;

  const titulo =
    secao !== "inicio" ? titulos[secao] : nomeProfessor ? `Olá, Prof. ${nomeProfessor}` : "Início";
  const descricao =
    secao === "inicio"
      ? "Suas turmas e os próximos prazos de entrega."
      : turmaAtual && disciplina && secao !== "comunicados"
        ? `${disciplina.title} no ${turmaAtual.turmaName}, ${turmaAtual.schoolYear}${bimestreDoCalendario ? ` · ${nomeBimestre(bimestreDoCalendario)} em andamento` : ""}`
        : turmaAtual
          ? `${turmaAtual.turmaName}, ${turmaAtual.schoolYear}`
          : undefined;
  const seletores =
    secao !== "inicio" && minhasTurmas && minhasTurmas.length > 0 ? (
      <>
        {turmaAtual &&
          disciplina &&
          turmaAtual.disciplinas.length === 1 &&
          secao !== "comunicados" && (
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-primary-foreground/40 bg-primary-foreground/10 px-3 text-sm font-semibold text-primary-foreground">
              <BookOpen className="size-4" aria-hidden="true" />
              {disciplina.title}
            </span>
          )}
        <Select
          value={turmaId === null ? "" : String(turmaId)}
          onValueChange={(v) => setTurmaId(Number(v))}
        >
          <SelectTrigger aria-label="Turma" className={`${classeSeletorFaixa} w-44`}>
            <SelectValue placeholder="Escolha a turma" />
          </SelectTrigger>
          <SelectContent>
            {minhasTurmas.map((t) => (
              <SelectItem key={t.turmaId} value={String(t.turmaId)}>
                {t.turmaName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {turmaAtual &&
          disciplina &&
          turmaAtual.disciplinas.length > 1 &&
          secao !== "comunicados" && (
            <Select value={String(disciplina.id)} onValueChange={(v) => setDisciplinaId(Number(v))}>
              <SelectTrigger aria-label="Disciplina" className={`${classeSeletorFaixa} w-44`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {turmaAtual.disciplinas.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
      </>
    ) : undefined;

  return (
    <AppShell
      role="ROLE_PROFESSOR"
      navegacao={<MenuHorizontal grupos={grupos} ativo={secao} aoSelecionar={setSecao} />}
    >
      <div className="space-y-6">
        <CabecalhoPagina
          trilha="Diário de classe"
          atual={secao === "inicio" ? "Início" : titulo}
          titulo={titulo}
          descricao={descricao}
          acoes={seletores}
        />
        {erroCarregamento && (
          <Painel>
            <p className="text-sm font-semibold text-destructive">{erroCarregamento}</p>
          </Painel>
        )}
        {!erroCarregamento && minhasTurmas === null && (
          <Painel>
            <p className="text-sm text-muted-foreground">Carregando suas turmas…</p>
          </Painel>
        )}
        {minhasTurmas?.length === 0 && (
          <Painel>
            <p className="text-sm text-muted-foreground">
              Você ainda não está associado a nenhuma turma. Procure a secretaria da escola.
            </p>
          </Painel>
        )}
        {minhasTurmas && minhasTurmas.length > 0 && secao === "inicio" && (
          <InicioProfessor
            turmas={minhasTurmas}
            aoAbrir={(id, destino) => {
              setTurmaId(id);
              setSecao(destino);
            }}
          />
        )}
        {secao !== "inicio" && turmaAtual && !disciplina && (
          <Painel>
            <p className="text-sm font-semibold text-destructive">
              Nenhuma disciplina associada a você nesta turma. Procure a secretaria da escola.
            </p>
          </Painel>
        )}
        {turmaAtual && disciplina && secao === "chamada" && (
          <Chamada
            key={`${turmaAtual.turmaId}-${disciplina.id}`}
            turmaId={turmaAtual.turmaId}
            disciplina={disciplina}
          />
        )}
        {turmaAtual && disciplina && secao === "notas" && (
          <NotasDaTurma
            key={`${turmaAtual.turmaId}-${disciplina.id}`}
            turmaId={turmaAtual.turmaId}
            disciplina={disciplina}
            fechados={fechados}
          />
        )}
        {turmaAtual && disciplina && secao === "atividades" && (
          <Atividades
            key={`${turmaAtual.turmaId}-${disciplina.id}-${bimestreDoCalendario ?? ""}`}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
            disciplina={disciplina}
            fechados={fechados}
            bimestreInicial={bimestreDoCalendario ?? bimestreAtual()}
          />
        )}
        {turmaAtual && secao === "comunicados" && (
          <Comunicados
            key={`${turmaAtual.turmaId}`}
            turmaId={turmaAtual.turmaId}
            turmaName={turmaAtual.turmaName}
          />
        )}
      </div>
    </AppShell>
  );
}
