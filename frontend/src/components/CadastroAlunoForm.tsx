import { useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, cadastrarAluno, type StudentRegistrationResponse } from "@/lib/api";
import { emailValido, formatarCpf, formatarTelefone, idadeEm, somenteDigitos, telefoneValido } from "@/lib/validacao";


const inicial = {
  responsavelNome: "",
  responsavelEmail: "",
  responsavelTelefone: "",
  responsavelEndereco: "",
  responsavelCpf: "",
  alunoNome: "",
  alunoEmail: "",
  alunoMatricula: "",
  alunoNascimento: "",
};

type Campos = typeof inicial;
type Erros = Partial<Record<keyof Campos, string>>;

function validarCampo(chave: keyof Campos, valor: string, campos: Campos): string | undefined {
  const v = valor.trim();
  switch (chave) {
    case "responsavelNome":
    case "alunoNome":
      if (v.length < 3) return "Informe o nome completo.";
      if (!v.includes(" ")) return "Informe nome e sobrenome.";
      return;
    case "responsavelEmail":
    case "alunoEmail":
      if (!emailValido(v)) return "Informe um e-mail válido (ex.: nome@dominio.com).";
      if (chave === "alunoEmail" && v.toLowerCase() === campos.responsavelEmail.trim().toLowerCase())
        return "O e-mail do aluno deve ser diferente do e-mail do responsável.";
      return;
    case "responsavelTelefone":
      if (!telefoneValido(v)) return "Informe DDD + número (10 ou 11 dígitos).";
      return;
    case "responsavelEndereco":
      if (v.length < 5) return "Informe o endereço.";
      return;
    case "responsavelCpf":
      if (somenteDigitos(v).length !== 11) return "O CPF precisa ter 11 dígitos.";
      return;
    case "alunoMatricula":
      if (!/^\d{4,12}$/.test(v)) return "Informe só números (4 a 12 dígitos).";
      return;
    case "alunoNascimento": {
      const idade = idadeEm(v);
      if (idade === null) return "Informe a data de nascimento.";
      if (idade < 0) return "A data de nascimento não pode ser no futuro.";
      if (idade < 3) return "O aluno precisa ter pelo menos 3 anos.";
      if (idade > 25) return "Confira a data: idade acima de 25 anos.";
      return;
    }
  }
}

function validarTudo(campos: Campos): Erros {
  const erros: Erros = {};
  for (const chave of Object.keys(campos) as (keyof Campos)[]) {
    const erro = validarCampo(chave, campos[chave], campos);
    if (erro) erros[chave] = erro;
  }
  return erros;
}

const mascaras: Partial<Record<keyof Campos, (v: string) => string>> = {
  responsavelCpf: formatarCpf,
  responsavelTelefone: formatarTelefone,
  alunoMatricula: (v) => somenteDigitos(v).slice(0, 12),
};

const rotulos: Record<string, string> = {
  "responsible.name": "Nome do responsável",
  "responsible.email": "E-mail do responsável",
  "responsible.phone": "Telefone do responsável",
  "responsible.address": "Endereço",
  "responsible.cpf": "CPF do responsável",
  "student.fullName": "Nome do aluno",
  "student.educationalEmail": "E-mail escolar",
  "student.matricula": "Matrícula",
  "student.birthDate": "Data de nascimento",
};

