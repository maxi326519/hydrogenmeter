import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useBLEStore } from "../stores/useBLEStore";
import { AppRed } from "../constants/Colors";

interface SignalIndicatorProps {
  /** Si false, el indicador se mantiene apagado (sin parpadear). */
  active?: boolean;
  /** Estilo extra para posicionar el contenedor. */
  style?: StyleProp<ViewStyle>;
  /** Tamaño del círculo en píxeles (default 16). */
  size?: number;
}

/**
 * Círculo rojo que destella cada vez que el store recibe un nuevo paquete
 * BLE (signalTick se incrementa en useBLE.onDataUpdate y en el mock).
 */
export function SignalIndicator({
  active = true,
  style,
  size = 16,
}: SignalIndicatorProps) {
  const signalTick = useBLEStore((s) => s.signalTick);
  const opacity = useRef(new Animated.Value(0.15)).current;
  const firstTickRef = useRef<number>(signalTick);

  useEffect(() => {
    if (!active) {
      opacity.stopAnimation();
      opacity.setValue(0.15);
      return;
    }
    // Evitar destello inicial al montar
    if (signalTick === firstTickRef.current) return;

    opacity.stopAnimation();
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.15,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [signalTick, active, opacity]);

  return (
    <View style={style} pointerEvents="none">
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: AppRed,
    shadowColor: AppRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
