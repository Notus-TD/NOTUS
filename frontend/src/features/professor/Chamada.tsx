import { ApiError } from "@/api/cliente";
import { getChamada, salvarChamada, type ChamadaDTO } from "@/api/falta";
import { Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { CampoData } from "@/components/layout/CampoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DisciplinaRef } from "@/features/professor/turma";
import { formatarData, hojeLocal } from "@/lib/datas";
import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ! REFF: Tela de lista de presença do professor: marca presente/falta por aula e salva a chamada do dia
export function Chamada({ turmaId, disciplina }: { turmaId: number; disciplina: DisciplinaRef }) {
  const hoje = hojeLocal();
  const [data, setData] = useState(hoje);
  const [chamada, setChamada] = useState<ChamadaDTO | null>(null);
  const [aulas, setAulas] = useState(1);
  // ! REFF: por aluno, uma marca por aula do dia: true = falta, false = presente (padrão)
  const [faltas, setFaltas] = useState<Record<number, boolean[]>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ! REFF: preenche a tela com a chamada que veio do back (nº de aulas e faltas de cada aluno)
  function carregou(dto: ChamadaDTO) {
    setChamada(dto);
    setAulas(dto.aulas ?? 1);
    setFaltas(
      Object.fromEntries(
        dto.alunos.map((a) => [a.studentId, marcas(a.faltasNoDia, dto.aulas ?? 1)]),
      ),
    );
  }

  // ! REFF: carrega a chamada ao abrir e sempre que mudar a turma, a disciplina ou a data
  useEffect(() => {
    let ativo = true;
    setChamada(null);
    setErro(null);
    getChamada(turmaId, disciplina.id, data)
      .then((dto) => ativo && carregou(dto))
      .catch(
        (e) => ativo && setErro(e instanceof ApiError ? e.message : "Erro ao carregar a chamada."),
      );
    return () => {
      ativo = false;
    };
  }, [turmaId, disciplina.id, data]);

  // ! REFF: o back guarda só a quantidade de faltas no dia; ao carregar, marcamos as primeiras N aulas como falta
  function marcas(faltasNoDia: number, total: number): boolean[] {
    return Array.from({ length: total }, (_, i) => i < faltasNoDia);
  }
  // ! REFF: marcas do aluno ajustadas ao número atual de aulas (se mudou, completa com presente)
  const marcasDe = (id: number) =>
    Array.from({ length: aulas }, (_, i) => faltas[id]?.[i] ?? false);
  // ! REFF: quantidade de faltas enviada ao back = quantas aulas estão marcadas como falta
  const valor = (id: number) => marcasDe(id).filter(Boolean).length;
  // ! REFF: alterna uma aula do aluno entre presente e falta
  function marcar(id: number, aula: number, falta: boolean) {
    const m = marcasDe(id);
    m[aula] = falta;
    setFaltas({ ...faltas, [id]: m });
  }
  const alunos = chamada?.alunos ?? [];
  const bloqueio = chamada?.bloqueio ?? null;
  const comFalta = alunos.filter((a) => valor(a.studentId) > 0).length;
  const presentes = alunos.length - comFalta;

  // ! REFF: envia a chamada (quantidade de faltas por aluno) e recarrega com o que o back gravou
  async function salvar() {
    if (!chamada) return;
    setSalvando(true);
    try {
      const salva = await salvarChamada({
        turmaId,
        disciplinaId: disciplina.id,
        data,
        aulas,
        faltas: alunos.map((a) => ({ studentId: a.studentId, faltas: valor(a.studentId) })),
      });
      carregou(salva);
      toast.success(`Chamada de ${formatarData(data)} salva.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar a chamada.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Painel
      titulo="Lista de presença"
      icone={ClipboardCheck}
      semEspaco
      ferramentas={
        <>
          <label htmlFor="data-chamada" className="text-sm font-semibold text-foreground">
            Dia da aula
          </label>
          <CampoData
            id="data-chamada"
            value={data}
            max={hoje}
            onChange={(v) => v && setData(v)}
            className="h-9 w-44 text-sm"
          />
          <label htmlFor="aulas-no-dia" className="text-sm font-semibold text-foreground">
            Aulas no dia
          </label>
          {/* ! REFF: nº de aulas do dia (1 a 10) — define quantos botões presente/falta cada aluno tem */}
          <Input
            id="aulas-no-dia"
            type="number"
            min="1"
            max="10"
            value={aulas}
            onChange={(e) => setAulas(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            disabled={bloqueio !== null}
            className="h-9 w-24 text-sm"
          />
        </>
      }
      rodape={
        alunos.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {`${presentes} ${presentes === 1 ? "presente" : "presentes"} · ${comFalta} com falta`}
              {chamada?.aulas !== null && ` · chamada de ${formatarData(data)} já registrada`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setFaltas({})}
                disabled={salvando || bloqueio !== null}
              >
                Limpar
              </Button>
              <Button onClick={salvar} disabled={salvando || bloqueio !== null}>
                {salvando ? "Salvando..." : "Salvar chamada"}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {erro && <p className="p-4 text-sm font-semibold text-destructive">{erro}</p>}
      {bloqueio && (
        <p className="border-b border-border bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          {bloqueio} A chamada deste dia está só para consulta.
        </p>
      )}
      {!erro && chamada === null && (
        <p className="p-6 text-sm text-muted-foreground">Carregando a chamada…</p>
      )}
      {chamada && alunos.length === 0 && (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Nenhum aluno ativo nesta turma.
        </p>
      )}
      {alunos.length > 0 && (
        <Table>
          <TableHeader className={classeCabecalhoTabela}>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14 pl-4">Nº</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead className="w-36">Matrícula</TableHead>
              <TableHead
                className="w-32 text-right"
                title="Total de faltas do aluno nesta disciplina no ano letivo"
              >
                Faltas no ano
              </TableHead>
              <TableHead className="pr-4 text-center">Presença hoje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((a, indice) => {
              const ausente = valor(a.studentId) > 0;
              return (
                <TableRow
                  key={a.studentId}
                  className={ausente ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                >
                  <TableCell className="pl-4 tabular-nums text-muted-foreground">
                    {indice + 1}
                  </TableCell>
                  <TableCell
                    className={`py-2 font-medium ${ausente ? "text-destructive" : "text-foreground"}`}
                  >
                    {a.studentName}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {a.matricula}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {a.totalFaltas}
                  </TableCell>
                  <TableCell className="pr-4">
                    {/* ! REFF: um par Presente/Falta por aula do dia; Presente já vem selecionado */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {marcasDe(a.studentId).map((falta, aula) => (
                        <div
                          key={aula}
                          role="group"
                          aria-label={`${aulas > 1 ? `${aula + 1}ª aula de ` : ""}${a.studentName}`}
                          className="flex items-center gap-1"
                        >
                          {aulas > 1 && (
                            <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                              {aula + 1}ª
                            </span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={falta ? "outline" : "default"}
                            aria-pressed={!falta}
                            disabled={bloqueio !== null}
                            onClick={() => marcar(a.studentId, aula, false)}
                            className="h-7 px-2 text-xs"
                          >
                            Presente
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={falta ? "destructive" : "outline"}
                            aria-pressed={falta}
                            disabled={bloqueio !== null}
                            onClick={() => marcar(a.studentId, aula, true)}
                            className="h-7 px-2 text-xs"
                          >
                            Falta
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Painel>
  );
}
