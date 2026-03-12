import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { ModalHeader } from "../modules";
import type { VideoRecord } from "../../hooks/useVideoStorage";

export interface VideoViewerModalProps {
  visible: boolean;
  record: VideoRecord | null;
  onClose: () => void;
}

export const VideoViewerModal: React.FC<VideoViewerModalProps> = ({
  visible,
  record,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ModalHeader title="Video del registro" onClose={onClose} />
        {record && (
          <Video
            style={styles.videoPlayer}
            source={{ uri: record.videoUri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoPlayer: {
    flex: 1,
    width: "100%",
  },
  info: {
    padding: 16,
    backgroundColor: "#2d2d2d",
  },
  infoLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
});
