import { ApiError } from "@/api/cliente";
import { type TurmaRequestDTO } from "@/api/turmas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

export function FormularioTurma({
  inicial,
  textoBotao,
  onSalvar,
  onCancelar,
}: {
  inicial?: TurmaRequestDTO;
  textoBotao: string;
  onSalvar: (dados: TurmaRequestDTO) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(inicial?.name ?? "");
  const [schoolYear, setSchoolYear] = useState(
    inicial?.schoolYear ?? String(new Date().getFullYear()),
  );
  const [salvando, setSalvando] = useState(false);
  const valido = name.trim() !== "" && schoolYear.trim() !== "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      await onSalvar({ name: name.trim(), schoolYear: schoolYear.trim() });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a turma.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="grid gap-4 sm:grid-cols-[1fr_10rem] lg:grid-cols-[1fr_10rem_auto] lg:items-end"
    >
      <div className="space-y-2">
        <label htmlFor={`${id}-nome`} className="block text-sm font-semibold text-foreground">
          Nome da turma
        </label>
        <Input
          id={`${id}-nome`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: 9º Ano A"
          className="h-9 text-sm"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-ano`} className="block text-sm font-semibold text-foreground">
          Ano letivo
        </label>
        <Input
          id={`${id}-ano`}
          value={schoolYear}
          onChange={(e) => setSchoolYear(e.target.value)}
          inputMode="numeric"
          maxLength={4}
          className="h-9 text-sm"
          required
        />
      </div>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" disabled={!valido || salvando}>
          {salvando ? "Salvando..." : textoBotao}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
