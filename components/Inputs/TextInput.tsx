import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  TextStyle,
  StyleProp,
  StyleSheet,
} from "react-native";
import Colors from "@/constants/Colors";

interface Props {
  name: string;
  label?: string;
  value: string;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
  error?: string;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
  isPassword?: boolean;
}

export default function Input({
  name,
  label,
  value,
  style,
  placeholder,
  error,
  onChange,
  disabled = false,
  isPassword = false,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          style={[
            styles.input,
            {
              borderColor: error ? "red" : "#eee",
              backgroundColor: disabled
                ? "#8883"
                : error
                ? "#f001"
                : "transparent",
              paddingRight: isPassword ? 40 : 10,
            },
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.primary.low}
          onChangeText={(text) => onChange(name, text)}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? "Ocultar" : "Ver"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 8,
    paddingVertical: 8,
  },
  label: {
    paddingLeft: 5,
    color: Colors.primary.low,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 5,
    borderWidth: 1,
  },
  passwordToggle: {
    position: "absolute",
    right: 0,
    top: 12,
    justifyContent: "center",
    height: "100%",
    padding: 10,
    width: 90,
    paddingHorizontal: 20,
    transform: [{ translateY: -12 }],
  },
  passwordToggleText: {
    color: Colors.primary.low,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    color: "red",
  },
});
