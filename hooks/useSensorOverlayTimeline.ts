import { useCallback, useEffect, useRef } from "react";
import type { VideoOverlayTimelineItem } from "./useVideoOverlay";

export function defaultPpmOverlayLabel(sensorValue: number | null): string {
  if (sensorValue === null || Number.isNaN(sensorValue)) return "--";
  return String(Math.round(sensorValue));
}

type FormatSensor = (value: number | null) => string;

/**
 * Construye la línea de tiempo para FFmpeg drawtext: un punto cada vez que
 * cambia el valor del sensor (sin muestreo periódico). El tiempo es segundos
 * desde beginSession() (alineado con el reloj real).
 */
export function useSensorOverlayTimeline(
  isRecording: boolean,
  sensorValue: number | null,
  formatValue: FormatSensor = defaultPpmOverlayLabel,
) {
  const sessionStartedAtMsRef = useRef(0);
  const timelineRef = useRef<VideoOverlayTimelineItem[]>([]);

  useEffect(() => {
    if (!isRecording || sessionStartedAtMsRef.current === 0) return;
    const elapsedSec =
      (Date.now() - sessionStartedAtMsRef.current) / 1000;
    const val = formatValue(sensorValue);
    const last = timelineRef.current[timelineRef.current.length - 1];
    if (last?.value === val) return;
    timelineRef.current.push({
      time: Number(elapsedSec.toFixed(2)),
      value: val,
    });
  }, [sensorValue, isRecording, formatValue]);

  const beginSession = useCallback(
    (initialSensorValue: number | null) => {
      sessionStartedAtMsRef.current = Date.now();
      timelineRef.current = [
        { time: 0, value: formatValue(initialSensorValue) },
      ];
    },
    [formatValue],
  );

  const getElapsedSeconds = useCallback(() => {
    if (sessionStartedAtMsRef.current === 0) return 0;
    return (Date.now() - sessionStartedAtMsRef.current) / 1000;
  }, []);

  const endSession = useCallback(
    (lastSensorValue: number | null) => {
      const durationSec =
        sessionStartedAtMsRef.current > 0
          ? (Date.now() - sessionStartedAtMsRef.current) / 1000
          : 0;
      const finalLabel = formatValue(lastSensorValue);
      let overlayTimeline = [...timelineRef.current];
      const lastPt = overlayTimeline[overlayTimeline.length - 1];
      const tEnd = Number(durationSec.toFixed(2));
      if (lastPt && lastPt.time === tEnd) {
        overlayTimeline[overlayTimeline.length - 1] = {
          time: tEnd,
          value: finalLabel,
        };
      } else if (
        !lastPt ||
        lastPt.time < tEnd - 0.001 ||
        lastPt.value !== finalLabel
      ) {
        overlayTimeline.push({ time: tEnd, value: finalLabel });
      }

      sessionStartedAtMsRef.current = 0;
      timelineRef.current = [];

      return {
        durationSec,
        overlayData:
          overlayTimeline.length > 0
            ? overlayTimeline
            : [{ time: 0, value: finalLabel }],
      };
    },
    [formatValue],
  );

  const abortSession = useCallback(() => {
    sessionStartedAtMsRef.current = 0;
    timelineRef.current = [];
  }, []);

  return {
    beginSession,
    endSession,
    getElapsedSeconds,
    abortSession,
  };
}
