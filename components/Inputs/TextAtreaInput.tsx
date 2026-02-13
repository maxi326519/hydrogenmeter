import { Text, TextInput, View, Platform, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

interface Props {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  disabled?: boolean;
  numberOfLines?: number;
  minHeight?: number;
}

export default function TextAreaInput({
  name,
  label,
  value,
  onChange,
  error,
  disabled,
  numberOfLines = 4,
  minHeight = 100,
}: Props) {
  const handleKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === "Enter") {
      onChange(name, value + "\n");
    }
  };

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
              minHeight: minHeight,
            },
          ]}
          placeholderTextColor={Colors.primary.low}
          onChangeText={(text) => onChange(name, text)}
          onKeyPress={handleKeyPress}
          editable={!disabled}
          multiline={true}
          numberOfLines={numberOfLines}
          scrollEnabled={true}
          blurOnSubmit={false} // Esto es crucial
          returnKeyType={Platform.OS === "ios" ? "default" : "none"} // Importante para Android
        />
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
    paddingRight: 10,
    textAlignVertical: "top",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
  },
});
