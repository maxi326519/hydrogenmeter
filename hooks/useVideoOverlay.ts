import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { FFmpegKit } from "ffmpeg-kit-react-native";

/** drawtext en Android no resuelve "Sans" sin fontconfig accesible; hay que pasar TTF del sistema. */
function getDrawtextFontfile(): string {
  if (Platform.OS === "android") {
    return "/system/fonts/Roboto-Regular.ttf";
  }
  return "/System/Library/Fonts/Supplemental/Arial.ttf";
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

  const generateDrawtextFilter = (data: VideoOverlayTimelineItem[]) => {
    const fontfile = getDrawtextFontfile();
    return data
      .map((item, index) => {
        const next = data[index + 1];
        const endTime = next ? next.time : item.time + 1;

        return (
          `drawtext=fontfile=${fontfile}:` +
          `text='${item.value}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=44:fontcolor=0x00FF00:enable='between(t,${item.time},${endTime})'`
        );
      })
      .join(",");
  };

  const addOverlay = useCallback(
    async ({
      inputPath,
      outputPath,
      data,
    }: {
      inputPath: string;
      outputPath: string;
      data: VideoOverlayTimelineItem[];
    }) => {
      try {
        setLoading(true);
        setError(null);

        const filter = generateDrawtextFilter(data);

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
