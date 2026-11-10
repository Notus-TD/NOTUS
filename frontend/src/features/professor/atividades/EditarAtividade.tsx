import { atualizarAtividade, type AtividadeDTO } from "@/api/atividades";
import { type Bimestre } from "@/api/boletim";
import { ApiError } from "@/api/cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BIMESTRES } from "@/lib/bimestres";
import { hojeLocal } from "@/lib/datas";
import { useState } from "react";
import { toast } from "sonner";

export function EditarAtividade({
  atividade,
  disciplinaId,
  fechados,
  aoSalvar,
  aoCancelar,
}: {
  atividade: AtividadeDTO;
  disciplinaId: number;
  fechados: Bimestre[];
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const hoje = hojeLocal();
  const [titulo, setTitulo] = useState(atividade.title);
  const [corpo, setCorpo] = useState(atividade.content);
  const [bimestre, setBimestre] = useState<Bimestre>(atividade.bimestre);
  const [prazo, setPrazo] = useState(atividade.prazo);
  const [pontos, setPontos] = useState(
    atividade.pontos === null ? "" : String(atividade.pontos).replace(".", ","),
  );
  const [salvando, setSalvando] = useState(false);
  const id = `editar-${atividade.id}`;

  async function salvar() {
    if (!titulo.trim() || !corpo.trim() || !prazo) {
      toast.error("Preencha o título, o texto e o prazo da atividade.");
      return;
    }
    if (prazo !== atividade.prazo && prazo < hoje) {
      toast.error("O prazo não pode ser uma data passada.");
      return;
    }
    const valorPontos = pontos.trim() ? Number(pontos.replace(",", ".")) : null;
    if (
      valorPontos !== null &&
      (Number.isNaN(valorPontos) || valorPontos <= 0 || valorPontos > 10)
    ) {
      toast.error("Os pontos devem ser maiores que 0 e no máximo 10.");
      return;
    }
    setSalvando(true);
    try {
      await atualizarAtividade(atividade.id, {
        title: titulo.trim(),
        content: corpo.trim(),
        bimestre,
        prazo,
        turmaId: atividade.turmaId,
        disciplinaId,
        pontos: valorPontos,
      });
      toast.success("Atividade atualizada.");
      aoSalvar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao atualizar a atividade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-semibold text-foreground">Editar atividade</p>
      <div className="space-y-2">
        <label htmlFor={`${id}-titulo`} className="block text-base font-semibold text-foreground">
          Título
        </label>
        <Input
          id={`${id}-titulo`}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="h-11 text-base"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-corpo`} className="block text-base font-semibold text-foreground">
          Texto
        </label>
        <Textarea
          id={`${id}-corpo`}
          rows={3}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          className="text-base"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label
            htmlFor={`${id}-bimestre`}
            className="block text-base font-semibold text-foreground"
          >
            Bimestre
          </label>
          <Select value={bimestre} onValueChange={(v) => setBimestre(v as Bimestre)}>
            <SelectTrigger id={`${id}-bimestre`} className="h-11 w-44 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BIMESTRES.map((b) => (
                <SelectItem key={b.id} value={b.id} disabled={fechados.includes(b.id)}>
                  {b.label}
                  {fechados.includes(b.id) ? " (fechado)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-prazo`} className="block text-base font-semibold text-foreground">
            Prazo de entrega
          </label>
          <Input
            id={`${id}-prazo`}
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="h-11 w-44 text-base"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-pontos`} className="block text-base font-semibold text-foreground">
            Nota
          </label>
          <Input
            id={`${id}-pontos`}
            inputMode="decimal"
            value={pontos}
            onChange={(e) => setPontos(e.target.value)}
            placeholder="Ex.: 1,0"
            className="h-11 w-36 text-base"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={salvar} disabled={salvando} className="min-h-11 text-base">
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
        <Button
          variant="ghost"
          onClick={aoCancelar}
          disabled={salvando}
          className="min-h-11 text-base"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
