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
import { BotaoAnonimizar, BotaoReenviarConvite } from "@/features/admin/comum/BotoesUsuario";
import { useCarga } from "@/hooks/use-carga";
import { MensagemErro } from "@/components/layout/MensagemErro";
import { Search, UserX } from "lucide-react";
import { useState } from "react";

const PERFIS: Record<PerfilUsuario, string> = {
  ALUNO: "Aluno",
  RESPONSAVEL: "Responsável",
};

export function ExcluirUsuarios() {
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario | "TODOS">("TODOS");
  const [pagina, setPagina] = useState(1);
  const carga = useCarga<UsuarioDTO[]>(getUsuarios, versao);

  const termo = busca.trim().toLowerCase();
  const filtrados =
    carga.estado === "ok"
      ? carga.dados.filter(
          (u) =>
            (perfil === "TODOS" || u.perfil === perfil) &&
            (!termo ||
              (u.nome ?? "").toLowerCase().includes(termo) ||
              String(u.matricula ?? "").includes(termo) ||
              String(u.id).includes(termo)),
        )
      : [];

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
              <SelectTrigger className="h-9 w-44 text-sm" aria-label="Filtrar por perfil">
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
                A anonimização apaga nome, e-mail, telefone e nascimento e não pode ser desfeita.
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
                      {u.anonimizado ? (
                        <span className="text-sm text-muted-foreground">Dados apagados</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          {u.acessoPendente && (
                            <BotaoReenviarConvite
                              userId={u.id}
                              nome={u.nome ?? `o registro nº ${u.id}`}
                            />
                          )}
                          {u.matriculaStatus === "ATIVA" ? (
                            <span className="text-sm text-muted-foreground">
                              Cancele a matrícula antes
                            </span>
                          ) : (
                            <BotaoAnonimizar
                              userId={u.id}
                              nome={u.nome ?? `o registro nº ${u.id}`}
                              codigo={String(u.matricula ?? u.id)}
                              rotuloCodigo={u.matricula === null ? "o registro" : "a matrícula"}
                              compacto
                              aoConcluir={() => setVersao((v) => v + 1)}
                            />
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </Painel>
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
