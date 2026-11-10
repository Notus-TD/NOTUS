import { ApiError } from "@/api/cliente";
import {
  atualizarDisciplina,
  criarDisciplina,
  deletarDisciplina,
  getDisciplinas,
  type DisciplinaDTO,
} from "@/api/disciplinas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/layout/blocos";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmarAcao } from "@/features/admin/comum/ConfirmarAcao";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

export function Disciplinas() {
  const [versao, setVersao] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [deletando, setDeletando] = useState<number | null>(null);
  const carga = useCarga<DisciplinaDTO[]>(getDisciplinas, versao);
  const atualizar = () => setVersao((v) => v + 1);

  async function criar(dados: { title: string; description: string }) {
    const criada = await criarDisciplina(dados);
    toast.success(`Disciplina ${criada.title} criada.`);
    setCriando(false);
    atualizar();
  }

  async function atualizar_disciplina(id: number, dados: { title: string; description: string }) {
    const atualizada = await atualizarDisciplina(id, dados);
    toast.success(`Disciplina ${atualizada.title} atualizada.`);
    setEditandoId(null);
    atualizar();
  }

  async function deletar(id: number) {
    await deletarDisciplina(id);
    toast.success("Disciplina deletada.");
    setDeletando(null);
    atualizar();
  }

  return (
    <div className="space-y-6">
      <Painel>
        <div className="flex flex-wrap items-end gap-3">
          <Button onClick={() => setCriando(true)} disabled={criando}>
            <Plus className="size-4" aria-hidden="true" />
            Nova disciplina
          </Button>
          <Button
            variant="outline"

            onClick={atualizar}
            disabled={carga.estado === "carregando"}
          >
            <RefreshCw
              className={`size-4 ${carga.estado === "carregando" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Atualizar
          </Button>
        </div>
      </Painel>

      {criando && (
        <Card>
          <CardHeader>
            <CardTitle>Nova disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioDisciplina
              textoBotao="Criar disciplina"
              onSalvar={criar}
              onCancelar={() => setCriando(false)}
            />
          </CardContent>
        </Card>
      )}

      {carga.estado === "carregando" && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}
      {carga.estado === "erro" && <MensagemErro carga={carga} />}
      {carga.estado === "ok" && (
        <div className="space-y-3">
          {carga.dados.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nenhuma disciplina cadastrada ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            carga.dados.map((disciplina) => (
              <Card key={disciplina.id}>
                <CardContent>
                  {editandoId === disciplina.id ? (
                    <FormularioDisciplina
                      inicial={{
                        title: disciplina.title,
                        description: disciplina.description || "",
                      }}
                      textoBotao="Salvar disciplina"
                      onSalvar={(dados) => atualizar_disciplina(disciplina.id, dados)}
                      onCancelar={() => setEditandoId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {disciplina.title}
                        </p>
                        {disciplina.description && (
                          <p className="text-sm text-muted-foreground">{disciplina.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditandoId(disciplina.id)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </Button>
                        <ConfirmarAcao
                          titulo="Excluir disciplina"
                          descricao={`Tem certeza que deseja excluir a disciplina "${disciplina.title}"? Esta ação não pode ser desfeita.`}
                          textoConfirmar="Excluir"
                          onConfirmar={() => deletar(disciplina.id)}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletando === disciplina.id}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Excluir
                          </Button>
                        </ConfirmarAcao>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FormularioDisciplina({
  inicial,
  textoBotao,
  onSalvar,
  onCancelar,
}: {
  inicial?: { title: string; description: string };
  textoBotao: string;
  onSalvar: (dados: { title: string; description: string }) => Promise<void>;
  onCancelar: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(inicial?.title ?? "");
  const [description, setDescription] = useState(inicial?.description ?? "");
  const [salvando, setSalvando] = useState(false);
  const valido = title.trim() !== "" && description.trim() !== "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      await onSalvar({ title: title.trim(), description: description.trim() });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a disciplina.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${id}-titulo`} className="block text-sm font-semibold text-foreground">
          Nome da disciplina
        </label>
        <Input
          id={`${id}-titulo`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Matemática"
          className="h-9 text-sm"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-descricao`} className="block text-sm font-semibold text-foreground">
          Descrição
        </label>
        <Textarea
          id={`${id}-descricao`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Disciplina de matemática"

          rows={3}
          required
        />
      </div>
      <div className="flex gap-2">
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
