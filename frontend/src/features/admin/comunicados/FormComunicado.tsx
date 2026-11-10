import { ApiError } from "@/api/cliente";
import { publicarComunicado, type ComunicadoDTO } from "@/api/comunicados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Publico, rotuloPublico } from "@/features/admin/comunicados/publico";
import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export function FormComunicado({
  compacto = false,
  aoEnviar,
}: {
  compacto?: boolean;
  aoEnviar?: (c: ComunicadoDTO) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [publico, setPublico] = useState<Publico>("TODOS");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) {
      toast.error("Preencha o título e o texto do comunicado.");
      return;
    }
    setEnviando(true);
    try {
      const novo = await publicarComunicado({
        titulo: titulo.trim(),
        texto: texto.trim(),
        publico,
      });
      setTitulo("");
      setTexto("");
      toast.success(`Comunicado enviado para ${rotuloPublico[publico].toLowerCase()}.`);
      aoEnviar?.(novo);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar o comunicado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="com-titulo" className="block text-sm font-semibold text-foreground">
          Título
        </label>
        <Input
          id="com-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Reunião de pais"
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-foreground">Para quem</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(rotuloPublico) as Publico[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === publico ? "default" : "outline"}

              aria-pressed={p === publico}
              onClick={() => setPublico(p)}
            >
              {rotuloPublico[p]}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="com-texto" className="block text-sm font-semibold text-foreground">
          Mensagem
        </label>
        <Textarea
          id="com-texto"
          rows={compacto ? 3 : 5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva o aviso."
        />
      </div>
      <Button type="submit" disabled={enviando} aria-busy={enviando}>
        <Send className="size-4" aria-hidden="true" />
        {enviando ? "Enviando..." : "Enviar comunicado"}
      </Button>
    </form>
  );
}
