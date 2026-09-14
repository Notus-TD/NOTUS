import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { aluno, avisos, boletim, conversas, media } from "@/data/notus";
import { ApiError, getMeuPerfil, getMinhaFrequencia, type FrequenciaDTO, type MeuPerfilDTO } from "@/lib/api";

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

  const [perfil, setPerfil] = useState<MeuPerfilDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    getMeuPerfil()
      .then((p) => ativo && setPerfil(p))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const [frequencia, setFrequencia] = useState<FrequenciaDTO[] | null>(null);
  const [carregandoFrequencia, setCarregandoFrequencia] = useState(false);
  const [erroFrequencia, setErroFrequencia] = useState<string | null>(null);

  async function buscarFrequencia() {
    setCarregandoFrequencia(true);
    setErroFrequencia(null);
    try {
      setFrequencia(await getMinhaFrequencia());
    } catch (e) {
      setErroFrequencia(e instanceof ApiError ? e.message : "Erro ao carregar as faltas.");
    } finally {
      setCarregandoFrequencia(false);
    }
  }

  useEffect(() => {
    void buscarFrequencia();
  }, []);

  function enviar() {
    if (!texto.trim()) return;
    setMensagens([...mensagens, { de: "Você", quando: "Agora", texto: texto.trim(), meu: true }]);
    setTexto("");
    toast.success("Mensagem enviada para a coordenação.");
  }

  return (
    <AppShell
      role="ROLE_RESPONSAVEL"
      titulo={`Boa tarde, ${perfil?.nome ?? "..."}`}
      subtitulo={`Acompanhamento de ${perfil?.dependentes[0]?.nome ?? "..."} — ${aluno.turma}. Avisos da escola, boletim, faltas e conversa com a equipe.`}
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">Controle de faltas</h2>
          <Button onClick={buscarFrequencia} disabled={carregandoFrequencia} variant="outline" className="min-h-11 text-base">
            {carregandoFrequencia ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
        {erroFrequencia && <p className="text-base font-semibold text-destructive">{erroFrequencia}</p>}
        {!erroFrequencia && frequencia === null && <p className="text-base text-muted-foreground">Carregando…</p>}
        {frequencia && frequencia.length === 0 && (
          <p className="text-base text-muted-foreground">
            Nenhuma aula registrada ainda pelo professor — as faltas aparecem aqui assim que a chamada começar.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {frequencia?.map((f) => {
            const limite = Math.floor(f.totalAulas * 0.25);
            const alerta = f.totalFaltas >= limite && limite > 0;
            return (
              <Card key={`${f.studentId}-${f.disciplinaId}`} className={alerta ? "border-2 border-warning" : undefined}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{f.disciplinaTitle}</CardTitle>
                  <CardDescription className="text-base">
                    {f.totalFaltas} de {f.totalAulas} aulas perdidas · {Math.round(f.percentualPresenca)}% de presença
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
