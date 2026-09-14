import { getToken, saveSession, type Session } from "@/lib/auth";

const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8080";

export type TokenDTO = {
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export async function login(email: string, password: string): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(0, `Não foi possível conectar ao backend em ${API_URL}. Ele está rodando?`);
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(res.status, "E-mail ou senha incorretos.");
  }
  if (!res.ok) throw new ApiError(res.status, `Login falhou: ${res.status}`);
  const data = (await res.json()) as TokenDTO;
  return saveSession(data);
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
  const token = getToken();
  if (!token) throw new Error("É preciso fazer login antes de buscar as faltas.");
  const res = await fetch(`${API_URL}/falta`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao buscar faltas: ${res.status}`);
  return res.json();
}

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
  matricula: number;
  birthDate: string;
};

export type StudentRegistrationRequest = {
  responsible: ResponsibleRequest;
  student: StudentRequest;
};

export type StudentRegistrationResponse = {
  userId: number;
  studentName: string;
};

type StandardError = {
  status: number;
  message: string;
  errors?: { fieldName: string; message: string }[];
};

export class ApiError extends Error {
  status: number;
  fieldErrors: { fieldName: string; message: string }[];

  constructor(
    status: number,
    message: string,
    fieldErrors: { fieldName: string; message: string }[] = [],
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function cadastrarAluno(
  body: StudentRegistrationRequest,
): Promise<StudentRegistrationResponse> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

async function getJson<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, `Não foi possível conectar ao backend em ${API_URL}. Ele está rodando?`);
  }
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, `Sem permissão para ${path}.`);
  if (!res.ok) throw new ApiError(res.status, `Falha em GET ${path}: ${res.status}`);
  return res.json();
}

async function sendJson<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : null,
    });
  } catch {
    throw new ApiError(0, `Não foi possível conectar ao backend em ${API_URL}. Ele está rodando?`);
  }
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, `Sem permissão para ${path}.`);
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      err?.message ?? `Falha em ${method} ${path}: ${res.status}`,
      err?.errors ?? [],
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type StatusMatricula = "ATIVA" | "FINALIZADA";

export type StudentMinDTO = {
  userId: number;
  matricula: number;
  studentName: string;
  matriculaStatus: StatusMatricula;
};
export type TurmaDTO = {
  id: number;
  name: string;
  schoolYear: string;
  disciplinas?: { id: number; title: string }[];
};
export type DisciplinaDTO = { id: number; title: string; description?: string };
export type AtividadeDTO = { id: number; title: string; content?: string; status: string };

export type BoletimDTO = {
  id: number;
  period: string;
  finalAverage: number;
  status: string;
  studentId: number;
};
export type Boletim = {
  id: number;
  period: string;
  finalAverage: number;
  status: string;
  student: { id: number; fullName?: string };
};

export type NotaDTO = {
  id: number;
  rate: number;
  period: string;
  boletimId: number;
  disciplinaId: number;
};
export type Nota = {
  id: number;
  rate: number;
  period: string;
  boletim: { id: number; period: string; finalAverage: number; status: string };
  disciplina: { id: number; title: string };
};

export const getStudents = () => getJson<StudentMinDTO[]>("/students");
export const getStudentsByResponsible = (responsibleId: number) =>
  getJson<StudentMinDTO[]>(`/students/responsible/${responsibleId}`);
export const getTurmas = () => getJson<TurmaDTO[]>("/turma");
export const getDisciplinas = () => getJson<DisciplinaDTO[]>("/disciplina");
export const getAtividades = () => getJson<AtividadeDTO[]>("/atividade");
export const getBoletins = () => getJson<BoletimDTO[]>("/boletim");
export const getBoletinsByStudent = (studentId: number) =>
  getJson<Boletim[]>(`/boletim/student/${studentId}`);
export const createBoletim = (dto: Omit<BoletimDTO, "id">) =>
  sendJson<BoletimDTO>("POST", "/boletim", dto);
export const deleteBoletim = (id: number) => sendJson<void>("DELETE", `/boletim/${id}`);

export const getNotasByBoletim = (boletimId: number) =>
  getJson<Nota[]>(`/nota/boletim/${boletimId}`);
export const createNota = (dto: Omit<NotaDTO, "id">) => sendJson<NotaDTO>("POST", "/nota", dto);
export const updateNota = (id: number, dto: Omit<NotaDTO, "id">) =>
  sendJson<NotaDTO>("PUT", `/nota/${id}`, dto);
export const deleteNota = (id: number) => sendJson<void>("DELETE", `/nota/${id}`);
