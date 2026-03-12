import { IconButton } from "../IconButton";
import { AppRed } from "../../constants/Colors";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  ArrowBackIcon,
  SoundMaxIcon,
  SoundMuteIcon,
  FlashIcon,
  CameraIcon,
  VideoIcon,
} from "../Icons";
import React from "react";

export type CameraBarMode = "photo" | "video";

export interface CameraBarPhotoProps {
  mode: "photo";
  onBack: () => void;
  alarmEnabled: boolean;
  onAudioPress: () => void;
  flashEnabled: boolean;
  onFlashPress: () => void;
  onSwitchToPhotoMode?: () => void;
  onSwitchToVideoMode?: () => void;
  isProcessing?: boolean;
  /** Botón de tomar foto - se renderiza en el centro */
  captureButton: React.ReactNode;
}

export interface CameraBarVideoProps {
  mode: "video";
  onBack: () => void;
  alarmEnabled: boolean;
  onAudioPress: () => void;
  flashEnabled: boolean;
  onFlashPress: () => void;
  onSwitchToPhotoMode?: () => void;
  onSwitchToVideoMode?: () => void;
  /** Botón de grabar - se renderiza en el centro */
  recordButton: React.ReactNode;
  isRecording?: boolean;
}

export type CameraBarProps = CameraBarPhotoProps | CameraBarVideoProps;

export const CameraBar: React.FC<CameraBarProps> = (props) => {
  const { mode } = props;

  return (
    <>
      {/* Flash, captura y alternar modo - contenedor alineado (box-none para que el botón atrás reciba toques) */}
      <View style={styles.centerControlsContainer} pointerEvents="box-none">
        <IconButton
          icon={
            <FlashIcon
              size={28}
              color={AppRed}
              filled={props.flashEnabled}
            />
          }
          onPress={props.onFlashPress}
          style={styles.iconButtonSide}
        />
        <View style={styles.captureButtonWrapper}>
          {mode === "photo" ? props.captureButton : props.recordButton}
        </View>
        {mode === "photo" ? (
          <IconButton
            icon={<VideoIcon size={26} color={AppRed} />}
            onPress={props.onSwitchToVideoMode ?? (() => {})}
            disabled={!!props.isProcessing}
            style={styles.iconButtonSide}
          />
        ) : (
          <IconButton
            icon={<CameraIcon size={26} color={AppRed} />}
            onPress={props.onSwitchToPhotoMode ?? (() => {})}
            disabled={!!props.isRecording}
            style={styles.iconButtonSide}
          />
        )}
      </View>

      {/* Audio - derecha */}
      <View style={styles.rightButtonsContainer}>
        <View style={styles.audioButtonContainer}>
          <IconButton
            icon={
              props.alarmEnabled ? (
                <SoundMaxIcon size={28} color={AppRed} />
              ) : (
                <SoundMuteIcon size={28} color={AppRed} />
              )
            }
            onPress={props.onAudioPress}
          />
        </View>
      </View>

      {/* Botón atrás - renderizado al final para que quede encima y reciba toques */}
      <View style={styles.backButtonContainer}>
        <IconButton
          icon={<ArrowBackIcon size={28} color={AppRed} />}
          onPress={props.onBack}
          disabled={mode === "video" && props.isRecording}
        />
      </View>
    </>
  );
};

export interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export const CameraCaptureButton: React.FC<CaptureButtonProps> = ({
  onPress,
  disabled = false,
  isProcessing = false,
}) => (
  <TouchableOpacity
    style={styles.captureButton}
    onPress={onPress}
    disabled={disabled}
  >
    {isProcessing ? (
      <ActivityIndicator size="large" color="#fff" />
    ) : (
      <View style={styles.captureButtonInner} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  centerControlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    zIndex: 30,
    elevation: 30,
  },
  captureButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  rightButtonsContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    gap: 16,
    zIndex: 40,
    elevation: 40,
  },
  audioButtonContainer: {
    alignItems: "center",
  },
  iconButtonNoBackground: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: 0,
  },
  iconButtonSideBorder: {
    borderWidth: 2,
    borderColor: AppRed,
    borderRadius: 28,
  },
  iconButtonSide: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: 0,
    borderWidth: 2,
    borderColor: AppRed,
    borderRadius: 28,
  },
  headerContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 20,
    elevation: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerDate: {
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
});
