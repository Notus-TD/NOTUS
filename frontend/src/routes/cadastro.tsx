import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, cadastrarAluno, type StudentRegistrationResponse } from "@/lib/api";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro de aluno · NOTUS" },
      { name: "description", content: "Cadastre um novo aluno e seu responsável no portal NOTUS." },
    ],
  }),
  component: CadastroAluno,
});

const inicial = {
  responsavelNome: "",
  responsavelEmail: "",
  responsavelTelefone: "",
  responsavelEndereco: "",
  responsavelCpf: "",
  alunoNome: "",
  alunoEmail: "",
  alunoCpf: "",
  alunoNascimento: "",
  alunoMatricula: "",
};

type Campos = typeof inicial;

const rotulos: Record<string, string> = {
  "responsible.name": "Nome do responsável",
  "responsible.email": "E-mail do responsável",
  "responsible.phone": "Telefone do responsável",
  "responsible.address": "Endereço",
  "responsible.cpf": "CPF do responsável",
  "student.fullName": "Nome do aluno",
  "student.educationalEmail": "E-mail escolar",
  "student.cpf": "CPF do aluno",
  "student.birthDate": "Data de nascimento",
  "student.matricula": "Matrícula",
};

function CadastroAluno() {
  const [campos, setCampos] = useState<Campos>(inicial);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<StudentRegistrationResponse | null>(null);
  const [errosCampo, setErrosCampo] = useState<{ fieldName: string; message: string }[]>([]);

  const set = (chave: keyof Campos) => (e: ChangeEvent<HTMLInputElement>) =>
    setCampos({ ...campos, [chave]: e.target.value });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrosCampo([]);
    setResultado(null);
    setEnviando(true);

    try {
      const res = await cadastrarAluno({
        responsible: {
          name: campos.responsavelNome.trim(),
          email: campos.responsavelEmail.trim(),
          phone: campos.responsavelTelefone.trim(),
          address: campos.responsavelEndereco.trim(),
          cpf: campos.responsavelCpf.trim(),
        },
        student: {
          fullName: campos.alunoNome.trim(),
          educationalEmail: campos.alunoEmail.trim(),
          cpf: campos.alunoCpf.trim(),
          birthDate: campos.alunoNascimento,
          matricula: Number(campos.alunoMatricula),
        },
      });
      setResultado(res);
      setCampos(inicial);
      toast.success(`Aluno cadastrado. Usuário nº ${res.userId}, matrícula ${res.matriculaStatus}.`);
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
    <AppShell
      titulo="Cadastro de aluno"
      subtitulo="Secretaria · Cadastre o responsável e o aluno. Os dois recebem acesso ao portal com a senha inicial igual ao e-mail."
    >
      <form onSubmit={enviar} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Responsável</CardTitle>
            <CardDescription className="text-base">Quem responde pelo aluno na escola.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo id="responsavelNome" rotulo="Nome completo" value={campos.responsavelNome} onChange={set("responsavelNome")} />
            <Campo id="responsavelEmail" rotulo="E-mail" type="email" value={campos.responsavelEmail} onChange={set("responsavelEmail")} />
            <Campo id="responsavelTelefone" rotulo="Telefone" inputMode="tel" placeholder="11999990000" value={campos.responsavelTelefone} onChange={set("responsavelTelefone")} />
            <Campo id="responsavelCpf" rotulo="CPF" placeholder="000.000.000-00" value={campos.responsavelCpf} onChange={set("responsavelCpf")} />
            <div className="sm:col-span-2">
              <Campo id="responsavelEndereco" rotulo="Endereço" value={campos.responsavelEndereco} onChange={set("responsavelEndereco")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Aluno</CardTitle>
            <CardDescription className="text-base">O aluno usa o telefone e o endereço do responsável.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Campo id="alunoNome" rotulo="Nome completo" value={campos.alunoNome} onChange={set("alunoNome")} />
            <Campo id="alunoEmail" rotulo="E-mail escolar" type="email" value={campos.alunoEmail} onChange={set("alunoEmail")} />
            <Campo id="alunoCpf" rotulo="CPF" placeholder="000.000.000-00" value={campos.alunoCpf} onChange={set("alunoCpf")} />
            <Campo id="alunoNascimento" rotulo="Data de nascimento" type="date" value={campos.alunoNascimento} onChange={set("alunoNascimento")} />
            <Campo id="alunoMatricula" rotulo="Matrícula" type="number" inputMode="numeric" placeholder="20260010" value={campos.alunoMatricula} onChange={set("alunoMatricula")} />
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
            <CardDescription className="text-base">Resposta do servidor.</CardDescription>
          </CardHeader>
          <CardContent className="text-lg text-foreground">
            <p>
              <strong>ID do usuário:</strong> {resultado.userId}
            </p>
            <p>
              <strong>Situação da matrícula:</strong> {resultado.matriculaStatus}
            </p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function Campo({
  id,
  rotulo,
  ...props
}: { id: string; rotulo: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-lg font-semibold text-foreground">
        {rotulo}
      </label>
      <Input id={id} required className="h-12 text-lg" {...props} />
    </div>
  );
}
