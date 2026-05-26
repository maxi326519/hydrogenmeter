import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { VideoIcon } from "./Icons";
import { SavingVideosModal } from "./modals/SavingVideosModal";
import { useVideoSaving } from "../hooks/useVideoSaving";
import { AppRed } from "../constants/Colors";

export interface VideoSavingIndicatorProps {
  /** Estilo extra para el wrapper (posición absoluta, etc.). */
  style?: StyleProp<ViewStyle>;
  /** Tamaño del icono interno (default 32). */
  iconSize?: number;
}

/**
 * Botón que sólo aparece cuando hay videos en proceso de guardado.
 * Muestra el ícono de video, un badge con el contador y abre un modal
 * con la lista de videos en curso al tocarlo.
 */
export const VideoSavingIndicator: React.FC<VideoSavingIndicatorProps> = ({
  style,
  iconSize = 32,
}) => {
  const { jobs, count, isSaving } = useVideoSaving();
  const [open, setOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  // Si se cierra el último job, también cerramos el modal por seguridad.
  useEffect(() => {
    if (!isSaving && open) setOpen(false);
  }, [isSaving, open]);

  // Pulso suave del ícono mientras hay jobs activos.
  useEffect(() => {
    if (!isSaving) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isSaving, pulse]);

  if (!isSaving) return null;

  return (
    <>
      <View style={style}>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Guardando ${count} video${count === 1 ? "" : "s"}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.button}
        >
          <Animated.View style={{ opacity: pulse }}>
            <VideoIcon size={iconSize} color={AppRed} />
          </Animated.View>
          {count > 1 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <SavingVideosModal
        visible={open}
        onClose={() => setOpen(false)}
        jobs={jobs}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: AppRed,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#2d2d2d",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
  },
});
