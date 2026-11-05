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
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(res.status, "E-mail ou senha incorretos.");
  }
  if (res.status === 429) {
    // Bloqueio por excesso de senhas erradas: o servidor diz quantos minutos faltam.
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      err?.message ?? "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
    );
  }
  if (!res.ok) throw new ApiError(res.status, `Login falhou: ${res.status}`);
  const data = (await res.json()) as TokenDTO;
  return saveSession(data);
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/esqueci-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 422) throw new ApiError(res.status, "Informe um e-mail válido.");
  if (res.status === 429) {
    throw new ApiError(res.status, "Muitas tentativas seguidas. Aguarde alguns minutos.");
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      "Não foi possível enviar o link agora. Tente mais tarde ou procure a secretaria da escola.",
    );
  }
}

export type TipoTokenSenha = "CONVITE" | "REDEFINICAO";
export type TokenSenhaDTO = { tipo: TipoTokenSenha; emailMascarado: string };

export const LINK_INVALIDO = "Este link é inválido ou já expirou. Peça um novo link.";

// Rotas públicas do link de senha: o token vai no corpo, nunca na URL da API.
async function postPublico(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
}

export async function validarTokenSenha(token: string): Promise<TokenSenhaDTO> {
  const res = await postPublico("/auth/token-senha/validar", { token });
  if (res.status === 422) throw new ApiError(res.status, LINK_INVALIDO);
  if (!res.ok) throw new ApiError(res.status, `Falha ao verificar o link: ${res.status}`);
  return res.json();
}

export async function definirSenha(
  token: string,
  novaSenha: string,
  aceiteTermos: boolean,
): Promise<void> {
  const res = await postPublico("/auth/definir-senha", { token, novaSenha, aceiteTermos });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(
      res.status,
      res.status === 422 && err?.message ? err.message : `Falha ao salvar a senha: ${res.status}`,
      err?.errors ?? [],
    );
  }
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
  if (!token) throw new ApiError(401, "É preciso fazer login antes de buscar as faltas.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}/falta`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, "Sem permissão para ver as faltas.");
  if (!res.ok) throw new ApiError(res.status, `Falha ao buscar faltas: ${res.status}`);
  return res.json();
}

export type FaltaCreateRequest = {
  data: string;
  quantidade: number;
  studentId: number;
  disciplinaId: number;
};

