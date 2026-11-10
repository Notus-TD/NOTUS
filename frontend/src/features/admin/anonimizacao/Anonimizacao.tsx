import { getUsuarios, type PerfilUsuario, type UsuarioDTO } from "@/api/usuarios";
import {
  classeCabecalhoTabela,
  Etiqueta,
  Paginacao,
  Painel,
} from "@/components/layout/LayoutAdmin";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALUNOS_POR_PAGINA, rotuloSituacao, tomSituacao } from "@/features/admin/alunos/situacao";
import { PedidosTitulares } from "@/features/admin/anonimizacao/PedidosTitulares";
import { DetalheAnonimizacao } from "@/features/admin/anonimizacao/DetalheAnonimizacao";
import { HistoricoAnonimizacoes } from "@/features/admin/anonimizacao/HistoricoAnonimizacoes";
import { BotaoReenviarConvite } from "@/features/admin/comum/BotoesUsuario";
import { Button } from "@/components/ui/button";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { ChevronRight, Search, UserX } from "lucide-react";
import { useState } from "react";

type FiltroSituacao = "TODAS" | "ATIVOS" | "ANONIMIZADOS";

const SITUACOES: Record<FiltroSituacao, string> = {
  TODAS: "Todas as situações",
  ATIVOS: "Não anonimizados",
  ANONIMIZADOS: "Anonimizados",
};

const PERFIS: Record<PerfilUsuario, string> = {
  ALUNO: "Aluno",
  RESPONSAVEL: "Responsável",
};

export function ExcluirUsuarios() {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario | "TODOS">("TODOS");
  const [situacao, setSituacao] = useState<FiltroSituacao>("TODAS");
  const [pagina, setPagina] = useState(1);
  const [aberto, setAberto] = useState<number | null>(null);
  const carga = useCarga<UsuarioDTO[]>(getUsuarios, versao);

  const termo = busca.trim().toLowerCase();
  const filtrados =
    carga.estado === "ok"
      ? carga.dados.filter(
          (u) =>
            (perfil === "TODOS" || u.perfil === perfil) &&
            (situacao === "TODAS" || (situacao === "ANONIMIZADOS") === u.anonimizado) &&
            (!termo ||
              (u.nome ?? "").toLowerCase().includes(termo) ||
              String(u.matricula ?? "").includes(termo) ||
              String(u.id).includes(termo)),
        )
      : [];

  if (aberto !== null) {
    return (
      <DetalheAnonimizacao
        userId={aberto}
        voltar={() => setAberto(null)}
        aoMudar={() => setVersao((v) => v + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PedidosTitulares />
      <Painel
        titulo="Usuários"
        icone={UserX}
        semEspaco
        ferramentas={
          <>
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Nome, matrícula ou registro"
                aria-label="Buscar usuário"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Select
              value={perfil}
              onValueChange={(v) => {
                setPerfil(v as PerfilUsuario | "TODOS");
                setPagina(1);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-sm" aria-label="Filtrar por perfil">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os perfis</SelectItem>
                {(Object.keys(PERFIS) as PerfilUsuario[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERFIS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={situacao}
              onValueChange={(v) => {
                setSituacao(v as FiltroSituacao);
                setPagina(1);
              }}
            >
              <SelectTrigger className="h-9 w-48 text-sm" aria-label="Filtrar por situação">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SITUACOES) as FiltroSituacao[]).map((sit) => (
                  <SelectItem key={sit} value={sit}>
                    {SITUACOES[sit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        rodape={
          carga.estado === "ok" ? (
            <div className="space-y-2">
              <Paginacao
                pagina={pagina}
                porPagina={ALUNOS_POR_PAGINA}
                total={filtrados.length}
                aoMudar={setPagina}
              />
              <p className="text-xs text-muted-foreground">
                Clique num usuário para ver tudo o que está ligado a ele e anonimizar com o motivo
                registrado. A anonimização não pode ser desfeita.
              </p>
            </div>
          ) : undefined
        }
      >
        {carga.estado === "carregando" && (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        )}
        {carga.estado === "erro" && (
          <div className="p-4">
            <MensagemErro carga={carga} />
          </div>
        )}
        {carga.estado === "ok" && filtrados.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {termo
              ? `Nenhum usuário encontrado para "${busca.trim()}".`
              : "Nenhum usuário cadastrado ainda."}
          </p>
        )}
        {carga.estado === "ok" && filtrados.length > 0 && (
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados
                .slice((pagina - 1) * ALUNOS_POR_PAGINA, pagina * ALUNOS_POR_PAGINA)
                .map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p
                        className={`font-medium ${u.anonimizado ? "text-muted-foreground" : "text-foreground"}`}
                      >
                        {u.anonimizado ? "Anonimizado" : (u.nome ?? "Sem nome")}
                      </p>
                      <p className="text-xs text-muted-foreground">Registro {u.id}</p>
                    </TableCell>
                    <TableCell>{PERFIS[u.perfil]}</TableCell>
                    <TableCell className="tabular-nums">{u.matricula ?? "—"}</TableCell>
                    <TableCell>
                      <SituacaoUsuario u={u} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!u.anonimizado && u.acessoPendente && (
                          <BotaoReenviarConvite
                            userId={u.id}
                            nome={u.nome ?? `o registro nº ${u.id}`}
                          />
                        )}
                        <Button size="sm" variant="outline" onClick={() => setAberto(u.id)}>
                          Abrir
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Painel>
      <HistoricoAnonimizacoes versao={versao} />
    </div>
  );
}

function SituacaoUsuario({ u }: { u: UsuarioDTO }) {
  if (u.anonimizado) return <Etiqueta tom="neutro">Anonimizado</Etiqueta>;
  if (u.acessoPendente) return <Etiqueta tom="alerta">Acesso pendente</Etiqueta>;
  if (u.matriculaStatus === null) return <Etiqueta tom="sucesso">Ativo</Etiqueta>;
  return (
    <Etiqueta tom={tomSituacao[u.matriculaStatus]}>
      Matrícula {rotuloSituacao[u.matriculaStatus].toLowerCase()}
    </Etiqueta>
  );
}
