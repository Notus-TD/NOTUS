import { useEffect, useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, cadastrarAlunos, type StudentRegistrationResponse } from "@/lib/api";
import { emailValido, formatarTelefone, idadeEm, somenteDigitos, telefoneValido } from "@/lib/validacao";


const responsavelInicial = {
  nome: "",
  email: "",
  telefone: "",
};

const alunoVazio = {
  nome: "",
  email: "",
  matricula: "",
  nascimento: "",
};

type Responsavel = typeof responsavelInicial;
type Aluno = typeof alunoVazio & { chave: number };
type CampoAluno = keyof typeof alunoVazio;
type ErrosResponsavel = Partial<Record<keyof Responsavel, string>>;
type ErrosAluno = Partial<Record<CampoAluno, string>>;

const MAX_ALUNOS = 10;

let proximaChave = 0;
const novoAluno = (): Aluno => ({ ...alunoVazio, chave: proximaChave++ });

function validarNome(v: string): string | undefined {
  if (v.length < 3) return "Informe o nome completo.";
  if (!v.includes(" ")) return "Informe nome e sobrenome.";
  return;
}

function validarResponsavel(chave: keyof Responsavel, valor: string): string | undefined {
  const v = valor.trim();
  switch (chave) {
    case "nome":
      return validarNome(v);
    case "email":
      if (!emailValido(v)) return "Informe um e-mail válido (ex.: nome@dominio.com).";
      return;
    case "telefone":
      if (!telefoneValido(v)) return "Informe DDD + número (10 ou 11 dígitos).";
      return;
  }
}

// `alunos` é a lista inteira do formulário: matrícula e e-mail não podem se repetir entre os cards.
function validarAluno(
  chave: CampoAluno,
  aluno: Aluno,
  responsavel: Responsavel,
  alunos: Aluno[],
): string | undefined {
  const v = aluno[chave].trim();
  const repetido = alunos.some(
    (outro) => outro.chave !== aluno.chave && outro[chave].trim().toLowerCase() === v.toLowerCase(),
  );
  switch (chave) {
    case "nome":
      return validarNome(v);
    case "email":
      if (!emailValido(v)) return "Informe um e-mail válido (ex.: nome@dominio.com).";
      if (v.toLowerCase() === responsavel.email.trim().toLowerCase())
        return "O e-mail do aluno deve ser diferente do e-mail do responsável.";
      if (repetido) return "Outro aluno deste cadastro já usa este e-mail.";
      return;
    case "matricula":
      if (!/^\d{4,12}$/.test(v)) return "Informe só números (4 a 12 dígitos).";
      if (repetido) return "Outro aluno deste cadastro já usa esta matrícula.";
      return;
    case "nascimento": {
      const idade = idadeEm(v);
      if (idade === null) return "Informe a data de nascimento.";
      if (idade < 0) return "A data de nascimento não pode ser no futuro.";
      if (idade < 3) return "O aluno precisa ter pelo menos 3 anos.";
      if (idade > 25) return "Confira a data: idade acima de 25 anos.";
      return;
    }
  }
}

function validarTudoResponsavel(responsavel: Responsavel): ErrosResponsavel {
  const erros: ErrosResponsavel = {};
  for (const chave of Object.keys(responsavelInicial) as (keyof Responsavel)[]) {
    const erro = validarResponsavel(chave, responsavel[chave]);
    if (erro) erros[chave] = erro;
  }
  return erros;
}

function validarTudoAluno(aluno: Aluno, responsavel: Responsavel, alunos: Aluno[]): ErrosAluno {
  const erros: ErrosAluno = {};
  for (const chave of Object.keys(alunoVazio) as CampoAluno[]) {
    const erro = validarAluno(chave, aluno, responsavel, alunos);
    if (erro) erros[chave] = erro;
  }
  return erros;
}

const mascarasAluno: Partial<Record<CampoAluno, (v: string) => string>> = {
  matricula: (v) => somenteDigitos(v).slice(0, 12),
};

const rotulos: Record<string, string> = {
  "responsible.name": "Nome do responsável",
  "responsible.email": "E-mail do responsável",
  "responsible.phone": "Telefone do responsável",
  students: "Alunos",
  fullName: "Nome do aluno",
  educationalEmail: "E-mail escolar",
  matricula: "Matrícula",
  birthDate: "Data de nascimento",
};

// O backend devolve erros de aluno como "students[1].fullName".
function rotuloDoCampo(fieldName: string): string {
  const aluno = /^students\[(\d+)]\.(\w+)$/.exec(fieldName);
  if (aluno) return `${rotulos[aluno[2]!] ?? aluno[2]} (aluno ${Number(aluno[1]) + 1})`;
  return rotulos[fieldName] ?? fieldName;
}

