import { type StudentMinDTO } from "@/api/alunos";
import { type Bimestre } from "@/api/boletim";
import { ApiError } from "@/api/cliente";
import { Painel } from "@/components/layout/LayoutAdmin";
import { BoletimTurma } from "@/features/professor/BoletimTurma";
import { DisciplinaRef, alunosAtivosDaTurma } from "@/features/professor/turma";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export function NotasDaTurma({
  turmaId,
  disciplina,
  fechados,
}: {
  turmaId: number;
  disciplina: DisciplinaRef;
  fechados: Bimestre[];
}) {
  const [alunos, setAlunos] = useState<StudentMinDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    alunosAtivosDaTurma(turmaId)
      .then((lista) => ativo && setAlunos(lista))
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar os alunos da turma."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId]);

  return (
    <Painel
      titulo="Notas por bimestre"
      icone={BarChart3}
      ferramentas={
        <p className="text-sm text-muted-foreground">
          {fechados.length > 0
            ? "Bimestres fechados ficam bloqueados. Clique na nota, digite e tecle Enter."
            : "Clique na nota, digite e tecle Enter. A nota é salva na hora."}
        </p>
      }
    >
      {erro && <p className="text-sm font-semibold text-destructive">{erro}</p>}
      {!erro && alunos === null && (
        <p className="text-sm text-muted-foreground">Carregando alunos…</p>
      )}
      {alunos && <BoletimTurma alunos={alunos} disciplina={disciplina} fechados={fechados} />}
    </Painel>
  );
}
