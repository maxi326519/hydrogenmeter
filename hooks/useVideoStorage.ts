import { useState, useEffect, useCallback } from "react";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export interface VideoRecord {
  id: string;
  videoUri: string;
  sensorValue: number | null;
  timestamp: string;
  location?: string;
}

const DATA_FILE = `${FileSystem.documentDirectory}video_records.json`;
const VIDEOS_DIR = `${FileSystem.documentDirectory}videos/`;

const ensureVideosDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(VIDEOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VIDEOS_DIR, { intermediates: true });
  }
};

export const useVideoStorage = () => {
  const [records, setRecords] = useState<VideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const fileInfo = await FileSystem.getInfoAsync(DATA_FILE);
      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(DATA_FILE);
        if (fileContent) {
          const parsedRecords = JSON.parse(fileContent) as VideoRecord[];
          setRecords(parsedRecords);
        } else {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error cargando registros de video:", error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVideoToDevice = async (
    sourceUri: string,
    recordId: string
  ): Promise<string> => {
    try {
      await ensureVideosDirectory();
      const fileName = `video_${recordId}.mp4`;
      const newPath = `${VIDEOS_DIR}${fileName}`;

      // Asegurar formato URI válido para FileSystem (file:// en Android)
      const fromUri = sourceUri.startsWith("file://") ? sourceUri : `file://${sourceUri}`;

      await FileSystem.copyAsync({
        from: fromUri,
        to: newPath,
      });

      // Guardar también en la galería del dispositivo para acceso desde Fotos/Galería
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          const uriForGallery =
            Platform.OS === "android" && !newPath.startsWith("file://")
              ? `file://${newPath}`
              : newPath;
          await MediaLibrary.createAssetAsync(uriForGallery);
        }
      } catch (galleryError) {
        console.warn("No se pudo guardar el video en la galería:", galleryError);
        // No fallar el guardado: el video queda guardado en la app
      }

      return newPath;
    } catch (error) {
      console.error("Error guardando video:", error);
      throw error;
    }
  };

  const createRecord = async (
    videoUri: string,
    sensorValue: number | null,
    location?: string
  ): Promise<VideoRecord> => {
    try {
      const recordId = Date.now().toString();
      const timestamp = new Date().toISOString();

      const savedVideoUri = await saveVideoToDevice(videoUri, recordId);

      const newRecord: VideoRecord = {
        id: recordId,
        videoUri: savedVideoUri,
        sensorValue,
        timestamp,
        location,
      };

      const updatedRecords = [newRecord, ...records];
      await FileSystem.writeAsStringAsync(
        DATA_FILE,
        JSON.stringify(updatedRecords)
      );
      setRecords(updatedRecords);

      return newRecord;
    } catch (error) {
      console.error("Error creando registro de video:", error);
      throw error;
    }
  };

  const getRecord = useCallback(
    (id: string): VideoRecord | undefined => {
      return records.find((record) => record.id === id);
    },
    [records]
  );

  const getAllRecords = useCallback((): VideoRecord[] => {
    return records;
  }, [records]);

  const updateRecord = async (
    id: string,
    updates: Partial<Omit<VideoRecord, "id" | "timestamp">>
  ): Promise<VideoRecord | null> => {
    try {
      const recordIndex = records.findIndex((record) => record.id === id);
      if (recordIndex === -1) return null;

      const updatedRecord = { ...records[recordIndex], ...updates };
      const updatedRecords = [...records];
      updatedRecords[recordIndex] = updatedRecord;

      await FileSystem.writeAsStringAsync(
        DATA_FILE,
        JSON.stringify(updatedRecords)
      );
      setRecords(updatedRecords);

      return updatedRecord;
    } catch (error) {
      console.error("Error actualizando registro de video:", error);
      return null;
    }
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    try {
      const record = records.find((r) => r.id === id);
      if (!record) return false;

      const fileInfo = await FileSystem.getInfoAsync(record.videoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(record.videoUri, { idempotent: true });
      }

      const updatedRecords = records.filter((r) => r.id !== id);
      await FileSystem.writeAsStringAsync(
        DATA_FILE,
        JSON.stringify(updatedRecords)
      );
      setRecords(updatedRecords);

      return true;
    } catch (error) {
      console.error("Error eliminando registro de video:", error);
      throw error;
    }
  };

  return {
    records,
    isLoading,
    createRecord,
    getRecord,
    getAllRecords,
    updateRecord,
    deleteRecord,
    loadRecords,
  };
};
