import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiConfig";

//토큰 생성 api
export const getNewAccessToken = async (navigation) => {
  try {
    const email = await AsyncStorage.getItem("userEmail");
    const password = await AsyncStorage.getItem("userPassword");

    if (!email || !password) {
      console.error("❌ 저장된 이메일 또는 비밀번호 없음");
      navigation.navigate("Login");
      return null;
    }

    console.log("🔄 Access Token 요청 중...");
    const response = await fetch(`${API_BASE_URL}api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("📡 응답 상태 코드:", response.status);
    const responseText = await response.text();
    console.log("📡 응답 본문:", responseText);

    if (!response.ok) throw new Error("❌ Access Token 발급 실패");

    const data = JSON.parse(responseText);

    await AsyncStorage.setItem("accessToken", data.access);
    //console.log('✅ 새 Access Token 저장 완료:', data.access);

    return data.access;
  } catch (error) {
    console.error("❌ Access Token 요청 실패:", error);
    return null;
  }
};
