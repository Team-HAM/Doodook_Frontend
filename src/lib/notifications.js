// src/lib/notifications.js
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utils/apiConfig";

// 포그라운드에서도 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DEVICE_ID_KEY = "doodook:deviceId";

function randomId() {
  return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function getOrCreateDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** 권한 → 기기 토큰(APNs/FCM) → 서버 등록 */
export async function registerPushToken(userId = null) {
  await ensureAndroidChannel();

  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return null;

  // iOS=APNs 토큰 / Android=FCM 토큰
  const { data: token } = await Notifications.getDevicePushTokenAsync();

  const deviceId = await getOrCreateDeviceId();
  const platform =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  const body = { token, deviceId, platform };
  if (userId != null) body.userId = userId;

  const res = await fetch(`${API_BASE_URL}/api/push-tokens/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`token register failed: ${res.status} ${t}`);
  }
  return token;
}

/** 로그아웃 등 토큰 해제 */
export async function unregisterPushToken(currentToken) {
  if (!currentToken) return;
  const res = await fetch(`${API_BASE_URL}/api/push-tokens/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: currentToken }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`token unregister failed: ${res.status} ${t}`);
  }
}

/** 알림 수신/탭 리스너 */
let _subReceive, _subResponse;
export function attachNotificationListeners(onReceive, onTap) {
  _subReceive = Notifications.addNotificationReceivedListener((n) => {
    onReceive?.(n);
  });
  _subResponse = Notifications.addNotificationResponseReceivedListener((r) => {
    onTap?.(r);
  });
}
export function detachNotificationListeners() {
  _subReceive?.remove?.();
  _subResponse?.remove?.();
  _subReceive = null;
  _subResponse = null;
}
                                                                                                                                                               