import { getNewAccessToken } from "./token";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiConfig";

// ✅ 사용자의 MBTI 유형을 가져오는 함수
export const fetchUserMbtiType = async (navigation, setMbtiType) => {
  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("액세스 토큰이 없습니다.");
      return;
    }

    const response = await fetch(`${API_BASE_URL}mbti/result/detail/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    console.log("MBTI 응답 본문:", text);

    try {
      const data = JSON.parse(text);
      let mbti = "";

      if (data.result && typeof data.result === "string") {
        mbti = data.result;
      } else if (data.type) {
        mbti = data.type;
      } else {
        console.warn("예상치 못한 MBTI 응답 형식:", data);
        setMbtiType(null);
        return;
      }

      console.log("사용자의 MBTI 유형:", mbti);
      setMbtiType(mbti);
    } catch (parseError) {
      console.error("MBTI JSON 파싱 실패:", parseError);
      setMbtiType(null);
    }
  } catch (err) {
    console.error("MBTI 결과 요청 실패:", err);
    setMbtiType(null);
  }
};

// ✅ MBTI 이미지 불러오기 함수
export const getMbtiImage = (mbtiType) => {
  if (!mbtiType) return null;

  switch (mbtiType) {
    // 안정형(S)
    case "SDGH": return require("../assets/mbti/SDGH.png");
    case "SDGQ": return require("../assets/mbti/SDGQ.png");
    case "SDVH": return require("../assets/mbti/SDVH.png");
    case "SDVQ": return require("../assets/mbti/SDVQ.png");
    case "SFGH": return require("../assets/mbti/SFGH.png");
    case "SFGQ": return require("../assets/mbti/SFGQ.png");
    case "SFVH": return require("../assets/mbti/SFVH.png");
    case "SFVQ": return require("../assets/mbti/SFVQ.png");

    // 모험형(R)
    case "RDGH": return require("../assets/mbti/RDGH.png");
    case "RDGQ": return require("../assets/mbti/RDGQ.png");
    case "RDVH": return require("../assets/mbti/RDVH.png");
    case "RDVQ": return require("../assets/mbti/RDVQ.png");
    case "RFGH": return require("../assets/mbti/RFGH.png");
    case "RFGQ": return require("../assets/mbti/RFGQ.png");
    case "RFVH": return require("../assets/mbti/RFVH.png");
    case "RFVQ": return require("../assets/mbti/RFVQ.png");

    default:
      console.warn(`이미지를 찾을 수 없습니다: ${mbtiType}`);
      return null;
  }
};
