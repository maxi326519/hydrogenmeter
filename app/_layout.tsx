import { AppRed } from "../constants/Colors";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
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
