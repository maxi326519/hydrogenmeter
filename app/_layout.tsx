import { AppRed } from "../constants/Colors";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const { width } = Dimensions.get("window");

// Mantener el splash screen visible mientras cargamos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simular carga inicial
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={splashStyles.container}>
        <Image
          source={require("../assets/images/logo.png")}
          style={splashStyles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        options={{
          title: "Hydrogenmeter",
          headerStyle: {
            backgroundColor: AppRed,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            color: "#fff",
          },
        }}
        name="index"
      />
    </Stack>
  );
}

const splashStyles = StyleSheet.create({
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
