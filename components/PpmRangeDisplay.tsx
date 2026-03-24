import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { ArrowUpIcon, ArrowDownIcon } from "./Icons";
import { AppRed } from "../constants/Colors";

export interface PpmRangeDisplayProps {
  gasPpm: number | null;
  ppmDirection: "up" | "down" | null;
  /** "camera" = overlay absoluto (cámara foto/video); "main" = vista principal centrada */
  variant?: "camera" | "main";
  /** Estilos opcionales para los contenedores */
  rangeBarContainerStyle?: ViewStyle;
  ppmContainerStyle?: ViewStyle;
}

/**
 * Barra de rango 0-10,000 + valor PPM + flechas de tendencia.
 * Reutilizable en vista de cámara (foto/video) y vista principal.
 */
export const PpmRangeDisplay: React.FC<PpmRangeDisplayProps> = ({
  gasPpm,
  ppmDirection,
  variant = "main",
  rangeBarContainerStyle,
  ppmContainerStyle,
}) => {
  const barStyle = variant === "camera" ? styles.rangeBarContainerCamera : styles.rangeBarContainer;
  const ppmWrapStyle = variant === "camera" ? styles.ppmTopContainer : styles.ppmContainerWrapper;

  return (
    <>
      <View style={[barStyle, rangeBarContainerStyle]}>
        <View style={styles.rangeBar}>
          <View
            style={[
              styles.rangeBarFill,
              {
                width: `${Math.min(
                  ((gasPpm !== null ? gasPpm : 0) / 10000) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>
      <View style={[ppmWrapStyle, ppmContainerStyle]}>
        <View style={styles.ppmContainer}>
          <Text style={styles.ppmValue}>
            {gasPpm !== null ? gasPpm : "--"}
          </Text>
          {gasPpm !== null && ppmDirection === "up" && (
            <View style={styles.ppmArrow}>
              <ArrowUpIcon size={40} color={AppRed} />
            </View>
          )}
          {gasPpm !== null && ppmDirection === "down" && (
            <View style={styles.ppmArrow}>
              <ArrowDownIcon size={40} color={AppRed} />
            </View>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  rangeBarContainer: {
    width: "80%",
    maxWidth: 400,
    marginBottom: 20,
    alignItems: "center",
  },
  rangeBarContainerCamera: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    paddingBottom: 300,
    zIndex: 25,
    elevation: 25,
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
  },
  rangeBar: {
    width: "100%",
    height: 16,
    backgroundColor: "#444",
    borderRadius: 8,
    overflow: "hidden",
  },
  rangeBarFill: {
    height: "100%",
    backgroundColor: AppRed,
    borderRadius: 8,
  },
  ppmTopContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 200,
    alignItems: "center",
    justifyContent: "flex-start",
    zIndex: 26,
    elevation: 26,
  },
  ppmContainerWrapper: {
    alignItems: "center",
  },
  ppmContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ppmValue: {
    fontSize: 72,
    fontWeight: "bold",
    color: AppRed,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  ppmArrow: {
    marginLeft: 12,
  },
});
