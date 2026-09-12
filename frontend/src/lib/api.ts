const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// ---------- Auth ----------

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

// ---------- Faltas ----------

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

// ---------- Cadastro de aluno ----------

export type ResponsibleRequest = {
  name: string;
  email: string;
  phone: string;
  address: string;
  cpf: string;
};

export type StudentRequest = {
  fullName: string;
  educationalEmail: string;
  cpf: string;
  birthDate: string;
  matricula: number;
};

export type StudentRegistrationRequest = {
  responsible: ResponsibleRequest;
  student: StudentRequest;
};

export type StudentRegistrationResponse = {
  userId: number;
  matriculaStatus: "ATIVA" | "INATIVA" | "TRANCADA" | "CANCELADA";
};

type StandardError = {
  status: number;
  message: string;
  errors?: { fieldName: string; message: string }[];
};

export class ApiError extends Error {
  status: number;
  fieldErrors: { fieldName: string; message: string }[];

  constructor(status: number, message: string, fieldErrors: { fieldName: string; message: string }[] = []) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function cadastrarAluno(
  body: StudentRegistrationRequest,
): Promise<StudentRegistrationResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `Não foi possível conectar ao backend em ${API_URL}. Ele está rodando?`);
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(res.status, err?.message ?? `Erro ${res.status}`, err?.errors ?? []);
  }

  return res.json();
}
