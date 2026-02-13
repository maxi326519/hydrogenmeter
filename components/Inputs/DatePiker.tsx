import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Colors, { AppRed } from "@/constants/Colors";

interface DatePickerProps {
  value: string | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  label,
  placeholder = "--/--/----",
  disabled = false,
  error = "",
  onChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dateParts, setDateParts] = useState({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1),
    day: String(new Date().getDate()),
  });
  const [editMode, setEditMode] = useState<"day" | "month" | "year" | null>(
    null
  );
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-");
      setDateParts({ day, month, year });
    }
  }, [value]);

  const handleConfirm = () => {
    const { day, month, year } = dateParts;
    if (day && month && year) {
      onChange(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }
    setModalVisible(false);
    setEditMode(null);
  };

  const handleCancelEdit = () => {
    setEditMode(null);
  };

  const handleSaveEdit = (value: string, mode: string) => {
    const num = parseInt(value);
    if (isNaN(num)) {
      handleCancelEdit();
      return;
    }

    const newParts = { ...dateParts };
    switch (mode) {
      case "day":
        newParts.day = Math.min(31, Math.max(1, num)).toString();
        break;
      case "month":
        newParts.month = Math.min(12, Math.max(1, num)).toString();
        break;
      case "year":
        newParts.year = Math.max(1900, num).toString();
        break;
    }

    setDateParts(newParts);
  };

  const startEditing = (type: "day" | "month" | "year") => {
    setEditMode(type);
    setTempValue(dateParts[type]);
  };

  const changeValue = (field: "day" | "month" | "year", amount: number) => {
    const current = parseInt(dateParts[field]) || 0;
    let updated = current + amount;

    if (field === "day") updated = Math.min(31, Math.max(1, updated));
    if (field === "month") updated = Math.min(12, Math.max(1, updated));
    if (field === "year") updated = Math.max(1900, updated);

    setDateParts({ ...dateParts, [field]: updated.toString() });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable onPress={() => !disabled && setModalVisible(true)}>
        <TextInput
          style={[
            styles.input,
            disabled && styles.disabledInput,
            error ? styles.inputError : undefined,
          ]}
          value={
            value
              ? `${value.split("-")?.[2]?.padStart(2, "0")}/${value
                  .split("-")?.[1]
                  ?.padStart(2, "0")}/${value
                  .split("-")?.[0]
                  ?.padStart(2, "0")}`
              : placeholder
          }
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setEditMode(null);
          }}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selecciona la fecha</Text>

              {["year", "month", "day"].map((type) => (
                <View style={styles.controlsRow} key={type}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => changeValue(type as any, -1)}
                  >
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>

                  {editMode === type ? (
                    <TextInput
                      style={styles.editInput}
                      value={tempValue}
                      onChangeText={(text) => handleSaveEdit(text, type)}
                      keyboardType="numeric"
                      autoFocus
                      onSubmitEditing={() => {
                        setDateParts((prev) => ({
                          ...prev,
                          [type]: tempValue.padStart(
                            type === "year" ? 4 : 2,
                            "0"
                          ),
                        }));
                        setEditMode(null);
                      }}
                      onBlur={() => {
                        setDateParts((prev) => ({
                          ...prev,
                          [type]: tempValue.padStart(
                            type === "year" ? 4 : 2,
                            "0"
                          ),
                        }));
                        setEditMode(null);
                      }}
                      maxLength={type === "year" ? 4 : 2}
                    />
                  ) : (
                    <TouchableOpacity onPress={() => startEditing(type as any)}>
                      <Text style={styles.valueText}>
                        {dateParts[type as keyof typeof dateParts]?.padStart(
                          type === "year" ? 4 : 2,
                          "0"
                        )}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => changeValue(type as any, 1)}
                  >
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditMode(null);
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { marginBottom: 5, paddingLeft: 5, color: Colors.primary.low },
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "white",
  },
  inputError: { borderColor: "red", borderWidth: 1.5 },
  disabledInput: { backgroundColor: "#8883", opacity: 0.7 },
  errorText: { color: "red", marginTop: 5, marginLeft: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "white", borderRadius: 10 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: AppRed,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary.low,
    marginHorizontal: 5,
  },
  controlText: { fontSize: 20, color: Colors.primary.low },
  valueText: { width: 80, textAlign: "center", fontSize: 20 },
  editInput: {
    width: 80,
    height: 50,
    borderBottomWidth: 1,
    borderColor: Colors.primary.low,
    textAlign: "center",
    fontSize: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#ccc" },
  confirmButton: { backgroundColor: AppRed },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default DatePicker;
