import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import Colors, { AppRed } from "@/constants/Colors";
// import ButtonPrimary from "../Buttons/ButtonPrimary"; // Componente no disponible, usando Button nativo

interface CameraInputProps {
  imageUri?: string;
  setImageUri: (imgUrl: string) => void;
}

export default function CameraInput({
  imageUri,
  setImageUri,
}: CameraInputProps) {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: true,
        });
        if (photo) setCapturedPhoto(photo.uri);
      } catch (error) {
        Alert.alert("Error", "No se pudo tomar la foto");
        console.error("Error taking picture:", error);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const acceptPhoto = () => {
    if (capturedPhoto) {
      setImageUri(capturedPhoto);
      setCameraVisible(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  return (
    <View style={buttonStyles.photoSection}>
      <Text style={buttonStyles.photoLabel}>Foto del comprobante</Text>
      <View style={buttonStyles.photoPreviewContainer}>
        <Image source={{ uri: imageUri }} style={buttonStyles.photoPreview} />
        <View style={buttonStyles.photoButtons}>
          {!permission.granted ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                Necesitamos permiso para acceder a tu cámara
              </Text>
              <Button
                onPress={() => requestPermission()}
                title="Conceder permiso"
                color={AppRed}
              />
            </View>
          ) : (
            <Button
              title={imageUri ? "Tomar otra foto" : "Tomar foto del comprobante"}
              onPress={() => setCameraVisible(true)}
              color={AppRed}
            />
          )}
        </View>
      </View>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        {capturedPhoto ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedPhoto }}
              style={styles.previewImage}
            />
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retakeButton]}
                onPress={retakePhoto}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
                <Text style={styles.actionButtonText}>Volver a tomar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={acceptPhoto}
              >
                <Ionicons name="checkmark" size={24} color="white" />
                <Text style={styles.actionButtonText}>Aceptar foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            <View style={styles.topButtons}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCameraVisible(false)}
              >
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.flipButton} />
            </View>
          </CameraView>
        )}
      </Modal>
    </View>
  );
}

const buttonStyles = StyleSheet.create({
  photoSection: {
  },
  photoLabel: {
    fontSize: 15,
    marginLeft: 6,
    marginBottom: 8,
    color: Colors.primary.low,
  },
  photoPreviewContainer: {
    alignItems: "center",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: "contain",
    backgroundColor: Colors.primary.low,
  },
  photoButtons: {
    position: "absolute",
    bottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  photoButton: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary.low,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  camera: {
    flex: 1,
  },
  topButtons: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  flipButton: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  previewButtons: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retakeButton: {
    backgroundColor: AppRed,
  },
  acceptButton: {
    backgroundColor: AppRed,
  },
  actionButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
  },
});
