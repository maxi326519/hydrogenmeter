import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import * as FileSystem from "expo-file-system";
import { AppRed } from "../constants/Colors";

/** TTF del sistema; Roboto-Regular suele existir en Android (Bold no en todos los OEM). */
function getDrawtextFontfile(): string {
  if (Platform.OS === "android") {
    return "/system/fonts/Roboto-Regular.ttf";
  }
  return "/System/Library/Fonts/Supplemental/Arial.ttf";
}

function getSubtitlesFontsdir(): string {
  if (Platform.OS === "android") {
    return "/system/fonts";
  }
  return "/System/Library/Fonts/Supplemental";
}

/** Ruta absoluta sin `file://` para FFmpeg nativo. */
function toFfmpegFilesystemPath(uriOrPath: string): string {
  const t = uriOrPath.trim();
  return t.startsWith("file://") ? t.replace(/^file:\/\//, "") : t;
}

function appRedToFfmpegFontcolor(): string {
  const hex = AppRed.replace("#", "").toLowerCase();
  return `0x${hex}`;
}

/** ASS PrimaryColour &H00BBGGRR (alpha + blue + green + red). */
function appRedToAssPrimaryColour(): string {
  const hex = AppRed.replace("#", "").toLowerCase();
  const r = hex.slice(0, 2);
  const g = hex.slice(2, 4);
  const b = hex.slice(4, 6);
  return `&H00${b}${g}${r}`;
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
  /** Fracción de la altura: más alto = más abajo en pantalla. */
  const barYExpr = "ih*0.71";
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

/** Tiempo ASS (H:MM:SS.cc). */
function formatAssTime(t: number): string {
  const clamped = Math.max(0, t);
  const c = Math.round((clamped % 1) * 100);
  const totalSec = Math.floor(clamped);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad2(m)}:${pad2(s)}.${String(c).padStart(2, "0")}`;
}

/** Escapa texto en campo Dialogue ASS (llaves y barras). */
function escapeAssDialogueText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}");
}

/**
 * Un único filtro `subtitles` con reloj por segundo (archivo ASS), en lugar de cientos de
 * `drawtext` encadenados: en móvil eso hacía que FFmpeg tardara una eternidad o pareciera colgado.
 */
async function writeClockAssFile(
  recordingStartedAt: Date,
  durationSec: number,
): Promise<string> {
  const baseDir = FileSystem.cacheDirectory;
  if (!baseDir) {
    throw new Error("Sin directorio de caché para subtítulos del reloj");
  }
  const outUri = `${baseDir}overlay_clock_${Date.now()}.ass`;
  const safeDur = Number.isFinite(durationSec) ? Math.max(durationSec, 0.05) : 0.05;
  const n = Math.max(1, Math.ceil(safeDur));
  const primary = appRedToAssPrimaryColour();
  const clockFont = Platform.OS === "android" ? "Roboto" : "Arial";
  // Sin PlayRes, libass asume resolución antigua y escala mal → texto gigante y mal posicionado.
  // App en portrait; el vídeo suele ser 1080×1920 (ancho×alto).
  const header =
    "[Script Info]\n" +
    "ScriptType: v4.00+\n" +
    "WrapStyle: 0\n" +
    "PlayResX: 1080\n" +
    "PlayResY: 1920\n" +
    "\n" +
    "[V4+ Styles]\n" +
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n" +
    `Style: Clock,${clockFont},44,${primary},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,1,7,0,0,0,0\n` +
    "\n" +
    "[Events]\n" +
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

  let events = "";
  for (let sec = 0; sec < n; sec++) {
    const t0 = sec;
    const t1 = Math.min(sec + 1, safeDur);
    const wall = new Date(recordingStartedAt.getTime() + sec * 1000);
    const label = escapeAssDialogueText(formatRecordingClockHms(wall));
    // \an7 = anclar arriba-izquierda; debajo de "Hydrogen Meter" (drawtext y≈58, fontsize 44).
    events +=
      `Dialogue: 0,${formatAssTime(t0)},${formatAssTime(t1)},Clock,,0,0,0,,{\\an7\\fs44\\pos(40,118)}${label}\n`;
  }

  await FileSystem.writeAsStringAsync(outUri, header + events);
  return outUri;
}

/** En drawtext, `:` separa opciones; hay que escapar para horas y otros textos. */
function escapeDrawtextText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");
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
    clockAssFsPath: string | null,
  ) => {
    const fontfile = getDrawtextFontfile();
    const fontcolor = appRedToFfmpegFontcolor();
    const brandDrawtext =
      `drawtext=fontfile=${fontfile}:` +
      `text='${escapeDrawtextText("Hydrogen Meter")}':x=40:y=58:fontsize=44:fontcolor=${fontcolor}:` +
      `enable='between(t,0,999999)'`;
    const barFilters = buildRangeBarFilters(data);
    const ppmDrawtexts = data
      .map((item, index) => {
        const next = data[index + 1];
        const endTime = next ? next.time : 999999;

        return (
          `drawtext=fontfile=${fontfile}:` +
          `text='${escapeDrawtextText(item.value)}':x=(w-text_w)/2:y=h*0.83-text_h:fontsize=120:fontcolor=${fontcolor}:` +
          `enable='between(t,${item.time},${endTime})'`
        );
      })
      .join(",");
    const fontsdir = getSubtitlesFontsdir();
    const clockFilter =
      recordingStartedAt !== null && clockAssFsPath
        ? `subtitles=${clockAssFsPath}:fontsdir=${fontsdir}`
        : null;
    const stack = [barFilters, ppmDrawtexts, brandDrawtext, clockFilter].filter(Boolean);
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
      let clockAssUri: string | null = null;
      try {
        setLoading(true);
        setError(null);

        let clockAssFsPath: string | null = null;
        if (recordingStartedAt != null) {
          clockAssUri = await writeClockAssFile(
            recordingStartedAt,
            recordingDurationSec,
          );
          clockAssFsPath = toFfmpegFilesystemPath(clockAssUri);
        }

        const filter = generateDrawtextFilter(
          data,
          recordingStartedAt ?? null,
          clockAssFsPath,
        );

        const inputFs = toFfmpegFilesystemPath(inputPath);
        const outputFs = toFfmpegFilesystemPath(outputPath);

        // veryfast: en móvil `medium` + 1080p puede tardar órdenes de magnitud > tiempo real.
        // -nostdin evita que FFmpeg espere entrada en stdin en algunos builds.
        const videoEncode =
          "-c:v libx264 -crf 22 -preset veryfast -pix_fmt yuv420p -movflags +faststart -threads 0";
        // Sin -an: el audio del vídeo se copia al salida (misma pista; vídeo se recompila por -vf).
        const command = `-y -nostdin -i ${inputFs} -vf "${filter}" ${videoEncode} -c:a copy ${outputFs}`;

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
        if (clockAssUri) {
          FileSystem.deleteAsync(clockAssUri, { idempotent: true }).catch(() => {});
        }
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
