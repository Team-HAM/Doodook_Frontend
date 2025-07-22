import { fetchWithAuth } from "./token";
import { API_BASE_URL } from "./apiConfig";

export const fetchPortfolio = async (
  navigation,
  setPortfolioData,
  setLoading
) => {
  console.log("📥 포트폴리오 요청 시작");

  try {
    setLoading(true);

    const response = await fetchWithAuth(
      `${API_BASE_URL}trading/portfolio/`,
      {
        method: "GET",
      },
      navigation
    );

    console.log("📬 응답 상태 코드:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("📦 포트폴리오 응답:", result);

    if (result?.status !== "success" || !Array.isArray(result.portfolio)) {
      console.warn("⚠️ 응답 구조가 예상과 다릅니다:", result);
      setPortfolioData([]);
      return;
    }

    // 수량이 0인 항목은 제외하고 파싱
    const parsedData = result.portfolio
      .filter((item) => item.quantity > 0) // 보유 수량이 0보다 큰 것만 필터링
      .map((item, index) => ({
        id: `${item.stock_code}-${index}`,
        name: item.stock_name,
        symbol: item.stock_code,
        price: item.current_price,
        change: item.profit_rate,
        quantity: item.quantity,
        average_price: item.average_price,
        totalBuyPrice: item.average_price * item.quantity,
        current_value: item.current_price * item.quantity,
        profit_amount:
          (item.current_price - item.average_price) * item.quantity,
      }));

    console.log("✅ 파싱된 포트폴리오 데이터:", parsedData);
    setPortfolioData(parsedData);
  } catch (error) {
    console.error("❌ 포트폴리오 요청 실패:", error);
    setPortfolioData([]);
  } finally {
    setLoading(false);
  }
};
