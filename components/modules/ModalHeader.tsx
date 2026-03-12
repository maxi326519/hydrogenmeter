import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { CloseCircleIcon } from "../Icons";
import { AppRed } from "../../constants/Colors";

export interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  /** Mostrar borde inferior (para modales con formulario o lista) */
  showBorder?: boolean;
  containerStyle?: ViewStyle;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showBorder = false,
  containerStyle,
}) => {
  return (
    <View
      style={[
        styles.header,
        showBorder && styles.headerWithBorder,
        containerStyle,
      ]}
    >
      <Text style={styles.modalTitle}>{title}</Text>
      <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
        <CloseCircleIcon size={40} color={AppRed} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#2d2d2d",
  },
  headerWithBorder: {
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
});
