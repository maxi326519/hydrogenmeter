import type { ConsoleEntry } from "../../hooks/useBLE";
import { AppRed } from "../../constants/Colors";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import React from "react";

export interface ConsoleLogModalProps {
  visible: boolean;
  onClose: () => void;
  consoleData: ConsoleEntry[];
  onClear: () => void;
}

export const ConsoleLogModal: React.FC<ConsoleLogModalProps> = ({
  visible,
  onClose,
  consoleData,
  onClear,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Consola de dispositivo</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={onClear}>
                <Text style={styles.modalButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.modalScrollView}>
            {consoleData.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                Esperando datos del dispositivo...
              </Text>
            ) : (
              consoleData.map((entry: ConsoleEntry) => (
                <View key={entry.id} style={styles.logLine}>
                  <Text style={styles.logTimestamp}>[{entry.timestamp}]</Text>
                  <Text style={styles.logData}>{entry.data}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              {consoleData.length} mensaje
              {consoleData.length !== 1 ? "s" : ""} recibido
              {consoleData.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2d2d2d",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  modalEmptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  logLine: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  logTimestamp: {
    color: "#888",
    fontSize: 12,
    fontFamily: "monospace",
    marginRight: 8,
    minWidth: 80,
  },
  logData: {
    color: AppRed,
    fontSize: 14,
    fontFamily: "monospace",
    flex: 1,
  },
  modalFooter: {
    backgroundColor: "#2d2d2d",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  modalFooterText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
});
