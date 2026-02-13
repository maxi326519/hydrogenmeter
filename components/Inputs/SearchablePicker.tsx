import { useState, useRef } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import Colors, { AppRed } from "@/constants/Colors";

interface Props {
  name: string;
  label?: string;
  value: string;
  options: { label: string | number; value: string | number }[];
  placeholder?: string;
  error?: string;
  style?: any;
  onChange: (name: any, value: any) => void;
  disabled?: boolean;
}

const SearchablePicker = ({
  name,
  label,
  value,
  options,
  placeholder,
  error,
  style,
  onChange,
  disabled,
}: Props) => {
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const selectedItem = options.find(
    (item) => item.value?.toString() === value?.toString()
  );
  const displayValue = selectedItem ? selectedItem.label : placeholder;

  const filteredItems = options.filter((item) =>
    item.label?.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  const handleOpenModal = () => {
    if (disabled) return;
    setShowModal(true);
    setSearchText("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSelectItem = (item: {
    label: string | number;
    value: string | number;
  }) => {
    onChange(name, item.value);
    setShowModal(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input que solo muestra el valor seleccionado */}
      <Pressable onPress={handleOpenModal}>
        <View
          style={[
            styles.input,
            error ? styles.inputError : null,
            disabled ? styles.disabled : null,
          ]}
          pointerEvents="none"
        >
          <TextInput
            placeholder={placeholder}
            value={displayValue?.toString()}
            editable={false}
          />
          <Text style={styles.inputArrow}>▼</Text>
        </View>
      </Pressable>

      {/* Modal con buscador y lista */}
      <Modal
        visible={showModal && !disabled}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        {/* Pressable para cerrar al tocar fuera */}
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          {/* Contenido del modal - evitar que se cierre al tocar aquí */}
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Campo de búsqueda dentro del modal */}
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Buscar..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />

            {/* Lista de resultados */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => item.value?.toString() + index}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleSelectItem(item)}
                >
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text>No se encontraron resultados</Text>
                </View>
              }
            />

            {/* Botón para cerrar */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    paddingLeft: 5,
    color: Colors.primary.low,
  },
  input: {
    display: "flex",
    marginTop: 5,
    paddingHorizontal: 15,
    padding: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "white",
  },
  inputArrow: {
    position: "absolute",
    right: 15,
    top: 15,
    color: Colors.primary.low,
  },
  inputError: {
    borderColor: "red",
  },
  disabled: {
    backgroundColor: "#8883",
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
    padding: 15,
    maxHeight: "80%",
  },
  searchInput: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 5,
    marginBottom: 10,
  },
  list: {
    flexGrow: 0,
    maxHeight: 300,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emptyList: {
    padding: 15,
    alignItems: "center",
  },
  closeButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: AppRed,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});

export default SearchablePicker;
