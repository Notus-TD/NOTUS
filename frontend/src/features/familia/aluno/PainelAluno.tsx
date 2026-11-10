import { getMinhasAtividades, type AtividadeDTO } from "@/api/atividades";
import { getMeuPerfil } from "@/api/auth";
import { getBoletimDoAluno, type BoletimDisciplinaDTO } from "@/api/boletim";
import { getMinhaFrequencia, type FrequenciaDTO } from "@/api/falta";
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
  const boletim = useCarga<BoletimDisciplinaDTO[]>(
    () => (studentId ? getBoletimDoAluno(studentId) : Promise.resolve([])),
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
