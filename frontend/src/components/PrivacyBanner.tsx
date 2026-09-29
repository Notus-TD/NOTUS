import { useEffect, useState } from "react";
import { TermsReaderDialog } from "@/components/TermsReaderDialog";

const CHAVE = "notus.privacyBannerDismissed";

export function PrivacyBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      setVisivel(localStorage.getItem(CHAVE) !== "1");
    } catch {
      setVisivel(true);
    }
  }, []);

  function confirmar() {
    setVisivel(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* ignore */
    }
  }

  if (!visivel) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Usamos os dados cadastrados (nome, matrícula, notas, presença e contato do responsável)
          apenas para a gestão escolar, conforme a LGPD.
        </p>
        <TermsReaderDialog
          triggerLabel="Ler política de privacidade"
          triggerClassName="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          onConfirm={confirmar}
        />
      </div>
    </div>
  );
}
