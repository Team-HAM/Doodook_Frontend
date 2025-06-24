import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNewAccessToken } from "./token";
import { API_BASE_URL } from "./apiConfig";

export const increaseBalance = async (navigation, amount) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}point/increase_balance/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const text = await response.text();
    console.log("예수금 추가 응답 본문:", text);

    const data = JSON.parse(text);

    if (data.status === "success") {
      return data.message;
    } else {
      throw new Error(data.message || "알 수 없는 오류 발생");
    }
  } catch (err) {
    console.error("예수금 추가 실패:", err);
    throw err;
  }
};
