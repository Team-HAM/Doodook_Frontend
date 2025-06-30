import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { API_BASE_URL } from "../utils/apiConfig";

const RecommendedStock = ({ stockCode, navigation }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockPrice();
  }, [stockCode]);

  const fetchStockPrice = async () => {
    try {
      setLoading(true);

      // 현재가 조회
      const priceResponse = await fetch(
        `${API_BASE_URL}trading/stock_price/?stock_code=${stockCode}`
      );

      if (!priceResponse.ok) {
        throw new Error(`Price API error: ${priceResponse.status}`);
      }

      const priceData = await priceResponse.json();

      if (priceData.status !== "success") {
        throw new Error("Price API response status not success");
      }

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
      };

      setStockData({
        code: stockCode,
        name: stockNames[stockCode] || `종목${stockCode}`,
        price: priceData.current_price,
        change: changeData ? changeData.price_change_percentage : 0,
        changeStatus: changeData ? changeData.change_status : "same",
      });
    } catch (error) {
      console.error(`📉 추천주식 ${stockCode} 데이터 로딩 실패:`, error);

      // 기본값 설정
      const stockNames = {
        "005930": "삼성전자",
        352820: "하이브",
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
  };

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

  const formatNumber = (number) => {
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
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{stockData.name}</Text>
          <Text style={styles.stockCode}>({stockData.code})</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.stockPrice}>
              {formatNumber(stockData.price)}원
            </Text>
            <Text style={[styles.stockChange, { color: getChangeColor() }]}>
              {getChangeSymbol()}
              {Math.abs(stockData.change).toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
            <Text style={styles.buyText}>매수</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
            <Text style={styles.sellText}>매도</Text>
          </TouchableOpacity>
        </View>
      </View>
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
