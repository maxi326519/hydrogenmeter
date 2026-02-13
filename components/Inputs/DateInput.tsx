import { Text, TextInput, View, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

interface Props {
  name: string;
  label?: string;
  value: Date;
  style?: any;
  placeholder?: string;
  error?: string;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
  isPassword?: boolean;
}

export default function DateInput({
  name,
  label,
  value,
  style,
  placeholder,
  error,
  onChange,
  disabled = true,
  isPassword = false,
}: Props) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          value={formatDate(value)}
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
          secureTextEntry={isPassword}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 8,
  },
  label: {
    paddingLeft: 5,
    color: Colors.primary.low,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 5,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'red',
  },
});

function formatDate(dateString: Date): string {
  const date = new Date(dateString);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${`0${day}`.slice(-2)} ${month} del ${year}`;
}
