import { API_URL, ApiError, getJson, sendJson, StandardError } from "@/api/cliente";
import { getToken } from "@/lib/sessao";

export type ResponsibleRequest = {
  name: string;
  email: string;
  phone: string;
};

export type StudentRequest = {
  fullName: string;
  educationalEmail: string | null;
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

export type StudentBatchRegistrationRequest = {
  responsible: ResponsibleRequest;
  students: StudentRequest[];
};

export type StudentDetalheDTO = {
  userId: number;
  fullName: string;
  educationalEmail: string | null;
  matricula: number;
  birthDate: string;
  matriculaStatus: StatusMatricula;
  turmaId: number | null;
  turmaName: string | null;
  responsibleId: number | null;
  responsibleName: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  acessoLiberadoEm: string | null;
};

export const getStudentDetalhe = (studentId: number) =>
  getJson<StudentDetalheDTO>(`/students/${studentId}`);

export const updateStudent = (studentId: number, dto: StudentRequest) =>
  sendJson<StudentDetalheDTO>("PUT", `/students/${studentId}`, dto);

export type ResponsibleDTO = { id: number; name: string; email: string; phone: string };

export const updateResponsible = (responsibleId: number, dto: ResponsibleRequest) =>
  sendJson<ResponsibleDTO>("PUT", `/responsibles/${responsibleId}`, dto);

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
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(res.status, err?.message ?? `Erro ${res.status}`, err?.errors ?? []);
  }

  return res.json();
}

export async function cadastrarAlunos(
  body: StudentBatchRegistrationRequest,
): Promise<StudentRegistrationResponse[]> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/students/lote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(res.status, err?.message ?? `Erro ${res.status}`, err?.errors ?? []);
  }

  return res.json();
}

export type StatusMatricula = "ATIVA" | "FINALIZADA" | "CANCELADA";

export type StudentMinDTO = {
  userId: number;
  matricula: number;
  studentName: string;
  matriculaStatus: StatusMatricula;
  turmaId: number | null;
  turmaName: string | null;
  anonimizado?: boolean;
  acessoLiberadoEm: string | null;
};

export const getStudents = () => getJson<StudentMinDTO[]>("/students");

export const getStudentsByResponsible = (responsibleId: number) =>
  getJson<StudentMinDTO[]>(`/students/responsible/${responsibleId}`);

export const getStudentsByTurma = (turmaId: number, sort: "nome" | "matricula" = "nome") =>
  getJson<StudentMinDTO[]>(`/students/turma/${turmaId}?sort=${sort}`);

export const liberarAcessoAluno = (studentId: number, email: string) =>
  sendJson<StudentMinDTO>("PUT", `/students/${studentId}/acesso`, { email });

export const retirarAcessoAluno = (studentId: number) =>
  sendJson<StudentMinDTO>("DELETE", `/students/${studentId}/acesso`);
