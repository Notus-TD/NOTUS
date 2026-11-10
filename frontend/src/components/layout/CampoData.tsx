import { useEffect, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

function paraTexto(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function mascarar(bruto: string) {
  const digitos = bruto.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function paraIso(texto: string) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return "";
  const [, dia = "", mes = "", ano = ""] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getDate() !== Number(dia)
  ) {
    return "";
  }
  return `${ano}-${mes}-${dia}`;
}

type Props = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "min" | "max"> & {
  value: string;
  onChange: (iso: string) => void;
  min?: string | undefined;
  max?: string | undefined;
};

export function CampoData({ value, onChange, min, max, ...props }: Props) {
  const [texto, setTexto] = useState(() => paraTexto(value));

  useEffect(() => {
    setTexto((atual) => (paraIso(atual) === value ? atual : paraTexto(value)));
  }, [value]);

  const iso = paraIso(texto);
  const foraDoIntervalo = !!iso && ((!!min && iso < min) || (!!max && iso > max));
  const invalido = texto.length === 10 && (!iso || foraDoIntervalo);

  function mudar(bruto: string) {
    const novo = mascarar(bruto);
    setTexto(novo);
    const data = paraIso(novo);
    const fora = !!data && ((!!min && data < min) || (!!max && data > max));
    onChange(data && !fora ? data : "");
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      value={texto}
      onChange={(e) => mudar(e.target.value)}
      aria-invalid={invalido || props["aria-invalid"] || undefined}
      className={`${props.className ?? ""} ${invalido ? "border-destructive focus-visible:ring-destructive" : ""}`}
    />
  );
}
