import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SearchIcon from "../../assets/icons/search.svg";
import { fetchUserInfo } from "../../utils/user";
import { getNewAccessToken } from "../../utils/token";
import { fetchPortfolio } from "../../utils/portfolio";
import RecommendedStock from "../../components/RecommendedStock";
import { API_BASE_URL } from "../../utils/apiConfig";

const StockTradeScreen = ({ navigation }) => {
  console.log("📌 StockTradeScreen 렌더링");
  const [userInfo, setUserInfo] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchStocks = async () => {
    const query = searchText.trim();
    if (!query) return;

    try {
      const url = `${API_BASE_URL}api/stock/search/?query=${encodeURIComponent(
        query
      )}`;
      console.log("🔍 검색어:", query);
      console.log("🔄 검색 URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json", // ← 헤더 요구사항 반영
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("❌ 검색 실패 응답:", errorText);
        setSearchResults([]);
        return;
      }

      const result = await response.json();
      console.log("🔍 검색 응답:", result);

      if (!Array.isArray(result)) {
        console.warn("❗️검색 결과가 배열이 아닙니다:", result);
        setSearchResults([]);
        return;
      }

      const parsed = result.map((item, index) => ({
        id: index + 1,
        name: item.name,
        price: "-", // 가격 없음, placeholder로 처리
        change: "-", // 등락률 없음
        volume: "-", // 거래량 없음
        symbol: item.symbol, // ← 종목코드 필요 시
      }));

      console.log("✅ 파싱된 검색결과:", parsed);
      setSearchResults(parsed);
    } catch (error) {
      console.error("❌ 주식 검색 실패:", error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchUserInfo(navigation, setUserInfo);
      await fetchPortfolio(navigation, setPortfolioData, setLoading);
      await searchStocks();
    };
    load();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("📥 다시 focus됨: 포트폴리오 재요청");
      fetchPortfolio(navigation, setPortfolioData, setLoading);
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#F074BA" />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 내 포트폴리오 */}
        <Text style={styles.sectionTitle}>현재 보유 주식</Text>
        <View style={styles.divider} />

        {portfolioData.map((stock) => (
          <View key={stock.id}>
            <View style={styles.stockItem}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{stock.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.stockPrice}>{stock.price}원</Text>
                  <Text
                    style={[
                      styles.stockChange,
                      parseFloat(stock.change) < 0 && { color: "#00BFFF" },
                    ]}
                  >
                    {parseFloat(stock.change) >= 0 ? "▲" : "▼"}
                    {Math.abs(parseFloat(stock.change))}%
                  </Text>
                </View>
                <Text style={styles.averageLine}>
                  평균 단가: {stock.average_price.toLocaleString()}원
                </Text>
                <Text style={styles.stockLine}>
                  총 매수 금액: {stock.totalBuyPrice.toLocaleString()}원
                </Text>
                <Text style={styles.quantity}>보유 수량: {stock.quantity}</Text>
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
        ))}

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

        {/* <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="주식명 검색"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchStocks}
          >
            <SearchIcon width={24} height={24} fill="#003340" />
          </TouchableOpacity>
        </View> */}
        {/* 전체 주식 검색 */}
        {/* {searchText !== '' && (
  <>
    <View style={styles.divider} />
    {searchResults.length > 0 ? (
      searchResults.map(stock => (
        <View key={stock.id}>
          <View style={styles.stockItem}>
            <View style={styles.stockInfo}>
              <Text style={styles.stockName}>{stock.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.stockPrice}>{stock.price}원</Text>
                <Text style={[
                  styles.stockChange,
                  parseFloat(stock.change) < 0 && { color: '#00BFFF' }
                ]}>
                  {parseFloat(stock.change) >= 0 ? '▲' : '▼'}
                  {Math.abs(parseFloat(stock.change)).toFixed(2)}%
                </Text>
              </View>
              <Text style={styles.stockVolume}>거래량: {stock.volume}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => navigation.navigate('TradingBuy', { stock })}
              >
                <Text style={styles.buyText}>매수</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sellButton}
                onPress={() => navigation.navigate('TradingSell', { stock })}
              >
                <Text style={styles.sellText}>매도</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
        </View>
      ))
    ) : (
      <Text style={{ color: '#EFF1F5', textAlign: 'center', marginTop: 10 }}>
        검색 결과가 없습니다.
      </Text>
    )}
  </>
)} */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#003340",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 36,
    color: "#F074BA",
  },
  scrollView: {
    flex: 1,
    marginTop: 70,
    marginBottom: 20,
    maxHeight: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F074BA",
    textAlign: "center",
    top: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFD1EB",
    fontWeight: "bold",
    marginBottom: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#4A5A60",
    marginVertical: 10,
  },
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
    color: "#F074BA",
    fontWeight: "bold",
  },
  averageLine: {
    fontSize: 16,
    color: "#11A5CF",
    marginTop: 10,
  },

  stockLine: {
    fontSize: 16,
    color: "#AFA5CF",
    marginTop: 4,
  },
  quantity: {
    fontSize: 14,
    color: "#EFF1F5",
    marginTop: 4,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    borderRadius: 15,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 15,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: "#EFF1F5",
    borderRadius: 13,
    padding: 10,
    marginRight: 10,
  },
  searchButton: {
    padding: 5,
  },
});

export default StockTradeScreen;