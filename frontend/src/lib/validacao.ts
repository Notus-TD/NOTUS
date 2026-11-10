export const somenteDigitos = (v: string) => v.replace(/\D/g, "");

export function formatarTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
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
    hoje.getMonth() > data.getMonth() ||
    (hoje.getMonth() === data.getMonth() && hoje.getDate() >= data.getDate());
  if (!aniversarioPassou) idade--;
  return idade;
}

export function validarNome(v: string): string | undefined {
  if (v.length < 3) return "Informe o nome completo.";
  if (!v.includes(" ")) return "Informe nome e sobrenome.";
  return;
}

export function validarResponsavel(
  chave: "nome" | "email" | "telefone",
  valor: string,
): string | undefined {
  const v = valor.trim();
  switch (chave) {
    case "nome":
      return validarNome(v);
    case "email":
      if (!emailValido(v)) return "Informe um e-mail válido (ex.: nome@dominio.com).";
      return;
    case "telefone":
      if (!telefoneValido(v)) return "Informe DDD + número (10 ou 11 dígitos).";
      return;
  }
}

export function validarNascimento(v: string): string | undefined {
  const idade = idadeEm(v);
  if (idade === null) return "Informe a data de nascimento.";
  if (idade < 0) return "A data de nascimento não pode ser no futuro.";
  if (idade < 3) return "O aluno precisa ter pelo menos 3 anos.";
  if (idade > 25) return "Confira a data: idade acima de 25 anos.";
  return;
}
