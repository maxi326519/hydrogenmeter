import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { AppRed } from "../constants/Colors";

interface PhotoWithOverlayViewProps {
  uri: string;
  viewRef: React.RefObject<View>;
  photoSensorValue: number | null;
  onLoad: () => void;
  onError: () => void;
}

/**
 * Vista invisible que muestra una foto con overlay de texto (Hydrogen Meter, valor del sensor, fecha).
 * Se usa para capturar la imagen final con view-shot antes de guardarla.
 */
export const PhotoWithOverlayView: React.FC<PhotoWithOverlayViewProps> = ({
  uri,
  viewRef,
  photoSensorValue,
  onLoad,
  onError,
}) => {
  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={styles.photoOverlayContainer}
    >
      <Image
        source={{ uri }}
        style={styles.photoOverlayImage}
        resizeMode="cover"
        onLoad={onLoad}
        onError={onError}
      />

      {/* "Hydrogen Meter" arriba a la izquierda */}
      <View style={styles.overlayTopLeft}>
        <Text style={styles.overlayTextTop}>Hydrogen Meter</Text>
      </View>

      {/* Número del sensor abajo centrado */}
      <View style={styles.overlayBottomCenter}>
        <Text
          style={styles.overlayTextCenter}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {photoSensorValue !== null ? photoSensorValue : "--"}
        </Text>
      </View>

      {/* Fecha abajo a la derecha */}
      <View style={styles.overlayBottomRight}>
        <Text style={styles.overlayTextBottom}>
          {new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  photoOverlayContainer: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    backgroundColor: "#000",
    opacity: 1,
  },
  photoOverlayImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  overlayTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  overlayTextTop: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlayBottomCenter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Dimensions.get("window").height * 0.15,
  },
  overlayTextCenter: {
    fontSize: 72,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  overlayBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  overlayTextBottom: {
    fontSize: 16,
    fontWeight: "600",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
