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
          console.log("📦 응답 데이터:", data); // ← 전체 응답 확인
          setPrice(data.current_price);

          const percentage = parseFloat(data.price_change_percentage);
          console.log("🔍 퍼센트 원본:", data.price_change_percentage);
          console.log("🔍 변환된 퍼센트:", percentage);
          setPriceChangePercentage(isNaN(percentage) ? null : percentage); // ✅ NaN 방지
          setChangeStatus(data.change_status);
        }
      } catch (e) {
        console.error("📉 가격 불러오기 실패:", stockCode, e);
      }
    };
    fetchPrice();
  }, []);

  const stockNameMap = {
    "005930": "삼성전자",
    352820: "하이브",
    // "035720": "카카오",
    // "068270": "셀트리온",
    // "051910": "LG화학",
  };

  const stock = {
    id: `recommend-${stockCode}`,
    name: stockNameMap[stockCode],
    price: price ? `${price.toLocaleString()}원` : "-",
    symbol: stockCode,
  };

  return (
    <View>
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{stock.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.stockPrice}>{stock.price}</Text>
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
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => navigation.navigate("TradingBuy", { stock })}
          >
            <Text style={styles.buyText}>매수</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => navigation.navigate("TradingSell", { stock })}
          >
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
