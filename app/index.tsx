import { useState } from "react";
import { View } from "react-native";
import MainPage from "../components/MainPage";
import styles from "../assets/styles/styles";

export default function Index() {
  // Choose mode
  const [mode, setMode] = useState<"central" | "peripheral" | "start">("start");
  return (
    // TODO: Uncomment the following code to enable the mode selection
    // <View style={styles.containerScreen}>
    //   <Button title="Central Mode" onPress={() => setMode("central")} />
    //   <Button title="Peripheral Mode" onPress={() => setMode("peripheral")} />
    //   {mode == "central" ? <MainPage /> : <PeripheralPage />}
    // </View>
    <View style={styles.containerScreen}>
      <MainPage />
    </View>
  );
} 
