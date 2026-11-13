import { type StudentMinDTO } from "@/api/alunos";
import { getAtividadesDoAluno } from "@/api/atividades";
import { getNotasDoAluno, type NotaDTO, type Bimestre } from "@/api/nota";
import { type FrequenciaDTO } from "@/api/falta";
import type { BoletimDisciplinaDTO, BoletimDTO } from "@/api/boletim";
import { Painel } from "@/components/layout/LayoutAdmin";
import {
  BoletimEscolar,
  ResumoAluno,
  TabelaAtividades,
  type DestinoResumo,
} from "@/features/familia/PortalFamilia";
import { useCarga, type Carga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { hojeLocal } from "@/lib/datas";
import { BarChart3, ClipboardList } from "lucide-react";

export function EstadoFilhos({ filhos }: { filhos: Carga<StudentMinDTO[]> }) {
  if (filhos.estado === "carregando") {
    return (
      <Painel>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </Painel>
    );
  }
  if (filhos.estado === "erro") {
    return (
      <Painel>
        <MensagemErro carga={filhos} />
      </Painel>
    );
  }
  if (filhos.dados.length === 0) {
    return (
      <Painel>
        <p className="text-sm text-muted-foreground">
          Nenhum aluno vinculado a esta conta. Procure a secretaria da escola.
        </p>
      </Painel>
    );
  }
  return null;
}

export function ResumoDoFilho({
  filho,
  frequencia,
  avisosNovos,
  aoAbrir,
}: {
  filho: StudentMinDTO;
  frequencia: FrequenciaDTO[] | null;
  avisosNovos: number;
  aoAbrir: (destino: DestinoResumo) => void;
}) {
  // REFN: busca notas e reconstrói estrutura de boletim
  const boletim = useCarga(async () => {
    const notas = await getNotasDoAluno(filho.userId);
    return reconstruirBoletim(notas);
  }, 0);
  const atividades = useCarga(() => getAtividadesDoAluno(filho.userId), 0);
  return (
    <ResumoAluno
      boletim={boletim.estado === "ok" ? boletim.dados : null}
      frequencia={frequencia}
      atividades={atividades.estado === "ok" ? atividades.dados : null}
      hoje={hojeLocal()}
      avisosNovos={avisosNovos}
      aoAbrir={aoAbrir}
    />
  );
}

export function BoletimDoFilho({
  filho,
  frequencia,
}: {
  filho: StudentMinDTO;
  frequencia: FrequenciaDTO[] | null;
}) {
  // REFN: busca notas e reconstrói estrutura de boletim
  const boletim = useCarga(async () => {
    const notas = await getNotasDoAluno(filho.userId);
    return reconstruirBoletim(notas);
  }, 0);
  return (
    <Painel titulo={`Boletim de ${filho.studentName}`} icone={BarChart3} semEspaco>
      {boletim.estado === "carregando" && (
        <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
      )}
      {boletim.estado === "erro" && (
        <div className="p-4">
          <MensagemErro carga={boletim} />
        </div>
      )}
      {boletim.estado === "ok" && (
        <BoletimEscolar boletim={boletim.dados} frequencia={frequencia} />
      )}
    </Painel>
  );
}

export function AtividadesDoFilho({ filho }: { filho: StudentMinDTO }) {
  const atividades = useCarga(() => getAtividadesDoAluno(filho.userId), 0);
  return (
    <Painel titulo={`Atividades de ${filho.studentName}`} icone={ClipboardList} semEspaco>
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
          Nenhuma atividade publicada para a turma ainda.
        </p>
      )}
      {atividades.estado === "ok" && atividades.dados.length > 0 && (
        <TabelaAtividades atividades={atividades.dados} hoje={hojeLocal()} />
      )}
    </Painel>
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
    const bimestresData: BoletimDTO[] = [];

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
