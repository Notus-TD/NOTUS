import { ApiError } from "@/api/cliente";
import { getDisciplinas, type DisciplinaDTO } from "@/api/disciplinas";
import { getProfessores, type ProfessorDTO } from "@/api/professores";
import {
  deleteLecionamento,
  getLecionamentos,
  getTurmas,
  type LecionamentoDTO,
  type TurmaDTO,
} from "@/api/turmas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/layout/blocos";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BadgeAcessoPendente,
  BotaoRedefinirMfa,
  BotaoReenviarConvite,
} from "@/features/admin/comum/BotoesUsuario";
import { ConfirmarAcao } from "@/features/admin/comum/ConfirmarAcao";
import { CadastroProfessorForm } from "@/features/admin/professores/CadastroProfessorForm";
import { VincularProfessor } from "@/features/admin/professores/VincularProfessor";
import { nomeProfessor } from "@/features/admin/professores/vinculos";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { normalizar } from "@/lib/busca";
import { RefreshCw, Search, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Professores() {
  const [versao, setVersao] = useState(0);
  const [cadastrando, setCadastrando] = useState(false);
  const [busca, setBusca] = useState("");
  const professores = useCarga<ProfessorDTO[]>(getProfessores, versao);
  const lecionamentos = useCarga<LecionamentoDTO[]>(getLecionamentos, versao);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const disciplinas = useCarga<DisciplinaDTO[]>(getDisciplinas, versao);
  const cargas = [professores, lecionamentos, turmas, disciplinas];
  const carregando = cargas.some((c) => c.estado === "carregando");
  const erro = cargas.find((c) => c.estado === "erro");
  const atualizar = () => setVersao((v) => v + 1);

  async function remover(l: LecionamentoDTO) {
    try {
      await deleteLecionamento(l.id);
      toast.success(`${nomeProfessor(l)} não leciona mais ${l.disciplinaTitle} no ${l.turmaName}.`);
      atualizar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover o vínculo.");
    }
  }

  const termo = normalizar(busca.trim());
  const vinculosDe = (professorId: number) =>
    lecionamentos.estado === "ok"
      ? lecionamentos.dados
          .filter((l) => l.professorId === professorId)
          .sort(
            (a, b) =>
              a.turmaName.localeCompare(b.turmaName) ||
              a.disciplinaTitle.localeCompare(b.disciplinaTitle),
          )
      : [];

  return (
    <div className="space-y-6">
      <Painel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              aria-label="Buscar professor"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Button
            variant="outline"

            onClick={atualizar}
            disabled={carregando}
          >
            <RefreshCw
              className={`size-4 ${carregando ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
          <Button onClick={() => setCadastrando(true)} disabled={cadastrando}>
            <UserPlus className="size-4" aria-hidden="true" />
            Cadastrar professor
          </Button>
        </div>
      </Painel>

      {cadastrando && (
        <Card>
          <CardHeader>
            <CardTitle>Novo professor</CardTitle>
            <CardDescription>
              O professor entra no portal com o e-mail e, no primeiro acesso, a senha igual ao
              e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CadastroProfessorForm
              onSucesso={() => {
                setCadastrando(false);
                atualizar();
              }}
              onCancelar={() => setCadastrando(false)}
            />
          </CardContent>
        </Card>
      )}

      {erro?.estado === "erro" && <MensagemErro carga={erro} />}

      {professores.estado === "ok" &&
        lecionamentos.estado === "ok" &&
        turmas.estado === "ok" &&
        disciplinas.estado === "ok" && (
          <VincularProfessor
            professores={professores.dados}
            turmas={turmas.dados}
            disciplinas={disciplinas.dados}
            lecionamentos={lecionamentos.dados}
            onVinculado={atualizar}
          />
        )}

      <Card>
        <CardHeader>
          <CardTitle>Professores cadastrados</CardTitle>
          <CardDescription>Turmas e disciplinas em que cada professor leciona.</CardDescription>
        </CardHeader>
        <CardContent>
          {professores.estado === "carregando" && (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          )}
          {professores.estado === "ok" &&
            (() => {
              const filtrados = professores.dados.filter(
                (p) => !termo || normalizar(`${p.fullName} ${p.email}`).includes(termo),
              );
              if (filtrados.length === 0)
                return (
                  <p className="text-sm text-muted-foreground">
                    {termo
                      ? `Nenhum professor encontrado para "${busca.trim()}".`
                      : "Nenhum professor cadastrado ainda."}
                  </p>
                );
              return (
                <ul className="divide-y divide-border">
                  {filtrados.map((p) => {
                    const vinculos = vinculosDe(p.id);
                    return (
                      <li key={p.id} className="space-y-2 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                              <span className="truncate">{p.fullName}</span>
                              {p.acessoPendente && <BadgeAcessoPendente />}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.acessoPendente && (
                              <BotaoReenviarConvite userId={p.id} nome={p.fullName} />
                            )}
                            {!p.acessoPendente && (
                              <BotaoRedefinirMfa userId={p.id} nome={p.fullName} />
                            )}
                          </div>
                        </div>
                        {vinculos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Ainda não leciona em nenhuma turma.
                          </p>
                        ) : (
                          <ul className="flex flex-wrap gap-2">
                            {vinculos.map((l) => (
                              <li
                                key={l.id}
                                className="flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-sm font-medium text-foreground"
                              >
                                {l.disciplinaTitle} no {l.turmaName}
                                <ConfirmarAcao
                                  titulo="Tem certeza que deseja desvincular esse professor?"
                                  textoConfirmar="Desvincular"
                                  onConfirmar={() => void remover(l)}
                                >
                                  <button
                                    type="button"
                                    aria-label={`Remover ${l.disciplinaTitle} do ${l.turmaName}`}
                                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <X className="size-4" aria-hidden="true" />
                                  </button>
                                </ConfirmarAcao>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
        </CardContent>
      </Card>
    </div>
  );
}
