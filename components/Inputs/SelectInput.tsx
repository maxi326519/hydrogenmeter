import { StyleProp, Text, View, StyleSheet, ViewStyle } from "react-native";
// import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils"; // No usado
// import { Picker } from "@react-native-picker/picker"; // Paquete no instalado
import Colors from "@/constants/Colors";

interface Props {
  name: string;
  label?: string;
  value: string;
  options: { label: string | number; value: string | number }[];
  placeholder?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}

export default function SelectInput({
  name,
  label,
  value,
  options,
  placeholder,
  error,
  style,
  onChange,
  disabled,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerPlaceholder}>
          {placeholder || "Picker no disponible - instalar @react-native-picker/picker"}
        </Text>
        {/* Picker deshabilitado - paquete no instalado
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onChange(name, itemValue)}
          enabled={!disabled}
        >
          <Picker.Item
            label={placeholder || "Seleccionar"}
            value=""
            enabled={false}
          />
          {options.map((option, index) => (
            <Picker.Item
              key={option.value.toString() + index.toString()}
              label={option.label.toString()}
              value={option.value}
            />
          ))}
        </Picker>
        */}
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
    gap: 10,
    minWidth: 200,
  },
  label: {
    paddingLeft: 5,
    color: Colors.primary.low,
  },
  pickerContainer: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'red',
  },
  pickerPlaceholder: {
    padding: 10,
    color: Colors.primary.low,
    textAlign: 'center',
  },
});
