import { MMKVLoader } from "react-native-mmkv-storage";

export const Wallet = new MMKVLoader().withEncryption().initialize();
