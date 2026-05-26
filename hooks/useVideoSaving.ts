import { useCallback } from "react";
import {
  useVideoSavingStore,
  type SavingVideoJob,
} from "../stores/useVideoSavingStore";

/**
 * Hook ergonómico para registrar y consumir jobs de "guardando video".
 * Devuelve el listado actual y helpers para iniciar/actualizar/finalizar un job.
 */
export function useVideoSaving() {
  const jobs = useVideoSavingStore((s) => s.jobs);
  const startJobRaw = useVideoSavingStore((s) => s.startJob);
  const updateJobRaw = useVideoSavingStore((s) => s.updateJob);
  const finishJobRaw = useVideoSavingStore((s) => s.finishJob);

  const startJob = useCallback(
    (params: Omit<SavingVideoJob, "id" | "startedAt">) => startJobRaw(params),
    [startJobRaw],
  );

  const updateJob = useCallback(
    (
      id: string,
      patch: Partial<Omit<SavingVideoJob, "id" | "startedAt">>,
    ) => updateJobRaw(id, patch),
    [updateJobRaw],
  );

  const finishJob = useCallback(
    (id: string) => finishJobRaw(id),
    [finishJobRaw],
  );

  return {
    jobs,
    count: jobs.length,
    isSaving: jobs.length > 0,
    startJob,
    updateJob,
    finishJob,
  };
}