export function CadastroAlunoForm({ onSucesso }: { onSucesso?: (r: StudentRegistrationResponse) => void } = {}) {
  const [campos, setCampos] = useState<Campos>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<StudentRegistrationResponse | null>(null);
  const [errosCampo, setErrosCampo] = useState<{ fieldName: string; message: string }[]>([]);
  const [erros, setErros] = useState<Erros>({});
  const [tocados, setTocados] = useState<Partial<Record<keyof Campos, boolean>>>({});

  const set = (chave: keyof Campos) => (e: ChangeEvent<HTMLInputElement>) => {
    const valor = mascaras[chave]?.(e.target.value) ?? e.target.value;
    const novos = { ...campos, [chave]: valor };
    setCampos(novos);
    if (tocados[chave]) setErros((atual) => ({ ...atual, [chave]: validarCampo(chave, valor, novos) }));
  };

  const validarAoSair = (chave: keyof Campos) => () => {
    setTocados((t) => ({ ...t, [chave]: true }));
    setErros((atual) => ({ ...atual, [chave]: validarCampo(chave, campos[chave], campos) }));
  };

  const props = (chave: keyof Campos) => ({
    value: campos[chave],
    onChange: set(chave),
    onBlur: validarAoSair(chave),
    erro: erros[chave],
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrosCampo([]);
    setResultado(null);

    const errosAtuais = validarTudo(campos);
    setErros(errosAtuais);
    setTocados(Object.fromEntries(Object.keys(campos).map((k) => [k, true])));
    if (Object.keys(errosAtuais).length > 0) {
      toast.error("Corrija os campos destacados antes de enviar.");
      const primeiro = Object.keys(errosAtuais)[0];
      if (primeiro) document.getElementById(primeiro)?.focus();
      return;
    }

    setEnviando(true);

    try {
      const res = await cadastrarAluno({
        responsible: {
          name: campos.responsavelNome.trim(),
          email: campos.responsavelEmail.trim(),
          phone: somenteDigitos(campos.responsavelTelefone),
          address: campos.responsavelEndereco.trim(),
          cpf: campos.responsavelCpf,
        },
        student: {
          fullName: campos.alunoNome.trim(),
          educationalEmail: campos.alunoEmail.trim(),
          matricula: Number(campos.alunoMatricula),
          birthDate: campos.alunoNascimento,
        },
      });
      setResultado(res);
      onSucesso?.(res);
      setCampos(inicial);
      setErros({});
      setTocados({});
      toast.success(`${res.studentName} cadastrado(a). Registro nº ${res.userId}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrosCampo(err.fieldErrors);
        toast.error(err.fieldErrors.length ? "Corrija os campos destacados." : err.message);
      } else {
        toast.error("Erro inesperado ao cadastrar.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={enviar} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Responsável</CardTitle>
            <CardDescription className="text-base">Quem responde pelo aluno na escola.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo id="responsavelNome" rotulo="Nome completo" autoComplete="off" {...props("responsavelNome")} />
            <Campo id="responsavelEmail" rotulo="E-mail" type="email" autoComplete="off" {...props("responsavelEmail")} />
            <Campo id="responsavelTelefone" rotulo="Telefone" inputMode="tel" placeholder="(11) 99999-0000" {...props("responsavelTelefone")} />
            <Campo id="responsavelCpf" rotulo="CPF" inputMode="numeric" placeholder="000.000.000-00" {...props("responsavelCpf")} />
            <div className="sm:col-span-2">
              <Campo id="responsavelEndereco" rotulo="Endereço" {...props("responsavelEndereco")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Aluno</CardTitle>
            <CardDescription className="text-base">
              O aluno usa o telefone e o endereço do responsável. Se o CPF do responsável já estiver cadastrado, o aluno é vinculado a ele.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo id="alunoNome" rotulo="Nome completo" autoComplete="off" {...props("alunoNome")} />
            <Campo id="alunoEmail" rotulo="E-mail escolar" type="email" autoComplete="off" {...props("alunoEmail")} />
            <Campo id="alunoMatricula" rotulo="Matrícula" inputMode="numeric" placeholder="20260001" {...props("alunoMatricula")} />
            <Campo id="alunoNascimento" rotulo="Data de nascimento" type="date" max={new Date().toISOString().slice(0, 10)} {...props("alunoNascimento")} />
          </CardContent>
        </Card>

        {errosCampo.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Dados inválidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-base text-foreground">
                {errosCampo.map((e) => (
                  <li key={e.fieldName}>
                    <strong>{rotulos[e.fieldName] ?? e.fieldName}:</strong> {e.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={enviando} className="min-h-12 px-6 text-lg">
          {enviando ? "Cadastrando..." : "Cadastrar aluno"}
        </Button>
      </form>

      {resultado && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-xl">Cadastro concluído</CardTitle>
            <CardDescription className="text-base">Dados confirmados.</CardDescription>
          </CardHeader>
          <CardContent className="text-lg text-foreground">
            <p>
              <strong>Aluno:</strong> {resultado.studentName}
            </p>
            <p>
              <strong>Registro no sistema:</strong> {resultado.userId}
            </p>
            <p className="mt-2 text-base text-muted-foreground">
              O aluno e o responsável entram no portal com o e-mail e, no primeiro acesso, a senha igual ao e-mail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  ...props
}: { id: string; rotulo: string; erro?: string | undefined } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-lg font-semibold text-foreground">
        {rotulo}
      </label>
      <Input
        id={id}
        required
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`h-12 text-lg ${erro ? "border-destructive focus-visible:ring-destructive" : ""}`}
        {...props}
      />
      {erro && (
        <p id={`${id}-erro`} className="text-base font-medium text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
