# Hydrogen Meter

Proyecto que demuestra el uso de **Bluetooth Low Energy (BLE)** con React Native y Expo.

- React Native
- Java
- Android / iOS
- BLE (Bluetooth Low Energy)
- Expo

**Referencias:**

- Video: https://youtu.be/NkNMT-esVKY
- Repositorio de referencia: [dotintent/react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- Tutorial Expo BLE: [expo.dev/blog/how-to-build-a-bluetooth-low-energy-powered-expo-app](https://expo.dev/blog/how-to-build-a-bluetooth-low-energy-powered-expo-app)

---

## Requisitos para desarrollo

### Requisitos obligatorios

| Requisito | Descripción |
|-----------|-------------|
| **Node.js** | Versión 18.x o 20.x (LTS). Verificar con `node -v`. |
| **npm** | Incluido con Node.js. Verificar con `npm -v`. |

### Requisitos por plataforma

| Plataforma | Requisitos adicionales |
|------------|-------------------------|
| **Web** | Ninguno. |
| **iOS** | Xcode (App Store), CocoaPods (`gem install cocoapods`), simulador o dispositivo físico. |
| **Android** | Android Studio, JDK 17, variable `ANDROID_HOME` configurada, emulador o dispositivo. |
| **BLE / Cámara** | La app usa `expo-dev-client` y módulos nativos; no basta Expo Go. Se necesita un *development build* (EAS Build o compilación local con Xcode/Android Studio). |

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd hydrogenmeter
npm install
```

### 2. Iniciar en modo desarrollo

```bash
npx expo start
```

En la salida de la terminal podrás elegir:

- **Web:** `npx expo start --web`
- **Development build** (recomendado para BLE): [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- **Emulador Android:** [Android Studio Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- **Simulador iOS:** [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
- **Expo Go:** solo para pruebas básicas (BLE y cámara tienen limitaciones).

---

## Desarrollo por plataforma

### Solo web

No se requiere nada más que Node.js y las dependencias del proyecto:

```bash
npm install
npx expo start --web
```

### iOS (macOS)

1. Instalar **Xcode** desde la App Store.
2. Instalar **CocoaPods:** `sudo gem install cocoapods`
3. Ejecutar en simulador o dispositivo:

```bash
npx expo run:ios
```

### Android

1. Instalar **Android Studio** y **JDK 17**.
2. Configurar la variable de entorno `ANDROID_HOME` (ruta del Android SDK).
3. Ejecutar en emulador o dispositivo:

```bash
npx expo run:android
```

### Development build (BLE y cámara)

Para usar BLE y cámara de forma completa es necesario un *development build* (no Expo Go):

- **Con EAS (recomendado):** instalar EAS CLI, iniciar sesión y generar el build:

  ```bash
  npm install -g eas-cli
  eas login
  eas build --profile development --platform android
  # o: --platform ios
  ```

- **Local:** usar Xcode (iOS) o Android Studio (Android) y luego `npx expo run:ios` o `npx expo run:android`.

---

## Construir en local y recibir actualizaciones OTA

Para tener la app compilada en tu máquina y poder enviarle actualizaciones (JavaScript y recursos) sin volver a publicar en las tiendas, usa un **build local** + **EAS Update**.

### Requisitos previos

- Cuenta en [expo.dev](https://expo.dev) y EAS CLI instalado: `npm install -g eas-cli`
- Inicio de sesión: `eas login`
- Dependencia **expo-updates** instalada (en este proyecto ya está configurada)

### Pasos

#### 1. Configurar EAS Update (solo la primera vez)

```bash
npx expo install expo-updates
eas update:configure
```

Esto añade en `app.json` la `runtimeVersion` y la URL de actualizaciones. Si ya está configurado, puedes saltar este paso.

#### 2. Generar los proyectos nativos (prebuild)

```bash
npx expo prebuild
```

Se crean las carpetas `ios/` y `android/` con la configuración de updates incluida.

#### 3. Compilar e instalar la app en dispositivo o emulador

**iOS:**

```bash
npx expo run:ios
```

**Android:**

```bash
npx expo run:android
```

La app instalada quedará asociada al **canal** (channel) que definas en el siguiente paso.

#### 4. Crear un canal y publicar actualizaciones

Crea un canal (por ejemplo `preview`) y asígnalo a una rama:

```bash
eas channel:create preview
eas channel:edit preview --branch preview
```

En `eas.json` puedes añadir en el perfil que uses para el build local la opción `channel` para que el build apunte a ese canal, por ejemplo:

```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "channel": "preview",
  "android": { "buildType": "apk" }
}
```

Cada vez que quieras enviar una actualización OTA (cambios en JS, estilos, textos, etc.):

```bash
eas update --branch preview --message "Descripción del cambio"
```

La app recibirá la actualización en la siguiente apertura en frío (al volver a abrir la app).

### Resumen del flujo

| Paso | Comando |
|------|--------|
| Configurar updates | `eas update:configure` |
| Generar native | `npx expo prebuild` |
| Build local iOS | `npx expo run:ios` |
| Build local Android | `npx expo run:android` |
| Publicar actualización | `eas update --branch preview --message "..."` |

### Nota sobre `runtimeVersion`

La `runtimeVersion` en `app.json` debe coincidir entre el build y las actualizaciones que quiera recibir. Si cambias **código nativo** (dependencias nativas, plugins, permisos, etc.), actualiza `runtimeVersion` (por ejemplo a `"1.0.1"`) y vuelve a hacer un build local; si no, las actualizaciones OTA pueden fallar o no aplicarse.

- [Documentación: EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Build local y updates](https://docs.expo.dev/eas-update/build-locally/)

---

## Resumen rápido

1. **Node.js 18+** y **npm** instalados.
2. En el proyecto: `npm install`
3. Arrancar: `npx expo start` (elegir web, iOS o Android según lo instalado).

Este proyecto fue creado con [create-expo-app](https://www.npmjs.com/package/create-expo-app) y [Expo](https://expo.dev).
