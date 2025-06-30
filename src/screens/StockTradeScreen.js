import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { fetchUserInfo } from "../../utils/user";
import { fetchPortfolio } from "../../utils/portfolio";
import RecommendedStock from "../../components/RecommendedStock";

const StockTradeScreen = ({ navigation }) => {
  console.log("📌 StockTradeScreen 렌더링");

  const [userInfo, setUserInfo] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      console.log("📥 StockTradeScreen 초기 데이터 로딩 시작");

      // 병렬로 데이터 로딩
      await Promise.all([
        fetchUserInfo(navigation, setUserInfo),
        fetchPortfolio(navigation, setPortfolioData, setLoading),
      ]);

      console.log("✅ 초기 데이터 로딩 완료");
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("📥 StockTradeScreen 다시 focus됨: 포트폴리오 재요청");
      fetchPortfolio(navigation, setPortfolioData, setLoading);
    });

    return unsubscribe;
  }, [navigation]);

  const handleBuyPress = (stock) => {
    console.log("💰 매수 버튼 클릭됨 - 종목:", stock.name);

    if (!stock.name || !stock.price) {
      Alert.alert("오류", "주식 정보가 완전하지 않습니다.");
      return;
    }

    navigation.navigate("TradingBuy", { stock });
  };

  const handleSellPress = (stock) => {
    console.log("💸 매도 버튼 클릭됨 - 종목:", stock.name);

    if (!stock.name || !stock.price || stock.quantity <= 0) {
      Alert.alert("오류", "매도할 수 있는 주식이 없습니다.");
      return;
    }

    navigation.navigate("TradingSell", { stock });
  };

  const formatNumber = (number) => {
    return number.toLocaleString();
  };

  const getChangeColor = (change) => {
    if (change > 0) return "#F074BA"; // 상승 - 핑크
    if (change < 0) return "#00BFFF"; // 하락 - 파랑
    return "#AAAAAA"; // 보합 - 회색
  };

  const getChangeSymbol = (change) => {
    if (change > 0) return "▲";
    if (change < 0) return "▼";
    return "-";
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#F074BA" />
        <Text style={styles.loadingText}>보유 주식 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주식 거래하기</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 현재 보유 주식 섹션 */}
        <Text style={styles.sectionTitle}>현재 보유 주식</Text>
        <View style={styles.divider} />

        {portfolioData.length > 0 ? (
          portfolioData.map((stock) => (
            <View key={stock.id}>
              <View style={styles.stockItem}>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockName}>{stock.name}</Text>
                  <Text style={styles.stockCode}>({stock.symbol})</Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.stockPrice}>
                      {formatNumber(stock.price)}원
                    </Text>
                    <Text
                      style={[
                        styles.stockChange,
                        { color: getChangeColor(stock.change) },
                      ]}
                    >
                      {getChangeSymbol(stock.change)}
                      {Math.abs(stock.change).toFixed(2)}%
                    </Text>
                  </View>

                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}>
                      보유 수량: {formatNumber(stock.quantity)}주
                    </Text>
                    <Text style={styles.detailText}>
                      평균 단가: {formatNumber(stock.average_price)}원
                    </Text>
                    <Text style={styles.detailText}>
                      평가 금액: {formatNumber(stock.current_value)}원
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: getChangeColor(stock.profit_amount) },
                      ]}
                    >
                      평가 손익: {stock.profit_amount >= 0 ? "+" : ""}
                      {formatNumber(stock.profit_amount)}원
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => handleBuyPress(stock)}
                  >
                    <Text style={styles.buyText}>매수</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sellButton}
                    onPress={() => handleSellPress(stock)}
                  >
                    <Text style={styles.sellText}>매도</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />
            </View>
          ))
        ) : (
          <View style={styles.emptyPortfolio}>
            <Text style={styles.emptyText}>보유 중인 주식이 없습니다</Text>
            <Text style={styles.emptySubText}>
              아래 추천 주식에서 투자를 시작해보세요!
            </Text>
          </View>
        )}

        {/* 추천 주식 섹션 */}
        <Text style={styles.sectionTitle}>추천 주식</Text>
        <View style={styles.divider} />

        {["005930", "352820"].map((stockCode) => (
          <RecommendedStock
            key={stockCode}
            stockCode={stockCode}
            navigation={navigation}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003340",
    paddingHorizontal: 30,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: -10,
    padding: 10,
  },
  backText: {
    fontSize: 36,
    color: "#F074BA",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F074BA",
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFD1EB",
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 10,
  },
  stockItem: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "flex-start",
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
    marginBottom: 10,
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
  detailsContainer: {
    gap: 2,
  },
  detailText: {
    fontSize: 13,
    color: "#AFA5CF",
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 8,
    minWidth: 70,
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
  loadingText: {
    color: "#EFF1F5",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  emptyPortfolio: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#EFF1F5",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    color: "#AFA5CF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
