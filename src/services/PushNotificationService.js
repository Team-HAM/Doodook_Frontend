import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utils/apiConfig";
import { getNewAccessToken } from "../utils/token";

// 옵션
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const generateDeviceId = () => {
  return (
    "android-" +
    Math.random().toString(36).substring(2) +
    Date.now().toString(36)
  );
};

// 토큰 등록
export const registerPushToken = async (navigation) => {
  try {
    // 디바이스인지 확인 (에뮬 or 폰)
    if (!Device.isDevice) {
      console.log("⚠️ 에뮬레이터에서는 푸시 알림이 제한될 수 있습니다.");
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("푸시 알림 권한 거부됨");
      return false;
    }

    // Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "d831fa11-69a9-40eb-a916-ae0d22291e92",
    });

    const pushToken = tokenData.data;
    console.log("💕Push Token 획득💕:", pushToken);

    let deviceId = await AsyncStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem("deviceId", deviceId);
    }

    // 서버에 등록
    const success = await sendTokenToServer(pushToken, deviceId, navigation);

    if (success) {
      await AsyncStorage.setItem("pushToken", pushToken);
      console.log("💕푸시알림 토큰 서버 등록 완료💕");
      return true;
    } else {
      // ⭐ 추가: 서버 등록 실패해도 로컬에는 저장하고 성공으로 처리 (임시)
      await AsyncStorage.setItem("pushToken", pushToken);
      console.warn("⚠️ 서버 등록 실패했지만 로컬에 저장 (임시 해결책)");
      return true;
    }
  } catch (error) {
    console.error("푸시알림 토큰 등록 실패:", error);
    // ⭐ 추가: 에러가 발생해도 계속 진행 (임시)
    return true;
  }
};

// 서버에 전송
const sendTokenToServer = async (token, deviceId, navigation) => {
  try {
    const accessToken = await getNewAccessToken(navigation);

    if (!accessToken) {
      console.error("❌ 액세스 토큰이 없습니다");
      return false;
    }

    console.log("📡 서버로 토큰 전송:", {
      // ⭐ 추가: 요청 로그
      token: token.substring(0, 20) + "...",
      deviceId,
      platform: "android",
    });

    const response = await fetch(`${API_BASE_URL}api/push-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: token,
        deviceId: deviceId,
        platform: "android",
      }),
    });

    console.log("📡 서버 응답 상태:", response.status);
    console.log("📡 서버 응답 헤더:", response.headers.get("content-type"));

    // ⭐ 추가: 응답 타입 확인 후 파싱
    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("❌ JSON 파싱 오류:", jsonError);
        const textResponse = await response.text();
        console.error("❌ 서버 응답 (텍스트):", textResponse.substring(0, 200));
        return false;
      }
    } else {
      // json 말고도 다른 응답 처리
      const textResponse = await response.text();
      console.error(
        "❌ 서버에서 JSON이 아닌 응답:",
        textResponse.substring(0, 200)
      );

      if (response.status >= 500) {
        console.error("❌ 서버 내부 오류 (500+)");
      } else if (response.status >= 400) {
        console.error("❌ 클라이언트 오류 (400+)");
      }
      return false;
    }

    console.log("📡 파싱된 서버 응답:", responseData);

    if (response.ok && responseData && responseData.ok) {
      console.log(
        "토큰 서버 등록 성공:",
        responseData.created ? "신규" : "기존"
      );
      return true;
    } else {
      console.error("서버 토큰 등록 실패:", responseData);
      return false;
    }
  } catch (error) {
    console.error("서버 토큰 전송 오류:", error);
    return false;
  }
};

// Push 토큰 해제
export const unregisterPushToken = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("pushToken");

    if (!storedToken) {
      console.log("📱 등록된 푸시 토큰이 없습니다");
      return true;
    }

    const response = await fetch(`${API_BASE_URL}api/push-tokens`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: storedToken,
      }),
    });

    // DELETE는 response body가 없을 수 있음
    if (response.ok) {
      await AsyncStorage.removeItem("pushToken");
      console.log("푸시알림 토큰 해제 완료");
      return true;
    } else {
      console.error("푸시알림 토큰 해제 실패:", response.status);
      await AsyncStorage.removeItem("pushToken");
      console.warn("⚠️ 서버 해제 실패했지만 로컬에서 제거 ");
      return true;
    }
  } catch (error) {
    console.error("푸시알림 토큰 해제 오류:", error);
    try {
      await AsyncStorage.removeItem("pushToken");
      console.warn("⚠️ 에러 발생했지만 로컬에서 제거 ");
    } catch (storageError) {
      console.error("❌ AsyncStorage 제거 실패:", storageError);
    }
    return true;
  }
};

export const setupNotificationListeners = (navigation) => {
  // 포그라운드 알림 수신 시 처리
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("알림 수신 (포그라운드):", notification);

      // 공지사항 알림인 경우 자동으로 공지사항 화면으로 이동하는 로직 추가하도록. (나중에 서버 배포되면 추가예쩡)
      const notificationData = notification.request.content.data;
      if (notificationData?.type === "notice") {
      }
    }
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 알림 클릭:", response);

      const notificationData = response.notification.request.content.data;

      if (notificationData?.screen) {
        navigation.navigate(notificationData.screen);
      } else if (notificationData?.type === "notice") {
        navigation.navigate("NoticeScreen");
      }
    });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};
