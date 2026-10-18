/** Minúsculas e sem acentos, para a busca encontrar "presenca" em "Presença". */
export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
