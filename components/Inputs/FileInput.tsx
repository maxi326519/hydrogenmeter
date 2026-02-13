import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
// import * as DocumentPicker from "expo-document-picker"; // Paquete no instalado
// import IconUpload from "../Icons/IconUpload"; // Componente no disponible
import Colors from "@/constants/Colors";

interface Props {
  children?: React.ReactNode;
  file?: File | null;
  label?: string;
  onChange: (file: File) => void;
}

export default function FileInput({ children, file, label, onChange }: Props) {
  const handleFilePick = async () => {
    // DocumentPicker no está disponible - funcionalidad deshabilitada
    console.warn("DocumentPicker no está disponible");
    // DocumentPicker.getDocumentAsync()
    //   .then((res) => {
    //     if (!res.canceled && res.assets[0]) {
    //       const asset = res.assets[0];
    //       const fileObj = ({
    //         uri: asset.uri,
    //         name: asset.name || "document",
    //         type: asset.mimeType || "application/octet-stream",
    //         size: asset.size || 0,
    //       } as unknown) as File;
    //       onChange(fileObj);
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Error picking document:", error);
    //   });
  };

  return (
    <View>
      {children ? (
        <TouchableOpacity onPress={handleFilePick}>{children}</TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            {
              borderColor: file ? "green" : Colors.primary.low,
              backgroundColor: file ? "#d4f5d411" : "#d0e7ff11",
            },
          ]}
          onPress={handleFilePick}
        >
          {!file ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Presione para subir un archivo
              </Text>
              <Text style={styles.iconPlaceholder}>📁</Text>
            </View>
          ) : (
            <View style={styles.fileState}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileInfoText}>Archivo seleccionado:</Text>
                <Text style={styles.fileName}>{file.name}</Text>
              </View>
              <View style={styles.changeFileContainer}>
                <Text style={styles.changeFileText}>
                  Presione para cambiar de archivo
                </Text>
                <Text style={styles.iconPlaceholderSmall}>📁</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    height: 200,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyStateText: {
    color: Colors.primary.low,
    marginTop: 10,
  },
  fileState: {
    alignItems: "center",
  },
  fileInfo: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfoText: {
    color: Colors.primary.low,
    fontSize: 14,
  },
  fileName: {
    color: Colors.primary.low,
    fontSize: 14,
    fontWeight: "bold",
  },
  changeFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    paddingTop: 0,
  },
  changeFileText: {
    color: "#89a",
  },
  label: {
    margin: 5,
    textAlign: "center",
    color: Colors.primary.low,
  },
  iconPlaceholder: {
    fontSize: 80,
  },
  iconPlaceholderSmall: {
    fontSize: 30,
  },
});