export async function associarFalta(body: FaltaCreateRequest): Promise<FaltaDTO> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/falta/associar`, {
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
    throw new ApiError(
      res.status,
      err?.message ?? `Erro ${res.status} ao registrar a falta.`,
      err?.errors ?? [],
    );
  }
  return res.json();
}

export async function deleteFalta(id: number): Promise<void> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/falta/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }
  if (!res.ok) throw new ApiError(res.status, `Falha ao excluir a falta: ${res.status}`);
}

export type ResponsibleRequest = {
  name: string;
  email: string;
  phone: string;
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

export type StudentBatchRegistrationRequest = {
  responsible: ResponsibleRequest;
  students: StudentRequest[];
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
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as StandardError | null;
    throw new ApiError(res.status, err?.message ?? `Erro ${res.status}`, err?.errors ?? []);
  }

  return res.json();
}

// Cadastra vários alunos do mesmo responsável numa única transação (tudo ou nada).
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

async function getJson<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Faça login para continuar.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
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
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
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
  totalAlunos: number;
};
export type TurmaRequestDTO = { name: string; schoolYear: string };
export type LecionamentoDTO = {
  id: number;
  turmaId: number;
  turmaName: string;
  disciplinaId: number;
  disciplinaTitle: string;
  professorId: number;
  professorName: string | null;
  professorEmail: string;
};
export type LecionamentoRequestDTO = { turmaId: number; disciplinaId: number; professorId: number };
// acessoPendente: ainda não usou o link de convite para criar a senha.
export type ProfessorDTO = { id: number; fullName: string; email: string; acessoPendente: boolean };
export type ProfessorRequest = { fullName: string; email: string };
export type TurmaDetalheDTO = {
  id: number;
  name: string;
  schoolYear: string;
  alunos: StudentMinDTO[];
  lecionamentos: LecionamentoDTO[];
};
export type DisciplinaDTO = { id: number; title: string; description?: string };
export type Bimestre = "PRIMEIRO" | "SEGUNDO" | "TERCEIRO" | "QUARTO";
export type AtividadeDTO = {
  id: number;
  title: string;
  content: string;
  bimestre: Bimestre;
  prazo: string;
  turmaId: number;
  disciplinaId: number;
  turmaName: string;
  disciplinaTitle: string;
  publicadaEm: string;
  entregue: boolean | null;
  pontos: number | null;
};
export type NovaAtividade = {
  title: string;
  content: string;
  bimestre: Bimestre;
  prazo: string;
  turmaId: number;
  disciplinaId?: number;
  pontos?: number | null;
};

export type BoletimDTO = {
  id: number | null;
  studentId: number;
  disciplinaId: number;
  disciplinaTitle: string;
  bimestre: Bimestre;
  mediaCalculada: number | null;
  notaFinal: number | null;
  nota: number;
  lancadoEm: string | null;
  pontosAtividades: number | null;
};
export type BoletimDisciplinaDTO = {
  disciplinaId: number;
  disciplinaTitle: string;
  bimestres: BoletimDTO[];
  mediaFinal: number | null;
  mediaSala: number | null;
};
export type NotaFinalRequest = {
  studentId: number;
  disciplinaId: number;
  bimestre: Bimestre;
  notaFinal: number;
};

export type NotaDTO = {
  id: number;
  descricao: string;
  rate: number;
  bimestre: Bimestre;
  studentId: number;
  disciplinaId: number;
  disciplinaTitle: string;
};
export type NotaRequest = Omit<NotaDTO, "id" | "disciplinaTitle">;

export type StatusEntrega = "ENTREGUE" | "ATRASADA" | "NAO_ENTREGUE";
export type EntregaDTO = {
  id: number;
  status: StatusEntrega;
  atividadeId: number;
  atividadeTitle: string;
  disciplinaId: number;
  bimestre: Bimestre;
  studentId: number;
  pontos: number | null;
  pontosObtidos: number | null;
};
export type EntregaRequest = {
  atividadeId: number;
  studentId: number;
  status: StatusEntrega;
  pontosObtidos?: number | null;
};

export type FrequenciaDTO = {
  studentId: number;
  studentName: string;
  disciplinaId: number;
  disciplinaTitle: string;
  totalAulas: number;
  totalFaltas: number;
  percentualPresenca: number;
};

export const getStudents = () => getJson<StudentMinDTO[]>("/students");
export const getStudentsByResponsible = (responsibleId: number) =>
  getJson<StudentMinDTO[]>(`/students/responsible/${responsibleId}`);
export const getStudentsByTurma = (turmaId: number, sort: "nome" | "matricula" = "nome") =>
  getJson<StudentMinDTO[]>(`/students/turma/${turmaId}?sort=${sort}`);
export const getTurmas = () => getJson<TurmaDTO[]>("/turma");
export const getTurma = (turmaId: number) => getJson<TurmaDetalheDTO>(`/turma/${turmaId}`);
export const createTurma = (dto: TurmaRequestDTO) => sendJson<TurmaDTO>("POST", "/turma", dto);
export const updateTurma = (turmaId: number, dto: TurmaRequestDTO) =>
  sendJson<TurmaDTO>("PUT", `/turma/${turmaId}`, dto);
export const deleteTurma = (turmaId: number) => sendJson<void>("DELETE", `/turma/${turmaId}`);

export const getProfessores = () => getJson<ProfessorDTO[]>("/professores");
export const cadastrarProfessor = (dto: ProfessorRequest) =>
  sendJson<ProfessorDTO>("POST", "/professores", dto);

export const getLecionamentos = () => getJson<LecionamentoDTO[]>("/lecionamento");
export const createLecionamento = (dto: LecionamentoRequestDTO) =>
  sendJson<LecionamentoDTO>("POST", "/lecionamento", dto);
export const deleteLecionamento = (id: number) => sendJson<void>("DELETE", `/lecionamento/${id}`);

export type TurmaAlunoResponseDTO = {
  turmaId: number;
  turmaName: string;
  studentId: number;
  studentName: string;
  matricula: number;
};
export const associarAlunoTurma = (turmaId: number, studentId: number) =>
  sendJson<TurmaAlunoResponseDTO>("POST", `/turma/${turmaId}/alunos`, { studentId });
export const removerAlunoTurma = (turmaId: number, studentId: number) =>
  sendJson<void>("DELETE", `/turma/${turmaId}/alunos/${studentId}`);

export type TurmaComDisciplinasDTO = {
  turmaId: number;
  turmaName: string;
  schoolYear: string;
  disciplinas: { id: number; title: string }[];
};
export const getMinhasTurmas = () => getJson<TurmaComDisciplinasDTO[]>("/turma/me");

export const getDisciplinas = () => getJson<DisciplinaDTO[]>("/disciplina");
export const getAtividades = () => getJson<AtividadeDTO[]>("/atividade");
export const getAtividadesDaTurma = (turmaId: number) =>
  getJson<AtividadeDTO[]>(`/atividade/turma/${turmaId}`);
export const getMinhasAtividades = () => getJson<AtividadeDTO[]>("/atividade/me");
export const publicarAtividade = (dto: NovaAtividade) =>
  sendJson<AtividadeDTO>("POST", "/atividade", dto);
export const deleteAtividade = (id: number) => sendJson<void>("DELETE", `/atividade/${id}`);
// Edita título, texto, bimestre, prazo e pontos (turma e disciplina não mudam).
export const atualizarAtividade = (id: number, dto: NovaAtividade) =>
  sendJson<AtividadeDTO>("PUT", `/atividade/${id}`, dto);
export const getBoletimDoAluno = (studentId: number) =>
  getJson<BoletimDisciplinaDTO[]>(`/boletim/student/${studentId}`);
export const lancarNotaFinal = (dto: NotaFinalRequest) =>
  sendJson<BoletimDTO>("PUT", "/boletim/nota-final", dto);
export const removerNotaFinal = (id: number) => sendJson<void>("DELETE", `/boletim/${id}`);

export const getNotasDoAluno = (studentId: number) =>
  getJson<NotaDTO[]>(`/nota/student/${studentId}`);
export const createNota = (dto: NotaRequest) => sendJson<NotaDTO>("POST", "/nota", dto);
export const updateNota = (id: number, dto: NotaRequest) =>
  sendJson<NotaDTO>("PUT", `/nota/${id}`, dto);
export const deleteNota = (id: number) => sendJson<void>("DELETE", `/nota/${id}`);

export const getEntregasDaAtividade = (atividadeId: number) =>
  getJson<EntregaDTO[]>(`/entrega/atividade/${atividadeId}`);
export const getEntregasDoAluno = (studentId: number) =>
  getJson<EntregaDTO[]>(`/entrega/student/${studentId}`);
export const marcarEntrega = (dto: EntregaRequest) => sendJson<EntregaDTO>("PUT", "/entrega", dto);

export type DependenteDTO = { id: number; nome: string };
export type MeuPerfilDTO = {
  email: string;
  roles: string[];
  nome: string | null;
  dependentes: DependenteDTO[];
};

export const getMeuPerfil = () => getJson<MeuPerfilDTO>("/auth/me");

export const completeOnboarding = (newPassword: string, acceptTerms: boolean) =>
  sendJson<void>("POST", "/users/me/onboarding", { newPassword, acceptTerms });

export type PerfilUsuario = "ALUNO" | "RESPONSAVEL";
export type UsuarioDTO = {
  id: number;
  perfil: PerfilUsuario;
  nome: string | null;
  matricula: number | null;
  anonimizado: boolean;
  acessoPendente: boolean;
};
export const getUsuarios = () => getJson<UsuarioDTO[]>("/users");
export const reenviarConvite = (userId: number) =>
  sendJson<void>("POST", `/users/${userId}/reenviar-convite`);
export const anonymizeUser = (userId: number, confirmacao: string) =>
  sendJson<void>("PUT", `/users/me/anonymize/${userId}`, { confirmacao });

export type StatusNotificacao =
  "PENDENTE" | "ENVIANDO" | "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHA" | "CANCELADA";
export type NotificacaoDTO = {
  id: number;
  tipo: "FALTA" | "ATIVIDADE" | "NOTA_FINAL" | "COMUNICADO";
  status: StatusNotificacao;
  criadoEm: string;
};
export const getNotificacoes = () => getJson<NotificacaoDTO[]>("/notificacao");

// Avisos do responsável (faltas, notas e atividades dos filhos), com o texto do e-mail.
export type AvisoDTO = {
  id: number;
  tipo: "FALTA" | "ATIVIDADE" | "NOTA_FINAL" | "COMUNICADO";
  titulo: string;
  texto: string;
  studentId: number | null;
  alunoNome: string | null;
  criadoEm: string;
};
export const getMeusAvisos = () => getJson<AvisoDTO[]>("/notificacao/me");

// Comunicados gerais da escola, salvos no back-end.
export type PublicoComunicado = "TODOS" | "ALUNOS" | "RESPONSAVEIS" | "PROFESSORES";
export type ComunicadoDTO = {
  id: number;
  titulo: string;
  texto: string;
  publico: PublicoComunicado;
  enviadoEm: string;
  autorEmail: string;
};
export type ComunicadoRequest = { titulo: string; texto: string; publico: PublicoComunicado };
export const getComunicados = () => getJson<ComunicadoDTO[]>("/comunicado");
export const getComunicadosParaMim = () => getJson<ComunicadoDTO[]>("/comunicado/me");
export const publicarComunicado = (dto: ComunicadoRequest) =>
  sendJson<ComunicadoDTO>("POST", "/comunicado", dto);

// Atividades de um aluno com a situação da entrega (responsável acompanhando os filhos).
export const getAtividadesDoAluno = (studentId: number) =>
  getJson<AtividadeDTO[]>(`/atividade/student/${studentId}`);

export const getMinhasFaltas = () => getJson<FaltaDTO[]>("/falta/me");
export const getMinhaFrequencia = () => getJson<FrequenciaDTO[]>("/falta/me/frequencia");
export const getFaltasByStudent = (studentId: number) =>
  getJson<FaltaDTO[]>(`/falta/student/${studentId}`);

export const registrarAula = (disciplinaId: number, data: string) =>
  sendJson<void>("POST", `/disciplina/${disciplinaId}/aulas`, { data });
