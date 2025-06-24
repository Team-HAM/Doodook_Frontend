// apiConfig.js - API 호출을 위한 기본 설정 파일

// 클라우드 서버 주소 사용
export const API_BASE_URL = "https://port-0-doodook-backend-lyycvlpm0d9022e4.sel4.cloudtype.app/";

// API 엔드포인트 정의
export const API_ENDPOINTS = {
  // 주식 검색 관련 API
  STOCK_AUTOCOMPLETE: "/api/stock/autocomplete",
  STOCK_SEARCH: "/api/stock/search",

  // 한국투자 토큰 관련 API
  DESTROY_ACCESS_TOKEN: "/trade_hantu/destroy_access_token/",
  ISSUE_ACCESS_TOKEN: "/trade_hantu/issue_access_token/",

  // 주식 가격 관련 API
  STOCK_PRICE: "/trading/stock_price",
  PRICE_CHANGE: "/stocks/price_change",

  ASSET_SUMMARY: "/api/asset/summary/",
};

export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`📡 API 요청: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`⚠️ API 오류 (${endpoint}):`, error);
    throw error;
  }
};
