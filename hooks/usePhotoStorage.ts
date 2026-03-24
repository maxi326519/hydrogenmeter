import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface PhotoRecord {
  id: string;
  imageUri: string; // URI local de la imagen guardada
  sensorValue: number | null;
  timestamp: string;
  location?: string; // Ubicación donde se tomó la foto
  originalImageUri?: string; // URI original de la foto capturada
}

const DATA_FILE = `${FileSystem.documentDirectory}photo_records.json`;
const IMAGES_DIR = `${FileSystem.documentDirectory}photos/`;

// Asegurar que el directorio de imágenes existe
const ensureImagesDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

export const usePhotoStorage = () => {
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar registros al iniciar
  useEffect(() => {
    loadRecords();
  }, []);

  // Cargar todos los registros desde el archivo JSON
  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const fileInfo = await FileSystem.getInfoAsync(DATA_FILE);
      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(DATA_FILE);
        if (fileContent) {
          const parsedRecords = JSON.parse(fileContent) as PhotoRecord[];
          setRecords(parsedRecords);
        } else {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar imagen en el sistema de archivos y en la galería del dispositivo
  const saveImageToDevice = async (imageUri: string, recordId: string): Promise<string> => {
    try {
      await ensureImagesDirectory();
      const fileName = `photo_${recordId}.jpg`;
      const newPath = `${IMAGES_DIR}${fileName}`;
      
      // Copiar la imagen al directorio permanente de la app
      await FileSystem.copyAsync({
        from: imageUri,
        to: newPath,
      });

      // Guardar también en la galería del dispositivo para acceso desde Fotos/Galería
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const uriForGallery = Platform.OS === 'android' && !newPath.startsWith('file://')
            ? `file://${newPath}`
            : newPath;
          await MediaLibrary.createAssetAsync(uriForGallery);
        }
      } catch (galleryError) {
        console.warn('No se pudo guardar en la galería:', galleryError);
        // No fallar el guardado: la foto queda guardada en la app
      }
      
      return newPath;
    } catch (error) {
      console.error('Error guardando imagen:', error);
      throw error;
    }
  };

  // Crear un nuevo registro
  const createRecord = async (
    imageUri: string,
    sensorValue: number | null,
    location?: string
  ): Promise<PhotoRecord> => {
    try {
      const recordId = Date.now().toString();
      const timestamp = new Date().toISOString();
      
      // Guardar la imagen en el dispositivo
      const savedImageUri = await saveImageToDevice(imageUri, recordId);
      
      const newRecord: PhotoRecord = {
        id: recordId,
        imageUri: savedImageUri,
        sensorValue,
        timestamp,
        location,
        originalImageUri: imageUri,
      };

      // Guardar en archivo JSON
      const updatedRecords = [newRecord, ...records];
      await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(updatedRecords));
      setRecords(updatedRecords);

      return newRecord;
    } catch (error) {
      console.error('Error creando registro:', error);
      throw error;
    }
  };

  // Leer un registro específico por ID
  const getRecord = useCallback(
    (id: string): PhotoRecord | undefined => {
      return records.find((record) => record.id === id);
    },
    [records]
  );

  // Leer todos los registros
  const getAllRecords = useCallback((): PhotoRecord[] => {
    return records;
  }, [records]);

  // Actualizar un registro
  const updateRecord = async (
    id: string,
    updates: Partial<Omit<PhotoRecord, 'id' | 'timestamp'>>
  ): Promise<PhotoRecord | null> => {
    try {
      const recordIndex = records.findIndex((record) => record.id === id);
      if (recordIndex === -1) {
        console.error('Registro no encontrado');
        return null;
      }

      const updatedRecord: PhotoRecord = {
        ...records[recordIndex],
        ...updates,
      };

      const updatedRecords = [...records];
      updatedRecords[recordIndex] = updatedRecord;

      await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(updatedRecords));
      setRecords(updatedRecords);

      return updatedRecord;
    } catch (error) {
      console.error('Error actualizando registro:', error);
      throw error;
    }
  };

  // Eliminar una imagen del sistema de archivos
  const deleteImageFile = async (imageUri: string): Promise<void> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      // No lanzar error para no interrumpir la eliminación del registro
    }
  };

  // Eliminar un registro
  const deleteRecord = async (id: string): Promise<boolean> => {
    try {
      const record = records.find((r) => r.id === id);
      if (!record) {
        console.error('Registro no encontrado');
        return false;
      }

      // Eliminar la imagen del sistema de archivos
      await deleteImageFile(record.imageUri);

      // Eliminar el registro del archivo JSON
      const updatedRecords = records.filter((r) => r.id !== id);
      await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(updatedRecords));
      setRecords(updatedRecords);

      return true;
    } catch (error) {
      console.error('Error eliminando registro:', error);
      throw error;
    }
  };

  // Eliminar todos los registros
  const deleteAllRecords = async (): Promise<void> => {
    try {
      // Eliminar todas las imágenes
      for (const record of records) {
        await deleteImageFile(record.imageUri);
      }

      // Eliminar el directorio de imágenes si está vacío
      try {
        await FileSystem.deleteAsync(IMAGES_DIR, { idempotent: true });
      } catch (error) {
        // Ignorar error si el directorio no está vacío o no existe
      }

      // Eliminar el archivo de datos
      const fileInfo = await FileSystem.getInfoAsync(DATA_FILE);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(DATA_FILE, { idempotent: true });
      }
      setRecords([]);
    } catch (error) {
      console.error('Error eliminando todos los registros:', error);
      throw error;
    }
  };

  // Verificar si una imagen existe
  const imageExists = async (imageUri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      return fileInfo.exists;
    } catch (error) {
      return false;
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
    deleteAllRecords,
    loadRecords,
    imageExists,
  };
};