const idCampoAluno = (indice: number, campo: CampoAluno) => `aluno-${indice}-${campo}`;

export function CadastroAlunoForm({ onSucesso }: { onSucesso?: (r: StudentRegistrationResponse[]) => void } = {}) {
  const [responsavel, setResponsavel] = useState<Responsavel>(responsavelInicial);
  const [alunos, setAlunos] = useState<Aluno[]>(() => [novoAluno()]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<StudentRegistrationResponse[] | null>(null);
  const [errosCampo, setErrosCampo] = useState<{ fieldName: string; message: string }[]>([]);
  const [errosResponsavel, setErrosResponsavel] = useState<ErrosResponsavel>({});
  const [errosAlunos, setErrosAlunos] = useState<Record<number, ErrosAluno>>({});
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [focarIndice, setFocarIndice] = useState<number | null>(null);

  // Leva o foco para o card recém-adicionado, depois que ele aparece na tela.
  useEffect(() => {
    if (focarIndice === null) return;
    const campo = document.getElementById(idCampoAluno(focarIndice, "nome"));
    campo?.scrollIntoView({ behavior: "smooth", block: "center" });
    campo?.focus({ preventScroll: true });
    setFocarIndice(null);
  }, [focarIndice]);

  function adicionarAluno() {
    if (alunos.length >= MAX_ALUNOS) return;
    setAlunos((lista) => [...lista, novoAluno()]);
    setFocarIndice(alunos.length);
  }

  function removerAluno(chave: number) {
    setAlunos((lista) => lista.filter((a) => a.chave !== chave));
    setErrosAlunos(({ [chave]: _removido, ...resto }) => resto);
  }

  const propsResponsavel = (chave: keyof Responsavel) => ({
    value: responsavel[chave],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const valor = chave === "telefone" ? formatarTelefone(e.target.value) : e.target.value;
      setResponsavel((r) => ({ ...r, [chave]: valor }));
      if (tocados[`responsavel.${chave}`])
        setErrosResponsavel((atual) => ({ ...atual, [chave]: validarResponsavel(chave, valor) }));
    },
    onBlur: () => {
      setTocados((t) => ({ ...t, [`responsavel.${chave}`]: true }));
      setErrosResponsavel((atual) => ({ ...atual, [chave]: validarResponsavel(chave, responsavel[chave]) }));
    },
    erro: errosResponsavel[chave],
  });

  const propsAluno = (aluno: Aluno, chave: CampoAluno) => {
    const tocado = `aluno.${aluno.chave}.${chave}`;
    const definirErro = (a: Aluno) =>
      setErrosAlunos((atual) => ({
        ...atual,
        [a.chave]: {
          ...atual[a.chave],
          [chave]: validarAluno(chave, a, responsavel, alunos.map((x) => (x.chave === a.chave ? a : x))),
        },
      }));
    return {
      value: aluno[chave],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const valor = mascarasAluno[chave]?.(e.target.value) ?? e.target.value;
        const atualizado = { ...aluno, [chave]: valor };
        setAlunos((lista) => lista.map((a) => (a.chave === aluno.chave ? atualizado : a)));
        if (tocados[tocado]) definirErro(atualizado);
      },
      onBlur: () => {
        setTocados((t) => ({ ...t, [tocado]: true }));
        definirErro(aluno);
      },
      erro: errosAlunos[aluno.chave]?.[chave],
    };
  };

  function limpar() {
    setResponsavel(responsavelInicial);
    setAlunos([novoAluno()]);
    setErrosResponsavel({});
    setErrosAlunos({});
    setTocados({});
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrosCampo([]);
    setResultado(null);

    const errosResp = validarTudoResponsavel(responsavel);
    const errosPorAluno = Object.fromEntries(alunos.map((a) => [a.chave, validarTudoAluno(a, responsavel, alunos)]));
    setErrosResponsavel(errosResp);
    setErrosAlunos(errosPorAluno);
    setTocados({
      ...Object.fromEntries(Object.keys(responsavelInicial).map((k) => [`responsavel.${k}`, true])),
      ...Object.fromEntries(
        alunos.flatMap((a) => Object.keys(alunoVazio).map((k) => [`aluno.${a.chave}.${k}`, true])),
      ),
    });

    const primeiroResp = Object.keys(errosResp)[0];
    const indiceAlunoComErro = alunos.findIndex((a) => Object.keys(errosPorAluno[a.chave] ?? {}).length > 0);
    if (primeiroResp || indiceAlunoComErro >= 0) {
      toast.error("Corrija os campos destacados antes de enviar.");
      const id = primeiroResp
        ? `responsavel-${primeiroResp}`
        : idCampoAluno(
            indiceAlunoComErro,
            Object.keys(errosPorAluno[alunos[indiceAlunoComErro]!.chave]!)[0] as CampoAluno,
          );
      document.getElementById(id)?.focus();
      return;
    }

    setEnviando(true);

    try {
      const res = await cadastrarAlunos({
        responsible: {
          name: responsavel.nome.trim(),
          email: responsavel.email.trim(),
          phone: somenteDigitos(responsavel.telefone),
        },
        students: alunos.map((a) => ({
          fullName: a.nome.trim(),
          educationalEmail: a.email.trim(),
          matricula: Number(a.matricula),
          birthDate: a.nascimento,
        })),
      });
      setResultado(res);
      onSucesso?.(res);
      limpar();
      toast.success(
        res.length === 1
          ? `${res[0]!.studentName} cadastrado(a). Registro nº ${res[0]!.userId}.`
          : `${res.length} alunos cadastrados.`,
      );
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
            <Campo id="responsavel-nome" rotulo="Nome completo" autoComplete="off" {...propsResponsavel("nome")} />
            <Campo id="responsavel-email" rotulo="E-mail" type="email" autoComplete="off" {...propsResponsavel("email")} />
            <Campo id="responsavel-telefone" rotulo="Telefone" inputMode="tel" placeholder="(11) 99999-0000" {...propsResponsavel("telefone")} />
          </CardContent>
        </Card>

        {alunos.map((aluno, indice) => (
          <Card key={aluno.chave}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-xl">{alunos.length > 1 ? `Aluno ${indice + 1}` : "Aluno"}</CardTitle>
                <CardDescription className="text-base">
                  O aluno usa o telefone do responsável. Se o e-mail do responsável já estiver cadastrado, o aluno é vinculado a ele.
                </CardDescription>
              </div>
              {alunos.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 shrink-0 text-base text-destructive hover:text-destructive"
                  onClick={() => removerAluno(aluno.chave)}
                  aria-label={`Remover aluno ${indice + 1}${aluno.nome.trim() ? ` (${aluno.nome.trim()})` : ""}`}
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                  Remover
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Campo id={idCampoAluno(indice, "nome")} rotulo="Nome completo" autoComplete="off" {...propsAluno(aluno, "nome")} />
              <Campo id={idCampoAluno(indice, "email")} rotulo="E-mail escolar" type="email" autoComplete="off" {...propsAluno(aluno, "email")} />
              <Campo id={idCampoAluno(indice, "matricula")} rotulo="Matrícula" inputMode="numeric" placeholder="20260001" {...propsAluno(aluno, "matricula")} />
              <Campo id={idCampoAluno(indice, "nascimento")} rotulo="Data de nascimento" type="date" max={new Date().toISOString().slice(0, 10)} {...propsAluno(aluno, "nascimento")} />
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 px-6 text-lg"
            onClick={adicionarAluno}
            disabled={alunos.length >= MAX_ALUNOS}
          >
            <Plus className="size-5" aria-hidden="true" />
            Adicionar aluno
          </Button>
          <p className="text-base text-muted-foreground">
            {alunos.length >= MAX_ALUNOS
              ? `Limite de ${MAX_ALUNOS} alunos por cadastro.`
              : "Use para cadastrar irmãos sob o mesmo responsável."}
          </p>
        </div>

        {errosCampo.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Dados inválidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-base text-foreground">
                {errosCampo.map((e) => (
                  <li key={e.fieldName}>
                    <strong>{rotuloDoCampo(e.fieldName)}:</strong> {e.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={enviando} className="min-h-12 px-6 text-lg">
          {enviando ? "Cadastrando..." : alunos.length > 1 ? `Cadastrar ${alunos.length} alunos` : "Cadastrar aluno"}
        </Button>
      </form>

      {resultado && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-xl">Cadastro concluído</CardTitle>
            <CardDescription className="text-base">Dados confirmados.</CardDescription>
          </CardHeader>
          <CardContent className="text-lg text-foreground">
            <ul className="space-y-1">
              {resultado.map((r) => (
                <li key={r.userId}>
                  <strong>{r.studentName}</strong> — registro nº {r.userId}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-base text-muted-foreground">
              O aluno e o responsável entram no portal com o e-mail e, no primeiro acesso, a senha igual ao e-mail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function Campo({
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
