import { useRef, useCallback } from "react";
import { Audio } from "expo-av";

const BEEP_SOURCE = require("../assets/sounds/beep.wav");

/**
 * Hook para reproducir un pitido. Carga el sonido una vez y lo reproduce bajo demanda.
 */
export function useBeepSound() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingRef = useRef(false);

  const playBeep = useCallback(async () => {
    try {
      if (isLoadingRef.current) return;

      if (!soundRef.current) {
        isLoadingRef.current = true;
        const { sound } = await Audio.Sound.createAsync(BEEP_SOURCE);
        soundRef.current = sound;
        await sound.playAsync();
        await sound.setPositionAsync(0);
        isLoadingRef.current = false;
      } else {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.log("Error reproduciendo pitido:", error);
      isLoadingRef.current = false;
    }
  }, []);

  return { playBeep };
}
