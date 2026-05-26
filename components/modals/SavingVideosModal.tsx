import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ModalHeader } from "../modules";
import { AppRed } from "../../constants/Colors";
import type { SavingVideoJob } from "../../stores/useVideoSavingStore";

export interface SavingVideosModalProps {
  visible: boolean;
  onClose: () => void;
  jobs: SavingVideoJob[];
}

/** Calcula segundos transcurridos desde startedAt. */
const elapsedSeconds = (startedAt: number, now: number) =>
  Math.max(0, Math.floor((now - startedAt) / 1000));

/**
 * Lista de videos cuya operación de guardado está en curso.
 * Se actualiza solo (timer interno) para reflejar "hace Xs".
 */
export const SavingVideosModal: React.FC<SavingVideosModalProps> = ({
  visible,
  onClose,
  jobs,
}) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ModalHeader
            title={`Videos en proceso${jobs.length ? ` (${jobs.length})` : ""}`}
            onClose={onClose}
            showBorder
          />
          <ScrollView style={styles.scroll}>
            {jobs.length === 0 ? (
              <Text style={styles.emptyText}>
                No hay videos en proceso de guardado.
              </Text>
            ) : (
              jobs.map((job) => (
                <View key={job.id} style={styles.row}>
                  <ActivityIndicator size="small" color={AppRed} />
                  <View style={styles.info}>
                    <Text style={styles.phase}>
                      {job.phase === "processing"
                        ? "Procesando…"
                        : "Guardando…"}
                    </Text>
                    <Text style={styles.title} numberOfLines={1}>
                      {job.sensorValue !== null
                        ? `PPM: ${job.sensorValue}`
                        : "Video sin medición"}
                    </Text>
                    {job.location ? (
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {job.location}
                      </Text>
                    ) : null}
                    <Text style={styles.elapsed}>
                      Hace {elapsedSeconds(job.startedAt, now)}s
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#2d2d2d",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  scroll: {
    backgroundColor: "#2d2d2d",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    gap: 14,
  },
  info: {
    flex: 1,
  },
  phase: {
    color: AppRed,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    color: "#bbb",
    fontSize: 13,
    marginBottom: 2,
  },
  elapsed: {
    color: "#888",
    fontSize: 12,
  },
});
