import React from "react";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import TextInput from "../Inputs/TextInput";
import { ModalHeader } from "../modules";
import { AppRed } from "../../constants/Colors";

export interface PhotoFormModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  sensorValue: number | null;
  location: string;
  onSensorValueChange: (value: number | null) => void;
  onLocationChange: (value: string) => void;
  onSave: () => void;
  onOpenImageViewer: (uri: string) => void;
}

export const PhotoFormModal: React.FC<PhotoFormModalProps> = ({
  visible,
  onClose,
  imageUri,
  sensorValue,
  location,
  onSensorValueChange,
  onLocationChange,
  onSave,
  onOpenImageViewer,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.photoFormModalContainer}>
        <View style={styles.photoFormModalContent}>
          <ModalHeader title="Nueva Foto" onClose={onClose} showBorder />
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.photoFormContainer}>
              {imageUri && (
                <TouchableOpacity
                  onPress={() => onOpenImageViewer(imageUri)}
                  style={styles.photoThumbnailContainer}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photoThumbnail}
                  />
                </TouchableOpacity>
              )}
              <View style={styles.inputWrapper}>
                <TextInput
                  name="sensorValue"
                  label="Valor del Sensor"
                  value={sensorValue !== null ? sensorValue.toString() : ""}
                  onChange={(_, value) => {
                    const numValue = parseInt(value) || null;
                    onSensorValueChange(numValue);
                  }}
                  placeholder="Ingrese el valor del sensor"
                  disabled={true}
                  style={styles.darkInput}
                />
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  name="location"
                  label="Ubicación"
                  value={location}
                  onChange={(_, value) => onLocationChange(value)}
                  placeholder="Ingrese la ubicación donde se tomó la foto"
                  style={styles.darkInput}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  photoFormModalContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#2d2d2d",
  },
  photoFormModalContent: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#2d2d2d",
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
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalScrollView: {
    flex: 1,
  },
  photoFormContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  photoThumbnailContainer: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppRed,
  },
  photoThumbnail: {
    width: 200,
    height: 200,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  saveButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: AppRed,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
