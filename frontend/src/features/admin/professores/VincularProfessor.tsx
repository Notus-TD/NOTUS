import { ApiError } from "@/api/cliente";
import { type DisciplinaDTO } from "@/api/disciplinas";
import { type ProfessorDTO } from "@/api/professores";
import { createLecionamento, type LecionamentoDTO, type TurmaDTO } from "@/api/turmas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/layout/blocos";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_PROFESSORES_POR_DISCIPLINA,
  nomeProfessor,
} from "@/features/admin/professores/vinculos";
import { Link2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export function VincularProfessor({
  professores,
  turmas,
  disciplinas,
  lecionamentos,
  onVinculado,
}: {
  professores: ProfessorDTO[];
  turmas: TurmaDTO[];
  disciplinas: DisciplinaDTO[];
  lecionamentos: LecionamentoDTO[];
  onVinculado: () => void;
}) {
  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const professoresPorDisciplina = new Map<number, LecionamentoDTO[]>();
  for (const l of lecionamentos) {
    if (String(l.turmaId) !== turmaId) continue;
    professoresPorDisciplina.set(l.disciplinaId, [
      ...(professoresPorDisciplina.get(l.disciplinaId) ?? []),
      l,
    ]);
  }
  const indisponivel = (id: number) => {
    const atuais = professoresPorDisciplina.get(id) ?? [];
    return (
      atuais.length >= MAX_PROFESSORES_POR_DISCIPLINA ||
      atuais.some((l) => String(l.professorId) === professorId)
    );
  };
  const valido =
    professorId !== "" &&
    turmaId !== "" &&
    disciplinaId !== "" &&
    !indisponivel(Number(disciplinaId));

  async function vincular(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      const criado = await createLecionamento({
        professorId: Number(professorId),
        turmaId: Number(turmaId),
        disciplinaId: Number(disciplinaId),
      });
      toast.success(
        `${nomeProfessor(criado)} agora leciona ${criado.disciplinaTitle} no ${criado.turmaName}.`,
      );
      setDisciplinaId("");
      onVinculado();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao vincular o professor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vincular professor a uma turma</CardTitle>
        <CardDescription>
          Escolha o professor, a turma e a disciplina que ele vai lecionar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={vincular}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Professor</label>
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger className="h-9 text-sm" aria-label="Professor">
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Turma</label>
            <Select
              value={turmaId}
              onValueChange={(v) => {
                setTurmaId(v);
                setDisciplinaId("");
              }}
            >
              <SelectTrigger className="h-9 text-sm" aria-label="Turma">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}, {t.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Disciplina</label>
            <Select value={disciplinaId} onValueChange={setDisciplinaId} disabled={turmaId === ""}>
              <SelectTrigger className="h-9 text-sm" aria-label="Disciplina">
                <SelectValue
                  placeholder={
                    turmaId === "" ? "Escolha a turma primeiro" : "Selecione a disciplina"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => {
                  const atuais = professoresPorDisciplina.get(d.id) ?? [];
                  const nomes = atuais.map(nomeProfessor).join(" e ");
                  return (
                    <SelectItem key={d.id} value={String(d.id)} disabled={indisponivel(d.id)}>
                      {nomes ? `${d.title} (${nomes})` : d.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="sm:col-span-2 lg:col-span-1"
            disabled={!valido || salvando}
          >
            <Link2 className="size-4" aria-hidden="true" />
            {salvando ? "Vinculando..." : "Vincular"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
