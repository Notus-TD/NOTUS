import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function media(valores: number[]) {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}
