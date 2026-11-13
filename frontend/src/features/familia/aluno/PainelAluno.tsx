import { getMinhasAtividades, type AtividadeDTO } from "@/api/atividades";
import { getMeuPerfil } from "@/api/auth";
import { getNotasDoAluno, type Bimestre, type NotaDTO } from "@/api/nota";
import { getMinhaFrequencia, type FrequenciaDTO } from "@/api/falta";
import type { BoletimDisciplinaDTO } from "@/api/boletim";
import { AppShell } from "@/components/layout/AppShell";
import {
  CabecalhoPagina,
  MenuHorizontal,
  Painel,
  classeBotaoFaixaSecundario,
  type GrupoMenu,
} from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import {
  BoletimEscolar,
  ResumoAluno,
  TabelaAtividades,
  type DestinoResumo,
} from "@/features/familia/PortalFamilia";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { paraAtividadeAluno } from "@/features/familia/atividades-aluno";
import { hojeLocal } from "@/lib/datas";
import { getSession } from "@/lib/sessao";
import { BarChart3, ClipboardList, LayoutDashboard, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type SecaoId = "inicio" | "notas" | "atividades";

const titulos: Record<SecaoId, string> = {
  inicio: "Resumo",
  notas: "Notas e frequência",
  atividades: "Atividades",
};

const descricoes: Record<Exclude<SecaoId, "inicio">, string> = {
  notas: "Notas de cada bimestre, média final e faltas por disciplina no ano letivo.",
  atividades: "Atividades publicadas pelos professores, com prazo e situação.",
};

export function PainelAluno() {
  const [secao, setSecao] = useState<SecaoId>("inicio");
  const [versao, setVersao] = useState(0);
  const [primeiroNome, setPrimeiroNome] = useState<string | null>(null);
  const studentId = getSession()?.userId ?? null;

  useEffect(() => {
    let ativo = true;
    getMeuPerfil()
      .then((perfil) => ativo && setPrimeiroNome(perfil.nome?.split(" ")[0] ?? null))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const atividades = useCarga<AtividadeDTO[]>(getMinhasAtividades, versao);
  const frequencia = useCarga<FrequenciaDTO[]>(getMinhaFrequencia, versao);
  // REFN: busca notas e reconstrói estrutura de boletim
  const boletim = useCarga<BoletimDisciplinaDTO[]>(
    () => (studentId ? getNotasDoAluno(studentId).then(reconstruirBoletim) : Promise.resolve([])),
    versao,
  );

  const hoje = hojeLocal();
  const atrasadas =
    atividades.estado === "ok"
      ? atividades.dados.filter((a) => paraAtividadeAluno(a, hoje).situacao === "atrasada").length
      : 0;

  const grupos: GrupoMenu<SecaoId>[] = [
    {
      label: "Início",
      icon: LayoutDashboard,
      itens: [{ id: "inicio", label: "Início", icon: LayoutDashboard }],
    },
    {
      label: "Notas e frequência",
      icon: BarChart3,
      itens: [{ id: "notas", label: "Notas e frequência", icon: BarChart3 }],
    },
    {
      label: "Atividades",
      icon: ClipboardList,
      contador: atrasadas,
      itens: [{ id: "atividades", label: "Atividades", icon: ClipboardList }],
    },
  ];

  const descricao =
    secao === "inicio"
      ? `Olá${primeiroNome ? `, ${primeiroNome}` : ""}. Acompanhe suas notas, sua frequência e suas entregas.`
      : descricoes[secao];

  return (
    <AppShell
      role="ROLE_ALUNO"
      navegacao={<MenuHorizontal grupos={grupos} ativo={secao} aoSelecionar={setSecao} />}
    >
      <div className="space-y-6">
        <CabecalhoPagina
          trilha="Portal do aluno"
          titulo={titulos[secao]}
          descricao={descricao}
          acoes={
            <Button
              variant="outline"
              size="icon"
              className={`size-9 ${classeBotaoFaixaSecundario}`}
              onClick={() => setVersao((v) => v + 1)}
              aria-label="Atualizar"
              title="Atualizar"
            >
              <RefreshCw aria-hidden="true" />
            </Button>
          }
        />

        {secao === "inicio" && (
          <ResumoAluno
            boletim={boletim.estado === "ok" ? boletim.dados : null}
            frequencia={frequencia.estado === "ok" ? frequencia.dados : null}
            atividades={atividades.estado === "ok" ? atividades.dados : null}
            hoje={hoje}
            aoAbrir={(destino: DestinoResumo) => destino !== "avisos" && setSecao(destino)}
          />
        )}

        {secao === "notas" && (
          <Painel titulo="Boletim" icone={BarChart3} semEspaco>
            {boletim.estado === "carregando" && (
              <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
            )}
            {boletim.estado === "erro" && (
              <div className="p-4">
                <MensagemErro carga={boletim} />
              </div>
            )}
            {boletim.estado === "ok" && (
              <BoletimEscolar
                boletim={boletim.dados}
                frequencia={frequencia.estado === "ok" ? frequencia.dados : null}
              />
            )}
          </Painel>
        )}

        {secao === "atividades" && (
          <Painel titulo="Minhas atividades" icone={ClipboardList} semEspaco>
            {atividades.estado === "carregando" && (
              <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
            )}
            {atividades.estado === "erro" && (
              <div className="p-4">
                <MensagemErro carga={atividades} />
              </div>
            )}
            {atividades.estado === "ok" && atividades.dados.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma atividade publicada para você ainda.
              </p>
            )}
            {atividades.estado === "ok" && atividades.dados.length > 0 && (
              <TabelaAtividades atividades={atividades.dados} hoje={hoje} />
            )}
          </Painel>
        )}
      </div>
    </AppShell>
  );
}

// REFN: reconstrói estrutura BoletimDisciplinaDTO a partir de notas
function reconstruirBoletim(notas: NotaDTO[]): BoletimDisciplinaDTO[] {
  const porDisciplina = new Map<number, NotaDTO[]>();

  for (const nota of notas) {
    const lista = porDisciplina.get(nota.disciplinaId) ?? [];
    lista.push(nota);
    porDisciplina.set(nota.disciplinaId, lista);
  }

  const resultado: BoletimDisciplinaDTO[] = [];

  for (const [disciplinaId, notasDisciplina] of porDisciplina.entries()) {
    const bimestres = ["PRIMEIRO", "SEGUNDO", "TERCEIRO", "QUARTO"] as const;
    const bimestresData = [];

    for (const bimestre of bimestres) {
      const notasDoB = notasDisciplina.filter((n) => n.bimestre === bimestre);
      if (notasDoB.length === 0) continue;

      const media = notasDoB.reduce((sum, n) => sum + n.rate, 0) / notasDoB.length;

      bimestresData.push({
        id: null,
        studentId: notasDoB[0].studentId,
        disciplinaId,
        disciplinaTitle: notasDoB[0].disciplinaTitle,
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

    resultado.push({
      disciplinaId,
      disciplinaTitle: notasDisciplina[0].disciplinaTitle,
      bimestres: bimestresData,
      mediaFinal,
    });
  }

  return resultado;
}
