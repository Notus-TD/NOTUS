const API_URL = "http://localhost:8081";

let token: string | null = null;

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const data = (await res.json()) as { token: string };
  token = data.token;
}

export type FaltaDTO = {
  id: number;
  data: string;
  quantidade: number;
  registradoEm: string;
  studentId: number;
  disciplinaId: number;
  registradoPorId: number;
};

export async function getFaltas(): Promise<FaltaDTO[]> {
  if (!token) throw new Error("É preciso fazer login antes de buscar as faltas.");
  const res = await fetch(`${API_URL}/falta`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao buscar faltas: ${res.status}`);
  return res.json();
}
