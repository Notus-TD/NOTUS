import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PolicyContent } from "@/components/PolicyContent";
import { TermsContent } from "@/components/TermsContent";

const DOCUMENTOS = {
  privacidade: {
    titulo: "Política de Privacidade",
    triggerLabel: "Leia a política de privacidade completa",
    Conteudo: PolicyContent,
  },
  termos: {
    titulo: "Termos de Uso",
    triggerLabel: "Leia os termos de uso completos",
    Conteudo: TermsContent,
  },
};

export function TermsReaderDialog({
  documento = "privacidade",
  triggerLabel,
  triggerClassName = "text-primary underline",
  onConfirm,
}: {
  documento?: keyof typeof DOCUMENTOS;
  triggerLabel?: string;
  triggerClassName?: string;
  onConfirm: () => void;
}) {
  const { titulo, triggerLabel: labelPadrao, Conteudo } = DOCUMENTOS[documento];
  const [aberto, setAberto] = useState(false);
  const [leuTudo, setLeuTudo] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);

  function abrir() {
    setAberto(true);
    requestAnimationFrame(() => {
      const el = corpoRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 8) {
        setLeuTudo(true);
      }
    });
  }

  function aoRolar() {
    const el = corpoRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setLeuTudo(true);
    }
  }

  function confirmarLeitura() {
    setAberto(false);
    onConfirm();
  }

  return (
    <>
      <button type="button" onClick={abrir} className={triggerClassName}>
        {triggerLabel ?? labelPadrao}
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="grid max-h-[85vh] max-w-2xl grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>

          <div ref={corpoRef} onScroll={aoRolar} className="min-h-0 overflow-y-auto pr-2">
            <Conteudo />
          </div>

          <DialogFooter>
            <p className="mr-auto self-center text-sm text-muted-foreground sm:mr-0">
              {leuTudo ? "" : "Role até o fim para continuar."}
            </p>
            <Button disabled={!leuTudo} onClick={confirmarLeitura} className="min-h-11 text-base">
              Li e entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
