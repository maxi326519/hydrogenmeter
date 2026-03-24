import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { AppRed } from "../constants/Colors";

/** TTF del sistema; Roboto-Regular suele existir en Android (Bold no en todos los OEM). */
function getDrawtextFontfile(): string {
  if (Platform.OS === "android") {
    return "/system/fonts/Roboto-Regular.ttf";
  }
  return "/System/Library/Fonts/Supplemental/Arial.ttf";
}

function appRedToFfmpegFontcolor(): string {
  const hex = AppRed.replace("#", "").toLowerCase();
  return `0x${hex}`;
}

const PPM_RANGE_MAX = 10000;
const BAR_TRACK_GRAY = "0x444444";

function ppmLabelToFillRatio(label: string): number {
  const n = parseFloat(label);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n / PPM_RANGE_MAX, 1);
}

/**
 * Barra de medición (como PpmRangeDisplay): track gris + relleno rojo por tramo de tiempo.
 * Va debajo del número grande; se dibuja antes que los drawtext del PPM para quedar detrás.
 */
function buildRangeBarFilters(data: VideoOverlayTimelineItem[]): string {
  const fillRed = appRedToFfmpegFontcolor();
  const barYExpr = "ih*0.667";
  const barH = 28;
  const parts: string[] = [
    `drawbox=x='iw*0.15':y='${barYExpr}':w='iw*0.7':h=${barH}:color=${BAR_TRACK_GRAY}:t=fill:enable='between(t,0,999999)'`,
  ];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const next = data[i + 1];
    const endTime = next ? next.time : 999999;
    const ratio = ppmLabelToFillRatio(item.value);
    if (ratio <= 0) continue;
    const wExpr = `iw*0.7*${ratio}`;
    parts.push(
      `drawbox=x='iw*0.15':y='${barYExpr}':w='${wExpr}':h=${barH}:color=${fillRed}:t=fill:enable='between(t,${item.time},${endTime})'`,
    );
  }
  return parts.join(",");
}

/** HH:mm:ss local. */
export function formatRecordingClockHms(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/** En drawtext, `:` separa opciones; hay que escapar para horas y otros textos. */
function escapeDrawtextText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");
}

/** Un drawtext por segundo: reloj que avanza (strftime en el filtro rompe fontfile en ffmpeg-kit). */
function buildClockDrawtextChain(
  recordingStartedAt: Date,
  durationSec: number,
  fontfile: string,
  fontcolor: string,
): string {
  const nSec = Math.max(1, Math.ceil(durationSec));
  const parts: string[] = [];
  for (let s = 0; s < nSec; s++) {
    const wall = new Date(recordingStartedAt.getTime() + s * 1000);
    const label = formatRecordingClockHms(wall);
    parts.push(
      `drawtext=fontfile=${fontfile}:` +
        `text='${escapeDrawtextText(label)}':x=40:y=112:fontsize=36:fontcolor=${fontcolor}:` +
        `enable='between(t,${s},${s + 1})'`,
    );
  }
  return parts.join(",");
}

export type VideoOverlayTimelineItem = {
  time: number;
  value: string;
};

/**
 * Hook para procesar videos con overlay dinámico (tal como lo definiste con FFmpegKit).
 */
export function useVideoOverlay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateDrawtextFilter = (
    data: VideoOverlayTimelineItem[],
    recordingStartedAt: Date | null,
    recordingDurationSec: number,
  ) => {
    const fontfile = getDrawtextFontfile();
    const fontcolor = appRedToFfmpegFontcolor();
    const brandDrawtext =
      `drawtext=fontfile=${fontfile}:` +
      `text='${escapeDrawtextText("Hydrogen Meter")}':x=40:y=58:fontsize=44:fontcolor=${fontcolor}:` +
      `enable='between(t,0,999999)'`;
    const clockDrawtext =
      recordingStartedAt !== null
        ? buildClockDrawtextChain(
            recordingStartedAt,
            recordingDurationSec,
            fontfile,
            fontcolor,
          )
        : null;
    const barFilters = buildRangeBarFilters(data);
    const ppmDrawtexts = data
      .map((item, index) => {
        const next = data[index + 1];
        const endTime = next ? next.time : 999999;

        return (
          `drawtext=fontfile=${fontfile}:` +
          `text='${escapeDrawtextText(item.value)}':x=(w-text_w)/2:y=h*0.78-text_h:fontsize=120:fontcolor=${fontcolor}:` +
          `enable='between(t,${item.time},${endTime})'`
        );
      })
      .join(",");
    const brandAndClock = clockDrawtext
      ? `${brandDrawtext},${clockDrawtext}`
      : brandDrawtext;
    const stack = [barFilters, ppmDrawtexts, brandAndClock].filter(Boolean);
    return stack.join(",");
  };

  const addOverlay = useCallback(
    async ({
      inputPath,
      outputPath,
      data,
      recordingStartedAt,
      recordingDurationSec = 0,
    }: {
      inputPath: string;
      outputPath: string;
      data: VideoOverlayTimelineItem[];
      /** Inicio de grabación (reloj que avanza segundo a segundo en el overlay). */
      recordingStartedAt?: Date | null;
      /** Duración del clip en s (p. ej. la que devuelve endOverlaySession). */
      recordingDurationSec?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const filter = generateDrawtextFilter(
          data,
          recordingStartedAt ?? null,
          recordingDurationSec,
        );

        const command = `-y -i ${inputPath} -vf "${filter}" -c:a copy ${outputPath}`;

        const session = await FFmpegKit.execute(command);
        const returnCode = await session.getReturnCode();

        if (!returnCode.isValueSuccess()) {
          const logs = await session.getLogsAsString();
          console.error("[useVideoOverlay] FFmpeg:", logs);
          throw new Error("FFmpeg falló al procesar el video");
        }

        return outputPath;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    addOverlay,
    loading,
    error,
  };
}
