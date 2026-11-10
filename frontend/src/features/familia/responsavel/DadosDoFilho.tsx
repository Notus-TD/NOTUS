import { type StudentMinDTO } from "@/api/alunos";
import { getAtividadesDoAluno } from "@/api/atividades";
import { getBoletimDoAluno } from "@/api/boletim";
import { type FrequenciaDTO } from "@/api/falta";
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
  const boletim = useCarga(() => getBoletimDoAluno(filho.userId), 0);
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
  const boletim = useCarga(() => getBoletimDoAluno(filho.userId), 0);
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
