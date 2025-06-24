import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNewAccessToken } from "./token";
import { API_BASE_URL } from "./apiConfig";

// 사용자 정보를 불러와 setUserInfo에 설정해주는 함수
export const fetchUserInfo = async (navigation, setUserInfo) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      return;
    }

    console.log("사용 중인 액세스 토큰:", accessToken);

    const response = await fetch(`${API_BASE_URL}users/me/`, {
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
      console.log("응답에서 사용자 정보 찾음");

      console.log(`사용자 ID: ${data.id}`);
      console.log(`닉네임: ${data.nickname}`);
      console.log(`이메일: ${data.email}`);
      console.log(`성별: ${data.gender || "(미입력)"}`);
      console.log(`생일: ${data.birthdate || "(미입력)"}`);
      console.log(`주소: ${data.address || "(미입력)"}`);

      setUserInfo(data);
    } catch (jsonErr) {
      console.error("JSON 파싱 실패:", jsonErr);
      setUserInfo(null);
    }
  } catch (err) {
    console.error("사용자 정보 요청 실패:", err);
    setUserInfo(null);
  }
};

// 사용자 정보 수정 함수
export const updateUserInfo = async (navigation, updatedFields) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      return false;
    }

    console.log("🔧 수정 요청 보낼 필드:", updatedFields);

    const response = await fetch(`${API_BASE_URL}users/me/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedFields),
    });

    console.log("🔧 수정 응답 상태:", response.status);
    const text = await response.text();
    console.log("🔧 수정 응답 본문:", text);

    if (response.ok) {
      return true; // 성공
    } else {
      return false; // 실패
    }
  } catch (err) {
    console.error("사용자 정보 수정 실패:", err);
    return false;
  }
};
