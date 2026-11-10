import {
  deleteAtividade,
  getAtividadesDaTurma,
  publicarAtividade,
  type AtividadeDTO,
} from "@/api/atividades";
import { type Bimestre } from "@/api/boletim";
import { ApiError } from "@/api/cliente";
import { Etiqueta, Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { CampoData } from "@/components/layout/CampoData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EditarAtividade } from "@/features/professor/atividades/EditarAtividade";
import { EntregasDaAtividade } from "@/features/professor/atividades/EntregasDaAtividade";
import { formatarPontos } from "@/lib/entregas";
import { DisciplinaRef } from "@/features/professor/turma";
import { BIMESTRES, nomeBimestre } from "@/lib/bimestres";
import { formatarData, hojeLocal } from "@/lib/datas";
import { ClipboardCheck, ClipboardList, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Atividades({
  turmaId,
  turmaName,
  disciplina,
  fechados,
  bimestreInicial,
}: {
  turmaId: number;
  turmaName: string;
  disciplina: DisciplinaRef;
  fechados: Bimestre[];
  bimestreInicial: Bimestre;
}) {
  const hoje = hojeLocal();
  const [atividades, setAtividades] = useState<AtividadeDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [pontos, setPontos] = useState("");
  const [bimestre, setBimestre] = useState<Bimestre>(bimestreInicial);
  const [publicando, setPublicando] = useState(false);
  const [entregasAbertas, setEntregasAbertas] = useState<number | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState<AtividadeDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    getAtividadesDaTurma(turmaId)
      .then((lista) => {
        if (!ativo) return;
        setAtividades([...lista].sort((a, b) => b.publicadaEm.localeCompare(a.publicadaEm)));
      })
      .catch(
        (e) =>
          ativo &&
          setErro(e instanceof ApiError ? e.message : "Erro ao carregar as atividades da turma."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId, versao]);

  async function publicar() {
    if (!titulo.trim() || !corpo.trim() || !prazo) {
      toast.error("Preencha o título, o texto e o prazo da atividade.");
      return;
    }
    if (prazo < hoje) {
      toast.error("O prazo não pode ser uma data passada.");
      return;
    }
    const valorPontos = pontos.trim() ? Number(pontos.replace(",", ".")) : null;
    if (
      valorPontos !== null &&
      (Number.isNaN(valorPontos) || valorPontos <= 0 || valorPontos > 10)
    ) {
      toast.error("Os pontos devem ser maiores que 0 e no máximo 10.");
      return;
    }
    setPublicando(true);
    try {
      await publicarAtividade({
        title: titulo.trim(),
        content: corpo.trim(),
        bimestre,
        prazo,
        turmaId,
        disciplinaId: disciplina.id,
        pontos: valorPontos,
      });
      setTitulo("");
      setCorpo("");
      setPrazo("");
      setPontos("");
      toast.success(`Atividade de ${disciplina.title} publicada para o ${turmaName}.`);
      setVersao((v) => v + 1);
      setCriando(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao publicar a atividade.");
    } finally {
      setPublicando(false);
    }
  }

  const doProfessor = atividades?.filter((a) => a.disciplinaId === disciplina.id) ?? null;
  const atividadeEditada = doProfessor?.find((a) => a.id === editando) ?? null;
  const atividadeEntregas = doProfessor?.find((a) => a.id === entregasAbertas) ?? null;

  async function excluir(atividade: AtividadeDTO) {
    try {
      await deleteAtividade(atividade.id);
      toast.success("Atividade excluída.");
      setVersao((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir a atividade.");
    }
  }

  return (
    <div className="space-y-6">
      <Sheet open={criando} onOpenChange={setCriando}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Nova atividade</SheetTitle>
            <SheetDescription>
              {disciplina.title} no {turmaName}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="titulo" className="block text-sm font-semibold text-foreground">
                Título
              </label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Trabalho sobre ecossistemas"
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="corpo" className="block text-sm font-semibold text-foreground">
                Texto
              </label>
              <Textarea
                id="corpo"
                rows={4}
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Explique a atividade e o que precisa ser entregue."
                className="text-base"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label htmlFor="bimestre" className="block text-sm font-semibold text-foreground">
                  Bimestre
                </label>
                <Select value={bimestre} onValueChange={(v) => setBimestre(v as Bimestre)}>
                  <SelectTrigger id="bimestre" className="h-10 w-48 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIMESTRES.map((b) => (
                      <SelectItem key={b.id} value={b.id} disabled={fechados.includes(b.id)}>
                        {b.label}
                        {fechados.includes(b.id) ? " (fechado)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="prazo" className="block text-sm font-semibold text-foreground">
                  Prazo de entrega
                </label>
                <CampoData
                  id="prazo"
                  value={prazo}
                  min={hoje}
                  onChange={setPrazo}
                  className="h-10 w-48 text-base"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="pontos" className="block text-sm font-semibold text-foreground">
                  Nota
                </label>
                <Input
                  id="pontos"
                  inputMode="decimal"
                  value={pontos}
                  onChange={(e) => setPontos(e.target.value)}
                  placeholder="Ex.: 1,0"
                  className="h-10 w-40 text-base"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={publicar} disabled={publicando}>
                {publicando ? "Publicando..." : "Publicar para a turma"}
              </Button>
              <Button variant="ghost" onClick={() => setCriando(false)} disabled={publicando}>
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Painel
        titulo="Atividades publicadas"
        icone={ClipboardList}
        semEspaco
        ferramentas={
          <Button onClick={() => setCriando(true)}>
            <Plus aria-hidden="true" />
            Nova atividade
          </Button>
        }
      >
        {erro && <p className="p-4 text-sm font-semibold text-destructive">{erro}</p>}
        {!erro && atividades === null && (
          <p className="p-6 text-sm text-muted-foreground">Carregando atividades…</p>
        )}
        {doProfessor?.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma atividade de {disciplina.title} publicada para esta turma ainda.
          </p>
        )}
        {doProfessor && doProfessor.length > 0 && (
          <Table>
            <TableHeader className={classeCabecalhoTabela}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Atividade</TableHead>
                <TableHead>Bimestre</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doProfessor.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-md py-3 pl-4">
                    <span className="block font-medium text-foreground">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.content}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{nomeBimestre(a.bimestre)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatarData(a.prazo)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.pontos === null ? "—" : formatarPontos(a.pontos)}
                  </TableCell>
                  <TableCell>
                    {a.prazo < hoje ? (
                      <Etiqueta tom="neutro">Encerrada</Etiqueta>
                    ) : (
                      <Etiqueta tom="sucesso">Aberta</Etiqueta>
                    )}
                  </TableCell>
                  <TableCell className="pr-2">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Ações de ${a.title}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditando(a.id)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEntregasAbertas(a.id)}>
                          <ClipboardCheck className="size-4" aria-hidden="true" />
                          Marcar entregas
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setExcluindo(a)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Painel>

      <Sheet
        open={atividadeEditada !== null}
        onOpenChange={(aberto) => !aberto && setEditando(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Editar atividade</SheetTitle>
            <SheetDescription>
              {disciplina.title} no {turmaName}
            </SheetDescription>
          </SheetHeader>
          {atividadeEditada && (
            <div className="mt-6">
              <EditarAtividade
                key={atividadeEditada.id}
                atividade={atividadeEditada}
                disciplinaId={disciplina.id}
                fechados={fechados}
                aoCancelar={() => setEditando(null)}
                aoSalvar={() => {
                  setEditando(null);
                  setVersao((v) => v + 1);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={atividadeEntregas !== null}
        onOpenChange={(aberto) => !aberto && setEntregasAbertas(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Entregas</SheetTitle>
            <SheetDescription>{atividadeEntregas?.title}</SheetDescription>
          </SheetHeader>
          {atividadeEntregas && (
            <div className="mt-6">
              <EntregasDaAtividade
                key={atividadeEntregas.id}
                atividadeId={atividadeEntregas.id}
                turmaId={turmaId}
                pontos={atividadeEntregas.pontos}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={excluindo !== null}
        onOpenChange={(aberto) => !aberto && setExcluindo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              "{excluindo?.title}" deixa de aparecer para os alunos do {turmaName}. Atividades que
              já têm entregas não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluindo && excluir(excluindo)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
