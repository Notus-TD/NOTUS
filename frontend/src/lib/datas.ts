/** Data de hoje no fuso do navegador, no formato do input date (aaaa-mm-dd). */
export function hojeLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** aaaa-mm-dd → dd/mm/aaaa */
export function formatarData(iso: string) {
  return iso.split("-").reverse().join("/");
}

/** Dias de `de` até `ate` (datas aaaa-mm-dd); negativo se `ate` vem antes. */
export function diasEntre(de: string, ate: string) {
  const emUtc = (iso: string) => {
    const [ano, mes, dia] = iso.split("-").map(Number);
    return Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
  };
  return Math.round((emUtc(ate) - emUtc(de)) / 86_400_000);
}
