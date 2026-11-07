// Where the app keeps the login on the phone. On a real phone it goes into the
// phone's encrypted storage (Android Keystore). On the web preview we use the
// normal browser storage, because encrypted storage does not exist there.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { KeyValueStore, createChunkedStorage } from "./chunkedStorage";

const secureBackend: KeyValueStore = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};

export const sessionStorage: KeyValueStore =
  Platform.OS === "web" ? AsyncStorage : createChunkedStorage(secureBackend, AsyncStorage);
