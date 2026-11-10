import { updateResponsible, updateStudent, type StudentDetalheDTO } from "@/api/alunos";
import { ApiError } from "@/api/cliente";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/layout/blocos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  emailValido,
  formatarTelefone,
  somenteDigitos,
  telefoneValido,
  validarNascimento,
  validarNome,
} from "@/lib/validacao";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

export function FormularioEdicaoAluno({
  detalhe,
  onSalvo,
  onCancelar,
}: {
  detalhe: StudentDetalheDTO;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(detalhe.fullName);
  const [email, setEmail] = useState(detalhe.educationalEmail ?? "");
  const [matricula, setMatricula] = useState(String(detalhe.matricula));
  const [nascimento, setNascimento] = useState(detalhe.birthDate);
  const [respNome, setRespNome] = useState(detalhe.responsibleName ?? "");
  const [respEmail, setRespEmail] = useState(detalhe.responsibleEmail ?? "");
  const [respTelefone, setRespTelefone] = useState(
    formatarTelefone(detalhe.responsiblePhone ?? ""),
  );
  type ErrosEdicao = {
    nome?: string;
    email?: string;
    matricula?: string;
    nascimento?: string;
    respNome?: string;
    respEmail?: string;
    respTelefone?: string;
  };
  const [erros, setErros] = useState<ErrosEdicao>({});
  const [salvando, setSalvando] = useState(false);

  function validar(): ErrosEdicao {
    const novosErros: ErrosEdicao = {};
    const erroNome = validarNome(nome.trim());
    if (erroNome) novosErros.nome = erroNome;
    if (email.trim() && !emailValido(email))
      novosErros.email = "Informe um e-mail válido (ex.: nome@dominio.com).";
    if (!/^\d+$/.test(matricula.trim())) novosErros.matricula = "Informe só números.";
    const erroNascimento = validarNascimento(nascimento);
    if (erroNascimento) novosErros.nascimento = erroNascimento;
    if (detalhe.responsibleId !== null) {
      const erroRespNome = validarNome(respNome.trim());
      if (erroRespNome) novosErros.respNome = erroRespNome;
      if (!emailValido(respEmail)) novosErros.respEmail = "Informe um e-mail válido.";
      if (!telefoneValido(respTelefone))
        novosErros.respTelefone = "Informe DDD + número (10 ou 11 dígitos).";
    }
    return novosErros;
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    try {
      await updateStudent(detalhe.userId, {
        fullName: nome.trim(),
        educationalEmail: email.trim() || null,
        matricula: Number(matricula.trim()),
        birthDate: nascimento,
      });
      if (detalhe.responsibleId !== null) {
        await updateResponsible(detalhe.responsibleId, {
          name: respNome.trim(),
          email: respEmail.trim(),
          phone: somenteDigitos(respTelefone),
        });
      }
      toast.success("Cadastro atualizado.");
      onSalvo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do aluno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Nome completo" valor={nome} onChange={setNome} erro={erros.nome} />
          <CampoTexto
            rotulo="E-mail do aluno (opcional)"
            valor={email}
            onChange={setEmail}
            erro={erros.email}
          />
          <CampoTexto
            rotulo="Matrícula"
            valor={matricula}
            onChange={setMatricula}
            erro={erros.matricula}
          />
          <CampoTexto
            rotulo="Data de nascimento"
            tipo="date"
            valor={nascimento}
            onChange={setNascimento}
            erro={erros.nascimento}
          />
        </CardContent>
      </Card>

      {detalhe.responsibleId !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Nome"
              valor={respNome}
              onChange={setRespNome}
              erro={erros.respNome}
            />
            <CampoTexto
              rotulo="E-mail"
              valor={respEmail}
              onChange={setRespEmail}
              erro={erros.respEmail}
            />
            <CampoTexto
              rotulo="Telefone"
              valor={respTelefone}
              onChange={(v) => setRespTelefone(formatarTelefone(v))}
              erro={erros.respTelefone}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function CampoTexto({
  rotulo,
  valor,
  onChange,
  erro,
  tipo = "text",
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  erro?: string | undefined;
  tipo?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {rotulo}
      </label>
      <Input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-sm"
        aria-invalid={!!erro}
      />
      {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
    </div>
  );
}
