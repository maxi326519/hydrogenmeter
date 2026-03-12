import React from "react";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { Device } from "react-native-ble-plx";
import { AppRed } from "../../constants/Colors";

export interface DeviceConnectModalProps {
  visible: boolean;
  onClose: () => void;
  devices: Device[];
  isScanning: boolean;
  onSelectDevice: (device: Device) => void;
  mockEnabled?: boolean;
}

export const DeviceConnectModal: React.FC<DeviceConnectModalProps> = ({
  visible,
  onClose,
  devices,
  isScanning,
  onSelectDevice,
  mockEnabled = false,
}) => {
  const isEmpty = devices.length === 0 && !isScanning;

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
            <Text style={styles.modalTitle}>Seleccionar dispositivo</Text>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {isScanning && devices.length === 0 ? (
            <View style={styles.modalBody}>
              <ActivityIndicator size="large" color={AppRed} />
              <Text style={[styles.modalText, { marginTop: 16 }]}>
                Buscando dispositivos...
              </Text>
            </View>
          ) : null}
          <View style={styles.modalScrollViewContainer}>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={
                isEmpty ? styles.modalScrollViewContentEmpty : undefined
              }
              showsVerticalScrollIndicator={true}
            >
              {isEmpty ? (
                <Text style={styles.modalEmptyText}>
                  No se encontraron dispositivos. Asegúrate de que el Bluetooth
                  esté encendido y el dispositivo cerca.
                  {mockEnabled ? " (usando mock)" : ""}
                </Text>
              ) : (
                devices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={styles.deviceItem}
                    onPress={() => onSelectDevice(device)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deviceItemName} numberOfLines={1}>
                      {device.name ||
                        device.localName ||
                        "Dispositivo sin nombre"}
                    </Text>
                    <Text style={styles.deviceItemId} numberOfLines={1}>
                      {device.id}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              {devices.length} dispositivo
              {devices.length !== 1 ? "s" : ""} encontrado
              {devices.length !== 1 ? "s" : ""}
              {isScanning ? " · Buscando..." : ""}
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
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
  },
  modalScrollViewContainer: {
    flex: 1,
    minHeight: 200,
    backgroundColor: "#2d2d2d",
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  modalScrollViewContentEmpty: {
    flexGrow: 1,
  },
  modalEmptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  deviceItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  deviceItemId: {
    fontSize: 12,
    color: "#888",
    fontFamily: "monospace",
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
