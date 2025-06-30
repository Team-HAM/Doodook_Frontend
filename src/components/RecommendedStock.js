import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { API_BASE_URL } from "../utils/apiConfig";

const RecommendedStock = ({ stockCode, navigation, styles }) => {
  const [price, setPrice] = useState(null);
  const [priceChangePercentage, setPriceChangePercentage] = useState(null);
  const [changeStatus, setChangeStatus] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}stocks/price_change/?stock_code=${stockCode}`
        );
        const data = await res.json();
        if (data.status === "success") {
          console.log("📦 추천주식 응답 데이터:", data);
          setPrice(data.current_price);

          const percentage = parseFloat(data.price_change_percentage);
          console.log("🔍 추천주식 퍼센트 원본:", data.price_change_percentage);
          console.log("🔍 추천주식 변환된 퍼센트:", percentage);
          setPriceChangePercentage(isNaN(percentage) ? 0 : percentage);
          setChangeStatus(data.change_status);
        }
      } catch (e) {
        console.error("📉 추천주식 가격 불러오기 실패:", stockCode, e);
        setPriceChangePercentage(0);
        setChangeStatus("same");
      }
    };
    fetchPrice();
  }, []);

  const stockNameMap = {
    "005930": "삼성전자",
    352820: "하이브",
    // 필요시 추가
  };

  // 🔧 매수/매도용 stock 객체 - 종목코드를 우선 사용
  const createStockObject = () => {
    return {
      id: `recommend-${stockCode}`,
      name: stockNameMap[stockCode] || `종목${stockCode}`,
      displayName: stockNameMap[stockCode] || `종목${stockCode}`, // 화면 표시용
      price: price ? price.toString() : "0",
      change:
        priceChangePercentage !== null ? priceChangePercentage.toString() : "0",
      symbol: stockCode.toString(),
      quantity: 0,
      // 🔧 API 요청시 사용할 식별자 (종목코드 우선)
      stock_symbol: stockCode.toString(), // API에는 종목코드 전달
      _source: "recommended",
      _rawPrice: price,
      _rawChange: priceChangePercentage,
      _changeStatus: changeStatus,
    };
  };

  const stock = createStockObject();

  // 🔧 매수 버튼 클릭 핸들러
  const handleBuyPress = () => {
    console.log("🛒 추천 주식 매수 버튼 클릭됨");
    console.log("📊 전달할 stock 데이터:", stock);
    console.log("🔍 API에 전달될 stock_symbol:", stock.stock_symbol);
    console.log("🔍 stockCode 원본:", stockCode);

    // 🔧 데이터 유효성 검사
    if (!stock.name || !stock.price || stock.price === "0") {
      console.error("❌ 추천 주식 데이터 불완전:", stock);
      alert("주식 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    navigation.navigate("TradingBuy", { stock });
  };

  // 🔧 매도 버튼 클릭 핸들러
  const handleSellPress = () => {
    console.log("📤 추천 주식 매도 버튼 클릭됨");
    console.log("📊 전달할 stock 데이터:", stock);
    console.log("🔍 API에 전달될 stock_symbol:", stock.stock_symbol);

    // 🔧 데이터 유효성 검사
    if (!stock.name || !stock.price || stock.price === "0") {
      console.error("❌ 추천 주식 데이터 불완전:", stock);
      alert("주식 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    navigation.navigate("TradingSell", { stock });
  };

  return (
    <View>
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{stock.displayName}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.stockPrice}>
              {price ? `${price.toLocaleString()}원` : "-"}
            </Text>
            {priceChangePercentage !== null && (
              <Text
                style={[
                  styles.stockChange,
                  changeStatus === "down" && { color: "#00BFFF" },
                  changeStatus === "up" && { color: "#F074BA" },
                  changeStatus === "same" && { color: "#AAAAAA" },
                ]}
              >
                {changeStatus === "up"
                  ? "▲"
                  : changeStatus === "down"
                  ? "▼"
                  : ""}
                {Math.abs(priceChangePercentage).toFixed(2)}%
              </Text>
            )}
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
    paddingVertical: 10,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 16,
    color: "#EFF1F5",
    fontWeight: "bold",
    marginBottom: 4,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  buyButton: {
    backgroundColor: "#6EE69E",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buyText: {
    color: "#003340",
    fontWeight: "bold",
    fontSize: 16,
  },
  sellButton: {
    backgroundColor: "#F074BA",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  sellText: {
    color: "#003340",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 10,
  },
});

export default RecommendedStock;
