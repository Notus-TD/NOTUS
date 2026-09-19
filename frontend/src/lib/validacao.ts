export const somenteDigitos = (v: string) => v.replace(/\D/g, "");

export function formatarCpf(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function formatarTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function cpfValido(v: string): boolean {
  const d = somenteDigitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
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
