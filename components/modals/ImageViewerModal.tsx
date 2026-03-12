import { ModalHeader } from "../modules";
import {
  View,
  Modal,
  StyleSheet,
  Image,
} from "react-native";
import React from "react";

export interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >

      <ModalHeader title="Imagen del registro" onClose={onClose} />
      <View style={styles.imageViewerContainer}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  imageViewerImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
