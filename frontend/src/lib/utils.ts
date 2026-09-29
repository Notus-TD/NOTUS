import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;

  const soma = valores.reduce((total, valor) => total + valor, 0);
  return soma / valores.length;
}
