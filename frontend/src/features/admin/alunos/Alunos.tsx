import { type StudentMinDTO } from "@/api/alunos";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { BuscaAlunos } from "@/features/admin/alunos/BuscaAlunos";
import { CadastroAlunoForm } from "@/features/admin/alunos/CadastroAlunoForm";
import { FichaAluno } from "@/features/admin/alunos/FichaAluno";
import { ListaDeAlunos } from "@/features/admin/alunos/ListaDeAlunos";
import { ArrowLeft } from "lucide-react";

export type ModoAlunos =
  | { tipo: "lista" }
  | { tipo: "todos"; turma?: string }
  | { tipo: "cadastro" }
  | { tipo: "ficha"; aluno: StudentMinDTO };

export function Alunos({ modo, setModo }: { modo: ModoAlunos; setModo: (m: ModoAlunos) => void }) {
  const voltar = () => setModo({ tipo: "lista" });

  if (modo.tipo === "ficha" && modo.aluno.anonimizado) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={voltar}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para a lista
        </Button>
        <Painel>
          <p className="text-sm text-muted-foreground">
            Os dados pessoais deste aluno foram anonimizados a pedido do titular (LGPD). A matrícula
            {` ${modo.aluno.matricula} `}e o histórico escolar continuam guardados, sem identificar
            a pessoa. A anonimização não pode ser desfeita.
          </p>
        </Painel>
      </div>
    );
  }
  if (modo.tipo === "ficha") return <FichaAluno aluno={modo.aluno} voltar={voltar} />;
  if (modo.tipo === "cadastro") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={voltar}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para a lista
        </Button>
        <CadastroAlunoForm />
      </div>
    );
  }
  const abrir = (a: StudentMinDTO) => setModo({ tipo: "ficha", aluno: a });
  if (modo.tipo === "todos") {
    return <ListaDeAlunos key={modo.turma ?? "todas"} turmaInicial={modo.turma} abrir={abrir} />;
  }
  return <BuscaAlunos abrir={abrir} verTurma={(turma) => setModo({ tipo: "todos", turma })} />;
}
