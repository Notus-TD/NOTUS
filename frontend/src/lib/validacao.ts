export const somenteDigitos = (v: string) => v.replace(/\D/g, "");

export function formatarTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function emailValido(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function telefoneValido(v: string): boolean {
  const n = somenteDigitos(v).length;
  return n === 10 || n === 11;
}

export function idadeEm(nascimento: string, hoje = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return null;
  const data = new Date(`${nascimento}T00:00:00`);
  if (Number.isNaN(data.getTime())) return null;
  let idade = hoje.getFullYear() - data.getFullYear();
  const aniversarioPassou =
    hoje.getMonth() > data.getMonth() || (hoje.getMonth() === data.getMonth() && hoje.getDate() >= data.getDate());
  if (!aniversarioPassou) idade--;
  return idade;
}
