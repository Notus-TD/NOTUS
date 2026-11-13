// REFN: tipos para compatibilidade com BoletimTurma.tsx
// Nota: tipos Boletim removidos, usar nota.ts para funções de Nota
// Bimestre agora está definido em nota.ts

import type { Bimestre } from "@/api/nota";

export type BoletimDTO = {
  id: number | null;
  studentId: number;
  disciplinaId: number;
  disciplinaTitle: string;
  bimestre: Bimestre;
  mediaCalculada: number | null;
  notaFinal: number | null;
  nota: number | null;
  lancadoEm: string | null;
  pontosAtividades: number | null;
};

export type BoletimDisciplinaDTO = {
  disciplinaId: number;
  disciplinaTitle: string;
  bimestres: BoletimDTO[];
  mediaFinal: number | null;
};
