import { useState, type ReactNode } from "react";
import { RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStudents, type StudentMinDTO } from "@/api/alunos";
import { getTurmas, type TurmaDTO } from "@/api/turmas";
import { useCarga, type Carga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";

export function VisaoGeralAdmin({
  aoCadastrarAluno,
  aoAbrirAluno,
  aoVerAlunos,
  aoVerComunicados,
  formComunicado,
}: {
  aoCadastrarAluno: () => void;
  aoAbrirAluno: (aluno: StudentMinDTO) => void;
  aoVerAlunos: () => void;
  aoVerComunicados: () => void;
  formComunicado: ReactNode;
}) {
  const [versao, setVersao] = useState(0);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const alunos = useCarga<StudentMinDTO[]>(getStudents, versao);
  const carregando = turmas.estado === "carregando" || alunos.estado === "carregando";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-6 rounded-md border border-border bg-card p-5 shadow-sm">
        <dl className="flex flex-wrap gap-x-14 gap-y-4">
          <Numero rotulo="Turmas" carga={turmas} valor={(t) => t.length} />
          <Numero
            rotulo="Alunos matriculados"
            carga={alunos}
            valor={(a) => a.filter((s) => s.matriculaStatus === "ATIVA").length}
          />
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setVersao((v) => v + 1)}
            disabled={carregando}
          >
            <RefreshCw
              className={`size-4 ${carregando ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
          <Button onClick={aoCadastrarAluno}>
            <UserPlus className="size-4" aria-hidden="true" />
            Cadastrar aluno
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="ultimos-titulo"
          className="rounded-md border border-border bg-card p-5 shadow-sm"
        >
          <Cabecalho
            id="ultimos-titulo"
            titulo="Últimos alunos cadastrados"
            link="Ver todos"
            aoClicar={aoVerAlunos}
          />
          {alunos.estado === "carregando" && <Carregando />}
          {alunos.estado === "erro" && <MensagemErro carga={alunos} />}
          {alunos.estado === "ok" &&
            (alunos.dados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aluno cadastrado ainda. Use &quot;Cadastrar aluno&quot; para começar.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {alunos.dados
                  .filter((a) => !a.anonimizado)
                  .reverse()
                  .slice(0, 5)
                  .map((a) => (
                    <li key={a.userId}>
                      <button
                        type="button"
                        onClick={() => aoAbrirAluno(a)}
                        className="flex w-full items-baseline justify-between gap-4 rounded-md px-2 py-3 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {a.studentName}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            Matrícula {a.matricula}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-sm font-medium ${a.matriculaStatus === "ATIVA" ? "text-success" : "text-muted-foreground"}`}
                        >
                          {a.matriculaStatus === "ATIVA" ? "Ativa" : "Finalizada"}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            ))}
        </section>

        <section
          aria-labelledby="comunicado-titulo"
          className="rounded-md border border-border bg-card p-5 shadow-sm"
        >
          <Cabecalho
            id="comunicado-titulo"
            titulo="Comunicado rápido"
            link="Ver enviados"
            aoClicar={aoVerComunicados}
          />
          {formComunicado}
        </section>
      </div>
    </div>
  );
}

function Numero<T>({
  rotulo,
  carga,
  valor,
}: {
  rotulo: string;
  carga: Carga<T>;
  valor: (dados: T) => number;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="mt-1 font-display text-4xl font-semibold leading-none text-foreground">
        {carga.estado === "ok" ? valor(carga.dados) : carga.estado === "erro" ? "–" : "…"}
      </dd>
      {carga.estado === "erro" && (
        <dd className="mt-2">
          <MensagemErro carga={carga} />
        </dd>
      )}
    </div>
  );
}

function Cabecalho({
  id,
  titulo,
  link,
  aoClicar,
}: {
  id: string;
  titulo: string;
  link: string;
  aoClicar: () => void;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h3 id={id} className="text-base font-semibold text-foreground">
        {titulo}
      </h3>
      <button
        type="button"
        onClick={aoClicar}
        className="shrink-0 whitespace-nowrap rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {link}
      </button>
    </div>
  );
}

function Carregando() {
  return <p className="text-sm text-muted-foreground">Carregando…</p>;
}
