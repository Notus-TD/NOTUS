import { getStudentDetalhe, type StudentDetalheDTO, type StudentMinDTO } from "@/api/alunos";
import { ApiError } from "@/api/cliente";
import { cancelarMatricula, reativarMatricula } from "@/api/usuarios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/layout/blocos";
import { Etiqueta } from "@/components/layout/LayoutAdmin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormularioEdicaoAluno } from "@/features/admin/alunos/FormularioEdicaoAluno";
import { rotuloSituacao, tomSituacao } from "@/features/admin/alunos/situacao";
import { BotaoAnonimizar } from "@/features/admin/comum/BotoesUsuario";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { formatarTelefone } from "@/lib/validacao";
import { ArrowLeft, Pencil, RotateCcw, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function BotaoMatricula({ aluno, aoMudar }: { aluno: StudentDetalheDTO; aoMudar: () => void }) {
  const [salvando, setSalvando] = useState(false);
  const cancelar = aluno.matriculaStatus === "ATIVA";
  if (!cancelar && aluno.matriculaStatus !== "CANCELADA") return null;

  async function confirmar() {
    setSalvando(true);
    try {
      if (cancelar) await cancelarMatricula(aluno.userId);
      if (!cancelar) await reativarMatricula(aluno.userId);
      toast.success(
        cancelar
          ? "Matrícula cancelada."
          : "Matrícula reativada. Escolha a turma do aluno em Turmas.",
      );
      aoMudar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar a matrícula.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          disabled={salvando}
          className={
            cancelar
              ? "min-h-9 border-destructive/60 text-sm text-destructive hover:bg-destructive/5 hover:text-destructive"
              : "min-h-9 text-sm"
          }
        >
          {cancelar ? (
            <UserX className="size-4" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          {cancelar ? "Cancelar matrícula" : "Reativar matrícula"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {cancelar
              ? `Cancelar a matrícula de ${aluno.fullName}?`
              : `Reativar a matrícula de ${aluno.fullName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {cancelar
              ? "O aluno sai da turma, perde o acesso ao portal e os avisos ainda não enviados são cancelados. Os dados e o histórico continuam guardados."
              : "O aluno volta a ter acesso ao portal, ainda sem turma. Depois, escolha a turma dele em Turmas."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmar}
            className={
              cancelar ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
            }
          >
            {cancelar ? "Cancelar matrícula" : "Reativar matrícula"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FichaAluno({ aluno, voltar }: { aluno: StudentMinDTO; voltar: () => void }) {
  const [versao, setVersao] = useState(0);
  const [editando, setEditando] = useState(false);
  const detalhe = useCarga<StudentDetalheDTO>(() => getStudentDetalhe(aluno.userId), versao);

  function salvou() {
    setEditando(false);
    setVersao((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={voltar}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a lista
      </Button>

      {detalhe.estado === "carregando" && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}
      {detalhe.estado === "erro" && <MensagemErro carga={detalhe} />}
      {detalhe.estado === "ok" && !editando && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-lg">{detalhe.dados.fullName}</CardTitle>
                <CardDescription>
                  Matrícula {detalhe.dados.matricula}, registro {detalhe.dados.userId}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Etiqueta tom={tomSituacao[detalhe.dados.matriculaStatus]}>
                  {rotuloSituacao[detalhe.dados.matriculaStatus]}
                </Etiqueta>
                <BotaoMatricula aluno={detalhe.dados} aoMudar={() => setVersao((v) => v + 1)} />
                <Button
                  variant="outline"
                  className="min-h-9 text-sm"
                  onClick={() => setEditando(true)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dado rotulo="E-mail do aluno" valor={detalhe.dados.educationalEmail ?? "—"} />
              <Dado
                rotulo="Data de nascimento"
                valor={new Date(`${detalhe.dados.birthDate}T00:00:00`).toLocaleDateString("pt-BR")}
              />
              <Dado rotulo="Turma" valor={detalhe.dados.turmaName ?? "Sem turma"} />
              <Dado
                rotulo="Acesso ao portal"
                valor={
                  detalhe.dados.acessoLiberadoEm
                    ? `Liberado pelo responsável em ${new Date(detalhe.dados.acessoLiberadoEm).toLocaleDateString("pt-BR")}`
                    : "Não liberado pelo responsável"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsável</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Dado rotulo="Nome" valor={detalhe.dados.responsibleName ?? "—"} />
              <Dado
                rotulo="Telefone"
                valor={formatarTelefone(detalhe.dados.responsiblePhone ?? "")}
              />
              <Dado rotulo="E-mail" valor={detalhe.dados.responsibleEmail ?? "—"} />
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">Dados do aluno cadastrados na escola.</p>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Zona de risco</CardTitle>
              <CardDescription>
                Apaga nome, e-mail, nascimento e senha do aluno e tira o vínculo com a turma e o
                responsável. Ficam só o registro e a matrícula, ligados ao histórico escolar. Só
                vale para matrícula cancelada ou finalizada. Ação irreversível, usada para atender
                pedidos de exclusão de dados (LGPD).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detalhe.dados.matriculaStatus === "ATIVA" ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Cancele a matrícula do aluno antes de anonimizar.
                </p>
              ) : (
                <BotaoAnonimizar
                  userId={detalhe.dados.userId}
                  nome={detalhe.dados.fullName}
                  codigo={String(detalhe.dados.matricula)}
                  rotuloCodigo="a matrícula"
                  aoConcluir={voltar}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
      {detalhe.estado === "ok" && editando && (
        <FormularioEdicaoAluno
          detalhe={detalhe.dados}
          onSalvo={salvou}
          onCancelar={() => setEditando(false)}
        />
      )}
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-semibold text-foreground">{valor}</p>
    </div>
  );
}
