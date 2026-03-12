import React, { useState } from "react";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { AppRed } from "../../constants/Colors";
import { CloseCircleIcon } from "../Icons";
import TextInput from "../Inputs/TextInput";
import { MediaPreview, type MediaType } from "../MediaPreview";

export interface MediaRecordBase {
  id: string;
  sensorValue: number | null;
  timestamp: string;
  location?: string;
}

export interface FullMediaModalProps<T extends MediaRecordBase> {
  visible: boolean;
  onClose: () => void;
  mediaType: MediaType;
  mediaUri: string | null;
  record: T | null;
  onOpenMedia: () => void;
  onUpdateRecord: (
    id: string,
    updates: Partial<Omit<T, "id" | "timestamp">>
  ) => Promise<T | null>;
  onRecordUpdated: (record: T) => void;
}

export function FullMediaModal<T extends MediaRecordBase>({
  visible,
  onClose,
  mediaType,
  mediaUri,
  record,
  onOpenMedia,
  onUpdateRecord,
  onRecordUpdated,
}: FullMediaModalProps<T>) {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState("");

  const handleStartEditLocation = () => {
    if (record) {
      setEditingLocation(record.location || "");
      setIsEditingLocation(true);
    }
  };

  const handleSaveLocation = async () => {
    if (!record) return;

    try {
      const updatedRecord = await onUpdateRecord(record.id, {
        location: editingLocation || undefined,
      } as Partial<Omit<T, "id" | "timestamp">>);
      if (updatedRecord) {
        onRecordUpdated(updatedRecord);
        setIsEditingLocation(false);
        setEditingLocation("");
        Alert.alert("Éxito", "Ubicación actualizada correctamente");
      }
    } catch (error) {
      console.error("Error actualizando ubicación:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar la ubicación. Intenta nuevamente."
      );
    }
  };

  const handleCancelEditLocation = () => {
    setIsEditingLocation(false);
    setEditingLocation("");
  };

  const handleClose = () => {
    setIsEditingLocation(false);
    setEditingLocation("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.modalTitle}>Detalles del registro</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={handleClose}>
            <CloseCircleIcon size={40} color={AppRed} />
          </TouchableOpacity>
        </View>


        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {mediaUri && (
            <MediaPreview
              type={mediaType}
              uri={mediaUri}
              onPress={onOpenMedia}
            />
          )}

          {record && (
            <>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyFieldLabel}>Valor del Sensor</Text>
                <Text style={styles.readOnlyFieldValue}>
                  {record.sensorValue !== null
                    ? record.sensorValue.toString()
                    : "--"}
                </Text>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyFieldLabel}>Fecha</Text>
                <Text style={styles.readOnlyFieldValue}>
                  {new Date(record.timestamp).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {!isEditingLocation ? (
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyFieldLabel}>Ubicación</Text>
                  <Text style={styles.readOnlyFieldValue}>
                    {record.location || "No especificada"}
                  </Text>
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <TextInput
                    name="location"
                    label="Ubicación"
                    value={editingLocation}
                    onChange={(_, value) => setEditingLocation(value)}
                    disabled={false}
                    style={styles.darkInput}
                    placeholder="No especificada"
                  />
                </View>
              )}

              <View style={styles.editSection}>
                {!isEditingLocation ? (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleStartEditLocation}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelEditLocation}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveEditButton}
                      onPress={handleSaveLocation}
                    >
                      <Text style={styles.saveEditButtonText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  header: {
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
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  editSection: {
    alignItems: "flex-end",
    marginTop: 24,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveEditButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  saveEditButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  readOnlyField: {
    marginBottom: 16,
  },
  readOnlyFieldLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  readOnlyFieldValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
});
