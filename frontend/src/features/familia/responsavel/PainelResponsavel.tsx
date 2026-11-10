import { getStudentsByResponsible, type StudentMinDTO } from "@/api/alunos";
import { getMeuPerfil, type MeuPerfilDTO } from "@/api/auth";
import { getComunicadosParaMim, type ComunicadoDTO } from "@/api/comunicados";
import { getMinhaFrequencia, type FrequenciaDTO } from "@/api/falta";
import { getMeusAvisos, type AvisoDTO } from "@/api/notificacoes";
import { AppShell } from "@/components/layout/AppShell";
import {
  CabecalhoPagina,
  MenuHorizontal,
  Painel,
  classeBotaoFaixaSecundario,
  classeSeletorFaixa,
  type GrupoMenu,
} from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type DestinoResumo } from "@/features/familia/PortalFamilia";
import { AcessoDoFilho } from "@/features/familia/responsavel/AcessoDoFilho";
import { lerLidos, montarAvisos, salvarLidos } from "@/features/familia/responsavel/avisos";
import {
  AtividadesDoFilho,
  BoletimDoFilho,
  EstadoFilhos,
  ResumoDoFilho,
} from "@/features/familia/responsavel/DadosDoFilho";
import { ListaAvisos } from "@/features/familia/responsavel/ListaAvisos";
import { PrivacidadeResponsavel } from "@/features/familia/responsavel/PrivacidadeResponsavel";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { getSession } from "@/lib/sessao";
import {
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

type SecaoId = "inicio" | "notas" | "atividades" | "avisos" | "dados";

const titulos: Record<SecaoId, string> = {
  inicio: "Resumo",
  notas: "Notas e frequência",
  atividades: "Atividades",
  avisos: "Avisos",
  dados: "Meus dados",
};

function saudacao(hora = new Date().getHours()) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function PainelResponsavel() {
  const [secao, setSecao] = useState<SecaoId>("inicio");
  const [versao, setVersao] = useState(0);
  const [filhoId, setFilhoId] = useState<number | null>(null);
  const [lidos, setLidos] = useState<string[]>([]);
  const [perfil, setPerfil] = useState<MeuPerfilDTO | null>(null);
  useEffect(() => setLidos(lerLidos()), []);
  useEffect(() => {
    let ativo = true;
    getMeuPerfil()
      .then((p) => ativo && setPerfil(p))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  function marcarLidos(chaves: string[]) {
    setLidos((atual) => {
      const nova = [...new Set([...atual, ...chaves])];
      salvarLidos(nova);
      return nova;
    });
  }

  const responsibleId = getSession()?.userId;
  const filhos = useCarga<StudentMinDTO[]>(
    () => (responsibleId ? getStudentsByResponsible(responsibleId) : Promise.resolve([])),
    versao,
  );
  const comunicados = useCarga<ComunicadoDTO[]>(getComunicadosParaMim, versao);
  const avisosApi = useCarga<AvisoDTO[]>(getMeusAvisos, versao);
  const frequencia = useCarga<FrequenciaDTO[]>(getMinhaFrequencia, versao);

  const listaFilhos = filhos.estado === "ok" ? filhos.dados : [];
  const filho = listaFilhos.find((f) => f.userId === filhoId) ?? listaFilhos[0] ?? null;
  const itensAvisos =
    comunicados.estado === "ok" && avisosApi.estado === "ok"
      ? montarAvisos(comunicados.dados, avisosApi.dados)
      : null;
  const erroAvisos =
    comunicados.estado === "erro" ? comunicados : avisosApi.estado === "erro" ? avisosApi : null;
  const naoLidos = (itensAvisos ?? []).filter((a) => !lidos.includes(a.chave)).length;

  const frequenciaDoFilho =
    frequencia.estado === "ok" && filho
      ? frequencia.dados.filter((f) => f.studentId === filho.userId)
      : null;

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
      itens: [{ id: "atividades", label: "Atividades", icon: ClipboardList }],
    },
    {
      label: "Avisos",
      icon: Bell,
      contador: naoLidos,
      itens: [{ id: "avisos", label: "Avisos", icon: Bell }],
    },
    {
      label: "Meus dados",
      icon: ShieldCheck,
      itens: [{ id: "dados", label: "Meus dados", icon: ShieldCheck }],
    },
  ];

  const primeiroNome = perfil?.nome?.split(" ")[0];
  const nomeFilho = filho?.studentName.split(" ")[0];
  const descricao =
    secao === "inicio"
      ? `${saudacao()}${primeiroNome ? `, ${primeiroNome}` : ""}. Veja como ${nomeFilho ?? "seu filho"} está na escola.`
      : secao === "avisos"
        ? naoLidos > 0
          ? `Você tem ${naoLidos} ${naoLidos === 1 ? "aviso novo" : "avisos novos"}.`
          : "Nenhum aviso novo. Você está em dia."
        : secao === "dados"
          ? "Baixe uma cópia dos seus dados ou peça correção e anonimização à secretaria (LGPD, art. 18)."
          : filho
            ? `${filho.studentName}, matrícula ${filho.matricula}${filho.turmaName ? `, ${filho.turmaName}` : ""}.`
            : undefined;

  const acoes = (
    <>
      {listaFilhos.length > 1 && filho && secao !== "avisos" && secao !== "dados" && (
        <Select value={String(filho.userId)} onValueChange={(v) => setFilhoId(Number(v))}>
          <SelectTrigger aria-label="Filho" className={`${classeSeletorFaixa} w-52`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {listaFilhos.map((f) => (
              <SelectItem key={f.userId} value={String(f.userId)}>
                {f.studentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
    </>
  );

  return (
    <AppShell
      role="ROLE_RESPONSAVEL"
      navegacao={<MenuHorizontal grupos={grupos} ativo={secao} aoSelecionar={setSecao} />}
    >
      <div className="space-y-6">
        <CabecalhoPagina
          trilha="Portal do responsável"
          titulo={titulos[secao]}
          descricao={descricao}
          acoes={acoes}
        />

        {secao !== "avisos" && secao !== "dados" && <EstadoFilhos filhos={filhos} />}

        {secao === "inicio" && filho && (
          <>
            <ResumoDoFilho
              key={`${filho.userId}-${versao}`}
              filho={filho}
              frequencia={frequenciaDoFilho}
              avisosNovos={naoLidos}
              aoAbrir={(destino: DestinoResumo) => setSecao(destino)}
            />
            <AcessoDoFilho filho={filho} aoMudar={() => setVersao((v) => v + 1)} />
          </>
        )}

        {secao === "notas" && filho && (
          <BoletimDoFilho
            key={`${filho.userId}-${versao}`}
            filho={filho}
            frequencia={frequenciaDoFilho}
          />
        )}

        {secao === "atividades" && filho && (
          <AtividadesDoFilho key={`${filho.userId}-${versao}`} filho={filho} />
        )}

        {secao === "avisos" && (
          <Painel
            titulo="Avisos e comunicados"
            icone={Bell}
            semEspaco
            ferramentas={
              naoLidos > 0 && itensAvisos ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => marcarLidos(itensAvisos.map((a) => a.chave))}
                >
                  Marcar todos como lidos
                </Button>
              ) : undefined
            }
          >
            {erroAvisos && (
              <div className="p-4">
                <MensagemErro carga={erroAvisos} />
              </div>
            )}
            {itensAvisos === null && !erroAvisos && (
              <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
            )}
            {itensAvisos && (
              <ListaAvisos
                itens={itensAvisos}
                lidos={lidos}
                aoMarcarLido={(chave) => marcarLidos([chave])}
              />
            )}
          </Painel>
        )}

        {secao === "dados" && <PrivacidadeResponsavel filhos={listaFilhos} />}
      </div>
    </AppShell>
  );
}
