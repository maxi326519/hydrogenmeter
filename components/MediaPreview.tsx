import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ViewStyle,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { AppRed } from "../constants/Colors";

export type MediaType = "image" | "video";

export interface MediaPreviewProps {
  type: MediaType;
  uri: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  type,
  uri,
  onPress,
  style,
}) => {
  const containerStyle = [
    styles.container,
    type === "video" ? styles.videoAspectRatio : styles.imageHeight,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {type === "image" ? (
        <Image
          source={{ uri }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : (
        <>
          <Video
            style={styles.media}
            source={{ uri }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
          />
          <View style={styles.playOverlay} pointerEvents="none">
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.playHint}>Toca para reproducir</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppRed,
    backgroundColor: "#1a1a1a",
  },
  videoAspectRatio: {
    aspectRatio: 16 / 9,
  },
  imageHeight: {
    height: 200,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playIcon: {
    fontSize: 64,
    color: "#fff",
  },
  playHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#fff",
  },
});
