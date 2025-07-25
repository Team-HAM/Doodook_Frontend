import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { API_BASE_URL } from "../utils/apiConfig";
import { fetchWithHantuToken } from "../utils/hantuToken";

const RecommendedStock = ({ stockCode, navigation }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockPrice(stockCode);
  }, [stockCode]);

  async function fetchStockPrice(stockCode) {
    try {
      setLoading(true);

      // API 호출 제한 고려하여 간격 추가
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 기존 토큰 파괴/발급 코드 완전 제거
      const priceResult = await fetchWithHantuToken(
        `${API_BASE_URL}trading/stock_price/?stock_code=${stockCode}`
      );
      if (!priceResult.success) {
        console.error("API 호출 실패:", priceResult.error);
        throw new Error(priceResult.error);
      }
      const priceData = priceResult.data;

      // 두 번째 API 호출 전에도 간격 추가
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 가격 변동 정보 조회
      const changeResponse = await fetch(
        `${API_BASE_URL}stocks/price_change/?stock_code=${stockCode}`
      );

      let changeData = null;
      if (changeResponse.ok) {
        const changeResult = await changeResponse.json();
        if (changeResult.status === "success") {
          changeData = changeResult;
        }
      }

      // 주식명 매핑
      const stockNames = {
        "005930": "삼성전자",
        352820: "하이브",
        "066570": "LG전자",
      };

      setStockData({
        code: stockCode,
        name: stockNames[stockCode] || `종목${stockCode}`,
        price: priceData.current_price || 0,
        change: changeData ? changeData.price_change_percentage || 0 : 0,
        changeStatus: changeData ? changeData.change_status || "same" : "same",
      });
    } catch (err) {
      console.error("주식 가격 조회 중 예외:", err);
      // 기본값 설정
      const stockNames = {
        "005930": "삼성전자",
        352820: "하이브",
        "066570": "LG전자",
      };

      setStockData({
        code: stockCode,
        name: stockNames[stockCode] || `종목${stockCode}`,
        price: 0,
        change: 0,
        changeStatus: "same",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleBuyPress = () => {
    if (!stockData || !stockData.name || stockData.price <= 0) {
      Alert.alert(
        "오류",
        "주식 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    const stock = {
      id: `recommend-${stockCode}`,
      name: stockData.name,
      symbol: stockCode,
      price: stockData.price,
      change: stockData.change,
      quantity: 0, // 새로 매수하는 경우
    };

    console.log("🛒 추천 주식 매수:", stock);
    navigation.navigate("TradingBuy", { stock });
  };

  const handleSellPress = () => {
    if (!stockData || !stockData.name || stockData.price <= 0) {
      Alert.alert(
        "오류",
        "주식 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    const stock = {
      id: `recommend-${stockCode}`,
      name: stockData.name,
      symbol: stockCode,
      price: stockData.price,
      change: stockData.change,
      quantity: 0, // 실제로는 보유 수량을 확인해야 함
    };

    console.log("📤 추천 주식 매도:", stock);
    navigation.navigate("TradingSell", { stock });
  };

  // 안전한 숫자 포맷팅 함수
  const formatNumber = (number) => {
    if (
      typeof number !== "number" ||
      isNaN(number) ||
      number === null ||
      number === undefined
    ) {
      return "0";
    }
    return number.toLocaleString();
  };

  const getChangeColor = () => {
    if (!stockData) return "#AAAAAA";

    switch (stockData.changeStatus) {
      case "up":
        return "#F074BA";
      case "down":
        return "#00BFFF";
      default:
        return "#AAAAAA";
    }
  };

  const getChangeSymbol = () => {
    if (!stockData) return "";

    switch (stockData.changeStatus) {
      case "up":
        return "▲";
      case "down":
        return "▼";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>데이터 로딩 중...</Text>
        </View>
      </View>
    );
  }

  if (!stockData) {
    return (
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>데이터 로딩 실패</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.stockItem}
        onPress={() => {
          console.log("📱 추천 주식 클릭:", stockData.name, stockData.code);
          navigation.navigate("StockDetail", {
            symbol: stockData.code,
            name: stockData.name,
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{stockData.name}</Text>
          <Text style={styles.stockCode}>({stockData.code})</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.stockPrice}>
              {formatNumber(stockData.price)}원
            </Text>
            <Text style={[styles.stockChange, { color: getChangeColor() }]}>
              {getChangeSymbol()}
              {Math.abs(stockData.change || 0).toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={(e) => {
              e.stopPropagation(); // 부모 TouchableOpacity 이벤트 방지
              handleBuyPress();
            }}
          >
            <Text style={styles.buyText}>매수</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sellButton}
            onPress={(e) => {
              e.stopPropagation(); // 부모 TouchableOpacity 이벤트 방지
              handleSellPress();
            }}
          >
            <Text style={styles.sellText}>매도</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  stockInfo: {
    flex: 1,
    marginRight: 15,
  },
  stockName: {
    fontSize: 16,
    color: "#EFF1F5",
    fontWeight: "bold",
    marginBottom: 2,
  },
  stockCode: {
    fontSize: 12,
    color: "#AFA5CF",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockPrice: {
    fontSize: 18,
    color: "#EFF1F5",
    fontWeight: "bold",
    marginRight: 10,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    minWidth: 140,
  },
  buyButton: {
    backgroundColor: "#6EE69E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buyText: {
    color: "#003340",
    fontWeight: "bold",
    fontSize: 14,
  },
  sellButton: {
    backgroundColor: "#F074BA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  sellText: {
    color: "#003340",
    fontWeight: "bold",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 10,
  },
});

export default RecommendedStock;
