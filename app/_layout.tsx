import { useKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";
import { AppRed } from "../constants/Colors";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useKeepAwake();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
