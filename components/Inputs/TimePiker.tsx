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
import Colors from "@/constants/Colors";

interface TimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = "--:--",
  disabled = false,
  label,
  error = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [localTime, setLocalTime] = useState(value);
  const [editMode, setEditMode] = useState<"hour" | "minute" | null>(null);
  const [tempValue, setTempValue] = useState("");

  // Actualizar el valor local cuando cambia el prop
  useEffect(() => {
    setLocalTime(value || new Date());
  }, [value]);

  const formatDisplay = () => {
    if (!value) return placeholder;

    return value.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleConfirm = () => {
    if (localTime) {
      onChange(localTime);
      setModalVisible(false);
      setEditMode(null);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(null);
  };

  const handleSaveEdit = () => {
    const numValue = parseInt(tempValue);
    if (isNaN(numValue)) {
      handleCancelEdit();
      return;
    }

    const newTime = localTime ? new Date(localTime) : new Date();

    switch (editMode) {
      case "hour":
        newTime.setHours(Math.min(23, Math.max(0, numValue)));
        break;
      case "minute":
        newTime.setMinutes(Math.min(59, Math.max(0, numValue)));
        break;
    }

    setLocalTime(newTime);
    setEditMode(null);
  };

  const startEditing = (type: "hour" | "minute") => {
    setEditMode(type);
    switch (type) {
      case "hour":
        setTempValue((localTime || new Date()).getHours().toString());
        break;
      case "minute":
        setTempValue((localTime || new Date()).getMinutes().toString());
        break;
    }
  };

  const changeHour = (amount: number) => {
    const newTime = new Date(localTime || new Date());
    newTime.setHours(newTime.getHours() + amount);
    setLocalTime(newTime);
  };

  const changeMinute = (amount: number) => {
    const newTime = new Date(localTime || new Date());
    newTime.setMinutes(newTime.getMinutes() + amount);
    setLocalTime(newTime);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        style={disabled ? styles.disabledInput : null}
      >
        <TextInput
          style={[
            styles.input,
            disabled && styles.disabledInput,
            error && styles.inputError,
          ]}
          value={formatDisplay()}
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(null);
        }}
      >
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
              <Text style={styles.sectionTitle}>Hora</Text>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeHour(-1)}
                >
                  <Text style={styles.controlText}>-</Text>
                </TouchableOpacity>

                {editMode === "hour" ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      keyboardType="numeric"
                      autoFocus
                      onSubmitEditing={handleSaveEdit}
                      onBlur={handleCancelEdit}
                      maxLength={2}
                    />
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startEditing("hour")}>
                    <Text style={styles.valueText}>
                      {localTime
                        ? localTime.getHours().toString().padStart(2, "0")
                        : "--:--"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeHour(1)}
                >
                  <Text style={styles.controlText}>+</Text>
                </TouchableOpacity>

                <Text style={styles.timeSeparator}>:</Text>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeMinute(-1)}
                >
                  <Text style={styles.controlText}>-</Text>
                </TouchableOpacity>

                {editMode === "minute" ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      keyboardType="numeric"
                      autoFocus
                      onSubmitEditing={handleSaveEdit}
                      onBlur={handleCancelEdit}
                      maxLength={2}
                    />
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startEditing("minute")}>
                    <Text style={styles.valueText}>
                      {localTime
                        ? localTime.getMinutes().toString().padStart(2, "0")
                        : "--:--"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => changeMinute(1)}
                >
                  <Text style={styles.controlText}>+</Text>
                </TouchableOpacity>
              </View>
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
  container: {
    marginVertical: 10,
  },
  label: {
    marginBottom: 5,
    paddingLeft: 5,
    color: Colors.primary.low,
  },
  labelError: {
    color: "red",
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1.5,
  },
  disabledInput: {
    backgroundColor: "#8883",
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "80%",
  },
  section: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.primary.normal,
    textAlign: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 10,
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
  controlText: {
    fontSize: 20,
    color: Colors.primary.low,
  },
  valueText: {
    width: 50,
    height: 40,
    fontSize: 24,
    textAlign: "center",
    textAlignVertical: "center",
  },
  editContainer: {
    width: 50,
    alignItems: "center",
  },
  editInput: {
    fontSize: 24,
    borderWidth: 1,
    borderColor: Colors.primary.normal,
    borderRadius: 5,
    padding: 8,
    width: "100%",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 10,
  },
  confirmButton: {
    backgroundColor: Colors.primary.normal,
    borderBottomRightRadius: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
  },
});

export default TimePicker;
