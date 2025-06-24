import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNewAccessToken } from "./token";
import { API_BASE_URL } from "./apiConfig";
// import { fetchUserInfo } from "./user";

export const fetchPortfolio = async (
  navigation,
  setPortfolioData,
  setLoading
) => {
  console.log("📥 포트폴리오 요청 시작");

  try {
    const accessToken = await getNewAccessToken(navigation);
    if (!accessToken) {
      console.error("❌ AccessToken 없음. 요청 중단.");
      setLoading(false);
      return;
    }

    // 사용자 정보 요청
    // let userId = null;
    // await fetchUserInfo(navigation, (userInfo) => {
    //   if (userInfo && userInfo.id) {
    //     userId = userInfo.id;
    //   }
    // });

    // if (!userId) {
    //   console.error("❌ userId 없음. 요청 중단.");
    //   setLoading(false);
    //   return;
    // }

    const url = `${API_BASE_URL}trading/portfolio/`;
    console.log("📡 요청 URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📬 응답 상태 코드:", response.status);

    const responseText = await response.text();
    console.log("📦 응답 본문:\n", responseText);

    const result = JSON.parse(responseText);

    if (result?.status !== "success" || !Array.isArray(result.portfolio)) {
      console.warn("⚠️ 응답 구조가 예상과 다릅니다:", result);
      return;
    }

    const parsedData = result.portfolio.map((item, index) => ({
      id: index + 1,
      name: item.stock_code,
      price: item.current_price.toLocaleString(),
      change: item.profit_rate.toFixed(2),
      quantity: item.quantity,
      average_price: item.average_price,
      totalBuyPrice: item.average_price * item.quantity,
    }));

    console.log("✅ 파싱된 포트폴리오 데이터:", parsedData);

    setPortfolioData(parsedData);
  } catch (error) {
    console.error("❌ 포트폴리오 요청 실패:", error);
  } finally {
    setLoading(false);
  }
};