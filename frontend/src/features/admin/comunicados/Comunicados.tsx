import { getComunicados, type ComunicadoDTO } from "@/api/comunicados";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/layout/blocos";
import { FormComunicado } from "@/features/admin/comunicados/FormComunicado";
import { rotuloPublico } from "@/features/admin/comunicados/publico";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { useState } from "react";

export function Comunicados() {
  const [versao, setVersao] = useState(0);
  const carga = useCarga<ComunicadoDTO[]>(getComunicados, versao);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo comunicado</CardTitle>
          <CardDescription>
            Publique um aviso para alunos, responsáveis, professores ou para toda a escola.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormComunicado aoEnviar={() => setVersao((v) => v + 1)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comunicados enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {carga.estado === "carregando" && (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          )}
          {carga.estado === "erro" && <MensagemErro carga={carga} />}
          {carga.estado === "ok" && carga.dados.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum comunicado enviado ainda.</p>
          )}
          {carga.estado === "ok" && carga.dados.length > 0 && (
            <div className="grid gap-4">
              {carga.dados.map((c) => (
                <section
                  key={c.id}
                  aria-label={c.titulo}
                  className="rounded-md border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{c.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        Para{" "}
                        <span className="font-medium">
                          {rotuloPublico[c.publico].toLowerCase()}
                        </span>{" "}
                        • Enviado em {new Date(c.enviadoEm).toLocaleString("pt-BR")} por{" "}
                        {c.autorEmail}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{c.texto}</p>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
