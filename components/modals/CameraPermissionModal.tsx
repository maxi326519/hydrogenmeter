import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { AppRed } from "../../constants/Colors";

export interface CameraPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<{ granted: boolean }>;
  onPermissionGranted?: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  visible,
  onClose,
  onRequestPermission,
  onPermissionGranted,
}) => {
  const handleRequestPermission = async () => {
    const result = await onRequestPermission();
    if (!result.granted) {
      Alert.alert(
        "Permiso Denegado",
        "Para usar la cámara, necesitas otorgar permisos en la configuración de la aplicación.",
        [
          { text: "Cancelar", style: "cancel", onPress: onClose },
          { text: "Abrir Configuración", onPress: () => Linking.openSettings() },
        ]
      );
    } else if (onPermissionGranted) {
      onPermissionGranted();
    }
  };

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
            <Text style={styles.modalTitle}>Permiso de Cámara Requerido</Text>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              Esta aplicación necesita acceso a la cámara para capturar imágenes.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleRequestPermission}>
              <Text style={styles.modalButtonText}>Solicitar Permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonSecondary} onPress={onClose}>
              <Text style={styles.modalButtonSecondaryText}>Cerrar</Text>
            </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: AppRed,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppRed,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    color: AppRed,
    fontSize: 16,
    fontWeight: "600",
  },
});
