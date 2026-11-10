import { liberarAcessoAluno, retirarAcessoAluno, type StudentMinDTO } from "@/api/alunos";
import { ApiError } from "@/api/cliente";
import { Painel } from "@/components/layout/LayoutAdmin";
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
import { Input } from "@/components/ui/input";
import { emailValido } from "@/lib/validacao";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AcessoDoFilho({ filho, aoMudar }: { filho: StudentMinDTO; aoMudar: () => void }) {
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const nome = filho.studentName.split(" ")[0] ?? filho.studentName;
  const liberado = filho.acessoLiberadoEm !== null;
  if (!liberado && filho.matriculaStatus !== "ATIVA") return null;

  async function liberar() {
    if (!emailValido(email.trim())) {
      toast.error("Informe um e-mail válido para o aluno.");
      return;
    }
    setSalvando(true);
    try {
      await liberarAcessoAluno(filho.userId, email.trim());
      toast.success(`Acesso liberado. ${nome} vai receber um e-mail para criar a senha.`);
      aoMudar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao liberar o acesso.");
    } finally {
      setSalvando(false);
    }
  }

  async function retirar() {
    setSalvando(true);
    try {
      await retirarAcessoAluno(filho.userId);
      toast.success(`Acesso de ${nome} retirado.`);
      aoMudar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao retirar o acesso.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Painel titulo={`Acesso de ${nome} ao portal`} icone={KeyRound}>
      {liberado ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Liberado por você em{" "}
            {new Date(filho.acessoLiberadoEm ?? "").toLocaleDateString("pt-BR")}. {nome} pode ver as
            próprias notas, faltas e atividades.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={salvando}>
                Retirar acesso
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirar o acesso de {nome}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {nome} não vai mais conseguir entrar no portal. Você pode liberar de novo quando
                  quiser.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={retirar}>Retirar acesso</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="max-w-prose text-sm text-muted-foreground">
            {nome} ainda não tem acesso ao portal. Se você liberar, {nome} recebe um e-mail para
            criar a senha e passa a ver as próprias notas, faltas e atividades. Você pode retirar o
            acesso quando quiser.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`E-mail de ${nome}`}
              aria-label={`E-mail de ${nome}`}
              className="h-9 max-w-xs text-sm"
            />
            <Button onClick={liberar} disabled={salvando}>
              {salvando ? "Liberando..." : "Liberar acesso"}
            </Button>
          </div>
        </div>
      )}
    </Painel>
  );
}
