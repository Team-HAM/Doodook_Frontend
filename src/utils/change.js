// utils/change.js

import { API_BASE_URL } from "./apiConfig";

export const fetchPriceChange = async (stock_code) => {
  try {
    const url = `${API_BASE_URL}stocks/price_change/?stock_code=${stock_code}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`❌ [${stock_code}] 가격 변화 요청 실패:`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.status !== "success") {
      console.warn(`⚠️ [${stock_code}] 응답 상태 실패:`, data);
      return null;
    }

    return data; // { stock_code, current_price, previous_price, price_change, price_change_percentage, ... }
  } catch (error) {
    console.error(`🚨 [${stock_code}] 가격 변화 가져오기 에러:`, error);
    return null;
  }
};
