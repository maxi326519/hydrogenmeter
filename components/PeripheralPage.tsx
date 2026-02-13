import { useState } from "react";
import { View, Text } from "react-native";
import styles from "@/assets/styles/styles";
import ParallaxScrollView from "./ParallaxScrollView";

// TODO: Implement Peripheral Mode

export default function PeripheralPage() {
  return (
    <>
      <ParallaxScrollView>
        <Text style={styles.textTitle}>Peripheral Mode</Text>
      </ParallaxScrollView>
    </>
  );
}
