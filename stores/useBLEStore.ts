import { create } from "zustand";
import { Device } from "react-native-ble-plx";
import { ConsoleEntry } from "../hooks/useBLE";

interface BLEState {
  // Estados principales
  connectedDevice: Device | null;
  hc06Device: Device | null;
  isLoading: boolean;
  autoConnectFailed: boolean;
  consoleData: ConsoleEntry[];
  gasPpm: number | null;
  bateria: number | null;
  showDisconnectAlert: boolean;
  
  // Estados internos (para refs)
  isConnecting: boolean;
  connectionSuccess: boolean;
  isScanning: boolean;
  savedDeviceId: string | null;
  ignoreDisconnection: boolean;

  // Actions
  setConnectedDevice: (device: Device | null) => void;
  setHc06Device: (device: Device | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAutoConnectFailed: (failed: boolean) => void;
  setConsoleData: (data: ConsoleEntry[]) => void;
  addConsoleMessage: (message: string) => void;
  setGasPpm: (ppm: number | null) => void;
  setBateria: (bateria: number | null) => void;
  setShowDisconnectAlert: (show: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setConnectionSuccess: (success: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
  setSavedDeviceId: (id: string | null) => void;
  setIgnoreDisconnection: (ignore: boolean) => void;
  clearConsole: () => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  // Estados iniciales
  connectedDevice: null,
  hc06Device: null,
  isLoading: true,
  autoConnectFailed: false,
  consoleData: [],
  gasPpm: null,
  bateria: null,
  showDisconnectAlert: false,
  isConnecting: false,
  connectionSuccess: false,
  isScanning: false,
  savedDeviceId: null,
  ignoreDisconnection: false,

  // Actions
  setConnectedDevice: (device) => set({ connectedDevice: device }),
  setHc06Device: (device) => set({ hc06Device: device }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAutoConnectFailed: (failed) => set({ autoConnectFailed: failed }),
  setConsoleData: (data) => set({ consoleData: data }),
  addConsoleMessage: (message) =>
    set((state) => ({
      consoleData: [
        ...state.consoleData,
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          data: message,
        },
      ],
    })),
  setGasPpm: (ppm) => set({ gasPpm: ppm }),
  setBateria: (bateria) => set({ bateria }),
  setShowDisconnectAlert: (show) => set({ showDisconnectAlert: show }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  setConnectionSuccess: (success) => set({ connectionSuccess: success }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setSavedDeviceId: (id) => set({ savedDeviceId: id }),
  setIgnoreDisconnection: (ignore) => set({ ignoreDisconnection: ignore }),
  clearConsole: () => set({ consoleData: [] }),
}));
