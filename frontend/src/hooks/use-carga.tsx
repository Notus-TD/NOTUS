import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export type Carga<T> =
  | { estado: "carregando" }
  | { estado: "ok"; dados: T }
  | { estado: "erro"; mensagem: string; status: number };

export function useCarga<T>(buscar: () => Promise<T>, chave: number): Carga<T> {
  const [carga, setCarga] = useState<Carga<T>>({ estado: "carregando" });
  useEffect(() => {
    let ativo = true;
    setCarga({ estado: "carregando" });
    buscar()
      .then((dados) => ativo && setCarga({ estado: "ok", dados }))
      .catch(
        (e) =>
          ativo &&
          setCarga({
            estado: "erro",
            mensagem: e instanceof ApiError ? e.message : "Erro inesperado.",
            status: e instanceof ApiError ? e.status : 0,
          }),
      );
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return carga;
}

export function MensagemErro({ carga }: { carga: { status: number; mensagem: string } }) {
  return (
    <p className="text-base font-semibold text-destructive">
      {carga.status === 403 ? "Sem acesso para este perfil." : carga.mensagem}
    </p>
  );
}
