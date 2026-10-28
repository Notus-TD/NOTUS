import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/CadastroAlunoForm";
import { ApiError, cadastrarProfessor, type ProfessorDTO } from "@/lib/api";
import { emailValido } from "@/lib/validacao";

type Erros = { nome?: string; email?: string };

function validar(nome: string, email: string): Erros {
  const erros: Erros = {};
  const n = nome.trim();
  if (n.length < 3) erros.nome = "Informe o nome completo.";
  else if (!n.includes(" ")) erros.nome = "Informe nome e sobrenome.";
  if (!emailValido(email.trim())) erros.email = "Informe um e-mail válido (ex.: nome@dominio.com).";
  return erros;
}

export function CadastroProfessorForm({
  onSucesso,
  onCancelar,
}: {
  onSucesso?: (p: ProfessorDTO) => void;
  onCancelar?: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const errosAtuais = validar(nome, email);
    setErros(errosAtuais);
    if (errosAtuais.nome || errosAtuais.email) {
      document.getElementById(errosAtuais.nome ? "professor-nome" : "professor-email")?.focus();
      return;
    }

    setEnviando(true);
    try {
      const criado = await cadastrarProfessor({ fullName: nome.trim(), email: email.trim() });
      toast.success(
        `${criado.fullName} cadastrado(a). No primeiro acesso, a senha é o próprio e-mail.`,
      );
      setNome("");
      setEmail("");
      setErros({});
      onSucesso?.(criado);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro inesperado ao cadastrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="professor-nome"
          rotulo="Nome completo"
          autoComplete="off"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros.nome}
        />
        <Campo
          id="professor-email"
          rotulo="E-mail"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={enviando} className="min-h-11 text-base">
          {enviando ? "Cadastrando..." : "Cadastrar professor"}
        </Button>
        {onCancelar && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 text-base"
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
