import { ApiError } from "@/api/cliente";
import { publicarRecado } from "@/api/comunicados";
import { Painel } from "@/components/layout/LayoutAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Comunicados({ turmaId, turmaName }: { turmaId: number; turmaName: string }) {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [publicando, setPublicando] = useState(false);

  async function publicar() {
    if (!titulo.trim() || !corpo.trim()) {
      toast.error("Preencha o título e o texto do comunicado.");
      return;
    }
    setPublicando(true);
    try {
      await publicarRecado({
        titulo: titulo.trim(),
        texto: corpo.trim(),
        turmaId,
      });
      setTitulo("");
      setCorpo("");
      toast.success(`Comunicado publicado para o ${turmaName}.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao publicar o comunicado.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Painel titulo="Novo comunicado" icone={Mail}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Publique uma mensagem para os alunos do {turmaName}. Seus responsáveis também receberão
          uma notificação.
        </p>
        <div className="space-y-2">
          <label
            htmlFor="comunicado-titulo"
            className="block text-sm font-semibold text-foreground"
          >
            Título
          </label>
          <Input
            id="comunicado-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Aviso sobre as aulas"
            className="h-10 text-base"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="comunicado-corpo" className="block text-sm font-semibold text-foreground">
            Texto
          </label>
          <Textarea
            id="comunicado-corpo"
            rows={5}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Digite a mensagem que deseja enviar..."
            className="text-base"
          />
        </div>
        <Button onClick={publicar} disabled={publicando} className="min-h-10 px-6 text-base">
          {publicando ? "Publicando..." : "Publicar comunicado"}
        </Button>
      </div>
    </Painel>
  );
}
