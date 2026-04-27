import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "hottime.token";

export const tokenStorage = {
  async get(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },
  async set(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};

