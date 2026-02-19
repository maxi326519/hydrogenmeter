import { useBLE } from "./useBLE";
import { useBLEMock } from "./useBLEMock";
import { MOCK_BLE_ENABLED } from "../constants/mockBLE";

/**
 * Devuelve useBLE (real) o useBLEMock (simulado) según MOCK_BLE_ENABLED.
 * Usar este hook en lugar de useBLE para poder alternar entre dispositivo real y mock.
 */
export function useBLEOrMock() {
  const real = useBLE();
  const mock = useBLEMock();
  return MOCK_BLE_ENABLED ? mock : real;
}
