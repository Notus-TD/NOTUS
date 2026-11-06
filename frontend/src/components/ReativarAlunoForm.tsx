import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/blocos";
import { Campo } from "@/components/CadastroAlunoForm";
import { ApiError, reativarAluno, type StudentMinDTO } from "@/lib/api";
import {
  emailValido,
  formatarTelefone,
  somenteDigitos,
  validarNascimento,
  validarNome,
  validarResponsavel,
} from "@/lib/validacao";

/*
 * Reativação de um aluno anonimizado que voltou para a escola. Como os dados pessoais foram
 * apagados, a secretaria informa tudo de novo; a matrícula e o histórico (notas e faltas) continuam.
 */

const vazio = {
  nome: "",
  email: "",
  nascimento: "",
  responsavelNome: "",
  responsavelEmail: "",
  responsavelTelefone: "",
};
type Dados = typeof vazio;
type Chave = keyof Dados;

function validar(chave: Chave, d: Dados): string | undefined {
  const v = d[chave].trim();
  switch (chave) {
    case "nome":
      return validarNome(v);
    case "email":
      if (!emailValido(v)) return "Informe um e-mail válido (ex.: nome@dominio.com).";
      if (v.toLowerCase() === d.responsavelEmail.trim().toLowerCase())
        return "O e-mail do aluno deve ser diferente do e-mail do responsável.";
      return;
    case "nascimento":
      return validarNascimento(v);
    case "responsavelNome":
      return validarResponsavel("nome", v);
    case "responsavelEmail":
      return validarResponsavel("email", v);
    case "responsavelTelefone":
      return validarResponsavel("telefone", v);
  }
}

const idCampo = (chave: Chave) => `reativar-${chave}`;

export function ReativarAlunoForm({
  aluno,
  aoConcluir,
}: {
  aluno: StudentMinDTO;
  aoConcluir: () => void;
}) {
  const [dados, setDados] = useState<Dados>(vazio);
  const [erros, setErros] = useState<Partial<Record<Chave, string>>>({});
  const [tocados, setTocados] = useState<Partial<Record<Chave, boolean>>>({});
  const [enviando, setEnviando] = useState(false);

  const props = (chave: Chave) => ({
    id: idCampo(chave),
    value: dados[chave],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const valor =
        chave === "responsavelTelefone" ? formatarTelefone(e.target.value) : e.target.value;
      const novos = { ...dados, [chave]: valor };
      setDados(novos);
      if (tocados[chave]) setErros((atual) => ({ ...atual, [chave]: validar(chave, novos) }));
    },
    onBlur: () => {
      setTocados((t) => ({ ...t, [chave]: true }));
      setErros((atual) => ({ ...atual, [chave]: validar(chave, dados) }));
    },
    erro: erros[chave],
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const todos = Object.fromEntries(
      (Object.keys(vazio) as Chave[]).map((c) => [c, validar(c, dados)]),
    ) as Partial<Record<Chave, string>>;
    setErros(todos);
    setTocados(Object.fromEntries(Object.keys(vazio).map((c) => [c, true])));
    const primeiro = (Object.keys(todos) as Chave[]).find((c) => todos[c]);
    if (primeiro) {
      toast.error("Corrija os campos destacados antes de enviar.");
      document.getElementById(idCampo(primeiro))?.focus();
      return;
    }

    setEnviando(true);
    try {
      await reativarAluno(aluno.userId, {
        responsible: {
          name: dados.responsavelNome.trim(),
          email: dados.responsavelEmail.trim(),
          phone: somenteDigitos(dados.responsavelTelefone),
        },
        fullName: dados.nome.trim(),
        educationalEmail: dados.email.trim(),
        birthDate: dados.nascimento,
      });
      toast.success(
        `${dados.nome.trim()} reativado(a). O convite de acesso foi enviado para ${dados.email.trim()}.`,
      );
      aoConcluir();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro inesperado ao reativar o aluno.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Matrícula {aluno.matricula}</CardTitle>
          <CardDescription className="text-base">
            Os dados deste aluno foram apagados. Para reativar a matrícula, informe os dados de
            novo. As notas e faltas anteriores continuam ligadas a ele, e a turma pode ser escolhida
            depois, em Turmas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome completo" autoComplete="off" {...props("nome")} />
          <Campo rotulo="E-mail escolar" type="email" autoComplete="off" {...props("email")} />
          <Campo
            rotulo="Data de nascimento"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            {...props("nascimento")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Responsável</CardTitle>
          <CardDescription className="text-base">
            Se o e-mail do responsável já estiver cadastrado, o aluno é vinculado a ele.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome completo" autoComplete="off" {...props("responsavelNome")} />
          <Campo rotulo="E-mail" type="email" autoComplete="off" {...props("responsavelEmail")} />
          <Campo
            rotulo="Telefone"
            inputMode="tel"
            placeholder="(11) 99999-0000"
            {...props("responsavelTelefone")}
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={enviando} className="min-h-12 px-6 text-lg">
        {enviando ? "Reativando..." : "Reativar matrícula"}
      </Button>
    </form>
  );
}
