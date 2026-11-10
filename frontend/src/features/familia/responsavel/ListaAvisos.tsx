import { Etiqueta } from "@/components/layout/LayoutAdmin";
import { ItemAviso } from "@/features/familia/responsavel/avisos";

export function ListaAvisos({
  itens,
  lidos,
  aoMarcarLido,
}: {
  itens: ItemAviso[];
  lidos: string[];
  aoMarcarLido: (chave: string) => void;
}) {
  const novo = (a: ItemAviso) => !lidos.includes(a.chave);
  const ordenados = [...itens].sort((a, b) => Number(novo(b)) - Number(novo(a)));

  if (itens.length === 0) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        Nenhum aviso ainda. Aqui aparecem os comunicados da escola e os avisos sobre faltas, notas e
        atividades.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {ordenados.map((a) => {
        const ehNovo = novo(a);
        return (
          <li
            key={a.chave}
            className={`grid gap-x-6 gap-y-1 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_13rem] ${ehNovo ? "bg-primary/5" : ""}`}
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                {a.titulo}
                {ehNovo && <Etiqueta tom="alerta">Novo</Etiqueta>}
              </p>
              <p className="mt-1 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {a.texto}
              </p>
            </div>
            <div className="text-xs sm:text-right">
              <p className="font-medium text-foreground">{a.origem}</p>
              <p className="text-muted-foreground">
                {new Date(a.quando).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              {ehNovo && (
                <button
                  type="button"
                  onClick={() => aoMarcarLido(a.chave)}
                  className="mt-1 rounded font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Marcar como lido
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
