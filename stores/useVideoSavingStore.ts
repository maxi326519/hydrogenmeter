import { create } from "zustand";

/** Fase del trabajo en segundo plano sobre el video. */
export type SavingVideoPhase = "processing" | "saving";

export interface SavingVideoJob {
  /** Identificador único del job. */
  id: string;
  /** Fase actual del trabajo. */
  phase: SavingVideoPhase;
  /** URI del video. Puede no existir todavía durante "processing". */
  uri?: string;
  /** Valor del sensor asociado a la captura (PPM máximo durante la grabación). */
  sensorValue: number | null;
  /** Ubicación opcional ingresada en el formulario. */
  location?: string;
  /** Timestamp (ms) en que arrancó el job, para mostrar "hace Xs". */
  startedAt: number;
}

interface VideoSavingState {
  jobs: SavingVideoJob[];
  /** Registra un nuevo job y devuelve su id. */
  startJob: (params: Omit<SavingVideoJob, "id" | "startedAt">) => string;
  /** Actualiza un job existente (p.ej. para pasar de processing → saving). */
  updateJob: (
    id: string,
    patch: Partial<Omit<SavingVideoJob, "id" | "startedAt">>,
  ) => void;
  /** Quita un job del listado al terminar (éxito o error). */
  finishJob: (id: string) => void;
  /** Quita todos los jobs (uso defensivo si algo se cuelga). */
  clear: () => void;
}

export const useVideoSavingStore = create<VideoSavingState>((set) => ({
  jobs: [],
  startJob: (params) => {
    const id =
      Date.now().toString() + Math.random().toString(36).slice(2, 8);
    set((state) => ({
      jobs: [
        ...state.jobs,
        { id, startedAt: Date.now(), ...params },
      ],
    }));
    return id;
  },
  updateJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),
  finishJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),
  clear: () => set({ jobs: [] }),
}));
