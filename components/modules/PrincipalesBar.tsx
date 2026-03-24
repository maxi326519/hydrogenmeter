import { View, StyleSheet } from "react-native";
import { IconButton } from "../IconButton";
import { AppRed } from "../../constants/Colors";
import {
  BluetoothSlashIcon,
  CameraIcon,
  VideoIcon,
  FolderIcon,
  SoundMaxIcon,
  SoundMuteIcon,
  SettingsIcon,
} from "../Icons";
import React from "react";

export interface PrincipalesBarProps {
  connectedDevice: boolean;
  alarmEnabled: boolean;
  onDisconnect: () => void;
  onCameraPress: () => void;
  onVideoPress: () => void;
  onFilesPress: () => void;
  onAudioPress: () => void;
  onConfigPress: () => void;
  disabled?: boolean;
  /** Mostrar botón Config/Logs (solo en dev) */
  showConfig?: boolean;
}

export const PrincipalesBar: React.FC<PrincipalesBarProps> = ({
  connectedDevice,
  alarmEnabled,
  onDisconnect,
  onCameraPress,
  onVideoPress,
  onFilesPress,
  onAudioPress,
  onConfigPress,
  disabled = false,
  showConfig = __DEV__,
}) => {
  return (
    <>
      {showConfig && (
        <View style={styles.logButtonContainer}>
          <IconButton
            icon={<SettingsIcon size={28} color={AppRed} />}
            onPress={onConfigPress}
          />
        </View>
      )}

      <View style={styles.iconButtonsContainer}>
        {connectedDevice && (
          <IconButton
            icon={<BluetoothSlashIcon size={28} color={AppRed} />}
            onPress={onDisconnect}
          />
        )}
        <IconButton
          icon={<CameraIcon size={28} color={AppRed} />}
          onPress={onCameraPress}
          disabled={disabled}
        />
        <IconButton
          icon={<VideoIcon size={28} color={AppRed} />}
          onPress={onVideoPress}
          disabled={disabled}
        />
        <IconButton
          icon={<FolderIcon size={28} color={AppRed} />}
          onPress={onFilesPress}
        />
        <IconButton
          icon={
            alarmEnabled ? (
              <SoundMaxIcon size={28} color={AppRed} />
            ) : (
              <SoundMuteIcon size={28} color={AppRed} />
            )
          }
          onPress={onAudioPress}
          disabled={disabled}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  logButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  iconButtonsContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
});
