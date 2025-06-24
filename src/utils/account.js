import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNewAccessToken } from "./token";
import { API_BASE_URL } from "./apiConfig";

// 사용자 잔고를 불러와 setBalance에 설정해주는 함수
export const fetchUserBalance = async (navigation, setBalance) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      return;
    }

    console.log("사용 중인 액세스 토큰:", accessToken);

    const response = await fetch(`${API_BASE_URL}users/account/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("응답 상태:", response.status);
    const text = await response.text();
    console.log("응답 본문:", text);

    try {
      const data = JSON.parse(text);
      console.log("전체 데이터:", data);

      let userBalance = null;

      if (data?.status === "success" && data?.data?.balance !== undefined) {
        userBalance = data.data.balance;
        console.log("응답에서 잔고 찾음:", userBalance);
      } else if (data?.balance !== undefined) {
        userBalance = data.balance;
        console.log("대체 경로에서 잔고 찾음:", userBalance);
      } else {
        console.warn("알 수 없는 응답 구조:", data);
        userBalance = 0;
      }

      const formatted = Number(userBalance || 0).toLocaleString() + "원";
      console.log("최종 형식화된 잔고:", formatted);
      setBalance(formatted);
    } catch (jsonErr) {
      console.error("JSON 파싱 실패:", jsonErr);
      setBalance("0원");
    }
  } catch (err) {
    console.error("잔고 요청 실패:", err);
    setBalance("0원");
  }
};
