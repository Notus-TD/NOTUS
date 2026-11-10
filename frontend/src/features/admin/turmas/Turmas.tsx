import { createTurma, getTurmas, type TurmaDTO, type TurmaRequestDTO } from "@/api/turmas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/layout/blocos";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetalheTurma } from "@/features/admin/turmas/DetalheTurma";
import { FormularioTurma } from "@/features/admin/turmas/FormularioTurma";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Turmas() {
  const [versao, setVersao] = useState(0);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const turmas = useCarga<TurmaDTO[]>(getTurmas, versao);
  const turmaAtual =
    turmas.estado === "ok" ? (turmas.dados.find((t) => t.id === turmaId) ?? null) : null;
  const atualizar = () => setVersao((v) => v + 1);

  async function criar(dados: TurmaRequestDTO) {
    const criada = await createTurma(dados);
    toast.success(`Turma ${criada.name} criada.`);
    setCriando(false);
    setTurmaId(criada.id);
    atualizar();
  }

  return (
    <div className="space-y-6">
      <Painel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-md space-y-2">
            <label className="block text-sm font-semibold text-foreground">Turma</label>
            {turmas.estado === "carregando" && (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            )}
            {turmas.estado === "erro" && <MensagemErro carga={turmas} />}
            {turmas.estado === "ok" && (
              <Select
                value={turmaId ? String(turmaId) : ""}
                onValueChange={(v) => setTurmaId(Number(v))}
              >
                <SelectTrigger className="h-9 text-sm" aria-label="Turma">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.dados.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} de {t.schoolYear}, {t.totalAlunos}{" "}
                      {t.totalAlunos === 1 ? "aluno" : "alunos"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            variant="outline"

            onClick={atualizar}
            disabled={turmas.estado === "carregando"}
          >
            <RefreshCw
              className={`size-4 ${turmas.estado === "carregando" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
          <Button onClick={() => setCriando(true)} disabled={criando}>
            <Plus className="size-4" aria-hidden="true" />
            Nova turma
          </Button>
        </div>
      </Painel>

      {criando && (
        <Card>
          <CardHeader>
            <CardTitle>Nova turma</CardTitle>
            <CardDescription>
              Não pode existir outra turma com o mesmo nome no mesmo ano letivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioTurma
              textoBotao="Criar turma"
              onSalvar={criar}
              onCancelar={() => setCriando(false)}
            />
          </CardContent>
        </Card>
      )}

      {turmaAtual ? (
        <DetalheTurma
          key={`${turmaAtual.id}-${versao}`}
          turma={turmaAtual}
          onAlterada={atualizar}
          onExcluida={() => {
            setTurmaId(null);
            atualizar();
          }}
        />
      ) : (
        !criando && (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Selecione uma turma para ver os alunos e professores, ou crie uma nova.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
