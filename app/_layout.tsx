import { AppRed } from "../constants/Colors";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

// Mantener solo el splash nativo (app.json) visible hasta que la app esté lista
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Carga mínima; el splash nativo se mantiene visible hasta hideAsync
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "#2d2d2d" },
      }}
    >
      <Stack.Screen
        options={{
          title: "Hydrogen Meter",
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
