import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Archive, EyeOff, FileText, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/cliente";
import { getResumoAnonimizacao } from "@/api/privacidade";
import { cancelarMatricula } from "@/api/usuarios";
import { Etiqueta, Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { MensagemErro } from "@/components/layout/MensagemErro";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rotuloSituacao, tomSituacao } from "@/features/admin/alunos/situacao";
import { FormAnonimizacao } from "@/features/admin/anonimizacao/FormAnonimizacao";
import { EtiquetaSolicitacao } from "@/features/familia/responsavel/PrivacidadeResponsavel";
import { useCarga } from "@/hooks/use-carga";
import { formatarData, formatarDataHora, rotuloTipoSolicitacao } from "@/lib/solicitacoes";

function Dado({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium text-foreground">{valor}</p>
    </div>
  );
}

function Contagem({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums text-foreground">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

export function DetalheAnonimizacao({
  userId,
  voltar,
  aoMudar,
}: {
  userId: number;
  voltar: () => void;
  aoMudar: () => void;
}) {
  const [versao, setVersao] = useState(0);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const carga = useCarga(() => getResumoAnonimizacao(userId), versao);
  const recarregar = () => {
    setVersao((v) => v + 1);
    aoMudar();
  };

  async function cancelar(nome: string) {
    setCancelando(true);
    try {
      await cancelarMatricula(userId, motivo.trim());
      setMotivo("");
      toast.success(`Matrícula de ${nome} cancelada.`);
      recarregar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao cancelar a matrícula.");
    } finally {
      setCancelando(false);
    }
  }

  const botaoVoltar = (
    <Button variant="outline" onClick={voltar}>
      <ArrowLeft aria-hidden="true" />
      Voltar para a lista
    </Button>
  );

  if (carga.estado === "carregando") {
    return (
      <div className="space-y-6">
        {botaoVoltar}
        <Painel>
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </Painel>
      </div>
    );
  }
  if (carga.estado === "erro") {
    return (
      <div className="space-y-6">
        {botaoVoltar}
        <Painel>
          <MensagemErro carga={carga} />
        </Painel>
      </div>
    );
  }

  const r = carga.dados;
  const aluno = r.perfil === "ALUNO";
  const nome = r.nome ?? `registro nº ${r.id}`;
  const anonimizado = r.anonimizadoEm !== null;

  return (
    <div className="space-y-6">
      {botaoVoltar}

      <Painel
        titulo={anonimizado ? "Titular anonimizado" : nome}
        icone={UserRound}
        ferramentas={
          anonimizado ? (
            <Etiqueta tom="neutro">Anonimizado</Etiqueta>
          ) : r.matriculaStatus ? (
            <Etiqueta tom={tomSituacao[r.matriculaStatus]}>
              Matrícula {rotuloSituacao[r.matriculaStatus].toLowerCase()}
            </Etiqueta>
          ) : (
            <Etiqueta tom="sucesso">Ativo</Etiqueta>
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dado rotulo="Perfil" valor={aluno ? "Aluno" : "Responsável"} />
          <Dado rotulo="Registro" valor={r.id} />
          {aluno && <Dado rotulo="Matrícula" valor={r.matricula ?? "—"} />}
          <Dado rotulo="E-mail" valor={r.email ?? "—"} />
          {aluno && <Dado rotulo="Turma" valor={r.turmaName ?? "Sem turma"} />}
          {aluno && <Dado rotulo="Responsável" valor={r.responsavelNome ?? "—"} />}
          {aluno && r.motivoCancelamento && (
            <Dado
              rotulo="Matrícula cancelada"
              valor={`${r.matriculaCanceladaEm ? formatarData(r.matriculaCanceladaEm) : ""} · ${r.motivoCancelamento}`}
            />
          )}
          {aluno && (
            <Dado
              rotulo="Acesso ao portal"
              valor={r.acessoLiberado ? "Liberado" : "Não liberado"}
            />
          )}
        </div>
      </Painel>

      {!aluno && (
        <Painel titulo="Alunos vinculados" icone={Users} semEspaco>
          {r.filhos.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
          ) : (
            <Table>
              <TableHeader className={classeCabecalhoTabela}>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.filhos.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.anonimizado ? "Anonimizado" : f.nome}
                    </TableCell>
                    <TableCell className="tabular-nums">{f.matricula}</TableCell>
                    <TableCell>
                      <Etiqueta tom={tomSituacao[f.matriculaStatus]}>
                        Matrícula {rotuloSituacao[f.matriculaStatus].toLowerCase()}
                      </Etiqueta>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Painel>
      )}

      <Painel titulo="O que fica guardado, sem identificação" icone={Archive}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {aluno && <Contagem rotulo="Notas de bimestre" valor={r.notasDeBimestre} />}
          {aluno && <Contagem rotulo="Faltas registradas" valor={r.faltas} />}
          {aluno && <Contagem rotulo="Entregas de atividades" valor={r.entregas} />}
          <Contagem rotulo="Avisos por e-mail (conteúdo apagado)" valor={r.avisos} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Ao anonimizar, apagamos nome, e-mail, nascimento ou telefone, senha e os vínculos. O
          histórico escolar continua guardado, ligado só ao registro e à matrícula, porque a escola
          é obrigada a mantê-lo (LGPD, art. 16).
        </p>
      </Painel>

      {r.pedidosAbertos.length > 0 && (
        <Painel titulo="Pedidos do titular em aberto" icone={FileText} semEspaco>
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Feito por</TableHead>
                <TableHead>Recebido em</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.pedidosAbertos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    nº {p.id} · {rotuloTipoSolicitacao[p.tipo]}
                  </TableCell>
                  <TableCell>{p.solicitanteNome}</TableCell>
                  <TableCell>{formatarData(p.solicitadaEm)}</TableCell>
                  <TableCell>{formatarData(p.prazoEm)}</TableCell>
                  <TableCell>
                    <EtiquetaSolicitacao s={p} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Painel>
      )}

      <Painel titulo="Anonimização" icone={EyeOff}>
        {anonimizado && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dado rotulo="Feita em" valor={formatarDataHora(r.anonimizadoEm ?? "")} />
            <Dado rotulo="Motivo" valor={r.registro?.motivoDescricao ?? "Não registrado"} />
            <Dado rotulo="Executada por" valor={r.registro?.executadoPor ?? "—"} />
            <Dado
              rotulo="Pedido atendido"
              valor={r.registro?.solicitacaoId ? `nº ${r.registro.solicitacaoId}` : "—"}
            />
            {r.registro?.detalhe && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Dado rotulo="Detalhes" valor={r.registro.detalhe} />
              </div>
            )}
          </div>
        )}
        {!anonimizado && r.bloqueio && (
          <div className="space-y-3">
            <p className="rounded-md bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
              {r.bloqueio}
            </p>
            {aluno && r.matriculaStatus === "ATIVA" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={cancelando}>
                    {cancelando ? "Cancelando..." : "Cancelar matrícula"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar a matrícula de {nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O aluno sai da turma, perde o acesso ao portal e os avisos ainda não enviados
                      são cancelados. Os dados e o histórico continuam guardados até a anonimização.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="motivo-cancelamento-anon">Motivo do cancelamento</Label>
                    <Textarea
                      id="motivo-cancelamento-anon"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="Ex.: transferência para outra escola."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancelar(nome)} disabled={!motivo.trim()}>
                      Cancelar matrícula
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
        {!anonimizado && !r.bloqueio && (
          <FormAnonimizacao
            userId={r.id}
            nome={nome}
            codigo={String(aluno ? r.matricula : r.id)}
            rotuloCodigo={aluno ? "a matrícula" : "o registro"}
            pedidos={r.pedidosAbertos}
            aoConcluir={recarregar}
          />
        )}
      </Painel>
    </div>
  );
}
