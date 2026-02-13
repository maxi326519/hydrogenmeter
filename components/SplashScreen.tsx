import { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { AppRed } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

// Mantener el splash screen visible mientras cargamos
SplashScreen.preventAutoHideAsync();

interface CustomSplashProps {
  onFinish: () => void;
}

export default function CustomSplash({ onFinish }: CustomSplashProps) {
  useEffect(() => {
    // Ocultar el splash screen nativo después de un breve delay
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
      onFinish();
    }, 2000); // 2 segundos

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppRed,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.4, // 40% del ancho de la pantalla (ajustable)
    height: width * 0.4, // Mantener proporción cuadrada
    maxWidth: 200, // Tamaño máximo
    maxHeight: 200,
  },
});
