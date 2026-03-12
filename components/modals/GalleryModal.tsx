import React from "react";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { AppRed } from "../../constants/Colors";
import { VideoIcon, TrashIcon } from "../Icons";
import { ModalHeader } from "../modules";
import type { PhotoRecord } from "../../hooks/usePhotoStorage";
import type { VideoRecord } from "../../hooks/useVideoStorage";

export interface GalleryModalProps {
  visible: boolean;
  onClose: () => void;
  records: PhotoRecord[];
  videoRecords: VideoRecord[];
  onPhotoPress: (record: PhotoRecord) => void;
  onVideoPress: (record: VideoRecord) => void;
  onDeletePhoto: (id: string) => Promise<void>;
  onDeleteVideo: (id: string) => Promise<void>;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  visible,
  onClose,
  records,
  videoRecords,
  onPhotoPress,
  onVideoPress,
  onDeletePhoto,
  onDeleteVideo,
}) => {
  const items = [
    ...records.map((r) => ({ type: "photo" as const, record: r, id: r.id })),
    ...videoRecords.map((r) => ({ type: "video" as const, record: r, id: r.id })),
  ].sort(
    (a, b) =>
      new Date(b.record.timestamp).getTime() -
      new Date(a.record.timestamp).getTime()
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.galleryModalContainer}>
        <ModalHeader title="Galería" onClose={onClose} showBorder />
        <ScrollView style={styles.galleryModalScrollView}>
          {items.length === 0 ? (
            <Text style={styles.modalEmptyText}>
              No hay fotos ni videos guardados aún
            </Text>
          ) : (
            items.map((item) =>
              item.type === "photo" ? (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => onPhotoPress(item.record)}
                  activeOpacity={0.7}
                >
                  <View style={styles.galleryThumbnailContainer}>
                    <Image
                      source={{ uri: item.record.imageUri }}
                      style={styles.galleryThumbnail}
                    />
                  </View>
                  <View style={styles.galleryInfo}>
                    <Text style={styles.gallerySensorValue}>
                      {item.record.sensorValue !== null
                        ? item.record.sensorValue
                        : "--"}
                    </Text>
                    <Text style={styles.galleryTimestamp}>
                      {new Date(item.record.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Eliminar Foto",
                        "¿Estás seguro de que quieres eliminar esta foto?",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await onDeletePhoto(item.record.id);
                                Alert.alert(
                                  "Éxito",
                                  "Foto eliminada correctamente"
                                );
                              } catch (error) {
                                Alert.alert(
                                  "Error",
                                  "No se pudo eliminar la foto"
                                );
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <TrashIcon size={24} color={AppRed} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={() => onVideoPress(item.record)}
                  activeOpacity={0.7}
                >
                  <View style={styles.galleryThumbnailContainer}>
                    <View style={styles.galleryVideoThumbnail}>
                      <VideoIcon size={40} color={AppRed} />
                      <Text style={styles.galleryVideoLabel}>Video</Text>
                    </View>
                  </View>
                  <View style={styles.galleryInfo}>
                    <Text style={styles.gallerySensorValue}>
                      {item.record.sensorValue !== null
                        ? item.record.sensorValue
                        : "--"}
                    </Text>
                    <Text style={styles.galleryTimestamp}>
                      {new Date(item.record.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Eliminar Video",
                        "¿Estás seguro de que quieres eliminar este video?",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await onDeleteVideo(item.record.id);
                                Alert.alert(
                                  "Éxito",
                                  "Video eliminado correctamente"
                                );
                              } catch (error) {
                                Alert.alert(
                                  "Error",
                                  "No se pudo eliminar el video"
                                );
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <TrashIcon size={24} color={AppRed} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            )
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  galleryModalContainer: {
    flex: 1,
    backgroundColor: "#2d2d2d",
  },
  galleryModalHeader: {
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
  galleryModalScrollView: {
    flex: 1,
  },
  modalEmptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  galleryItem: {
    width: "100%",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    flexDirection: "row",
    alignItems: "center",
  },
  galleryThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 16,
  },
  galleryThumbnail: {
    width: 80,
    height: 80,
  },
  galleryVideoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryVideoLabel: {
    marginTop: 4,
    fontSize: 10,
    color: AppRed,
  },
  galleryInfo: {
    flex: 1,
  },
  gallerySensorValue: {
    fontSize: 16,
    fontWeight: "600",
    color: AppRed,
    marginBottom: 4,
  },
  galleryTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  deleteButton: {
    padding: 8,
  },
});
