import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { aluno, avisos, boletim, conversas, presenca, media } from "@/data/notus";

export const Route = createFileRoute("/responsavel")({
  head: () => ({
    meta: [
      { title: "Painel do Responsável · NOTUS" },
      {
        name: "description",
        content:
          "Avisos da escola, boletim completo, controle de faltas e conversa direta com a coordenação e os professores.",
      },
      { property: "og:title", content: "Painel do Responsável · NOTUS" },
      {
        property: "og:description",
        content: "Acompanhe notas, faltas e comunicados da escola em letras grandes e linguagem clara.",
      },
    ],
  }),
  component: PainelResponsavel,
});

function PainelResponsavel() {
  const [lidos, setLidos] = useState<string[]>([]);
  const [mensagens, setMensagens] = useState(conversas);
  const [texto, setTexto] = useState("");

  function enviar() {
    if (!texto.trim()) return;
    setMensagens([...mensagens, { de: "Você", quando: "Agora", texto: texto.trim(), meu: true }]);
    setTexto("");
    toast.success("Mensagem enviada para a coordenação.");
  }

  return (
    <AppShell
      titulo={`Boa tarde, ${aluno.responsavel}`}
      subtitulo={`Acompanhamento de ${aluno.nome} — ${aluno.turma}. Avisos da escola, boletim, faltas e conversa com a equipe.`}
    >
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Avisos e notificações</h2>
        <div className="grid gap-4">
          {avisos.map((a) => {
            const naoLido = a.naoLido && !lidos.includes(a.titulo);
            return (
              <Card key={a.titulo} className={naoLido ? "border-2 border-primary" : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{a.titulo}</CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {a.origem} · {a.data}
                      </CardDescription>
                    </div>
                    {naoLido && (
                      <Badge className="bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        Novo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg leading-relaxed text-foreground">{a.texto}</p>
                  {naoLido && (
                    <Button
                      variant="outline"
                      className="min-h-11 text-base"
                      onClick={() => setLidos([...lidos, a.titulo])}
                    >
                      Marcar como lido
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Boletim completo</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">Notas por bimestre, média e situação</caption>
              <thead>
                <tr className="border-b border-border bg-secondary text-base font-semibold text-secondary-foreground">
                  <th scope="col" className="px-5 py-4">
                    Disciplina
                  </th>
                  <th scope="col" className="px-5 py-4">
                    1º bim.
                  </th>
                  <th scope="col" className="px-5 py-4">
                    2º bim.
                  </th>
                  <th scope="col" className="px-5 py-4">
                    3º bim.
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Média
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {boletim.map((b) => {
                  const m = media([b.b1, b.b2, b.b3]);
                  const aprovado = m >= 7;
                  const recuperacao = m >= 6 && m < 7;
                  return (
                    <tr key={b.disciplina} className="border-b border-border text-lg last:border-0">
                      <th scope="row" className="px-5 py-4 font-semibold text-foreground">
                        {b.disciplina}
                      </th>
                      <td className="px-5 py-4 text-foreground">{b.b1.toFixed(1)}</td>
                      <td className="px-5 py-4 text-foreground">{b.b2.toFixed(1)}</td>
                      <td className="px-5 py-4 text-foreground">{b.b3.toFixed(1)}</td>
                      <td className="px-5 py-4 font-display font-bold text-foreground">{m.toFixed(1)}</td>
                      <td className="px-5 py-4">
                        <Badge
                          className={`px-3 py-1 text-sm font-semibold ${
                            aprovado
                              ? "bg-success text-success-foreground"
                              : recuperacao
                                ? "bg-warning text-warning-foreground"
                                : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {aprovado ? "Em dia" : recuperacao ? "Atenção" : "Recuperação"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Controle de faltas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presenca.map((p) => {
            const limite = Math.floor(p.aulas * 0.25);
            const alerta = p.faltas >= limite;
            return (
              <Card key={p.disciplina} className={alerta ? "border-2 border-warning" : undefined}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{p.disciplina}</CardTitle>
                  <CardDescription className="text-base">
                    {p.faltas} de {p.aulas} aulas perdidas
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-base">
                  {alerta ? (
                    <p className="font-semibold text-warning">
                      Atenção: o limite é de {limite} faltas nesta disciplina.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Dentro do limite permitido ({limite} faltas).
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
          Falar com a escola
        </h2>
        <Card>
          <CardContent className="space-y-5 p-6">
            <ul className="space-y-4">
              {mensagens.map((m, i) => (
                <li
                  key={i}
                  className={`max-w-2xl rounded-2xl p-4 ${
                    m.meu ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-base font-semibold">
                    {m.de} · <span className="font-normal opacity-80">{m.quando}</span>
                  </p>
                  <p className="mt-1 text-lg leading-relaxed">{m.texto}</p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border pt-5">
              <label htmlFor="mensagem" className="block text-lg font-semibold text-foreground">
                Escreva sua mensagem para a coordenação
              </label>
              <Textarea
                id="mensagem"
                rows={4}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ex.: Gostaria de conversar sobre as faltas em Ciências."
                className="text-lg"
              />
              <Button onClick={enviar} className="min-h-12 px-6 text-lg">
                Enviar mensagem
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
