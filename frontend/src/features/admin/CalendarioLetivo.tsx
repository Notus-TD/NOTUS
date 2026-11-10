import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Etiqueta, Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { CampoData } from "@/components/layout/CampoData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Bimestre } from "@/api/boletim";
import {
  fecharBimestre,
  getCalendario,
  reabrirBimestre,
  salvarCalendario,
  type CalendarioDTO,
  type PeriodoDTO,
  type SituacaoPeriodo,
} from "@/api/calendario";
import { ApiError } from "@/api/cliente";
import { BIMESTRES } from "@/lib/bimestres";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";

type Datas = Record<Bimestre, { inicio: string; fim: string }>;

const vazio = (): Datas => ({
  PRIMEIRO: { inicio: "", fim: "" },
  SEGUNDO: { inicio: "", fim: "" },
  TERCEIRO: { inicio: "", fim: "" },
  QUARTO: { inicio: "", fim: "" },
});

const tomSituacao: Record<SituacaoPeriodo, "sucesso" | "neutro" | "alerta" | "perigo"> = {
  NAO_INICIADO: "neutro",
  EM_ANDAMENTO: "sucesso",
  FECHADO: "perigo",
  REABERTO: "alerta",
};

const rotuloSituacao: Record<SituacaoPeriodo, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  FECHADO: "Fechado",
  REABERTO: "Reaberto",
};

const anoAtual = new Date().getFullYear();
const ANOS = [anoAtual - 1, anoAtual, anoAtual + 1].map(String);

function datasDe(calendario: CalendarioDTO): Datas {
  const datas = vazio();
  calendario.periodos.forEach((p) => {
    datas[p.bimestre] = { inicio: p.inicio, fim: p.fim };
  });
  return datas;
}

export function CalendarioLetivo() {
  const [ano, setAno] = useState(String(anoAtual));
  const [versao, setVersao] = useState(0);
  const carga = useCarga(() => getCalendario(ano), Number(ano) * 1000 + versao);
  const [datas, setDatas] = useState<Datas>(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (carga.estado === "ok") setDatas(datasDe(carga.dados));
  }, [carga]);

  const periodos: Partial<Record<Bimestre, PeriodoDTO>> =
    carga.estado === "ok"
      ? Object.fromEntries(carga.dados.periodos.map((p) => [p.bimestre, p]))
      : {};

  function mudar(bimestre: Bimestre, campo: "inicio" | "fim", valor: string) {
    setDatas((atual) => ({ ...atual, [bimestre]: { ...atual[bimestre], [campo]: valor } }));
  }

  async function salvar() {
    if (BIMESTRES.some((b) => !datas[b.id].inicio || !datas[b.id].fim)) {
      toast.error("Preencha o início e o fim dos quatro bimestres.");
      return;
    }
    setSalvando(true);
    try {
      await salvarCalendario(
        ano,
        BIMESTRES.map((b) => ({ bimestre: b.id, ...datas[b.id] })),
      );
      toast.success(`Calendário de ${ano} salvo.`);
      setVersao((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar o calendário.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternar(periodo: PeriodoDTO) {
    try {
      if (periodo.situacao === "FECHADO") {
        await reabrirBimestre(ano, periodo.bimestre);
        toast.success(`${periodo.descricao} reaberto para lançamentos.`);
      }
      if (periodo.situacao === "REABERTO") {
        await fecharBimestre(ano, periodo.bimestre);
        toast.success(`${periodo.descricao} fechado.`);
      }
      setVersao((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao mudar o bimestre.");
    }
  }

  return (
    <Painel
      titulo={`Ano letivo de ${ano}`}
      icone={CalendarDays}
      semEspaco
      ferramentas={
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="h-9 w-28 text-sm" aria-label="Ano letivo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANOS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      rodape={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-prose text-sm text-muted-foreground">
            O bimestre fecha no dia seguinte ao fim. Com ele fechado, ninguém lança chamada, nota,
            atividade ou entrega daquele período, até a secretaria reabrir.
          </p>
          <Button onClick={salvar} disabled={salvando || carga.estado !== "ok"}>
            {salvando ? "Salvando..." : "Salvar calendário"}
          </Button>
        </div>
      }
    >
      {carga.estado === "carregando" && (
        <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && (
        <div className="p-4">
          <MensagemErro carga={carga} />
        </div>
      )}
      {carga.estado === "ok" && !carga.dados.cadastrado && (
        <p className="border-b border-border bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          O calendário de {ano} ainda não foi cadastrado. Sem ele, o sistema não fecha bimestres nem
          confere a data da chamada.
        </p>
      )}
      {carga.estado === "ok" && (
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow>
              <TableHead>Bimestre</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Lançamentos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BIMESTRES.map((b) => {
              const periodo = periodos[b.id];
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.label}</TableCell>
                  <TableCell>
                    <CampoData
                      value={datas[b.id].inicio}
                      min={`${ano}-01-01`}
                      max={`${ano}-12-31`}
                      onChange={(v) => mudar(b.id, "inicio", v)}
                      aria-label={`Início do ${b.label}`}
                      className="h-9 w-40 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <CampoData
                      value={datas[b.id].fim}
                      min={`${ano}-01-01`}
                      max={`${ano}-12-31`}
                      onChange={(v) => mudar(b.id, "fim", v)}
                      aria-label={`Fim do ${b.label}`}
                      className="h-9 w-40 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    {periodo ? (
                      <Etiqueta tom={tomSituacao[periodo.situacao]}>
                        {rotuloSituacao[periodo.situacao]}
                      </Etiqueta>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {periodo?.situacao === "FECHADO" && (
                      <Button size="sm" variant="outline" onClick={() => alternar(periodo)}>
                        Reabrir
                      </Button>
                    )}
                    {periodo?.situacao === "REABERTO" && (
                      <Button size="sm" variant="outline" onClick={() => alternar(periodo)}>
                        Fechar de novo
                      </Button>
                    )}
                    {periodo &&
                      periodo.situacao !== "FECHADO" &&
                      periodo.situacao !== "REABERTO" && (
                        <span className="text-sm text-muted-foreground">Abertos</span>
                      )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Painel>
  );
}
