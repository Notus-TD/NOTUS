import { ApiError } from "@/api/cliente";
import { getChamada, salvarChamada, type ChamadaDTO } from "@/api/falta";
import { Painel, classeCabecalhoTabela } from "@/components/layout/LayoutAdmin";
import { CampoData } from "@/components/layout/CampoData";
import { Button } from "@/components/ui/button";
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
import { DisciplinaRef } from "@/features/professor/turma";
import { formatarData, hojeLocal } from "@/lib/datas";
import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Chamada({ turmaId, disciplina }: { turmaId: number; disciplina: DisciplinaRef }) {
  const hoje = hojeLocal();
  const [data, setData] = useState(hoje);
  const [chamada, setChamada] = useState<ChamadaDTO | null>(null);
  const [aulas, setAulas] = useState(1);
  const [faltas, setFaltas] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function carregou(dto: ChamadaDTO) {
    setChamada(dto);
    setAulas(dto.aulas ?? 1);
    setFaltas(
      Object.fromEntries(
        dto.alunos.map((a) => [a.studentId, a.faltasNoDia > 0 ? String(a.faltasNoDia) : ""]),
      ),
    );
  }

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

  const valor = (id: number) => Number(faltas[id] || 0);
  const invalido = (id: number) => {
    const texto = faltas[id] ?? "";
    return texto !== "" && (!/^\d$/.test(texto) || Number(texto) > aulas);
  };
  const alunos = chamada?.alunos ?? [];
  const bloqueio = chamada?.bloqueio ?? null;
  const comFalta = alunos.filter((a) => valor(a.studentId) > 0).length;
  const presentes = alunos.length - comFalta;

  async function salvar() {
    if (!chamada) return;
    if (alunos.some((a) => invalido(a.studentId))) {
      toast.error(`Cada aluno pode ter de 0 a ${aulas} falta(s) nesta chamada.`);
      return;
    }
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
          <Select
            value={String(aulas)}
            onValueChange={(v) => setAulas(Number(v))}
            disabled={bloqueio !== null}
          >
            <SelectTrigger id="aulas-no-dia" className="h-9 w-24 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 aula</SelectItem>
              <SelectItem value="2">2 aulas</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead className="w-32 pr-4 text-center">Faltas hoje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((a, indice) => {
              const ausente = valor(a.studentId) > 0;
              const erroCampo = invalido(a.studentId);
              return (
                <TableRow
                  key={a.studentId}
                  className={ausente || erroCampo ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                >
                  <TableCell className="pl-4 tabular-nums text-muted-foreground">
                    {indice + 1}
                  </TableCell>
                  <TableCell
                    className={`py-2 font-medium ${ausente ? "text-destructive" : "text-foreground"}`}
                  >
                    <label htmlFor={`faltas-${a.studentId}`} className="cursor-pointer">
                      {a.studentName}
                    </label>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {a.matricula}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {a.totalFaltas}
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    <Input
                      id={`faltas-${a.studentId}`}
                      inputMode="numeric"
                      maxLength={1}
                      placeholder="0"
                      value={faltas[a.studentId] ?? ""}
                      onChange={(e) =>
                        setFaltas({ ...faltas, [a.studentId]: e.target.value.trim() })
                      }
                      aria-invalid={erroCampo || undefined}
                      disabled={bloqueio !== null}
                      aria-label={`Faltas de ${a.studentName} hoje, de 0 a ${aulas}`}
                      className={`mx-auto h-8 w-14 text-center text-sm tabular-nums ${erroCampo ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
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
