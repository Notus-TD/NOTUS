export function hojeLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatarData(iso: string) {
  return iso.split("-").reverse().join("/");
}

export function diasEntre(de: string, ate: string) {
  const emUtc = (iso: string) => {
    const [ano, mes, dia] = iso.split("-").map(Number);
    return Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1);
  };
  return Math.round((emUtc(ate) - emUtc(de)) / 86_400_000);
}
